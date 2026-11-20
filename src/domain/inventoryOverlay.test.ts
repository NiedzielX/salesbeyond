import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allSectors, sectorSeats, stadiumSeats, type Seat} from '../data/stadium.ts';
import type {SeatInventory} from '../integrations/seatHoldClient.ts';
import {createSeatInventoryOverlay, InventoryOverlayError} from './inventoryOverlay.ts';

const eventId = 'enea-demo';
function inventory(seats: readonly Seat[], patch: Partial<SeatInventory> = {}): SeatInventory {
  return {
    eventId, status: 'open', version: 1, currency: 'PLN', maxSeats: 10,
    holdSeconds: 600, preventSingle: false,
    seats: seats.map((seat, index) => ({
      seatId: seat.id, sectionId: seat.sectorId, row: seat.row, number: seat.number,
      priceMinor: 6500 + index, status: 'available' as const,
    })),
    ...patch,
  };
}
function assertCode(fn: () => unknown, code: string) {
  assert.throws(fn, error => error instanceof InventoryOverlayError && error.code === code);
}

test('maps authoritative prices and status while preserving canonical identity and geometry', () => {
  const canonical = sectorSeats('101');
  const overlay = createSeatInventoryOverlay(canonical, eventId);
  const response = inventory(canonical, {version: 4});
  response.seats![0].priceMinor = 9875;
  response.seats![1].status = 'sold';
  const result = overlay.apply(response, {requestSequence: 1});
  const merged = result.bySection['101'];
  assert.equal(merged.length, canonical.length);
  assert.equal(merged[0].id, canonical[0].id);
  assert.notEqual(merged[0].position, canonical[0].position);
  assert.deepEqual(merged[0].position, canonical[0].position);
  assert.ok(Object.isFrozen(merged[0].position));
  assert.equal(merged[0].priceMinor, 9875);
  assert.equal(merged[0].price, 98.75);
  assert.equal(merged[0].available, true);
  assert.equal(merged[1].inventoryStatus, 'sold');
  assert.equal(merged[1].available, false);
  assert.equal(result.countsBySection['101'].sold, 1);
});

test('owned held seats stay in the result, are unavailable to others, and are marked for the owner', () => {
  const canonical = sectorSeats('101');
  const response = inventory(canonical);
  response.seats![0].status = 'held';
  const result = createSeatInventoryOverlay(canonical, eventId).apply(response, {
    requestSequence: 1, ownedHoldIds: [canonical[0].id],
  });
  const seat = result.bySection['101'][0];
  assert.equal(seat.id, canonical[0].id);
  assert.equal(seat.inventoryStatus, 'held');
  assert.equal(seat.available, false);
  assert.equal(seat.ownedHold, true);
  assert.equal(result.countsBySection['101'].ownedHeld, 1);
});

test('accepts newer prices, then a released snapshot at the same catalog version', () => {
  const canonical = sectorSeats('101');
  const overlay = createSeatInventoryOverlay(canonical, eventId);
  const held = inventory(canonical, {version: 7});
  held.seats![0].status = 'held';
  overlay.apply(held, {requestSequence: 1});
  const released = inventory(canonical, {version: 7});
  released.seats![0].priceMinor = 12300;
  const state = overlay.apply(released, {requestSequence: 2});
  assert.equal(state.bySection['101'][0].inventoryStatus, 'available');
  assert.equal(state.bySection['101'][0].price, 123);
  assert.equal(state.countsBySection['101'].available, canonical.length);
});

test('rejects older versions, out-of-order section replies, and event mismatches', () => {
  const canonical = sectorSeats('101');
  const overlay = createSeatInventoryOverlay(canonical, eventId);
  overlay.apply(inventory(canonical, {version: 3}), {requestSequence: 2});
  assertCode(() => overlay.apply(inventory(canonical, {version: 2}), {requestSequence: 3}), 'stale_version');
  assertCode(() => overlay.apply(inventory(canonical, {version: 3}), {requestSequence: 1}), 'stale_request');
  assertCode(() => overlay.apply(inventory(canonical, {eventId: 'another-event'}), {requestSequence: 3}), 'event_mismatch');
});

