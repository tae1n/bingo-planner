import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { ProgressRecord, Comment } from '@/types';
import { api, toImageUrl } from '@/lib/api';
import StatusBadge from '@/components/common/StatusBadge';
import Button from '@/components/common/Button';

interface RecordDetailModalProps {
  record: ProgressRecord;
  isReviewer: boolean;
  currentUserId: number | null;
  expandedCp: number | null;
  onClose: () => void;
  onReview: (cpId: number, recordId: number, action: 'APPROVED' | 'REJECTED') => Promise<void>;
  onDelete: (cpId: number, recordId: number) => Promise<void>;
}

export default function RecordDetailModal({
  record,
  isReviewer,
  currentUserId,
  expandedCp,
  onClose,
  onReview,
  onDelete,
}: RecordDetailModalProps) {
  const [localRecord, setLocalRecord] = useState(record);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    fetchComments();
  }, [record.id]);

  async function fetchComments() {
    try {
      const data = await api<Comment[]>(`/comments?targetType=PROGRESS_RECORD&targetId=${record.id}`);
      setComments(data);
    } catch {
      setComments([]);
    }
  }

  async function handleCreateComment() {
    if (!newComment.trim()) return;
    try {
      await api('/comments', {
        method: 'POST',
        body: JSON.stringify({
          targetType: 'PROGRESS_RECORD',
          targetId: record.id,
          content: newComment.trim(),
        }),
      });
      setNewComment('');
      await fetchComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }

  async function handleDeleteComment(commentId: number) {
    try {
      await api(`/comments/${commentId}`, { method: 'DELETE' });
      toast.success('삭제되었습니다');
      await fetchComments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '오류가 발생했습니다');
    }
  }

  async function handleReview(action: 'APPROVED' | 'REJECTED') {
    if (!expandedCp) return;
    await onReview(expandedCp, record.id, action);
    setLocalRecord({ ...localRecord, status: action });
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-surface1 w-full max-w-lg max-h-[90dvh] rounded-t-[var(--radius-card)] sm:rounded-[var(--radius-card)] shadow-xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text">{record.author.nickname}</span>
            <span className="text-xs text-muted">{record.recordedAt?.split('T')[0]}</span>
            <StatusBadge status={localRecord.status} />
          </div>
          <button onClick={onClose} className="text-muted hover:text-text p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {record.imageUrls && record.imageUrls.length > 0 && (
            <div className="flex flex-col gap-2 mb-4">
              {record.imageUrls.map((url, idx) => (
                <img key={idx} src={toImageUrl(url)} alt="" className="w-full rounded-[var(--radius-control)] object-contain max-h-80 bg-surface2" />
              ))}
            </div>
          )}

          {record.content && (
            <p className="text-sm text-text whitespace-pre-wrap mb-4">{record.content}</p>
          )}

          {isReviewer && (
            <div className="flex gap-2 mb-4">
              {localRecord.status !== 'APPROVED' && (
                <Button variant="success" size="sm" onClick={() => handleReview('APPROVED')}>승인</Button>
              )}
              {localRecord.status !== 'REJECTED' && (
                <Button variant="danger" size="sm" onClick={() => handleReview('REJECTED')}>거절</Button>
              )}
            </div>
          )}

          {currentUserId && record.author.id === currentUserId && (
            <button
              onClick={async () => {
                if (!expandedCp) return;
                await onDelete(expandedCp, record.id);
                onClose();
              }}
              className="text-xs text-danger hover:text-danger/80 mb-4"
            >삭제</button>
          )}

          {/* Comments */}
          <div className="border-t border-border pt-3">
            <h3 className="text-xs font-semibold text-muted mb-2">댓글</h3>
            {comments.length === 0 ? (
              <p className="text-xs text-muted mb-2">댓글이 없습니다.</p>
            ) : (
              <div className="space-y-2 mb-3">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-text">{comment.author.nickname}</span>
                        <span className="text-[10px] text-muted">{comment.createdAt?.split('T')[0]}</span>
                        {currentUserId && comment.author.id === currentUserId && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-[10px] text-muted hover:text-danger"
                          >삭제</button>
                        )}
                      </div>
                      <p className="text-xs text-muted mt-0.5">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="댓글 작성..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateComment()}
                className="flex-1 px-3 py-2 bg-surface2 border border-border rounded-[var(--radius-control)] text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary"
              />
              <Button size="sm" onClick={handleCreateComment} disabled={!newComment.trim()}>등록</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
