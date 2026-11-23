import assert from 'node:assert/strict';
import test from 'node:test';
import {act, createElement} from 'react';
import {createRoot, extend} from '@react-three/fiber';
import * as THREE from 'three';
import {stadiumSeats, type Seat} from '../data/stadium.ts';
import {useSectionInventory} from '../components/useSectionInventory.ts';
import type {SeatInventory} from './seatHoldClient.ts';

type InventoryClientFactory = typeof import('./seatHoldClient.ts').createSeatHoldClient;

test('event status survives navigation and pending or failed inventory, then follows a successful response', async () => {
  extend(THREE);
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  const originalActEnvironment = globalThis.IS_REACT_ACT_ENVIRONMENT;
  globalThis.window = {
    setInterval: () => 1,
    clearInterval: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  } as unknown as Window & typeof globalThis;
  globalThis.document = {visibilityState: 'visible'} as Document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;

  class FakeCanvas extends EventTarget {
    style = {};
    ownerDocument = new EventTarget();
    setPointerCapture() {}
  }

  const seats = stadiumSeats();
  const bySection = new Map<string, Seat[]>();
  for (const seat of seats) bySection.set(seat.sectorId, [...(bySection.get(seat.sectorId) ?? []), seat]);
  const [sectionA, sectionB] = [...bySection.entries()].slice(0, 2);
  assert.ok(sectionA && sectionB);
  let latest: ReturnType<typeof useSectionInventory> | null = null;
  const requests: {resolve: (value: SeatInventory) => void; reject: (reason: Error) => void}[] = [];
  const clientFactory = (() => ({
    inventory: async (_eventId: string, sectionId?: string) => {
      void sectionId;
      return await new Promise<SeatInventory>((resolve, reject) => requests.push({resolve, reject}));
    },
  })) as InventoryClientFactory;
  function Harness(props: {enabled: boolean; section: string | null}) {
    latest = useSectionInventory(seats, props.enabled, props.section, [], '', clientFactory);
    return null;
  }

  const canvas = new FakeCanvas();
  const root = createRoot(canvas as unknown as HTMLCanvasElement);
  try {
    await root.configure({frameloop: 'never', size: {width: 10, height: 10}, gl: {
      domElement: canvas,
      setPixelRatio() {},
      setSize() {},
      render() {},
    } as unknown as THREE.WebGLRenderer});
    const commit = async (enabled: boolean, section: string | null) => {
      await act(async () => { root.render(createElement(Harness, {enabled, section})); });
    };
    const response = (section: [string, Seat[]], status: SeatInventory['status'], version: number): SeatInventory => ({
      eventId: 'enea-demo', status, version, currency: 'PLN', maxSeats: 10, holdSeconds: 300, preventSingle: false,
      seats: section[1].map(seat => ({seatId: seat.id, sectionId: seat.sectorId, row: seat.row, number: seat.number, priceMinor: Math.round(seat.price * 100), status: 'available'})),
    });
    const resolveNext = async (value: SeatInventory) => {
      const request = requests.shift();
      assert.ok(request);
      await act(async () => { request.resolve(value); await Promise.resolve(); });
    };

    await commit(true, sectionA[0]);
    await resolveNext(response(sectionA, 'closed', 1));
    assert.equal(latest?.eventStatus, 'closed');

    await act(async () => { latest?.refresh(); });
    assert.equal(latest?.loading, true);
    assert.ok(latest?.snapshot.bySection[sectionA[0]], 'an accepted service snapshot remains while refreshing');
    const refreshFailure = requests.shift();
    assert.ok(refreshFailure);
    await act(async () => { refreshFailure.reject(new Error('offline')); await Promise.resolve(); });
    assert.equal(latest?.error, true);
    assert.ok(latest?.snapshot.bySection[sectionA[0]], 'a failed refresh retains the last accepted service snapshot');

    await commit(true, sectionB[0]);
    assert.equal(latest?.eventStatus, 'closed', 'status remains available while the next section is loading');
    const failedRequest = requests.shift();
    assert.ok(failedRequest);
    await act(async () => { failedRequest.reject(new Error('offline')); await Promise.resolve(); });
    assert.equal(latest?.eventStatus, 'closed', 'a failed request leaves the authoritative status intact');
    assert.equal(latest?.error, true);
    await commit(true, null);
    assert.equal(latest?.eventStatus, 'closed', 'overview keeps the last event-level status');

    await commit(true, sectionB[0]);
    await resolveNext(response(sectionB, 'open', 2));
    assert.equal(latest?.eventStatus, 'open', 'a successful response can authoritatively reopen the event');

    await commit(true, sectionA[0]);
    const staleRequest = requests.shift();
    assert.ok(staleRequest);
    await commit(true, null);
    await act(async () => { staleRequest.resolve(response(sectionA, 'cancelled', 3)); await Promise.resolve(); });
    assert.equal(latest?.eventStatus, 'open', 'a disposed section response cannot replace the event status');

    await commit(false, null);
    assert.equal(latest?.eventStatus, null, 'disabling live inventory resets its event status');
  } finally {
    await act(async () => { root.unmount(); });
    globalThis.window = originalWindow;
    globalThis.document = originalDocument;
    globalThis.IS_REACT_ACT_ENVIRONMENT = originalActEnvironment;
  }
});
