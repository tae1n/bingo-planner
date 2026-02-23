'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { Board } from '@/types';
import { toast } from 'sonner';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';

function BoardCard({ board, onClick }: { board: Board; onClick: () => void }) {
  const pct = board.progress.total > 0
    ? Math.round((board.progress.achieved / board.progress.total) * 100)
    : 0;
  return (
    <button
      onClick={onClick}
      className="text-left bg-surface1 rounded-[var(--radius-card)] shadow p-5 hover:shadow-md transition"
    >
      <h2 className="text-lg font-semibold text-text mb-2">{board.title}</h2>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs px-2 py-0.5 rounded-[var(--radius-chip)] bg-primary/15 text-primary">
          {board.size}x{board.size}
        </span>
        <span className="text-xs px-2 py-0.5 rounded-[var(--radius-chip)] bg-surface2 text-muted">
          {board.status}
        </span>
      </div>
      <div className="w-full bg-surface2 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted mt-2 text-right">{pct}%</p>
    </button>
  );
}

export default function BoardsPage() {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSize, setNewSize] = useState(5);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    fetchBoards();
  }, [accessToken]);

  async function fetchBoards() {
    try {
      const data = await api<Board[]>('/boards');
      setBoards(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      await api('/boards', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle.trim(), size: newSize }),
      });
      setShowModal(false);
      setNewTitle('');
      setNewSize(5);
      await fetchBoards();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setCreating(false);
    }
  }

  function handleLogout() {
    logout();
    router.replace('/login');
  }

  if (!accessToken) return null;

  const myBoards = boards.filter((b) => b.role === 'OWNER');
  const reviewBoards = boards.filter((b) => b.role === 'REVIEWER');

  return (
    <main className="min-h-dvh bg-bg p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-primary">보드 목록</h1>
            {user && (
              <p className="text-sm text-muted mt-1">{user.nickname}님 환영합니다</p>
            )}
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowModal(true)}>새 보드 만들기</Button>
            <Button variant="secondary" onClick={handleLogout}>로그아웃</Button>
          </div>
        </div>

        {loading ? (
          <p className="text-muted text-center py-12">로딩 중...</p>
        ) : boards.length === 0 ? (
          <p className="text-muted text-center py-12">아직 보드가 없습니다. 새 보드를 만들어보세요!</p>
        ) : (
          <>
            {/* My boards */}
            <section className="mb-8">
              <h2 className="text-xl font-bold text-text mb-4">내 보드</h2>
              {myBoards.length === 0 ? (
                <p className="text-sm text-muted py-4">소유한 보드가 없습니다.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myBoards.map((board) => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      onClick={() => router.push(`/boards/${board.id}`)}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Review boards */}
            {reviewBoards.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-text mb-4">리뷰 보드</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {reviewBoards.map((board) => (
                    <BoardCard
                      key={board.id}
                      board={board}
                      onClick={() => router.push(`/boards/${board.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {showModal && (
        <Modal
          title="새 보드 만들기"
          onClose={() => setShowModal(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">취소</Button>
              <Button onClick={handleCreate} disabled={!newTitle.trim()} loading={creating} className="flex-1">생성</Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="보드 제목"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-4 py-3 bg-surface2 border border-border rounded-[var(--radius-control)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <label className="text-sm text-muted">
              사이즈
              <select
                value={newSize}
                onChange={(e) => setNewSize(Number(e.target.value))}
                className="ml-2 px-3 py-2 bg-surface2 border border-border rounded-[var(--radius-control)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                <option value={3}>3x3</option>
                <option value={5}>5x5</option>
                <option value={7}>7x7</option>
                <option value={9}>9x9</option>
              </select>
            </label>
          </div>
        </Modal>
      )}
    </main>
  );
}
