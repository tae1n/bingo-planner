const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  APPROVED: { bg: 'bg-success/15', text: 'text-success', label: '승인' },
  REJECTED: { bg: 'bg-danger/15', text: 'text-danger', label: '거절' },
  PENDING: { bg: 'bg-pending/15', text: 'text-pending', label: '대기중' },
  ACHIEVED: { bg: 'bg-success/15', text: 'text-success', label: '달성' },
  NOT_ACHIEVED: { bg: 'bg-surface2', text: 'text-muted', label: '미달성' },
  OWNER: { bg: 'bg-primary/15', text: 'text-primary', label: '소유자' },
  VIEWER: { bg: 'bg-surface2', text: 'text-muted', label: 'VIEWER' },
  REVIEWER: { bg: 'bg-primary/15', text: 'text-primary', label: 'REVIEWER' },
  INVITE: { bg: 'bg-primary/15', text: 'text-primary', label: '초대' },
  REVIEW: { bg: 'bg-success/15', text: 'text-success', label: '리뷰' },
  REVIEW_REQUEST: { bg: 'bg-warning/15', text: 'text-warning', label: '승인요청' },
  COMMENT: { bg: 'bg-warning/15', text: 'text-warning', label: '댓글' },
  ACHIEVEMENT: { bg: 'bg-success/15', text: 'text-success', label: '달성' },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  className?: string;
}

export default function StatusBadge({ status, label, className = '' }: StatusBadgeProps) {
  const config = statusConfig[status] ?? {
    bg: 'bg-surface2',
    text: 'text-muted',
    label: status,
  };

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded-[var(--radius-chip)] border border-border ${config.bg} ${config.text} ${className}`}
    >
      {label ?? config.label}
    </span>
  );
}
