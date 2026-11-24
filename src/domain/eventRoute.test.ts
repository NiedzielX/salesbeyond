import assert from 'node:assert/strict';
import test from 'node:test';
import {canonicalEventSearch, parseEventRoute} from './eventRoute.ts';

const known = (id: string) => ['enea-demo', 'enea-demo-alt'].includes(id);
const validSeat = (eventId: string, seatId: string, legacyOnly: boolean) =>
  (eventId === 'enea-demo' || eventId === 'enea-demo-alt')
  && ['101-1-1', '101-2-4'].includes(seatId)
  && (!legacyOnly || seatId.startsWith('101-'));

test('missing event and legacy seat links default to the primary event', () => {
  assert.deepEqual(parseEventRoute('?seat=101-1-1', {isKnownEvent: known, isValidSeat: validSeat}), {
    eventId: 'enea-demo', seatId: '101-1-1', renderer: 'webgl', notice: null,
    canonicalSearch: '?event=enea-demo&seat=101-1-1',
  });
  assert.equal(parseEventRoute('', {isKnownEvent: known}).eventId, 'enea-demo');
});

test('event and seat deep links preserve only canonical routing fields', () => {
  const route = parseEventRoute('?utm=x&seat=101-2-4&event=enea-demo-alt&renderer=local&other=y', {
    isKnownEvent: known, isValidSeat: validSeat,
  });
  assert.equal(route.eventId, 'enea-demo');
  assert.equal(route.seatId, '101-2-4');
  assert.equal(route.notice, 'legacy-event');
  assert.equal(route.canonicalSearch, '?event=enea-demo&seat=101-2-4&renderer=local');
  assert.equal(canonicalEventSearch(route), route.canonicalSearch);
});

test('unknown and overlong events fall back without accepting an invalid seat', () => {
  for (const eventId of ['outside-event', 'x'.repeat(129)]) {
    const route = parseEventRoute(`?event=${eventId}&seat=999-1-1` , {isKnownEvent: known, isValidSeat: validSeat});
    assert.equal(route.eventId, 'enea-demo');
    assert.equal(route.seatId, null);
    assert.equal(route.notice, 'unknown-event');
  }
});

test('bad seats are removed and unknown query parameters are discarded', () => {
  const route = parseEventRoute('?event=enea-demo-alt&seat=bad&campaign=foo', {isKnownEvent: known, isValidSeat: validSeat});
  assert.equal(route.eventId, 'enea-demo-alt');
  assert.equal(route.seatId, null);
  assert.equal(route.notice, 'invalid-seat');
  assert.equal(route.canonicalSearch, '?event=enea-demo-alt');
});
