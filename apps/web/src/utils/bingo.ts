import type { BingoItem } from '@/types';

export interface BingoLine {
  type: 'row' | 'col' | 'diag';
  index: number;
}

export function calculateBingoLines(
  items: BingoItem[],
  size: number,
): BingoLine[] {
  const itemMap = new Map<number, BingoItem>();
  for (const item of items) {
    itemMap.set(item.position, item);
  }

  const lines: BingoLine[] = [];

  for (let r = 0; r < size; r++) {
    const allAchieved = Array.from({ length: size }, (_, c) => itemMap.get(r * size + c))
      .every((it) => it?.isAchieved);
    if (allAchieved) lines.push({ type: 'row', index: r });
  }

  for (let c = 0; c < size; c++) {
    const allAchieved = Array.from({ length: size }, (_, r) => itemMap.get(r * size + c))
      .every((it) => it?.isAchieved);
    if (allAchieved) lines.push({ type: 'col', index: c });
  }

  if (Array.from({ length: size }, (_, i) => itemMap.get(i * size + i)).every((it) => it?.isAchieved)) {
    lines.push({ type: 'diag', index: 0 });
  }

  if (Array.from({ length: size }, (_, i) => itemMap.get(i * size + (size - 1 - i))).every((it) => it?.isAchieved)) {
    lines.push({ type: 'diag', index: 1 });
  }

  return lines;
}
