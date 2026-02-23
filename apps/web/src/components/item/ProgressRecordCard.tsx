import type { ProgressRecord } from '@/types';
import { toImageUrl } from '@/lib/api';
import StatusBadge from '@/components/common/StatusBadge';

interface ProgressRecordCardProps {
  record: ProgressRecord;
  onClick: () => void;
}

export default function ProgressRecordCard({ record, onClick }: ProgressRecordCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-surface2 rounded-[var(--radius-control)] p-3 hover:bg-surface2/70 transition flex gap-3 items-start"
    >
      {record.imageUrls && record.imageUrls.length > 0 ? (
        <img
          src={toImageUrl(record.imageUrls[0])}
          alt=""
          className="w-14 h-14 object-cover rounded-lg flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 bg-border rounded-lg flex-shrink-0 flex items-center justify-center">
          <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
          </svg>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-text line-clamp-2">{record.content || '(내용 없음)'}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted">{record.recordedAt?.split('T')[0]}</span>
          <StatusBadge status={record.status} />
          {record.imageUrls && record.imageUrls.length > 1 && (
            <span className="text-[10px] text-muted">+{record.imageUrls.length - 1}장</span>
          )}
        </div>
      </div>
    </button>
  );
}
