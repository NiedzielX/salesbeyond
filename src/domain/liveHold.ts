import type {Seat} from '../data/stadium.ts';
import {
  SeatHoldClientError,
  type CreateSeatHoldInput,
  type HoldInventorySeat,
  type HoldItem,
  type SeatHold,
  type createSeatHoldClient,
} from '../integrations/seatHoldClient.ts';
import {basketLimit} from './basket.ts';

type HoldClient = Pick<ReturnType<typeof createSeatHoldClient>, 'inventory' | 'create' | 'get' | 'release'> & {
  current(eventId: string): Promise<SeatHold | null>;
};
type HoldStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
type HoldSource = 'created' | 'recovered';

export type LiveHoldQuote = Readonly<{
  eventId: string;
  version: number;
  currency: string;
  items: readonly Readonly<HoldItem>[];
  subtotalMinor: number;
  avoidSingle?: boolean;
}>;

type ConfirmedHold = Readonly<Omit<SeatHold, 'items'>> & {
  readonly items: readonly Readonly<HoldItem>[];
};

export type LiveHoldState = Readonly<
  | {phase: 'idle' | 'quoting'; locked: false}
  | {phase: 'quoted'; locked: false; quote: LiveHoldQuote}
  | {phase: 'error'; locked: false; error: SeatHoldClientError}
  | {phase: 'creating'; locked: true; quote: LiveHoldQuote}
  | {phase: 'create-unknown'; locked: true; quote: LiveHoldQuote; error: SeatHoldClientError}
  | {phase: 'restoring'; locked: true; holdId: string | null}
  | {phase: 'restore-unknown'; locked: true; holdId: string | null; error: SeatHoldClientError}
  | {
      phase: 'active';
      locked: true;
      hold: ConfirmedHold & {status: 'active'};
      source: HoldSource;
      operation: 'refreshing' | 'releasing' | null;
      error?: SeatHoldClientError;
    }
  | {phase: 'terminal'; locked: false; hold: ConfirmedHold & {status: 'released' | 'expired'}}
>;

const holdIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const rejectedByStore = new Set([
  'not_found', 'event_closed', 'catalog_changed', 'seat_limit', 'held', 'unavailable',
  'single_seat_gap', 'idempotency_key_reused',
]);
const rejectedBeforeStore = new Set([
  'backend_not_configured', 'session_required', 'origin_not_allowed', 'rate_limited', 'invalid_request',
]);

function clientError(error: unknown) {
  return error instanceof SeatHoldClientError ? error : new SeatHoldClientError('network_error', null);
}

function invalidResponse(): never {
  throw new SeatHoldClientError('invalid_response', null);
}

