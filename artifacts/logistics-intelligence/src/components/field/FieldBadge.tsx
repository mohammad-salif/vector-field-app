import type { ReactNode } from 'react';

export type FieldBadgeVariant =
  | 'accessible'
  | 'at-risk'
  | 'blocked'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'
  | 'reported'
  | 'under-review'
  | 'resolved'
  | 'neutral';

interface FieldBadgeProps {
  variant: FieldBadgeVariant;
  children: ReactNode;
  className?: string;
  showDot?: boolean;
}

const variantStyles: Record<FieldBadgeVariant, string> = {
  accessible: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'at-risk': 'bg-amber-50 text-amber-800 border-amber-200',
  moderate: 'bg-amber-50 text-amber-800 border-amber-200',
  'under-review': 'bg-amber-50 text-amber-800 border-amber-200',
  high: 'bg-orange-50 text-orange-800 border-orange-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  reported: 'bg-red-50 text-red-700 border-red-200',
  neutral: 'bg-neutral-100 text-neutral-800 border-neutral-200',
};

const dotStyles: Record<FieldBadgeVariant, string> = {
  accessible: 'bg-emerald-600',
  low: 'bg-emerald-600',
  resolved: 'bg-emerald-600',
  'at-risk': 'bg-amber-600',
  moderate: 'bg-amber-600',
  'under-review': 'bg-amber-600',
  high: 'bg-orange-600',
  blocked: 'bg-red-600',
  critical: 'bg-red-600',
  reported: 'bg-red-600',
  neutral: 'bg-neutral-500',
};

export function FieldBadge({
  variant,
  children,
  className = '',
  showDot = true,
}: FieldBadgeProps) {
  const style = variantStyles[variant] || variantStyles.neutral;
  const dot = dotStyles[variant] || dotStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ${style} ${className}`}
    >
      {showDot && (
        <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full shrink-0 ${dot}`} />
      )}
      {children}
    </span>
  );
}
