import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock3,
  Package,
  ShieldAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface DeliverySummary {
  total: number;
  planned: number;
  inTransit: number;
  delayed: number;
  delivered: number;
  atRisk: number;
}

interface SummaryCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: string;
}

function SummaryCard({ label, value, icon: Icon, tone }: SummaryCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-xs transition-colors hover:border-neutral-300">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${tone}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{label}</p>
        <p className="font-mono text-xl font-bold tabular-nums text-neutral-900" data-testid={`text-summary-${label.toLowerCase().replaceAll(' ', '-')}`}>
          {value}
        </p>
      </div>
    </div>
  );
}

export function DeliverySummaryCards({ summary }: { summary: DeliverySummary }) {
  const cards: SummaryCardProps[] = [
    { label: 'Total Deliveries', value: summary.total, icon: Package, tone: 'bg-neutral-100 text-neutral-900 border-neutral-200' },
    { label: 'Planned', value: summary.planned, icon: CircleDot, tone: 'bg-neutral-100 text-neutral-700 border-neutral-200' },
    { label: 'In Transit', value: summary.inTransit, icon: Clock3, tone: 'bg-blue-50 text-blue-700 border-blue-200' },
    { label: 'Delayed', value: summary.delayed, icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700 border-amber-200' },
    { label: 'Delivered', value: summary.delivered, icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { label: 'At Risk', value: summary.atRisk, icon: ShieldAlert, tone: 'bg-orange-50 text-orange-700 border-orange-200' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <SummaryCard key={card.label} {...card} />
      ))}
    </div>
  );
}