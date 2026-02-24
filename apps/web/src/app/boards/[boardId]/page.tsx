'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ConditionType } from '@bingo-planner/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { BingoItem, BoardDetail } from '@/types';
import { calculateBingoLines } from '@/utils/bingo';
import { toast } from 'sonner';
import Button from '@/components/common/Button';
import Modal from '@/components/common/Modal';
import BingoGrid from '@/components/board/BingoGrid';
import BingoLines from '@/components/board/BingoLines';
import MemberList from '@/components/board/MemberList';
import CreateItemModal from '@/components/board/CreateItemModal';
import AddMemberModal from '@/components/board/AddMemberModal';
import EditBoardModal from '@/components/board/EditBoardModal';

export default function BoardDetailPage() {
  const params = useParams();
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);
  const boardId = params.boardId as string;

  const [board, setBoard] = useState<BoardDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [modalPosition, setModalPosition] = useState(0);
  const [showEditBoardModal, setShowEditBoardModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingBoard, setDeletingBoard] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // Drag & Drop
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const [draggedPosition, setDraggedPosition] = useState<number | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<number | null>(null);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    fetchBoard();
  }, [accessToken, boardId]);

  async function fetchBoard() {
    try {
      const data = await api<BoardDetail>(`/boards/${boardId}`);
      setBoard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '보드를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }

  const isOwner = !!(board && currentUser && board.ownerId === currentUser.id);
  const isReviewer = !!(board && currentUser && board.members.some(
    (m) => m.user.id === currentUser.id && m.role === 'REVIEWER' && m.status === 'ACCEPTED',
  ));

  async function handleCreateItem(data: {
    title: string;
    description?: string;
    deadline?: string;
    conditionType: ConditionType;
    targetCount: number;
  }) {
    await api(`/boards/${boardId}/items`, {
      method: 'POST',
      body: JSON.stringify({ ...data, position: modalPosition }),
    });
    setShowCreateModal(false);
    await fetchBoard();
  }

  async function handleToggleAchieve(e: React.MouseEvent, itemId: number) {
    e.stopPropagation();
    try {
      await api(`/boards/${boardId}/items/${itemId}/achieve`, { method: 'PATCH' });
      await fetchBoard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }

  async function handleDeleteItem(e: React.MouseEvent, itemId: number) {
    e.stopPropagation();
    try {
      await api(`/boards/${boardId}/items/${itemId}`, { method: 'DELETE' });
      toast.success('삭제되었습니다');
      await fetchBoard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }

  function openCreateModal(position: number) {
    setModalPosition(position);
    setShowCreateModal(true);
  }

  async function handleUpdateBoard(data: {
    title: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
  }) {
    await api(`/boards/${boardId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setShowEditBoardModal(false);
    await fetchBoard();
  }

  async function handleDeleteBoard() {
    setDeletingBoard(true);
    try {
      await api(`/boards/${boardId}`, { method: 'DELETE' });
      toast.success('삭제되었습니다');
      router.replace('/boards');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setDeletingBoard(false);
      setShowDeleteConfirm(false);
    }
  }

  async function handleAddMember(email: string, role: string) {
    await api(`/boards/${boardId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
    setShowMemberModal(false);
    await fetchBoard();
  }

  async function handleRemoveMember(memberId: number) {
    try {
      await api(`/boards/${boardId}/members/${memberId}`, { method: 'DELETE' });
      toast.success('삭제되었습니다');
      await fetchBoard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }

  async function handleChangeRole(memberId: number, newRole: string) {
    try {
      await api(`/boards/${boardId}/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      await fetchBoard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }

  function handleDragStart(itemId: number, position: number) {
    setDraggedItemId(itemId);
    setDraggedPosition(position);
  }

  function handleDragOver(e: React.DragEvent, position: number) {
    e.preventDefault();
    setDragOverPosition(position);
  }

  function handleDragLeave() {
    setDragOverPosition(null);
  }

  async function handleDrop(e: React.DragEvent, targetPosition: number) {
    e.preventDefault();
    setDragOverPosition(null);
    if (draggedPosition === null || draggedPosition === targetPosition) {
      setDraggedItemId(null);
      setDraggedPosition(null);
      return;
    }

    const itemMap = new Map<number, BingoItem>();
    for (const item of board!.items) itemMap.set(item.position, item);
    const targetItem = itemMap.get(targetPosition);

    try {
      if (targetItem) {
        await api(`/boards/${boardId}/items/swap`, {
          method: 'PATCH',
          body: JSON.stringify({ positionA: draggedPosition, positionB: targetPosition }),
        });
      } else if (draggedItemId) {
        await api(`/boards/${boardId}/items/${draggedItemId}`, {
          method: 'PATCH',
          body: JSON.stringify({ position: targetPosition }),
        });
      }
      await fetchBoard();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setDraggedItemId(null);
      setDraggedPosition(null);
    }
  }

  function handleDragEnd() {
    setDraggedItemId(null);
    setDraggedPosition(null);
    setDragOverPosition(null);
  }

  if (!accessToken) return null;

  if (loading) {
    return (
      <main className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="text-muted">로딩 중...</p>
      </main>
    );
  }

  if (error || !board) {
    return (
      <main className="min-h-dvh bg-bg flex flex-col items-center justify-center gap-4">
        <p className="text-danger">{error || '보드를 찾을 수 없습니다'}</p>
        <button onClick={() => router.push('/boards')} className="text-primary hover:underline">
          목록으로 돌아가기
        </button>
      </main>
    );
  }

  const totalCells = board.size * board.size;
  const achieved = board.items.filter((i) => i.isAchieved).length;
  const pct = board.items.length > 0 ? Math.round((achieved / totalCells) * 100) : 0;
  const bingoLines = calculateBingoLines(board.items, board.size);

  return (
    <main className="min-h-dvh bg-bg px-4 py-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          <button
            onClick={() => router.push('/boards')}
            className="text-sm text-muted hover:text-primary mb-2"
          >
            &larr; 목록으로
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold text-text mr-auto">{board.title}</h1>
            {isOwner && (
              <>
                <Button variant="secondary" size="sm" onClick={() => setShowEditBoardModal(true)}>수정</Button>
                <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>삭제</Button>
              </>
            )}
          </div>
          {board.description && <p className="text-muted text-sm mt-1">{board.description}</p>}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs px-2 py-0.5 rounded-[var(--radius-chip)] bg-primary/15 text-primary">
              {board.size}x{board.size}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-[var(--radius-chip)] bg-surface2 text-muted">
              {board.status}
            </span>
            <span className="text-sm text-muted">{pct}%</span>
            {bingoLines.length > 0 && (
              <span className="text-sm font-bold px-2 py-0.5 rounded-[var(--radius-chip)] bg-warning/15 text-warning">
                {bingoLines.length}빙고!
              </span>
            )}
          </div>
        </div>

        {/* Bingo grid */}
        <div className="relative">
          <BingoGrid
            items={board.items}
            size={board.size}
            isOwner={isOwner}
            isReviewer={isReviewer}
            boardId={boardId}
            dragOverPosition={dragOverPosition}
            onCellClick={(item) => router.push(`/boards/${boardId}/items/${item.id}`)}
            onEmptyCellClick={openCreateModal}
            onToggleAchieve={handleToggleAchieve}
            onDeleteItem={handleDeleteItem}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragEnd={handleDragEnd}
          />
          <BingoLines lines={bingoLines} size={board.size} />
        </div>

        {/* Members section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-text">멤버</h2>
            {isOwner && (
              <Button size="sm" onClick={() => setShowMemberModal(true)}>초대</Button>
            )}
          </div>
          <MemberList
            owner={board.owner}
            members={board.members}
            isOwner={isOwner}
            onChangeRole={handleChangeRole}
            onRemove={handleRemoveMember}
          />
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateItemModal
          boardHasDates={!!(board.startDate && board.endDate)}
          onSubmit={handleCreateItem}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {showMemberModal && (
        <AddMemberModal
          onSubmit={handleAddMember}
          onClose={() => setShowMemberModal(false)}
        />
      )}

      {showEditBoardModal && (
        <EditBoardModal
          initialData={{
            title: board.title,
            description: board.description ?? '',
            startDate: board.startDate ? board.startDate.split('T')[0] : '',
            endDate: board.endDate ? board.endDate.split('T')[0] : '',
          }}
          onSubmit={handleUpdateBoard}
          onClose={() => setShowEditBoardModal(false)}
        />
      )}

      {showDeleteConfirm && (
        <Modal
          title="보드 삭제"
          onClose={() => setShowDeleteConfirm(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} className="flex-1">취소</Button>
              <Button variant="danger" onClick={handleDeleteBoard} loading={deletingBoard} className="flex-1">삭제</Button>
            </>
          }
        >
          <p className="text-muted">정말로 이 보드를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        </Modal>
      )}
    </main>
  );
}
