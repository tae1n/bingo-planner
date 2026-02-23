import { describe, it, expect } from 'vitest';
import { calculateBingoLines } from '../bingo';
import type { BingoItem } from '@/types';

function makeItem(position: number, isAchieved: boolean): BingoItem {
  return {
    id: position + 1,
    title: `Item ${position}`,
    description: null,
    position,
    color: null,
    conditionType: 'ONCE',
    targetCount: 1,
    isAchieved,
    achievedAt: null,
  };
}

describe('calculateBingoLines', () => {
  it('빈 보드 → 빈 배열', () => {
    expect(calculateBingoLines([], 3)).toEqual([]);
  });

  it('3x3 첫 번째 행 완료', () => {
    const items = [0, 1, 2].map((p) => makeItem(p, true));
    const lines = calculateBingoLines(items, 3);
    expect(lines).toContainEqual({ type: 'row', index: 0 });
  });

  it('3x3 첫 번째 열 완료', () => {
    const items = [0, 3, 6].map((p) => makeItem(p, true));
    const lines = calculateBingoLines(items, 3);
    expect(lines).toContainEqual({ type: 'col', index: 0 });
  });

  it('3x3 주대각선 완료', () => {
    const items = [0, 4, 8].map((p) => makeItem(p, true));
    const lines = calculateBingoLines(items, 3);
    expect(lines).toContainEqual({ type: 'diag', index: 0 });
  });

  it('3x3 반대각선 완료', () => {
    const items = [2, 4, 6].map((p) => makeItem(p, true));
    const lines = calculateBingoLines(items, 3);
    expect(lines).toContainEqual({ type: 'diag', index: 1 });
  });

  it('여러 빙고 동시 달성', () => {
    // 전체 3x3 완료 → 3행 + 3열 + 2대각선 = 8개
    const items = Array.from({ length: 9 }, (_, i) => makeItem(i, true));
    const lines = calculateBingoLines(items, 3);
    expect(lines).toHaveLength(8);
  });

  it('5x5 보드 행 완료', () => {
    const items = [0, 1, 2, 3, 4].map((p) => makeItem(p, true));
    const lines = calculateBingoLines(items, 5);
    expect(lines).toContainEqual({ type: 'row', index: 0 });
  });

  it('부분 달성 → 빙고 없음', () => {
    const items = [0, 1].map((p) => makeItem(p, true));
    const lines = calculateBingoLines(items, 3);
    expect(lines).toEqual([]);
  });

  it('달성하지 않은 아이템이 있으면 빙고 미성립', () => {
    const items = [
      makeItem(0, true),
      makeItem(1, true),
      makeItem(2, false),
    ];
    const lines = calculateBingoLines(items, 3);
    expect(lines.filter((l) => l.type === 'row' && l.index === 0)).toHaveLength(0);
  });
});
