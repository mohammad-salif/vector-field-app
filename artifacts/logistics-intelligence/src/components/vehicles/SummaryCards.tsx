import { Truck, CheckCircle, AlertTriangle, Clock, PowerOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface SummaryCardsProps {
  total: number;
  active: number;
  atRisk: number;
  delayed: number;
  offline: number;
}

interface CardDef {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClass: string;
}

export function SummaryCards({
  total,
  active,
  atRisk,
  delayed,
  offline,
}: SummaryCardsProps) {
  const cards: CardDef[] = [
    {
      label: 'Total Vehicles',
      value: total,
      icon: Truck,
      iconClass: 'bg-neutral-100 text-neutral-900 border-neutral-200',
    },
    {
      label: 'Active',
      value: active,
      icon: CheckCircle,
      iconClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      label: 'At Risk',
      value: atRisk,
      icon: AlertTriangle,
      iconClass: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      label: 'Delayed',
      value: delayed,
      icon: Clock,
      iconClass: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      label: 'Offline',
      value: offline,
      icon: PowerOff,
      iconClass: 'bg-neutral-100 text-neutral-600 border-neutral-200',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-xs transition-colors hover:border-neutral-300"
          >
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${card.iconClass}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                {card.label}
              </p>
              <p className="font-mono text-xl font-bold tabular-nums text-neutral-900">{card.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
