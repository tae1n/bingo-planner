import type { BingoLine } from '@/utils/bingo';

interface BingoLinesProps {
  lines: BingoLine[];
  size: number;
}

export default function BingoLines({ lines, size }: BingoLinesProps) {
  if (lines.length === 0) return null;

  const cellPct = 100 / size;
  const center = (i: number) => cellPct * i + cellPct / 2;

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
      {lines.map((line, li) => {
        let x1: number, y1: number, x2: number, y2: number;

        if (line.type === 'row') {
          y1 = y2 = center(line.index);
          x1 = center(0);
          x2 = center(size - 1);
        } else if (line.type === 'col') {
          x1 = x2 = center(line.index);
          y1 = center(0);
          y2 = center(size - 1);
        } else if (line.index === 0) {
          x1 = center(0); y1 = center(0);
          x2 = center(size - 1); y2 = center(size - 1);
        } else {
          x1 = center(size - 1); y1 = center(0);
          x2 = center(0); y2 = center(size - 1);
        }

        return (
          <line
            key={li}
            x1={`${x1}%`} y1={`${y1}%`}
            x2={`${x2}%`} y2={`${y2}%`}
            stroke="var(--color-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.7"
          />
        );
      })}
    </svg>
  );
}
