import assert from 'node:assert/strict';
import test from 'node:test';
import {defaultEvent, eventCatalog, priceForEvent, resolveEvent, seatsForEvent} from './event.ts';
import {stadiumSeats} from './stadium.ts';

test('catalog has two open, neutral demo events with a shared seat chart', () => {
  assert.equal(eventCatalog.length, 2);
  assert.equal(defaultEvent.id, 'enea-demo');
  assert.deepEqual(eventCatalog.map(({status, currency}) => [status, currency]), [['open', 'PLN'], ['open', 'PLN']]);
  assert.ok(eventCatalog.every(({title, dateLabel}) => /demonstracyjne/i.test(title) && /demo/i.test(dateLabel)));
  const first = seatsForEvent(defaultEvent.id);
  const second = seatsForEvent('enea-demo-alt');
  assert.equal(first.length, stadiumSeats().length);
  assert.deepEqual(first.map(({id}) => id), second.map(({id}) => id));
});

test('resolver falls back safely and event prices remain independent projections', () => {
  assert.equal(resolveEvent('unknown').id, defaultEvent.id);
  const seat = stadiumSeats()[0];
  const eventB = resolveEvent('enea-demo-alt');
  assert.equal(priceForEvent(defaultEvent, seat), seat.price);
  assert.equal(priceForEvent(eventB, seat), Math.round(seat.price * 1.2));
  assert.notEqual(priceForEvent(defaultEvent, seat), priceForEvent(eventB, seat));
  assert.equal(seatsForEvent('enea-demo-alt')[0].price, priceForEvent(eventB, seat));
});

test('legacy catalogue is a subset of the shared chart', () => {
  const all = seatsForEvent(defaultEvent.id);
  const legacy = seatsForEvent(defaultEvent.id, true);
  assert.ok(legacy.length > 0 && legacy.length < all.length);
  assert.ok(legacy.every((seat) => ['101', '102', '103'].includes(seat.sectorId)));
});
