import type {Seat} from '../data/stadium.ts';
import type {HoldInventorySeat, SeatInventory} from '../integrations/seatHoldClient.ts';

export type InventoryStatus = HoldInventorySeat['status'];
export type OverlaySeat = Readonly<Seat & {
  /** Exact server amount in the backend's integer minor units (PLN grosze). */
  priceMinor: number;
  /** Display/catalog amount in major units, derived from priceMinor. */
  price: number;
  inventoryStatus: InventoryStatus;
  /** True only when this seat is in the current fan's own active hold. */
  ownedHold: boolean;
}>;
export type SectionInventoryCounts = Readonly<{
  total: number;
  available: number;
  held: number;
  blocked: number;
  sold: number;
  closed: number;
  ownedHeld: number;
}>;
export type InventoryOverlayState = Readonly<{
  eventId: string;
  version: number;
  bySection: Readonly<Record<string, readonly OverlaySeat[]>>;
  countsBySection: Readonly<Record<string, SectionInventoryCounts>>;
}>;
export type InventoryOverlayErrorCode =
  | 'event_mismatch' | 'invalid_catalog' | 'invalid_inventory' | 'unknown_section'
  | 'unknown_seat' | 'duplicate_seat' | 'missing_seat' | 'coordinate_mismatch'
  | 'stale_version' | 'stale_request';
export class InventoryOverlayError extends Error {
  readonly code: InventoryOverlayErrorCode;
  constructor(code: InventoryOverlayErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = 'InventoryOverlayError';
  }
}

const statuses: readonly InventoryStatus[] = ['available', 'held', 'blocked', 'sold', 'closed'];
const fail = (code: InventoryOverlayErrorCode, message: string): never => {
  throw new InventoryOverlayError(code, message);
};

/**
 * Creates an event-scoped overlay for section-level live inventory responses.
 * Call apply with the sequence assigned when the section request was started;
 * late responses for that same section and older catalog versions are rejected.
 */
export function createSeatInventoryOverlay(canonicalSeats: readonly Seat[], eventId: string) {
  const canonicalById = new Map<string, Seat>();
  const canonicalBySection = new Map<string, Seat[]>();
  for (const seat of canonicalSeats) {
    if (!seat.id || !seat.sectorId || canonicalById.has(seat.id)) {
      fail('invalid_catalog', `Canonical catalog has a missing or duplicate seat ID: ${seat.id}`);
    }
    canonicalById.set(seat.id, seat);
    const section = canonicalBySection.get(seat.sectorId) ?? [];
    section.push(seat);
    canonicalBySection.set(seat.sectorId, section);
  }

  let version = 0;
  const requestSequenceBySection = new Map<string, number>();
  const bySection = new Map<string, readonly OverlaySeat[]>();
  const countsBySection = new Map<string, SectionInventoryCounts>();

  function snapshot(): InventoryOverlayState {
    return Object.freeze({
      eventId,
      version,
      bySection: Object.freeze(Object.fromEntries(bySection)),
      countsBySection: Object.freeze(Object.fromEntries(countsBySection)),
    });
  }

  function apply(
    inventory: SeatInventory,
    options: {requestSequence: number; ownedHoldIds?: readonly string[]},
  ): InventoryOverlayState {
    if (inventory.eventId !== eventId) fail('event_mismatch', 'Inventory belongs to a different event.');
    if (!Number.isSafeInteger(inventory.version) || inventory.version < 1
      || !['open', 'paused', 'closed', 'cancelled'].includes(inventory.status as string)
      || !Array.isArray(inventory.seats)) {
      return fail('invalid_inventory', 'A section-level inventory snapshot with a positive version is required.');
    }
    const inventorySeats = inventory.seats;
    if (!Number.isSafeInteger(options.requestSequence) || options.requestSequence < 1) {
      fail('invalid_inventory', 'A positive request sequence is required.');
    }
    if (inventory.version < version) fail('stale_version', 'Inventory version is older than an accepted snapshot.');
    if (inventorySeats.length === 0) return fail('unknown_section', 'Empty inventory cannot identify a canonical section.');

    const sectionId = inventorySeats[0].sectionId;
    const canonicalSection = canonicalBySection.get(sectionId);
    if (!canonicalSection) return fail('unknown_section', `Unknown canonical section: ${sectionId}`);
    if (inventorySeats.some(seat => seat.sectionId !== sectionId)) {
      fail('invalid_inventory', 'A section snapshot must contain seats from exactly one section.');
    }
    const previousSequence = requestSequenceBySection.get(sectionId) ?? 0;
    if (options.requestSequence <= previousSequence) fail('stale_request', 'A later request for this section was already accepted.');

    const owned = new Set(options.ownedHoldIds ?? []);
    const incomingById = new Map<string, HoldInventorySeat>();
    for (const incoming of inventorySeats) {
      if (!statuses.includes(incoming.status) || !Number.isSafeInteger(incoming.priceMinor) || incoming.priceMinor < 0) {
        fail('invalid_inventory', `Invalid price or status for seat ${incoming.seatId}.`);
      }
      if (incomingById.has(incoming.seatId)) fail('duplicate_seat', `Duplicate inventory seat: ${incoming.seatId}`);
      const canonical = canonicalById.get(incoming.seatId);
      if (!canonical) return fail('unknown_seat', `Inventory contains a non-canonical seat: ${incoming.seatId}`);
      if (canonical.sectorId !== incoming.sectionId || canonical.row !== incoming.row || canonical.number !== incoming.number) {
        fail('coordinate_mismatch', `Inventory coordinates do not match canonical seat ${incoming.seatId}.`);
      }
      incomingById.set(incoming.seatId, incoming);
    }
    if (incomingById.size !== canonicalSection.length || canonicalSection.some(seat => !incomingById.has(seat.id))) {
      fail('missing_seat', `Inventory for section ${sectionId} does not cover its full canonical seat set.`);
    }

    const counts = {total: canonicalSection.length, available: 0, held: 0, blocked: 0, sold: 0, closed: 0, ownedHeld: 0};
    const merged = canonicalSection.map((canonical): OverlaySeat => {
      const incoming = incomingById.get(canonical.id)!;
      // Event-level closure overrides only seats that would otherwise be available.
      const inventoryStatus: InventoryStatus = inventory.status === 'open' ? incoming.status
        : incoming.status === 'available' ? 'closed' : incoming.status;
      const ownedHold = inventoryStatus === 'held' && owned.has(canonical.id);
      counts[inventoryStatus] += 1;
      if (ownedHold) counts.ownedHeld += 1;
      return Object.freeze({
        ...canonical,
        // Copy and freeze geometry so neither the overlay consumer nor a caller can mutate the canonical catalog.
        position: Object.freeze([...canonical.position]) as unknown as Seat['position'],
        priceMinor: incoming.priceMinor,
        price: incoming.priceMinor / 100,
        available: inventoryStatus === 'available',
        inventoryStatus,
        ownedHold,
      });
    });

    if (inventory.version > version) {
      // A catalog bump invalidates all previously merged sections. Do this only
      // after the incoming section has passed complete validation and mapping.
      bySection.clear();
      countsBySection.clear();
      version = inventory.version;
    }
    requestSequenceBySection.set(sectionId, options.requestSequence);
    bySection.set(sectionId, Object.freeze(merged));
    countsBySection.set(sectionId, Object.freeze(counts));
    return snapshot();
  }

  return Object.freeze({apply, snapshot});
}
