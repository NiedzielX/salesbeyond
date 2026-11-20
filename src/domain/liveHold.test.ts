import {test} from 'node:test';
import assert from 'node:assert/strict';
import type {Seat, SectorId} from '../data/stadium.ts';
import {
  SeatHoldClientError,
  type CreateSeatHoldInput,
  type HoldInventorySeat,
  type SeatHold,
  type SeatInventory,
} from '../integrations/seatHoldClient.ts';
import {createLiveHoldFlow} from './liveHold.ts';

const eventId = 'enea-demo';
const holdId = '12345678-1234-4321-9876-123456789abc';
const nextHoldId = '12345678-1234-4321-9876-123456789abd';
const storageKey = `salesbeyond:seat-hold:${eventId}`;
const start = Date.parse('2035-01-01T12:00:00.000Z');
const expiresAt = '2035-01-01T12:10:00.000Z';

function localSeat(sectorId: SectorId, number: number): Seat {
  return {id: `${sectorId}-6-${number}`, sectorId, standId: 'N', row: 6, number, price: 42, available: false, position: [0, 0, 0]};
}

const a = localSeat('101', 1);
const b = localSeat('101', 2);
const c = localSeat('102', 1);
const catalog = [a, b, c];
const priceFor = new Map([[a.id, 9550], [b.id, 9000], [c.id, 7850]]);

function inventory(sectionId: string, patch: Partial<SeatInventory> = {}): SeatInventory {
  return {
    eventId, version: 7, currency: 'PLN', status: 'open', maxSeats: 10, holdSeconds: 600, preventSingle: false,
    seats: catalog.filter(seat => seat.sectorId === sectionId).map((seat): HoldInventorySeat => ({
      seatId: seat.id, sectionId, row: seat.row, number: seat.number,
      priceMinor: priceFor.get(seat.id)!, status: 'available',
    })),
    ...patch,
  };
}

