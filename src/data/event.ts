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
  selectionPolicy: Readonly<{minSeats: number; maxSeats: number}>;
  ticketTypes: readonly DemoTicketType[];
  defaultTicketTypeId: string;
};

export type DemoTicketType = Readonly<{
  id: 'standard' | 'reduced' | 'child';
  label: string;
  adjustmentMinor: number;
}>;

const ticketTypesA = [
  {id: 'standard', label: 'Normalny', adjustmentMinor: 0},
  {id: 'reduced', label: 'Ulgowy', adjustmentMinor: -1000},
  {id: 'child', label: 'Dziecko', adjustmentMinor: -2000},
] as const satisfies readonly DemoTicketType[];

const ticketTypesB = [
  {id: 'standard', label: 'Normalny', adjustmentMinor: 0},
  {id: 'reduced', label: 'Ulgowy', adjustmentMinor: -1500},
  {id: 'child', label: 'Dziecko', adjustmentMinor: -3000},
] as const satisfies readonly DemoTicketType[];

export const eventCatalog: readonly DemoEvent[] = [
  {
    id: 'enea-demo',
    title: 'Spotkanie demonstracyjne A',
    dateLabel: 'Termin demo · jesień 2026',
    status: 'open',
    currency: 'PLN',
    preventSingleSeats: false,
    catalogPriceMultiplier: 1,
    selectionPolicy: {minSeats: 1, maxSeats: 10},
    ticketTypes: ticketTypesA,
    defaultTicketTypeId: 'standard',
  },
  {
    id: 'enea-demo-alt',
    title: 'Spotkanie demonstracyjne B',
    dateLabel: 'Termin demo · wiosna 2027',
    status: 'open',
    currency: 'PLN',
    preventSingleSeats: false,
    catalogPriceMultiplier: 1.2,
    selectionPolicy: {minSeats: 2, maxSeats: 6},
    ticketTypes: ticketTypesB,
    defaultTicketTypeId: 'standard',
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

export function resolveTicketType(event: DemoEvent, id: unknown): DemoTicketType {
  return typeof id === 'string'
    ? event.ticketTypes.find((ticketType) => ticketType.id === id) ?? event.ticketTypes[0]
    : event.ticketTypes[0];
}

/** Display-only catalogue amount. The hold service recalculates integer minor units independently. */
export function ticketPriceMinor(event: DemoEvent, seat: Seat, ticketTypeId: unknown): number {
  const baseMinor = priceForEvent(event, seat) * 100;
  return Math.max(0, baseMinor + resolveTicketType(event, ticketTypeId).adjustmentMinor);
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
