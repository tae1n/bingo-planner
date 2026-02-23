'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ConditionType } from '@bingo-planner/shared';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { BoardInfo, ItemDetail, ProgressRecord } from '@/types';
import { useCheckpoints } from '@/hooks/useCheckpoints';
import { useProgressRecords } from '@/hooks/useProgressRecords';
import { getTodayStr, filterCheckpointsByTime, isPast } from '@/utils/checkpoint';
import { toast } from 'sonner';
import Button from '@/components/common/Button';
import StatusBadge from '@/components/common/StatusBadge';
import ItemEditForm from '@/components/item/ItemEditForm';
import CheckpointCard from '@/components/item/CheckpointCard';
import ProgressRecordForm from '@/components/item/ProgressRecordForm';
import ProgressRecordCard from '@/components/item/ProgressRecordCard';
import RecordDetailModal from '@/components/item/RecordDetailModal';

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const currentUser = useAuthStore((s) => s.user);
  const boardId = params.boardId as string;
  const itemId = params.itemId as string;
  const cpIdFromQuery = searchParams.get('cp');

  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(false);
  const [boardInfo, setBoardInfo] = useState<BoardInfo | null>(null);

  const [expandedCp, setExpandedCp] = useState<number | null>(null);
  const [showPastCps, setShowPastCps] = useState(false);
  const [showFutureCps, setShowFutureCps] = useState(false);

  const [selectedRecord, setSelectedRecord] = useState<ProgressRecord | null>(null);

  const {
    checkpoints, setCheckpoints, newCpTitle, setNewCpTitle, creatingCp,
    fetchCheckpoints, createCheckpoint, updateCheckpoint, deleteCheckpoint, toggleCheckpoint,
  } = useCheckpoints(boardId, itemId);

  const { records, fetchRecords, createRecord, deleteRecord, reviewRecord } = useProgressRecords();

  const isOwner = boardInfo && currentUser ? boardInfo.ownerId === currentUser.id : false;
  const isReviewer = boardInfo && currentUser
    ? boardInfo.members.some((m) => m.userId === currentUser.id && m.role === 'REVIEWER' && m.status === 'ACCEPTED')
    : false;

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
      return;
    }
    fetchAll();
  }, [accessToken, boardId, itemId]);

  async function fetchAll() {
    try {
      const [itemData, cpData, boardData] = await Promise.all([
        api<ItemDetail>(`/boards/${boardId}/items/${itemId}`).catch(() => null),
        fetchCheckpoints(),
        api<BoardInfo>(`/boards/${boardId}`).catch(() => null),
      ]);
      if (itemData) setItem(itemData);
      if (boardData) setBoardInfo(boardData);

      if (cpData.length > 0 && expandedCp === null) {
        const today = getTodayStr();
        let targetCp = cpIdFromQuery
          ? cpData.find((cp) => cp.id === Number(cpIdFromQuery))
          : undefined;

        if (!targetCp) {
          targetCp = cpData.find((cp) => {
            const start = cp.startDate ? cp.startDate.split('T')[0] : null;
            const end = cp.deadline ? cp.deadline.split('T')[0] : null;
            if (start && end) return today >= start && today <= end;
            if (end) return today === end;
            return false;
          });
        }

        if (targetCp) {
          setExpandedCp(targetCp.id);
          fetchRecords(targetCp.id);
          const cpEnd = targetCp.deadline ? targetCp.deadline.split('T')[0] : null;
          const cpStart = targetCp.startDate ? targetCp.startDate.split('T')[0] : null;
          if (cpEnd && cpEnd < today) setShowPastCps(true);
          else if (cpStart && cpStart > today) setShowFutureCps(true);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveItem(data: {
    title: string;
    description: string | null;
    deadline: string | null;
    conditionType: ConditionType;
    targetCount: number;
  }) {
    await api(`/boards/${boardId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    setEditingItem(false);
    const updated = await api<ItemDetail>(`/boards/${boardId}/items/${itemId}`);
    setItem(updated);
  }

  async function handleExpandCheckpoint(cpId: number) {
    if (expandedCp === cpId) {
      setExpandedCp(null);
      return;
    }
    setExpandedCp(cpId);
    await fetchRecords(cpId);
  }

  async function handleDeleteCheckpoint(cpId: number) {
    await deleteCheckpoint(cpId);
    if (expandedCp === cpId) setExpandedCp(null);
  }

  async function handleCreateRecord(content: string, files: FileList | null) {
    if (!expandedCp) return;
    await createRecord(expandedCp, content, files);
    await fetchCheckpoints();
  }

  async function handleDeleteRecord(cpId: number, recordId: number) {
    await deleteRecord(cpId, recordId);
    await fetchCheckpoints();
  }

  async function handleReviewRecord(cpId: number, recordId: number, action: 'APPROVED' | 'REJECTED') {
    await reviewRecord(cpId, recordId, action);
    await fetchCheckpoints();
  }

  if (!accessToken) return null;

  if (loading) {
    return (
      <main className="min-h-dvh bg-bg flex items-center justify-center">
        <p className="text-muted">로딩 중...</p>
      </main>
    );
  }

  const todayStr = getTodayStr();
  const { past: pastCps, current: currentCps, future: futureCps } = filterCheckpointsByTime(checkpoints, todayStr);

  return (
    <main className="min-h-dvh bg-bg p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <button
          onClick={() => router.push(`/boards/${boardId}`)}
          className="text-sm text-muted hover:text-primary mb-4"
        >
          &larr; 보드로 돌아가기
        </button>

        {/* Item info */}
        {item && (
          <div className="bg-surface1 rounded-[var(--radius-card)] shadow p-6 mb-6">
            {editingItem ? (
              <ItemEditForm
                item={item}
                onSave={handleSaveItem}
                onCancel={() => setEditingItem(false)}
              />
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-text">{item.title}</h1>
                  <div className="flex items-center gap-2">
                    {isOwner && (
                      <button onClick={() => setEditingItem(true)} className="text-xs text-muted hover:text-primary">
                        수정
                      </button>
                    )}
                    <StatusBadge status={item.isAchieved ? 'ACHIEVED' : 'NOT_ACHIEVED'} />
                  </div>
                </div>
                {item.description && (
                  <p className="text-muted mt-2">{item.description}</p>
                )}
                <div className="flex gap-4 mt-3 text-xs text-muted">
                  {item.deadline && <span>기한: {item.deadline.split('T')[0]}</span>}
                  <span>조건: {
                    item.conditionType === 'COUNT' ? `${item.targetCount}회` :
                    item.conditionType === 'WEEKLY' ? `주간 반복 (${item.targetCount}회/주)` :
                    item.conditionType === 'MONTHLY' ? `월간 반복 (${item.targetCount}회/월)` :
                    item.conditionType === 'YEARLY' ? `연간 반복 (${item.targetCount}회/년)` :
                    '1회'
                  }</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Checkpoints */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-text mb-4">체크포인트</h2>

          {isOwner && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="새 체크포인트 제목"
                value={newCpTitle}
                onChange={(e) => setNewCpTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && createCheckpoint()}
                className="flex-1 px-4 py-2 bg-surface2 border border-border rounded-[var(--radius-control)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <Button onClick={createCheckpoint} disabled={creatingCp || !newCpTitle.trim()}>
                추가
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {pastCps.length > 0 && (
              <div className="mb-2">
                <button
                  onClick={() => setShowPastCps(!showPastCps)}
                  className="flex items-center gap-1 text-xs text-muted hover:text-text mb-2 px-1"
                >
                  <svg className={`w-3 h-3 transition-transform ${showPastCps ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                  지난 기한 ({pastCps.length})
                </button>
                {showPastCps && pastCps.map((cp) => (
                  <div key={cp.id} className="mb-2">
                    <CheckpointCard
                      checkpoint={cp}
                      isOwner={isOwner}
                      isReviewer={isReviewer}
                      isExpanded={expandedCp === cp.id}
                      onToggleAchieve={toggleCheckpoint}
                      onEdit={updateCheckpoint}
                      onDelete={handleDeleteCheckpoint}
                      onExpand={handleExpandCheckpoint}
                    >
                      {expandedCp === cp.id && renderExpandedContent()}
                    </CheckpointCard>
                  </div>
                ))}
              </div>
            )}

            {currentCps.map((cp) => (
              <div key={cp.id}>
                <CheckpointCard
                  checkpoint={cp}
                  isOwner={isOwner}
                  isReviewer={isReviewer}
                  isExpanded={expandedCp === cp.id}
                  onToggleAchieve={toggleCheckpoint}
                  onEdit={updateCheckpoint}
                  onDelete={handleDeleteCheckpoint}
                  onExpand={handleExpandCheckpoint}
                >
                  {expandedCp === cp.id && renderExpandedContent()}
                </CheckpointCard>
              </div>
            ))}

            {futureCps.length > 0 && (
              <div className="mt-2">
                <button
                  onClick={() => setShowFutureCps(!showFutureCps)}
                  className="flex items-center gap-1 text-xs text-muted hover:text-text mb-2 px-1"
                >
                  <svg className={`w-3 h-3 transition-transform ${showFutureCps ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                  예정 ({futureCps.length})
                </button>
                {showFutureCps && futureCps.map((cp) => (
                  <div key={cp.id} className="mb-2 opacity-60">
                    <CheckpointCard
                      checkpoint={cp}
                      isOwner={isOwner}
                      isReviewer={isReviewer}
                      isExpanded={expandedCp === cp.id}
                      onToggleAchieve={toggleCheckpoint}
                      onEdit={updateCheckpoint}
                      onDelete={handleDeleteCheckpoint}
                      onExpand={handleExpandCheckpoint}
                    >
                      {expandedCp === cp.id && renderExpandedContent()}
                    </CheckpointCard>
                  </div>
                ))}
              </div>
            )}

            {checkpoints.length === 0 && (
              <p className="text-sm text-muted text-center py-4">
                아직 체크포인트가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {selectedRecord && (
        <RecordDetailModal
          record={selectedRecord}
          isReviewer={isReviewer}
          currentUserId={currentUser?.id ?? null}
          expandedCp={expandedCp}
          onClose={() => setSelectedRecord(null)}
          onReview={handleReviewRecord}
          onDelete={handleDeleteRecord}
        />
      )}
    </main>
  );

  function renderExpandedContent() {
    return (
      <>
        {isOwner && (
          <ProgressRecordForm onSubmit={handleCreateRecord} />
        )}
        {records.length === 0 ? (
          <p className="text-xs text-muted text-center py-2">진행 기록이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {records.map((record) => (
              <ProgressRecordCard
                key={record.id}
                record={record}
                onClick={() => setSelectedRecord(record)}
              />
            ))}
          </div>
        )}
      </>
    );
  }
}
