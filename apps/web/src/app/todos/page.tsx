'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { TodoBoard, TodoCheckpoint } from '@/types';
import { getTodayStr, isCurrent, isPast } from '@/utils/checkpoint';

export default function TodosPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [boards, setBoards] = useState<TodoBoard[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [showPast, setShowPast] = useState<Set<number>>(new Set());
  const [showFuture, setShowFuture] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    fetchTodoTree();
  }, [accessToken]);

  async function fetchTodoTree() {
    try {
      const data = await api<TodoBoard[]>('/todos/tree');
      setBoards(data);

      const today = getTodayStr();
      const autoExpand = new Set<number>();
      for (const board of data) {
        for (const item of board.items) {
          const hasCurrent = item.checkpoints.some(
            (cp) => isCurrent(cp, today) && !isPast(cp, today),
          );
          if (hasCurrent) autoExpand.add(item.id);
        }
      }
      setExpandedItems(autoExpand);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(itemId: number) {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function togglePast(itemId: number) {
    setShowPast((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function toggleFuture(itemId: number) {
    setShowFuture((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  const today = getTodayStr();

  if (!accessToken) return null;

  return (
    <main className="min-h-dvh bg-bg p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center mb-6">
          <h1 className="text-2xl font-bold text-text">할 일</h1>
        </div>

        {loading ? (
          <p className="text-muted text-center py-12">로딩 중...</p>
        ) : boards.length === 0 ? (
          <p className="text-muted text-center py-12">
            미달성 체크포인트가 없습니다.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {boards.map((board) => (
              <div key={board.id} className="bg-surface1 rounded-[var(--radius-card)] shadow overflow-hidden">
                {/* 보드 헤더 */}
                <div
                  className="px-4 py-3 bg-primary/10 border-b border-border cursor-pointer"
                  onClick={() => router.push(`/boards/${board.id}`)}
                >
                  <h2 className="text-sm font-bold text-primary">{board.title}</h2>
                </div>

                {/* 아이템 목록 */}
                <div>
                  {board.items.map((item) => {
                    const isExpanded = expandedItems.has(item.id);
                    const pastCps = item.checkpoints.filter((cp) => isPast(cp, today));
                    const currentCps = item.checkpoints.filter(
                      (cp) => isCurrent(cp, today) && !isPast(cp, today),
                    );
                    const futureCps = item.checkpoints.filter(
                      (cp) => !isCurrent(cp, today) && !isPast(cp, today),
                    );
                    const totalCps = item.checkpoints.length;
                    const achievedCps = item.checkpoints.filter((c) => c.isAchieved).length;

                    return (
                      <div key={item.id} className="border-b border-border last:border-0">
                        <button
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface2 transition text-left"
                          onClick={() => toggleItem(item.id)}
                        >
                          <svg
                            className={`w-4 h-4 text-muted flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-text truncate">{item.title}</p>
                            <p className="text-[10px] text-muted">
                              {item.conditionType === 'WEEKLY' ? `주${item.targetCount}회` :
                               item.conditionType === 'MONTHLY' ? `월${item.targetCount}회` :
                               item.conditionType === 'YEARLY' ? `연${item.targetCount}회` :
                               item.conditionType === 'COUNT' ? `${item.targetCount}회` : '1회'}
                            </p>
                          </div>
                          <span className="text-xs text-muted flex-shrink-0">
                            {achievedCps}/{totalCps}
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="pl-8 pr-4 pb-3">
                            {pastCps.length > 0 && (
                              <div className="mb-2">
                                <button
                                  className="flex items-center gap-1 text-xs text-muted hover:text-text mb-1"
                                  onClick={() => togglePast(item.id)}
                                >
                                  <svg
                                    className={`w-3 h-3 transition-transform ${showPast.has(item.id) ? 'rotate-90' : ''}`}
                                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                  </svg>
                                  지난 기한 ({pastCps.length})
                                </button>
                                {showPast.has(item.id) && (
                                  <div className="flex flex-col gap-1">
                                    {pastCps.map((cp) => (
                                      <CheckpointRow key={cp.id} cp={cp} variant="past" boardId={board.id} itemId={item.id} router={router} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {currentCps.length > 0 ? (
                              <div className="flex flex-col gap-1 mb-2">
                                {currentCps.map((cp) => (
                                  <CheckpointRow key={cp.id} cp={cp} variant="current" boardId={board.id} itemId={item.id} router={router} />
                                ))}
                              </div>
                            ) : pastCps.length === 0 && futureCps.length === 0 ? (
                              <p className="text-xs text-muted mb-2">체크포인트가 없습니다.</p>
                            ) : null}

                            {futureCps.length > 0 && (
                              <div>
                                <button
                                  className="flex items-center gap-1 text-xs text-muted hover:text-text mb-1"
                                  onClick={() => toggleFuture(item.id)}
                                >
                                  <svg
                                    className={`w-3 h-3 transition-transform ${showFuture.has(item.id) ? 'rotate-90' : ''}`}
                                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                  </svg>
                                  예정 ({futureCps.length})
                                </button>
                                {showFuture.has(item.id) && (
                                  <div className="flex flex-col gap-1">
                                    {futureCps.map((cp) => (
                                      <CheckpointRow key={cp.id} cp={cp} variant="future" boardId={board.id} itemId={item.id} router={router} />
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function CheckpointRow({
  cp,
  variant,
  boardId,
  itemId,
  router,
}: {
  cp: TodoCheckpoint;
  variant: 'past' | 'current' | 'future';
  boardId: number;
  itemId: number;
  router: ReturnType<typeof useRouter>;
}) {
  const colors = {
    past: 'text-muted',
    current: 'text-text',
    future: 'text-muted',
  };
  const dateBg = {
    past: 'text-muted',
    current: 'text-primary',
    future: 'text-muted',
  };

  return (
    <button
      className="flex items-center gap-2 py-1.5 px-2 rounded-[var(--radius-control)] hover:bg-surface2 transition text-left w-full"
      onClick={() => router.push(`/boards/${boardId}/items/${itemId}?cp=${cp.id}`)}
    >
      {cp.isAutoGenerated ? (
        <div className="flex-1 min-w-0">
          <span className={`text-xs ${colors[variant]}`}>{cp.title}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="flex-1 h-1 bg-surface2 rounded-full overflow-hidden max-w-[80px]">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${Math.min(100, (cp.achievedCount / cp.targetCount) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-muted">{cp.achievedCount}/{cp.targetCount}</span>
          </div>
        </div>
      ) : (
        <span className={`flex-1 text-xs ${colors[variant]} truncate`}>{cp.title}</span>
      )}
      {cp.deadline && (
        <span className={`text-[10px] flex-shrink-0 ${dateBg[variant]}`}>
          {cp.deadline.slice(5)}
        </span>
      )}
    </button>
  );
}
