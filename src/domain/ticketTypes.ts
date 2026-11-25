import type {DemoEvent} from '../data/event.ts';
import type {Seat} from '../data/stadium.ts';

export type TicketTypeBySeat = Readonly<Record<string, string>>;
export type TicketSelectionItem = Readonly<{seatId: string; ticketTypeId: string}>;

export function normalizeTicketTypeAssignments(
  event: DemoEvent,
  seats: readonly Seat[],
  source: unknown,
): Record<string, string> {
  const raw = source && typeof source === 'object' && !Array.isArray(source)
    ? source as Record<string, unknown>
    : {};
  const allowed = new Set<string>(event.ticketTypes.map(({id}) => id));
  return Object.fromEntries(seats.map((seat) => {
    const value = raw[seat.id];
    return [seat.id, typeof value === 'string' && allowed.has(value) ? value : event.defaultTicketTypeId];
  }));
}

export function ticketSelectionItems(
  event: DemoEvent,
  seats: readonly Seat[],
  assignments: TicketTypeBySeat,
): TicketSelectionItem[] {
  const normalized = normalizeTicketTypeAssignments(event, seats, assignments);
  return seats.map(({id}) => ({seatId: id, ticketTypeId: normalized[id]}));
}

export function selectionPolicyIssue(event: DemoEvent, count: number): 'below_minimum' | 'seat_limit' | null {
  if (!Number.isInteger(count) || count < 0 || count > event.selectionPolicy.maxSeats) return 'seat_limit';
  return count > 0 && count < event.selectionPolicy.minSeats ? 'below_minimum' : null;
}
