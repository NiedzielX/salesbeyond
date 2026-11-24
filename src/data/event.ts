import type {EventStatus} from '../domain/seatRules.ts';
import type {Seat} from './stadium.ts';
import {sectors, stadiumSeats} from './stadium.ts';

/** A local, explicitly fictional event fixture. Prices are display-only catalogue amounts. */
export type DemoEvent = {
  id: string;
  title: string;
  dateLabel: string;
  status: EventStatus;
  currency: 'PLN';
  preventSingleSeats: boolean;
  catalogPriceMultiplier: number;
};

export const eventCatalog: readonly DemoEvent[] = [
  {
    id: 'enea-demo',
    title: 'Spotkanie demonstracyjne A',
    dateLabel: 'Termin demo · jesień 2026',
    status: 'open',
    currency: 'PLN',
    preventSingleSeats: false,
    catalogPriceMultiplier: 1,
  },
  {
    id: 'enea-demo-alt',
    title: 'Spotkanie demonstracyjne B',
    dateLabel: 'Termin demo · wiosna 2027',
    status: 'open',
    currency: 'PLN',
    preventSingleSeats: false,
    catalogPriceMultiplier: 1.2,
  },
];

export const defaultEvent = eventCatalog[0];
const eventById = new Map(eventCatalog.map((event) => [event.id, event]));
const legacySectorIds = new Set<string>(sectors.map((sector) => sector.id));

/** Resolve local ids only; unknown input always falls back to the default event. */
export function resolveEvent(id: unknown): DemoEvent {
  return typeof id === 'string' ? eventById.get(id) ?? defaultEvent : defaultEvent;
}

/** A display-only whole-PLN catalogue price, independent of live inventory prices. */
export function priceForEvent(event: DemoEvent, seat: Seat): number {
  return Math.round(seat.price * event.catalogPriceMultiplier);
}

/** Return the shared chart with prices projected for this event. */
export function seatsForEvent(eventId: unknown, legacyOnly = false): Seat[] {
  const event = resolveEvent(eventId);
  return stadiumSeats()
    .filter((seat) => !legacyOnly || legacySectorIds.has(seat.sectorId))
    .map((seat) => ({...seat, price: priceForEvent(event, seat)}));
}

/** @deprecated Use defaultEvent from the local event catalogue. */
export const demoEvent = defaultEvent;
