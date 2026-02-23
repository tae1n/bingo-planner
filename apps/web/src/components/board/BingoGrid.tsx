import type { BingoItem } from '@/types';

interface BingoGridProps {
  items: BingoItem[];
  size: number;
  isOwner: boolean;
  isReviewer: boolean;
  boardId: string;
  dragOverPosition: number | null;
  onCellClick: (item: BingoItem) => void;
  onEmptyCellClick: (position: number) => void;
  onToggleAchieve: (e: React.MouseEvent, itemId: number) => void;
  onDeleteItem: (e: React.MouseEvent, itemId: number) => void;
  onDragStart: (itemId: number, position: number) => void;
  onDragOver: (e: React.DragEvent, position: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, position: number) => void;
  onDragEnd: () => void;
}

export default function BingoGrid({
  items,
  size,
  isOwner,
  isReviewer,
  dragOverPosition,
  onCellClick,
  onEmptyCellClick,
  onToggleAchieve,
  onDeleteItem,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: BingoGridProps) {
  const itemMap = new Map<number, BingoItem>();
  for (const item of items) {
    itemMap.set(item.position, item);
  }

  const totalCells = size * size;

  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}
    >
      {Array.from({ length: totalCells }, (_, i) => {
        const item = itemMap.get(i);
        const isDragOver = dragOverPosition === i;
        if (item) {
          return (
            <div
              key={i}
              draggable={isOwner}
              onDragStart={() => onDragStart(item.id, i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, i)}
              onDragEnd={onDragEnd}
              onClick={() => onCellClick(item)}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-[var(--radius-control)] text-sm font-medium p-2 text-center cursor-pointer transition group ${
                item.isAchieved
                  ? 'bg-primary text-white'
                  : 'bg-surface1 border border-border text-text hover:shadow-lg'
              } ${isDragOver ? 'ring-2 ring-primary/40 scale-105' : ''}`}
              style={item.color ? { backgroundColor: item.isAchieved ? undefined : item.color } : undefined}
            >
              <span className="leading-tight">{item.title}</span>
              {item.conditionType !== 'ONCE' && (
                <span className={`text-[10px] mt-0.5 ${item.isAchieved ? 'text-white/70' : 'text-muted'}`}>
                  {item.conditionType === 'COUNT' ? `${item.targetCount}회` :
                   item.conditionType === 'WEEKLY' ? `주${item.targetCount}회` :
                   item.conditionType === 'MONTHLY' ? `월${item.targetCount}회` :
                   `연${item.targetCount}회`}
                </span>
              )}
              {isReviewer && (
                <button
                  onClick={(e) => onToggleAchieve(e, item.id)}
                  className={`absolute bottom-1 left-1 w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                    item.isAchieved ? 'bg-white/30 text-white hover:bg-white/50' : 'bg-success text-white hover:bg-success/80'
                  }`}
                  title={item.isAchieved ? '달성 취소' : '달성'}
                >
                  ✓
                </button>
              )}
              {isOwner && (
                <button
                  onClick={(e) => onDeleteItem(e, item.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-danger text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-danger/80"
                >
                  x
                </button>
              )}
            </div>
          );
        }
        if (isOwner) {
          return (
            <div
              key={i}
              onDragOver={(e) => onDragOver(e, i)}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, i)}
              onClick={() => onEmptyCellClick(i)}
              className={`aspect-square flex items-center justify-center rounded-[var(--radius-control)] text-sm text-muted border-2 border-dashed border-border cursor-pointer hover:border-primary hover:text-primary transition ${isDragOver ? 'border-primary bg-primary/10 scale-105' : ''}`}
            >
              +
            </div>
          );
        }
        return (
          <div
            key={i}
            className="aspect-square flex items-center justify-center rounded-[var(--radius-control)] text-sm text-muted border-2 border-dashed border-border"
          />
        );
      })}
    </div>
  );
}
