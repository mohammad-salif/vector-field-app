import type { ReactNode } from 'react';

type BadgeVariant =
  | 'accessible'
  | 'at-risk'
  | 'blocked'
  | 'low'
  | 'moderate'
  | 'high'
  | 'critical'
  | 'in-transit'
  | 'idle'
  | 'loading'
  | 'delayed'
  | 'maintenance'
  | 'reported'
  | 'under-review'
  | 'resolved'
  | 'neutral'
  | 'active'
  | 'offline';

const variantStyles: Record<BadgeVariant, string> = {
  accessible: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'at-risk': 'bg-amber-50 text-amber-800 border-amber-200',
  blocked: 'bg-red-50 text-red-700 border-red-200',
  low: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  moderate: 'bg-amber-50 text-amber-800 border-amber-200',
  high: 'bg-orange-50 text-orange-800 border-orange-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  'in-transit': 'bg-neutral-100 text-neutral-800 border-neutral-300',
  idle: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  loading: 'bg-neutral-100 text-neutral-800 border-neutral-300',
  delayed: 'bg-amber-50 text-amber-800 border-amber-200',
  maintenance: 'bg-neutral-100 text-neutral-700 border-neutral-300',
  reported: 'bg-red-50 text-red-700 border-red-200',
  'under-review': 'bg-amber-50 text-amber-800 border-amber-200',
  resolved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  neutral: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  offline: 'bg-neutral-100 text-neutral-600 border-neutral-200',
};

const dotStyles: Record<BadgeVariant, string> = {
  accessible: 'bg-emerald-600',
  'at-risk': 'bg-amber-600',
  blocked: 'bg-red-600',
  low: 'bg-emerald-600',
  moderate: 'bg-amber-600',
  high: 'bg-orange-600',
  critical: 'bg-red-600',
  'in-transit': 'bg-neutral-700',
  idle: 'bg-neutral-400',
  loading: 'bg-neutral-700',
  delayed: 'bg-amber-600',
  maintenance: 'bg-neutral-500',
  reported: 'bg-red-600',
  'under-review': 'bg-amber-600',
  resolved: 'bg-emerald-600',
  neutral: 'bg-neutral-500',
  active: 'bg-emerald-600',
  offline: 'bg-neutral-400',
};

export interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
  showDot?: boolean;
}

export function Badge({ variant, children, className = '', showDot = true }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide ${variantStyles[variant]} ${className}`}
    >
      {showDot && (
        <span
          aria-hidden="true"
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotStyles[variant]}`}
        />
      )}
      {children}
    </span>
  );
}