function hold(ids = [a.id], patch: Partial<SeatHold> = {}): SeatHold {
  const items = ids.map(seatId => ({seatId, priceMinor: priceFor.get(seatId)!}));
  return {
    id: holdId, eventId, status: 'active', expiresAt, version: 7, currency: 'PLN', items,
    subtotalMinor: items.reduce((total, item) => total + item.priceMinor, 0),
    ...patch,
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((yes, no) => {resolve = yes; reject = no;});
  return {promise, resolve, reject};
}

type FlowOptions = Parameters<typeof createLiveHoldFlow>[0];
type FixtureOverrides = Pick<FlowOptions, 'storage' | 'now' | 'key'> & {client?: Partial<FlowOptions['client']>};

function fixture(overrides: FixtureOverrides = {}) {
  const requests: CreateSeatHoldInput[] = [];
  const sections: string[] = [];
  const values = new Map<string, string>();
  let keys = 0;
  let time = start;
  const client = {
    async inventory(id: string, sectionId?: string) {
      assert.equal(id, eventId);
      assert.ok(sectionId);
      sections.push(sectionId);
      return inventory(sectionId);
    },
    async create(input: CreateSeatHoldInput) {
      requests.push(input);
      return hold([...input.seatIds].reverse());
    },
    async get(id: string) {
      assert.equal(id, holdId);
      return hold();
    },
    async current(id: string): Promise<SeatHold | null> {
      assert.equal(id, eventId);
      return null;
    },
    async release(id: string) {
      assert.equal(id, holdId);
      return hold([a.id], {status: 'released'});
    },
  };
  const flow = createLiveHoldFlow({
    catalog, eventId,
    client: {...client, ...overrides.client},
    storage: overrides.storage ?? {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => {values.set(key, value);},
      removeItem: key => {values.delete(key);},
    },
    now: overrides.now ?? (() => time),
    key: overrides.key ?? (() => `stable-key-${++keys}`),
  });
  return {flow, requests, sections, values, setTime: (next: number) => {time = next;}, keyCount: () => keys};
}

test('quotes each selected section once with server prices and creates exactly that snapshot', async () => {
  const {flow, requests, sections, values} = fixture();
  const phases: string[] = [];
  const unsubscribe = flow.subscribe(() => phases.push(flow.getState().phase));
  const selection = [a.id, c.id, b.id];
  const pendingQuote = flow.quote(selection, true);
  selection[0] = 'different-seat';
  await pendingQuote;
  assert.deepEqual(sections, ['101', '102']);
  assert.deepEqual(flow.getState(), {
    phase: 'quoted', locked: false,
    quote: {
      eventId, version: 7, currency: 'PLN', subtotalMinor: 26400, avoidSingle: true,
      items: [
        {seatId: a.id, priceMinor: 9550},
        {seatId: c.id, priceMinor: 7850},
        {seatId: b.id, priceMinor: 9000},
      ],
    },
  });
  const creating = flow.create();
  assert.equal(flow.getState().locked, true);
  await Promise.all([flow.create(), flow.quote([b.id], false), creating]);
  assert.deepEqual(requests, [{
    eventId, seatIds: [a.id, c.id, b.id], expectedCatalogVersion: 7, idempotencyKey: 'stable-key-1', avoidSingle: true,
  }]);
  assert.equal(flow.getState().phase, 'active');
  const active = flow.getState();
  if (active.phase === 'active') assert.equal(active.source, 'created');
  assert.deepEqual([...values], [[storageKey, holdId]]);
  assert.deepEqual(phases, ['quoting', 'quoted', 'creating', 'active']);
  unsubscribe();
});

test('rejects unrecognized IDs, duplicates, removed/held seats, stale catalog, and inconsistent inventory', async () => {
  const cases: [string[], string, Partial<SeatInventory>?][] = [
    [[a.id, 'unknown'], 'unavailable'],
    [[a.id, a.id], 'invalid_request'],
    [[a.id, c.id], 'catalog_changed', {version: 8}],
    [[a.id, c.id], 'catalog_changed', {currency: 'EUR'}],
    [[a.id, c.id], 'invalid_response', {eventId: 'different-event'}],
    [[a.id, c.id], 'seat_limit', {maxSeats: 1}],
    [[a.id, c.id], 'event_closed', {status: 'paused'}],
    [[a.id, c.id], 'unavailable', {seats: []}],
    [[a.id, c.id], 'held', {seats: [{...inventory('102').seats![0], status: 'held'}]}],
    [[a.id, c.id], 'invalid_response', {seats: [{...inventory('102').seats![0], row: 12}]}],
    [[a.id, c.id], 'invalid_response', {seats: [inventory('102').seats![0], inventory('102').seats![0]]}],
  ];
  for (const [ids, code, patch] of cases) {
    const {flow, requests} = fixture({
      client: {inventory: async (_id, section) => inventory(section!, section === '102' ? patch : undefined)},
    });
    await flow.quote(ids);
    const state = flow.getState();
    assert.equal(state.phase, 'error');
    if (state.phase === 'error') assert.equal(state.error.code, code);
    await flow.create();
    assert.deepEqual(requests, []);
  }
});

test('a newer quotation wins even when an earlier request fails later', async () => {
  const old = deferred<SeatInventory>();
  const {flow} = fixture({
    client: {inventory: async (_id, section) => section === '101' ? old.promise : inventory('102')},
  });
  const pending = flow.quote([a.id]);
  await flow.quote([c.id]);
  const latest = flow.getState();
  assert.equal(latest.phase, 'quoted');
  old.reject(new SeatHoldClientError('network_error', null));
  await pending;
  assert.equal(flow.getState(), latest);
});

test('an uncertain create retains intent and key across explicit retries, including preflight rejection', async () => {
  const requests: CreateSeatHoldInput[] = [];
  const {flow, sections, values, keyCount} = fixture({
    client: {create: async input => {
      requests.push(input);
      if (requests.length === 1) throw new SeatHoldClientError('network_error', null);
      if (requests.length === 2) throw new SeatHoldClientError('rate_limited', 429);
      return hold([a.id], {status: 'expired'});
    }},
  });
  await flow.quote([a.id], false);
  await flow.create();
  const unknown = flow.getState();
  assert.equal(unknown.phase, 'create-unknown');
  assert.equal(unknown.locked, true);
  assert.equal(requests.length, 1);
  await Promise.all([flow.create(), flow.quote([b.id]), flow.restore(), flow.refresh(), flow.release()]);
  assert.deepEqual(sections, ['101']);
  assert.equal(flow.getState(), unknown);
  await flow.retry();
  assert.equal(flow.getState().phase, 'create-unknown');
  await flow.retry();
  const terminal = flow.getState();
  assert.equal(terminal.phase, 'terminal');
  if (terminal.phase === 'terminal') assert.equal(terminal.hold.status, 'expired');
  assert.equal(terminal.locked, false);
  assert.deepEqual(requests, [requests[0], requests[0], requests[0]]);
  assert.equal(keyCount(), 1);
  assert.equal(values.size, 0);
});

test('a create response that silently reprices the same seat remains unconfirmed', async () => {
  const {flow, values} = fixture({
    client: {create: async () => hold([a.id], {
      items: [{seatId: a.id, priceMinor: 8000}], subtotalMinor: 8000,
    })},
  });
  await flow.quote([a.id]);
  await flow.create();
  const state = flow.getState();
  assert.equal(state.phase, 'create-unknown');
  if (state.phase === 'create-unknown') {
    assert.equal(state.error.code, 'invalid_response');
    assert.equal(state.quote.subtotalMinor, 9550);
  }
  assert.equal(values.size, 0);
});

test('a definitive version conflict unlocks the basket and requires a fresh quote', async () => {
  let calls = 0;
  const {flow, keyCount} = fixture({
    client: {create: async () => {
      calls++;
      throw new SeatHoldClientError('catalog_changed', 409);
    }},
  });
  await flow.quote([a.id]);
  await flow.create();
  const state = flow.getState();
  assert.equal(state.phase, 'error');
  if (state.phase === 'error') assert.equal(state.error.code, 'catalog_changed');
  await flow.retry();
  await flow.create();
  assert.equal(calls, 1);
  await flow.quote([a.id]);
  await flow.create();
  assert.equal(calls, 2);
  assert.equal(keyCount(), 2);
});

test('active_hold_exists recovers an owned hold through GET and retries the read after a transient failure', async () => {
  let creates = 0, reads = 0;
  const {flow, values} = fixture({
    client: {
      async create() {
        creates++;
        throw new SeatHoldClientError('active_hold_exists', 409, {holdId});
      },
      async get(id) {
        assert.equal(id, holdId);
        if (++reads === 1) throw new SeatHoldClientError('network_error', null);
        return hold([b.id]);
      },
    },
  });
  await flow.quote([a.id]);
  await flow.create();
  assert.equal(flow.getState().phase, 'restore-unknown');
  assert.deepEqual([...values], [[storageKey, holdId]]);
  await flow.retry();
  const active = flow.getState();
  assert.equal(active.phase, 'active');
  if (active.phase === 'active') {
    assert.equal(active.source, 'recovered');
    assert.deepEqual(active.hold.items, [{seatId: b.id, priceMinor: 9000}]);
  }
  assert.equal(creates, 1);
  assert.equal(reads, 2);
});

test('reload keeps a saved ID unconfirmed while reading, then clears stale, expired, and tampered pointers', async () => {
  const route = deferred<SeatHold>();
  const {flow, values, setTime} = fixture({client: {get: () => route.promise}});
  values.set(storageKey, holdId);
  const restoring = flow.restore();
  assert.deepEqual(flow.getState(), {phase: 'restoring', locked: true, holdId});
  setTime(Date.parse(expiresAt));
  route.resolve(hold());
  await restoring;
  const terminal = flow.getState();
  assert.equal(terminal.phase, 'terminal');
  if (terminal.phase === 'terminal') assert.equal(terminal.hold.status, 'expired');
  assert.equal(values.size, 0);

  let reads = 0;
  const stale = fixture({
    client: {get: async () => {reads++; throw new SeatHoldClientError('not_found', 404);}},
  });
  stale.values.set(storageKey, '{"id":"tampered","subtotalMinor":1}');
  await stale.flow.restore();
  assert.equal(stale.flow.getState().phase, 'idle');
  assert.equal(stale.values.size, 0);
  assert.equal(reads, 0);
  stale.values.set(storageKey, holdId);
  await stale.flow.restore();
  assert.equal(stale.flow.getState().locked, false);
  assert.equal(stale.values.size, 0);
  assert.equal(reads, 1);
});

test('reload rediscovers a committed hold when the create response and local pointer were lost', async () => {
  let owned: SeatHold | null = null;
  const original = fixture({client: {
    async create() {
      owned = hold();
      throw new SeatHoldClientError('network_error', null);
    },
  }});
  await original.flow.quote([a.id]);
  await original.flow.create();
  assert.equal(original.flow.getState().phase, 'create-unknown');
  assert.equal(original.values.size, 0);
  original.flow.dispose();

  const reloaded = fixture({client: {
    async current(id) {
      assert.equal(id, eventId);
      return owned;
    },
  }});
  await reloaded.flow.restore();
  const active = reloaded.flow.getState();
  assert.equal(active.phase, 'active');
  if (active.phase === 'active') {
    assert.equal(active.source, 'recovered');
    assert.equal(active.hold.id, holdId);
  }
  assert.deepEqual([...reloaded.values], [[storageKey, holdId]]);
  assert.deepEqual(reloaded.requests, []);
});

test('a quote discovers a late create after an empty reload lookup and only checks once per quote', async () => {
  let checks = 0;
  const {flow, requests, values} = fixture({client: {
    async current() {
      return ++checks > 1 ? hold([a.id, b.id]) : null;
    },
    async inventory(_id, section) {
      return inventory(section!, {
        seats: inventory(section!).seats!.map(seat => ({...seat, status: 'held'})),
      });
    },
  }});
  await flow.restore();
  assert.equal(flow.getState().phase, 'idle');
  await flow.quote([a.id, b.id]);
  const active = flow.getState();
  assert.equal(active.phase, 'active');
  if (active.phase === 'active') assert.equal(active.source, 'recovered');
  assert.equal(checks, 2);
  assert.deepEqual(requests, []);
  assert.deepEqual([...values], [[storageKey, holdId]]);
});

test('restoration replaces a stale saved pointer with the current session-owned hold', async () => {
  for (const missing of [true, false]) {
    const {flow, values} = fixture({client: {
      async get() {
        if (missing) throw new SeatHoldClientError('not_found', 404);
        return hold([a.id], {status: 'expired'});
      },
      async current() {
        return hold([c.id], {id: nextHoldId});
      },
    }});
    values.set(storageKey, holdId);
    await flow.restore();
    const active = flow.getState();
    assert.equal(active.phase, 'active');
    if (active.phase === 'active') assert.equal(active.hold.id, nextHoldId);
    assert.deepEqual([...values], [[storageKey, nextHoldId]]);
  }
});

test('an empty session discovery unlocks, and ambiguous discovery can retry the same read', async () => {
  let checks = 0;
  const {flow, requests, values} = fixture({client: {
    async current() {
      if (++checks === 1) throw new SeatHoldClientError('network_error', null);
      return null; // The client maps session_required to no owned hold.
    },
  }});
  await flow.restore();
  const unknown = flow.getState();
  assert.equal(unknown.phase, 'restore-unknown');
  if (unknown.phase === 'restore-unknown') assert.equal(unknown.holdId, null);
  assert.equal(unknown.locked, true);
  await flow.retry();
  assert.deepEqual(flow.getState(), {phase: 'idle', locked: false});
  assert.equal(checks, 2);
  assert.deepEqual(requests, []);
  assert.equal(values.size, 0);
});

test('failed release stays locked, and a successful release preserves a newer saved pointer', async () => {
  let releases = 0;
  const {flow, values} = fixture({
    client: {release: async () => {
      if (++releases === 1) throw new SeatHoldClientError('network_error', null);
      return hold([a.id], {status: 'released'});
    }},
  });
  await flow.quote([a.id]);
  await flow.create();
  await Promise.all([flow.release(), flow.release()]);
  assert.equal(releases, 1);
  const active = flow.getState();
  assert.equal(active.phase, 'active');
  assert.equal(active.locked, true);
  if (active.phase === 'active') assert.equal(active.error?.code, 'network_error');
  assert.equal(values.get(storageKey), holdId);
  values.set(storageKey, nextHoldId);
  await flow.release();
  assert.equal(flow.getState().phase, 'terminal');
  assert.equal(flow.getState().locked, false);
  assert.equal(values.get(storageKey), nextHoldId);
});

test('a disposed flow ignores late responses and has no further storage or notification effects', async () => {
  const response = deferred<SeatHold>();
  const {flow, values} = fixture({client: {create: () => response.promise}});
  await flow.quote([a.id]);
  let notifications = 0;
  flow.subscribe(() => {notifications++;});
  const creating = flow.create();
  assert.equal(notifications, 1);
  const current = flow.getState();
  flow.dispose();
  response.resolve(hold());
  await creating;
  await flow.quote([b.id]);
  assert.equal(flow.getState(), current);
  assert.equal(notifications, 1);
  assert.equal(values.size, 0);
});
