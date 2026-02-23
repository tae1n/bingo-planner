import { describe, it, expect } from 'vitest';
import { isCurrent, isPast, filterCheckpointsByTime } from '../checkpoint';

describe('isCurrent', () => {
  it('날짜 없음 → true', () => {
    expect(isCurrent({ startDate: null, deadline: null }, '2025-06-15')).toBe(true);
  });

  it('startDate만 있고 오늘이 이후 → true', () => {
    expect(isCurrent({ startDate: '2025-06-01', deadline: null }, '2025-06-15')).toBe(true);
  });

  it('startDate만 있고 오늘이 이전 → false', () => {
    expect(isCurrent({ startDate: '2025-06-20', deadline: null }, '2025-06-15')).toBe(false);
  });

  it('deadline만 있고 오늘이 이전 → true', () => {
    expect(isCurrent({ startDate: null, deadline: '2025-06-30' }, '2025-06-15')).toBe(true);
  });

  it('deadline만 있고 오늘이 이후 → false', () => {
    expect(isCurrent({ startDate: null, deadline: '2025-06-10' }, '2025-06-15')).toBe(false);
  });

  it('범위 안에 있으면 → true', () => {
    expect(isCurrent({ startDate: '2025-06-01', deadline: '2025-06-30' }, '2025-06-15')).toBe(true);
  });

  it('범위 밖 (이전) → false', () => {
    expect(isCurrent({ startDate: '2025-06-01', deadline: '2025-06-30' }, '2025-05-15')).toBe(false);
  });

  it('범위 밖 (이후) → false', () => {
    expect(isCurrent({ startDate: '2025-06-01', deadline: '2025-06-30' }, '2025-07-15')).toBe(false);
  });

  it('경계값: startDate와 동일 → true', () => {
    expect(isCurrent({ startDate: '2025-06-15', deadline: '2025-06-30' }, '2025-06-15')).toBe(true);
  });

  it('경계값: deadline과 동일 → true', () => {
    expect(isCurrent({ startDate: '2025-06-01', deadline: '2025-06-15' }, '2025-06-15')).toBe(true);
  });
});

describe('isPast', () => {
  it('deadline 없음 → false', () => {
    expect(isPast({ startDate: null, deadline: null }, '2025-06-15')).toBe(false);
  });

  it('deadline 이전 → false', () => {
    expect(isPast({ startDate: null, deadline: '2025-06-30' }, '2025-06-15')).toBe(false);
  });

  it('deadline 이후 → true', () => {
    expect(isPast({ startDate: null, deadline: '2025-06-10' }, '2025-06-15')).toBe(true);
  });

  it('deadline과 동일 → false (당일은 past가 아님)', () => {
    expect(isPast({ startDate: null, deadline: '2025-06-15' }, '2025-06-15')).toBe(false);
  });
});

describe('filterCheckpointsByTime', () => {
  const checkpoints = [
    { startDate: null, deadline: '2025-06-01' },      // past
    { startDate: '2025-06-10', deadline: '2025-06-20' }, // current
    { startDate: '2025-07-01', deadline: '2025-07-31' }, // future
    { startDate: null, deadline: null },                 // current (no dates)
  ];

  it('past/current/future 분류', () => {
    const { past, current, future } = filterCheckpointsByTime(checkpoints, '2025-06-15');
    expect(past).toHaveLength(1);
    expect(past[0].deadline).toBe('2025-06-01');
    expect(current).toHaveLength(2);
    expect(future).toHaveLength(1);
    expect(future[0].startDate).toBe('2025-07-01');
  });

  it('빈 배열', () => {
    const { past, current, future } = filterCheckpointsByTime([], '2025-06-15');
    expect(past).toEqual([]);
    expect(current).toEqual([]);
    expect(future).toEqual([]);
  });
});
