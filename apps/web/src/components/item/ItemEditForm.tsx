import { useState } from 'react';
import type { ConditionType } from '@bingo-planner/shared';
import type { ItemDetail } from '@/types';
import Button from '@/components/common/Button';

const inputCls = 'bg-surface2 border border-border rounded-[var(--radius-control)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary';

interface ItemEditFormProps {
  item: ItemDetail;
  onSave: (data: {
    title: string;
    description: string | null;
    deadline: string | null;
    conditionType: ConditionType;
    targetCount: number;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function ItemEditForm({ item, onSave, onCancel }: ItemEditFormProps) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.description ?? '');
  const [deadline, setDeadline] = useState(item.deadline ? item.deadline.split('T')[0] : '');
  const [conditionType, setConditionType] = useState(item.conditionType);
  const [targetCount, setTargetCount] = useState(item.targetCount);
  const [saving, setSaving] = useState(false);

  const isRepeat = ['WEEKLY', 'MONTHLY', 'YEARLY'].includes(conditionType);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline || null,
        conditionType,
        targetCount,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={`px-4 py-2 ${inputCls} text-lg font-bold`}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="설명"
        rows={2}
        className={`px-4 py-2 ${inputCls} resize-none`}
      />
      <div>
        <label className="text-sm text-muted block mb-1">기한</label>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={`w-full px-4 py-2 ${inputCls}`}
        />
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-sm text-muted block mb-1">달성 조건</label>
          {isRepeat ? (
            <div className={`w-full px-4 py-2 border border-border rounded-[var(--radius-control)] bg-surface2 text-muted text-sm`}>
              {conditionType === 'WEEKLY' ? '주간 반복' : conditionType === 'MONTHLY' ? '월간 반복' : '연간 반복'}
              <span className="text-xs text-muted ml-2">(변경 불가)</span>
            </div>
          ) : (
            <select
              value={conditionType}
              onChange={(e) => setConditionType(e.target.value as ConditionType)}
              className={`w-full px-4 py-2 ${inputCls}`}
            >
              <option value="ONCE">1회 달성</option>
              <option value="COUNT">횟수 달성</option>
            </select>
          )}
        </div>
        {['COUNT', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(conditionType) && (
          <div className="flex-1">
            <label className="text-sm text-muted block mb-1">목표 횟수</label>
            {isRepeat ? (
              <div className={`w-full px-4 py-2 border border-border rounded-[var(--radius-control)] bg-surface2 text-muted text-sm`}>
                {targetCount}회
                <span className="text-xs text-muted ml-2">(변경 불가)</span>
              </div>
            ) : (
              <input
                type="number"
                min={1}
                value={targetCount}
                onChange={(e) => setTargetCount(Number(e.target.value))}
                className={`w-full px-4 py-2 ${inputCls}`}
              />
            )}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSave} disabled={!title.trim()} loading={saving}>저장</Button>
        <Button variant="secondary" onClick={onCancel}>취소</Button>
      </div>
    </div>
  );
}