test('catalog version bumps clear older section snapshots only after incoming validation succeeds', () => {
  const canonical = stadiumSeats();
  const overlay = createSeatInventoryOverlay(canonical, eventId);
  const firstSection = sectorSeats('101');
  const secondSection = sectorSeats('102');
  overlay.apply(inventory(firstSection, {version: 10}), {requestSequence: 1});
  overlay.apply(inventory(secondSection, {version: 10}), {requestSequence: 1});

  const bumped = overlay.apply(inventory(firstSection, {version: 11}), {requestSequence: 2});
  assert.equal(bumped.version, 11);
  assert.ok(bumped.bySection['101']);
  assert.equal(bumped.bySection['102'], undefined);
  assert.equal(bumped.countsBySection['102'], undefined);

  const invalidBump = inventory(secondSection, {version: 12});
  invalidBump.seats!.pop();
  assertCode(() => overlay.apply(invalidBump, {requestSequence: 2}), 'missing_seat');
  const unchanged = overlay.snapshot();
  assert.equal(unchanged.version, 11);
  assert.ok(unchanged.bySection['101']);
  assert.equal(unchanged.bySection['102'], undefined);
});

test('rejects duplicate, foreign, missing, and coordinate-mismatched inventory', () => {
  const canonical = sectorSeats('101');
  const overlay = createSeatInventoryOverlay(canonical, eventId);
  const duplicate = inventory(canonical); duplicate.seats!.push({...duplicate.seats![0]});
  assertCode(() => overlay.apply(duplicate, {requestSequence: 1}), 'duplicate_seat');
  const foreign = inventory(canonical); foreign.seats![0].seatId = 'foreign-seat';
  assertCode(() => overlay.apply(foreign, {requestSequence: 2}), 'unknown_seat');
  const missing = inventory(canonical); missing.seats!.pop();
  assertCode(() => overlay.apply(missing, {requestSequence: 3}), 'missing_seat');
  const badCoordinates = inventory(canonical); badCoordinates.seats![0].row += 1;
  assertCode(() => overlay.apply(badCoordinates, {requestSequence: 4}), 'coordinate_mismatch');
});

test('event closure prevents choosing available seats and empty section snapshots fail closed', () => {
  const canonical = sectorSeats('101');
  const overlay = createSeatInventoryOverlay(canonical, eventId);
  const closed = overlay.apply(inventory(canonical, {status: 'closed'}), {requestSequence: 1});
  assert.ok(closed.bySection['101'].every(seat => !seat.available && seat.inventoryStatus === 'closed'));
  const empty = inventory([]);
  assertCode(() => createSeatInventoryOverlay(canonical, eventId).apply(empty, {requestSequence: 1}), 'unknown_section');
  const malformedStatus = inventory(canonical, {status: 'broken' as SeatInventory['status']});
  assertCode(() => createSeatInventoryOverlay(canonical, eventId).apply(malformedStatus, {requestSequence: 1}), 'invalid_inventory');
});

test('covers all 38,078 canonical seats across section responses without dropping IDs', () => {
  const canonical = stadiumSeats();
  assert.equal(canonical.length, 38078);
  const overlay = createSeatInventoryOverlay(canonical, eventId);
  let requestSequence = 0;
  for (const section of allSectors) {
    const sectionSeatsCanonical = canonical.filter(seat => seat.sectorId === section.id);
    if (!sectionSeatsCanonical.length) continue;
    const state = overlay.apply(inventory(sectionSeatsCanonical, {version: 12}), {requestSequence: ++requestSequence});
    assert.equal(state.bySection[section.id].length, sectionSeatsCanonical.length);
  }
  const mergedIds = Object.values(overlay.snapshot().bySection).flat().map(seat => seat.id);
  assert.equal(mergedIds.length, canonical.length);
  assert.deepEqual(new Set(mergedIds), new Set(canonical.map(seat => seat.id)));
});
