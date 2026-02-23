import { describe, it, expect } from 'vitest';
import { deduplicateEvents } from '../calendar';
import type { CalendarEvent } from '@/types';

function makeEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    date: '2025-06-15',
    type: 'ITEM',
    id: 1,
    title: 'Test',
    boardId: 1,
    itemId: 1,
    itemTitle: 'Item 1',
    isAchieved: false,
    ...overrides,
  };
}

describe('deduplicateEvents', () => {
  it('빈 배열', () => {
    expect(deduplicateEvents([])).toEqual([]);
  });

  it('중복 없으면 그대로 반환', () => {
    const events = [makeEvent({ id: 1 }), makeEvent({ id: 2 })];
    expect(deduplicateEvents(events)).toHaveLength(2);
  });

  it('같은 id + 같은 type 중복 제거', () => {
    const events = [
      makeEvent({ id: 1, type: 'ITEM' }),
      makeEvent({ id: 1, type: 'ITEM' }),
    ];
    expect(deduplicateEvents(events)).toHaveLength(1);
  });

  it('같은 id + 다른 type은 유지', () => {
    const events = [
      makeEvent({ id: 1, type: 'ITEM' }),
      makeEvent({ id: 1, type: 'CHECKPOINT' }),
    ];
    expect(deduplicateEvents(events)).toHaveLength(2);
  });
});
