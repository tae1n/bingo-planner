import { ButtonHTMLAttributes } from 'react';

const variantStyles = {
  primary:
    'bg-primary text-white hover:bg-primary/90 disabled:opacity-50',
  secondary:
    'bg-surface2 text-text border border-border hover:bg-surface2/70',
  danger:
    'text-danger border border-border hover:bg-danger/10',
  ghost:
    'text-muted hover:text-primary',
  success:
    'bg-success text-white hover:bg-success/90 disabled:opacity-50',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  loading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`rounded-[var(--radius-control)] font-medium transition active:translate-y-[1px] focus:outline-none focus:ring-4 focus:ring-primary/20 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? '처리 중...' : children}
    </button>
  );
}
