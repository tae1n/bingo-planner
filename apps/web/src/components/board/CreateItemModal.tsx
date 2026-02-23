import { useState } from 'react';
import type { ConditionType } from '@bingo-planner/shared';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

const inputCls = 'w-full px-4 py-3 bg-surface2 border border-border rounded-[var(--radius-control)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';
const inputSmCls = 'w-full px-4 py-2 bg-surface2 border border-border rounded-[var(--radius-control)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

interface CreateItemModalProps {
  boardHasDates: boolean;
  onSubmit: (data: {
    title: string;
    description?: string;
    deadline?: string;
    conditionType: ConditionType;
    targetCount: number;
  }) => Promise<void>;
  onClose: () => void;
}

export default function CreateItemModal({
  boardHasDates,
  onSubmit,
  onClose,
}: CreateItemModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [conditionType, setConditionType] = useState<ConditionType>('ONCE');
  const [targetCount, setTargetCount] = useState(1);
  const [creating, setCreating] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
        conditionType,
        targetCount,
      });
    } finally {
      setCreating(false);
    }
  }

  return (
    <Modal
      title="빙고 아이템 추가"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="flex-1">취소</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()} loading={creating} className="flex-1">추가</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <input
          type="text"
          placeholder="아이템 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          className={inputCls}
        />
        <textarea
          placeholder="설명 (선택)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className={`${inputCls} resize-none`}
        />
        <div>
          <label className="text-sm text-muted block mb-1">기한 (선택)</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className={inputSmCls}
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-muted block mb-1">달성 조건</label>
            <select
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value as ConditionType)}
              className={inputSmCls}
            >
              <option value="ONCE">1회 달성</option>
              <option value="COUNT">횟수 달성</option>
              <option value="WEEKLY">주간 반복</option>
              <option value="MONTHLY">월간 반복</option>
              <option value="YEARLY">연간 반복</option>
            </select>
          </div>
          {['COUNT', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(conditionType) && (
            <div className="flex-1">
              <label className="text-sm text-muted block mb-1">
                {conditionType === 'COUNT' ? '목표 횟수' : '기간 내 목표 횟수'}
              </label>
              <input
                type="number"
                min={1}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className={inputSmCls}
              />
            </div>
          )}
        </div>
        {['WEEKLY', 'MONTHLY', 'YEARLY'].includes(conditionType) && !boardHasDates && (
          <p className="text-xs text-warning bg-warning/10 px-3 py-2 rounded-[var(--radius-control)]">
            반복 조건을 사용하려면 보드에 시작일과 종료일을 설정해야 합니다.
          </p>
        )}
      </div>
    </Modal>
  );
}
