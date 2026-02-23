import type { Member } from '@/types';
import StatusBadge from '@/components/common/StatusBadge';

interface MemberListProps {
  owner: { nickname: string };
  members: Member[];
  isOwner: boolean;
  onChangeRole: (memberId: number, newRole: string) => void;
  onRemove: (memberId: number) => void;
}

export default function MemberList({
  owner,
  members,
  isOwner,
  onChangeRole,
  onRemove,
}: MemberListProps) {
  return (
    <div className="bg-surface1 rounded-[var(--radius-card)] shadow p-4">
      <div className="flex items-center justify-between py-2 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-sm font-bold">
            {owner.nickname[0]}
          </div>
          <span className="text-text font-medium">{owner.nickname}</span>
        </div>
        <StatusBadge status="OWNER" className="text-xs px-2 py-0.5" />
      </div>
      {members.map((member) => (
        <div key={member.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface2 flex items-center justify-center text-muted text-sm font-bold">
              {member.user.nickname[0]}
            </div>
            <span className="text-text">{member.user.nickname}</span>
          </div>
          <div className="flex items-center gap-2">
            {member.status === 'PENDING' && (
              <StatusBadge status="PENDING" className="text-xs px-2 py-0.5" />
            )}
            {isOwner ? (
              <>
                <select
                  value={member.role}
                  onChange={(e) => onChangeRole(member.id, e.target.value)}
                  disabled={member.status === 'PENDING'}
                  className="text-xs px-2 py-1 border border-border rounded-[var(--radius-control)] bg-surface1 disabled:opacity-50"
                >
                  <option value="VIEWER">VIEWER</option>
                  <option value="REVIEWER">REVIEWER</option>
                </select>
                <button
                  onClick={() => onRemove(member.id)}
                  className="text-xs text-danger hover:text-danger/80"
                >
                  제거
                </button>
              </>
            ) : (
              <StatusBadge status={member.role} className="text-xs px-2 py-0.5" />
            )}
          </div>
        </div>
      ))}
      {members.length === 0 && (
        <p className="text-sm text-muted py-2">아직 멤버가 없습니다.</p>
      )}
    </div>
  );
}