/** Client-side workflow for an authoritative quote and one session-owned hold. */
export function createLiveHoldFlow({
  client,
  catalog,
  eventId,
  storage,
  now = Date.now,
  key = () => crypto.randomUUID(),
}: {
  client: HoldClient;
  catalog: readonly Seat[];
  eventId: string;
  storage?: HoldStorage;
  now?: () => number;
  key?: () => string;
}) {
  const coordinates = new Map(catalog.map(({id, sectorId, row, number}) =>
    [id, {sectorId, row, number}] as const));
  const storageKey = `salesbeyond:seat-hold:${eventId}`;
  const listeners = new Set<() => void>();
  let state: LiveHoldState = {phase: 'idle', locked: false};
  let revision = 0;
  let disposed = false;
  let pendingKey: string | null = null;

  function publish(next: LiveHoldState) {
    state = Object.freeze(next);
    for (const listener of listeners) listener();
  }

  function begin(next: LiveHoldState) {
    const operation = ++revision;
    publish(next);
    return operation;
  }

  function current(operation: number) {
    return !disposed && operation === revision;
  }

  function pointer() {
    try {
      return storage?.getItem(storageKey) ?? null;
    } catch {
      return null;
    }
  }

  function remember(id: string) {
    try {
      storage?.setItem(storageKey, id);
    } catch {
      // Hold ownership and validation still come from the server.
    }
  }

  function forget(id: string) {
    try {
      if (pointer() === id) storage?.removeItem(storageKey);
    } catch {
      // A future restore can verify the pointer again.
    }
  }

  function settleHold(hold: ConfirmedHold, source: HoldSource, persist = false) {
    const status = hold.status === 'active' && Date.parse(hold.expiresAt) <= now()
      ? 'expired' : hold.status;
    if (status === 'active') {
      if (persist) remember(hold.id);
      publish({phase: 'active', locked: true, hold: Object.freeze({...hold, status}), source, operation: null});
    } else {
      forget(hold.id);
      publish({phase: 'terminal', locked: false, hold: Object.freeze({...hold, status})});
    }
  }

  function verifiedHold(hold: SeatHold, id?: string): ConfirmedHold {
    if (!holdIdPattern.test(hold.id) || (id !== undefined && hold.id !== id)) invalidResponse();
    if (hold.eventId !== eventId) throw new SeatHoldClientError('not_found', 404);
    return Object.freeze({
      ...hold,
      items: Object.freeze(hold.items.map(({seatId, priceMinor}) => Object.freeze({seatId, priceMinor}))),
    });
  }

  async function discoverHold() {
    const hold = await client.current(eventId);
    if (hold === null) return null;
    if (hold.eventId !== eventId || hold.status !== 'active') invalidResponse();
    return verifiedHold(hold);
  }

  async function quote(ids: readonly string[], avoidSingle?: boolean) {
    if (disposed || state.locked) return;
    const seatIds = [...ids];
    if (!seatIds.length) {
      begin({phase: 'idle', locked: false});
      return;
    }
    const operation = begin({phase: 'quoting', locked: false});
    if (!current(operation)) return;

    try {
      if (seatIds.length > basketLimit) throw new SeatHoldClientError('seat_limit', null);
      if (new Set(seatIds).size !== seatIds.length) throw new SeatHoldClientError('invalid_request', null);
      const selection = seatIds.map(seatId => {
        const seat = coordinates.get(seatId);
        if (!seat) throw new SeatHoldClientError('unavailable', null, {seatIds: [seatId]});
        return {seatId, ...seat};
      });
      const sections = [...new Set(selection.map(seat => seat.sectorId))];
      const inventories = await Promise.all(sections.map(section => client.inventory(eventId, section)));
      if (!current(operation)) return;
      const first = inventories[0];
      const inventory = new Map<string, HoldInventorySeat>();
      for (const [index, section] of inventories.entries()) {
        if (section.eventId !== eventId || !section.seats) invalidResponse();
        if (section.status !== 'open') throw new SeatHoldClientError('event_closed', null);
        if (section.version !== first.version || section.currency !== first.currency) {
          throw new SeatHoldClientError('catalog_changed', null);
        }
        if (seatIds.length > section.maxSeats) throw new SeatHoldClientError('seat_limit', null);
        for (const seat of section.seats) {
          if (seat.sectionId !== sections[index] || inventory.has(seat.seatId)) invalidResponse();
          inventory.set(seat.seatId, seat);
        }
      }

      const items: Readonly<HoldItem>[] = [];
      const held: string[] = [];
      const unavailable: string[] = [];
      for (const seat of selection) {
        const entry = inventory.get(seat.seatId);
        if (entry && (entry.sectionId !== seat.sectorId || entry.row !== seat.row || entry.number !== seat.number)) {
          invalidResponse();
        }
        if (entry?.status === 'available') {
          items.push(Object.freeze({seatId: seat.seatId, priceMinor: entry.priceMinor}));
        } else if (entry?.status === 'held') {
          held.push(seat.seatId);
        } else {
          unavailable.push(seat.seatId);
        }
      }
      // A create started before reload can finish after the initial session lookup.
      if (held.length) {
        const owned = await discoverHold();
        if (!current(operation)) return;
        if (owned) {
          settleHold(owned, 'recovered', true);
          return;
        }
      }
      if (unavailable.length) throw new SeatHoldClientError('unavailable', null, {seatIds: [...unavailable, ...held]});
      if (held.length) throw new SeatHoldClientError('held', null, {seatIds: held});

      const subtotalMinor = items.reduce((total, item) => total + item.priceMinor, 0);
      if (!Number.isSafeInteger(subtotalMinor)) invalidResponse();
      const snapshot = Object.freeze({
        eventId,
        version: first.version,
        currency: first.currency,
        items: Object.freeze(items),
        subtotalMinor,
        avoidSingle,
      });
      publish({phase: 'quoted', locked: false, quote: snapshot});
    } catch (error) {
      if (current(operation)) publish({phase: 'error', locked: false, error: clientError(error)});
    }
  }

  async function readSavedHold(id: string) {
    try {
      return verifiedHold(await client.get(id), id);
    } catch (cause) {
      if (clientError(cause).code === 'not_found') return null;
      throw cause;
    }
  }

  async function recover(id: string | null) {
    const operation = begin({phase: 'restoring', locked: true, holdId: id});
    if (!current(operation)) return;
    let unresolvedId = id;
    try {
      let terminal: ConfirmedHold | null = null;
      if (id !== null) {
        const saved = await readSavedHold(id);
        if (!current(operation)) return;
        if (saved?.status === 'active' && Date.parse(saved.expiresAt) > now()) {
          settleHold(saved, 'recovered');
          return;
        }
        terminal = saved;
        forget(id);
        unresolvedId = null;
      }
      const owned = await discoverHold();
      if (!current(operation)) return;
      if (owned) {
        settleHold(owned, 'recovered', true);
      } else if (terminal) {
        settleHold(terminal, 'recovered');
      } else if (id !== null) {
        publish({phase: 'error', locked: false, error: new SeatHoldClientError('not_found', 404)});
      } else {
        publish({phase: 'idle', locked: false});
      }
    } catch (cause) {
      if (current(operation)) {
        publish({phase: 'restore-unknown', locked: true, holdId: unresolvedId, error: clientError(cause)});
      }
    }
  }

  async function restore() {
    if (disposed || state.locked) return;
    const id = pointer();
    if (id !== null && !holdIdPattern.test(id)) {
      forget(id);
      await recover(null);
    } else {
      await recover(id);
    }
  }

  async function submit(snapshot: LiveHoldQuote, idempotencyKey: string, replay: boolean) {
    const operation = begin({phase: 'creating', locked: true, quote: snapshot});
    if (!current(operation)) return;
    const input: CreateSeatHoldInput = {
      eventId,
      seatIds: snapshot.items.map(item => item.seatId),
      expectedCatalogVersion: snapshot.version,
      idempotencyKey,
      avoidSingle: snapshot.avoidSingle,
    };
    try {
      const response = await client.create(input);
      if (!current(operation)) return;
      if (response.eventId !== eventId) invalidResponse();
      const hold = verifiedHold(response);
      const prices = new Map(hold.items.map(item => [item.seatId, item.priceMinor]));
      if (hold.version !== snapshot.version || hold.currency !== snapshot.currency
        || hold.subtotalMinor !== snapshot.subtotalMinor || hold.items.length !== snapshot.items.length
        || snapshot.items.some(item => prices.get(item.seatId) !== item.priceMinor)) {
        invalidResponse();
      }
      pendingKey = null;
      settleHold(hold, 'created', true);
    } catch (cause) {
      if (!current(operation)) return;
      const error = clientError(cause);
      if (error.code === 'active_hold_exists' && error.holdId && holdIdPattern.test(error.holdId)) {
        pendingKey = null;
        remember(error.holdId);
        await recover(error.holdId);
      } else if (rejectedByStore.has(error.code) || (!replay && rejectedBeforeStore.has(error.code))) {
        pendingKey = null;
        publish({phase: 'error', locked: false, error});
      } else {
        pendingKey = idempotencyKey;
        publish({phase: 'create-unknown', locked: true, quote: snapshot, error});
      }
    }
  }

  async function create() {
    if (disposed || state.phase !== 'quoted') return;
    const snapshot = state.quote;
    let idempotencyKey: string;
    try {
      idempotencyKey = key();
    } catch {
      begin({phase: 'error', locked: false, error: new SeatHoldClientError('invalid_request', null)});
      return;
    }
    await submit(snapshot, idempotencyKey, false);
  }

  async function retry() {
    if (disposed) return;
    if (state.phase === 'create-unknown' && pendingKey !== null) {
      await submit(state.quote, pendingKey, true);
    } else if (state.phase === 'restore-unknown') {
      await recover(state.holdId);
    }
  }

  async function updateHold(action: 'refreshing' | 'releasing') {
    if (disposed || state.phase !== 'active' || state.operation !== null) return;
    const {hold: previous, source} = state;
    const operation = begin({phase: 'active', locked: true, hold: previous, source, operation: action});
    if (!current(operation)) return;
    try {
      const result = await (action === 'refreshing' ? client.get(previous.id) : client.release(previous.id));
      if (!current(operation)) return;
      const hold = verifiedHold(result, previous.id);
      if (action === 'releasing' && hold.status === 'active') invalidResponse();
      settleHold(hold, source);
    } catch (cause) {
      if (!current(operation)) return;
      const error = clientError(cause);
      if (action === 'refreshing' && error.code === 'not_found') {
        forget(previous.id);
        publish({phase: 'error', locked: false, error});
      } else if (Date.parse(previous.expiresAt) <= now()) {
        settleHold(previous, source);
      } else {
        publish({phase: 'active', locked: true, hold: previous, source, operation: null, error});
      }
    }
  }

  return {
    getState: () => state,
    subscribe(listener: () => void) {
      if (disposed) return () => {};
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    quote,
    create,
    retry,
    refresh: () => state.phase === 'restore-unknown' ? retry() : updateHold('refreshing'),
    release: () => updateHold('releasing'),
    restore,
    dispose() {
      disposed = true;
      revision++;
      pendingKey = null;
      listeners.clear();
    },
  };
}
