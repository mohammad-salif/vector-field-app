import { LayoutGrid, Truck, CheckCircle, AlertTriangle, OctagonX, Siren } from 'lucide-react';
import type { MapFilter } from '@/types';

interface FilterBarProps {
  activeFilter: MapFilter;
  onChange: (filter: MapFilter) => void;
}

const filters: { key: MapFilter; label: string; icon: typeof Truck }[] = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'vehicles', label: 'Vehicles', icon: Truck },
  { key: 'accessible', label: 'Accessible Routes', icon: CheckCircle },
  { key: 'at-risk', label: 'At-Risk Routes', icon: AlertTriangle },
  { key: 'blocked', label: 'Blocked Routes', icon: OctagonX },
  { key: 'incidents', label: 'Incidents', icon: Siren },
];

export function FilterBar({ activeFilter, onChange }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((f) => {
        const Icon = f.icon;
        const isActive = activeFilter === f.key;
        return (
          <button
            key={f.key}
            type="button"
            onClick={() => onChange(f.key)}
            aria-pressed={isActive}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
              isActive
                ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs font-semibold'
                : 'border-neutral-200 bg-white text-neutral-700 shadow-xs hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900'
            }`}
          >
            <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
            {f.label}
          </button>
        );
      })}
    </div>
  );
}
