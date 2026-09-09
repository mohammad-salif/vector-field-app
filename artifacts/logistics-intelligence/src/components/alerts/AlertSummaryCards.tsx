import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Siren,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AlertSummary {
  total: number;
  active: number;
  acknowledged: number;
  resolved: number;
  highCritical: number;
}

interface AlertSummaryCardsProps {
  summary: AlertSummary;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-xs transition-colors hover:border-neutral-300">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </p>
        <p className="font-mono text-xl font-bold tabular-nums text-neutral-900" data-testid={`text-alert-summary-${label.toLowerCase().replaceAll(' ', '-')}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function AlertSummaryCards({ summary }: AlertSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <SummaryCard label="Total Alerts" value={summary.total} icon={Activity} tone="bg-neutral-100 text-neutral-900 border-neutral-200" />
      <SummaryCard label="Active" value={summary.active} icon={AlertTriangle} tone="bg-red-50 text-red-700 border-red-200" />
      <SummaryCard label="Acknowledged" value={summary.acknowledged} icon={CircleAlert} tone="bg-amber-50 text-amber-700 border-amber-200" />
      <SummaryCard label="Resolved" value={summary.resolved} icon={CheckCircle2} tone="bg-emerald-50 text-emerald-700 border-emerald-200" />
      <SummaryCard label="High/Critical" value={summary.highCritical} icon={Siren} tone="bg-orange-50 text-orange-700 border-orange-200" />
    </div>
  );
}