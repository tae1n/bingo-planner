import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  return (
    <div>
      {label && (
        <label className="text-sm text-muted block mb-1">{label}</label>
      )}
      <input
        className={`w-full px-4 py-2 bg-surface2 border border-border rounded-[var(--radius-control)] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary ${
          error ? 'border-danger' : ''
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  );
}
