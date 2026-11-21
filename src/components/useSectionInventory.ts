import {useCallback, useEffect, useRef, useState} from 'react';
import type {Seat} from '../data/stadium.ts';
import {createSeatInventoryOverlay, type InventoryOverlayState} from '../domain/inventoryOverlay.ts';
import {createSeatHoldClient,type SeatInventory} from '../integrations/seatHoldClient.ts';

const EVENT_ID = 'enea-demo';
const POLL_INTERVAL_MS = 15_000;
let nextRequestSequence = 0;

export type SectionInventorySnapshot = Readonly<{
  snapshot: InventoryOverlayState;
  loading: boolean;
  error: boolean;
  updatedAt: number | null;
  eventStatus:SeatInventory['status']|null;
  refresh: () => void;
}>;

const emptySnapshot = (): InventoryOverlayState => Object.freeze({
  eventId: EVENT_ID,
  version: 0,
  bySection: Object.freeze({}),
  countsBySection: Object.freeze({}),
});

/** Fetches and overlays live inventory for the currently selected section only. */
export function useSectionInventory(
  stableSeats: readonly Seat[],
  enabled: boolean,
  sectorId: string | null,
  ownedHoldIds: readonly string[],
  refreshKey: string,
  createClient: typeof createSeatHoldClient = createSeatHoldClient,
): SectionInventorySnapshot {
  const seatsRef = useRef(stableSeats);
  const ownedIdsRef = useRef(ownedHoldIds);
  seatsRef.current = stableSeats;
  ownedIdsRef.current = ownedHoldIds;

  const [snapshot, setSnapshot] = useState<InventoryOverlayState>(emptySnapshot);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [eventStatus,setEventStatus]=useState<SeatInventory['status']|null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const requestRef = useRef<(() => void) | null>(null);
  const previousRefreshKey = useRef(refreshKey);

  const refresh = useCallback(() => requestRef.current?.(), []);

  useEffect(() => {
    if (!enabled || !sectorId) {
      requestRef.current = null;
      setSnapshot(emptySnapshot());
      setLoading(false);
      setError(false);
      setUpdatedAt(null);
      if (!enabled) setEventStatus(null);
      return;
    }

    let disposed = false;
    let fetching = false;
    let manualRefreshQueued = false;
    const client = createClient();
    const overlay = createSeatInventoryOverlay(seatsRef.current, EVENT_ID);

    setSnapshot(overlay.snapshot());
    setLoading(true);
    setError(false);
    setUpdatedAt(null);

    const fetchSection = async (): Promise<void> => {
      if (disposed) return;
      if (fetching) {
        manualRefreshQueued = true;
        return;
      }
      fetching = true;
      setLoading(true);
      try {
        do {
          manualRefreshQueued = false;
          const requestSequence = ++nextRequestSequence;
          const inventory = await client.inventory(EVENT_ID, sectorId);
          if (disposed) return;
          if (manualRefreshQueued) continue;
          setSnapshot(overlay.apply(inventory, {
            requestSequence,
            ownedHoldIds: ownedIdsRef.current,
          }));
          setError(false);
          setUpdatedAt(Date.now());setEventStatus(inventory.status);
        } while (!disposed && manualRefreshQueued);
      } catch {
        if (!disposed) setError(true);
      } finally {
        fetching = false;
        if (!disposed) {setLoading(false);if(manualRefreshQueued)void fetchSection();}
      }
    };

    requestRef.current = () => {
      if (fetching) manualRefreshQueued = true;
      else void fetchSection();
    };
    void fetchSection();

    return () => {
      disposed = true;
      manualRefreshQueued = false;
      if (requestRef.current) requestRef.current = null;
    };
  }, [enabled, sectorId, createClient]);

  useEffect(() => {
    if (previousRefreshKey.current === refreshKey) return;
    previousRefreshKey.current = refreshKey;
    if (enabled && sectorId) refresh();
  }, [enabled, sectorId, refreshKey, refresh]);

  useEffect(() => {
    if (!enabled || !sectorId) return;
    const poll = () => {
      if (document.visibilityState !== 'hidden') refresh();
    };
    const onFocus = () => refresh();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, [enabled, sectorId, refresh]);

  return {snapshot, loading, error, updatedAt, eventStatus,refresh};
}
