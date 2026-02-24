import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import Input from '@/components/common/Input';

interface EditBoardModalProps {
  initialData: {
    title: string;
    description: string;
    startDate: string;
    endDate: string;
  };
  onSubmit: (data: {
    title: string;
    description: string | null;
    startDate: string | null;
    endDate: string | null;
  }) => Promise<void>;
  onClose: () => void;
}

export default function EditBoardModal({
  initialData,
  onSubmit,
  onClose,
}: EditBoardModalProps) {
  const [title, setTitle] = useState(initialData.title);
  const [description, setDescription] = useState(initialData.description);
  const [startDate, setStartDate] = useState(initialData.startDate);
  const [endDate, setEndDate] = useState(initialData.endDate);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        startDate: startDate || null,
        endDate: endDate || null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      title="보드 수정"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="flex-1">취소</Button>
          <Button onClick={handleSubmit} disabled={!title.trim()} loading={saving} className="flex-1">저장</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <Input label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div>
          <label className="text-sm text-muted block mb-1">설명</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 bg-surface2 border border-border rounded-[var(--radius-control)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="시작일" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input label="종료일" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>
      </div>
    </Modal>
  );
}
