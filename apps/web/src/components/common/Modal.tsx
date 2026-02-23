import { ReactNode } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export default function Modal({ title, children, footer, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-surface1 border border-border rounded-[var(--radius-card)] p-6 w-full max-w-md shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-text mb-4">{title}</h2>
        {children}
        {footer && <div className="flex gap-3 mt-5">{footer}</div>}
      </div>
    </div>
  );
}
