export type EventRoute = {
  eventId: string;
  seatId: string | null;
  renderer: 'local' | 'webgl';
};

export type EventRouteNotice = 'unknown-event' | 'invalid-seat' | 'legacy-event' | null;

export type ParsedEventRoute = EventRoute & {
  notice: EventRouteNotice;
  canonicalSearch: string;
};

export type ParseEventRouteOptions = {
  defaultEventId?: string;
  isKnownEvent?: (eventId: string) => boolean;
  isValidSeat?: (eventId: string, seatId: string, legacyOnly: boolean) => boolean;
};

const MAX_ID_LENGTH = 128;

/** Build a canonical query string containing only routing state. */
export function canonicalEventSearch(route: EventRoute): string {
  const params = new URLSearchParams();
  params.set('event', route.eventId);
  if (route.seatId) params.set('seat', route.seatId);
  if (route.renderer === 'local') params.set('renderer', 'local');
  return `?${params.toString()}`;
}

/** Parse a deep link, applying legacy renderer compatibility before seat validation. */
export function parseEventRoute(search: string, options: ParseEventRouteOptions = {}): ParsedEventRoute {
  const defaultEventId = options.defaultEventId ?? 'enea-demo';
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const rawEventId = params.get('event');
  const hasEvent = rawEventId !== null;
  const rawSeatId = params.get('seat');
  const renderer: EventRoute['renderer'] = params.get('renderer') === 'local' ? 'local' : 'webgl';
  let eventId = rawEventId ?? defaultEventId;
  let notice: EventRouteNotice = null;

  if (!eventId || eventId.length > MAX_ID_LENGTH || (options.isKnownEvent && !options.isKnownEvent(eventId))) {
    eventId = defaultEventId;
    notice = 'unknown-event';
  }

  const legacyOnly = renderer === 'local';
  if (legacyOnly && eventId !== defaultEventId) {
    eventId = defaultEventId;
    notice = 'legacy-event';
  }
  // A historical `renderer=local&seat=...` link without event remains on the default event.
  if (legacyOnly && hasEvent && rawEventId !== defaultEventId && notice === null) notice = 'legacy-event';

  let seatId: string | null = rawSeatId && rawSeatId.length <= MAX_ID_LENGTH ? rawSeatId : null;
  if (rawSeatId && (!seatId || (options.isValidSeat && !options.isValidSeat(eventId, rawSeatId, legacyOnly)))) {
    seatId = null;
    if (notice === null) notice = 'invalid-seat';
  }

  const route: EventRoute = {eventId, seatId, renderer};
  return {...route, notice, canonicalSearch: canonicalEventSearch(route)};
}
