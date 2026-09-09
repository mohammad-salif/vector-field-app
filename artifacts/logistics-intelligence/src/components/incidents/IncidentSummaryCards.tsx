import type { LucideIcon } from 'lucide-react';
import { AlertTriangle, CheckCircle2, ClipboardList, Clock3, Siren } from 'lucide-react';

interface IncidentSummary {
  total: number;
  reported: number;
  underReview: number;
  resolved: number;
  highCritical: number;
}

interface IncidentSummaryCardsProps {
  summary: IncidentSummary;
}

const cards: Array<{
  key: keyof IncidentSummary;
  label: string;
  icon: LucideIcon;
  tone: string;
}> = [
  { key: 'total', label: 'Total Incidents', icon: ClipboardList, tone: 'bg-neutral-100 text-neutral-900 border-neutral-200' },
  { key: 'reported', label: 'Reported', icon: AlertTriangle, tone: 'bg-red-50 text-red-700 border-red-200' },
  { key: 'underReview', label: 'Under Review', icon: Clock3, tone: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'resolved', label: 'Resolved', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'highCritical', label: 'High / Critical', icon: Siren, tone: 'bg-orange-50 text-orange-700 border-orange-200' },
];

export function IncidentSummaryCards({ summary }: IncidentSummaryCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-xs transition-colors hover:border-neutral-300"
            data-testid={`card-incident-summary-${card.key}`}
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${card.tone}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{card.label}</p>
              <p className="font-mono text-xl font-bold tabular-nums text-neutral-900" data-testid={`text-incident-count-${card.key}`}>
                {summary[card.key]}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}