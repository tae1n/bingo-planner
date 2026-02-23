import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

interface AddMemberModalProps {
  onSubmit: (email: string, role: string) => Promise<void>;
  onClose: () => void;
}

export default function AddMemberModal({ onSubmit, onClose }: AddMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('VIEWER');
  const [adding, setAdding] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) return;
    setAdding(true);
    try {
      await onSubmit(email.trim(), role);
    } finally {
      setAdding(false);
    }
  }

  return (
    <Modal
      title="멤버 추가"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} className="flex-1">취소</Button>
          <Button onClick={handleSubmit} disabled={!email.trim()} loading={adding} className="flex-1">추가</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <input
          type="email"
          placeholder="이메일 주소"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="px-4 py-3 bg-surface2 border border-border rounded-[var(--radius-control)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="px-4 py-3 bg-surface2 border border-border rounded-[var(--radius-control)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        >
          <option value="VIEWER">VIEWER</option>
          <option value="REVIEWER">REVIEWER</option>
        </select>
      </div>
    </Modal>
  );
}
