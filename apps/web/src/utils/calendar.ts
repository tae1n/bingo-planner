import type { CalendarEvent } from '@/types';

export function deduplicateEvents(events: CalendarEvent[]): CalendarEvent[] {
  return events.filter(
    (ev, i, arr) => arr.findIndex((e) => e.type === ev.type && e.id === ev.id) === i,
  );
}
