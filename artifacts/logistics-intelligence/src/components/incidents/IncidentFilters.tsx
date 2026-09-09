import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LayoutGrid,
  Search,
  ShieldAlert,
  Siren,
} from 'lucide-react';
import type { IncidentStatus, Severity } from '@/types';

export type IncidentFilter = 'all' | IncidentStatus | Severity;

interface IncidentFiltersProps {
  activeFilter: IncidentFilter;
  searchQuery: string;
  onFilterChange: (filter: IncidentFilter) => void;
  onSearchChange: (query: string) => void;
}

const filters: Array<{ key: IncidentFilter; label: string; icon: typeof LayoutGrid }> = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'Reported', label: 'Reported', icon: AlertTriangle },
  { key: 'Under Review', label: 'Under Review', icon: Clock3 },
  { key: 'Resolved', label: 'Resolved', icon: CheckCircle2 },
  { key: 'low', label: 'Low', icon: CheckCircle2 },
  { key: 'moderate', label: 'Medium', icon: CircleAlert },
  { key: 'high', label: 'High', icon: ShieldAlert },
  { key: 'critical', label: 'Critical', icon: Siren },
];

export function IncidentFilters({
  activeFilter,
  searchQuery,
  onFilterChange,
  onSearchChange,
}: IncidentFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const Icon = filter.icon;
          const isActive = activeFilter === filter.key;
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onFilterChange(filter.key)}
              aria-pressed={isActive}
              data-testid={`button-filter-incident-${String(filter.key).toLowerCase().replaceAll(' ', '-')}`}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                isActive
                  ? 'border-neutral-900 bg-neutral-900 text-white font-semibold shadow-xs'
                  : 'border-neutral-200 bg-white text-neutral-700 shadow-xs hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="relative w-full lg:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search ID, type, location..."
          aria-label="Search incidents"
          data-testid="input-search-incidents"
          className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 shadow-xs outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>
    </div>
  );
}