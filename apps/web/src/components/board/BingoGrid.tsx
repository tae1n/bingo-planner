'use client';

import { useRef, useState, useCallback } from 'react';
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

const LONG_PRESS_MS = 500;

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
  const [menuItemId, setMenuItemId] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didLongPress = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  function handleTouchStart(itemId: number) {
    didLongPress.current = false;
    timerRef.current = setTimeout(() => {
      didLongPress.current = true;
      setMenuItemId(itemId);
    }, LONG_PRESS_MS);
  }

  function handleTouchEnd() {
    clearTimer();
  }

  function handleCellClick(item: BingoItem) {
    if (didLongPress.current) {
      didLongPress.current = false;
      return;
    }
    onCellClick(item);
  }

  return (
    <>
      <div
        className="grid gap-1.5 sm:gap-2"
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
                onTouchStart={() => handleTouchStart(item.id)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={clearTimer}
                onClick={() => handleCellClick(item)}
                onContextMenu={(e) => { e.preventDefault(); setMenuItemId(item.id); }}
                className={`relative aspect-square flex flex-col items-center justify-center rounded-[var(--radius-control)] text-sm font-medium p-2 text-center cursor-pointer transition select-none group ${
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
                {/* Desktop only: hover buttons */}
                {isReviewer && (
                  <button
                    onClick={(e) => onToggleAchieve(e, item.id)}
                    className={`absolute bottom-1 left-1 w-5 h-5 rounded-full text-xs items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex ${
                      item.isAchieved ? 'bg-white/30 text-white hover:bg-white/50' : 'bg-success text-white hover:bg-success/80'
                    }`}
                  >
                    ✓
                  </button>
                )}
                {isOwner && (
                  <button
                    onClick={(e) => onDeleteItem(e, item.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-danger text-white text-xs items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex hover:bg-danger/80"
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

      {/* Long-press context menu */}
      {menuItemId !== null && (() => {
        const menuItem = items.find((it) => it.id === menuItemId);
        if (!menuItem) return null;
        return (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            onClick={() => setMenuItemId(null)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div
              className="relative bg-surface1 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xs mx-auto overflow-hidden safe-area-bottom"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-center text-sm font-semibold text-text px-4 pt-4 pb-2 truncate">
                {menuItem.title}
              </p>
              <div className="border-t border-border">
                {(isOwner || isReviewer) && (
                  <button
                    onClick={(e) => { onToggleAchieve(e, menuItem.id); setMenuItemId(null); }}
                    className="w-full text-left px-4 py-3 text-sm text-text hover:bg-surface2 transition"
                  >
                    {menuItem.isAchieved ? '달성 취소' : '달성 처리'}
                  </button>
                )}
                <button
                  onClick={() => { onCellClick(menuItem); setMenuItemId(null); }}
                  className="w-full text-left px-4 py-3 text-sm text-text hover:bg-surface2 transition"
                >
                  상세 보기
                </button>
                {isOwner && (
                  <button
                    onClick={(e) => { onDeleteItem(e, menuItem.id); setMenuItemId(null); }}
                    className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-surface2 transition"
                  >
                    삭제
                  </button>
                )}
              </div>
              <div className="border-t border-border">
                <button
                  onClick={() => setMenuItemId(null)}
                  className="w-full text-center px-4 py-3 text-sm font-medium text-muted hover:bg-surface2 transition"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
