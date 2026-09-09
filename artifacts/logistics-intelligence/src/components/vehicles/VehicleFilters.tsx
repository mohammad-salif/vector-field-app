import { Search, LayoutGrid, CheckCircle, Clock, PowerOff, AlertTriangle, OctagonX, Truck } from 'lucide-react';
import type { VehicleListFilter } from '@/types';

interface VehicleFiltersProps {
  activeFilter: VehicleListFilter;
  onFilterChange: (filter: VehicleListFilter) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const filters: { key: VehicleListFilter; label: string; icon: typeof Truck }[] = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'Active', label: 'Active', icon: CheckCircle },
  { key: 'Delayed', label: 'Delayed', icon: Clock },
  { key: 'Offline', label: 'Offline', icon: PowerOff },
  { key: 'At Risk', label: 'At Risk', icon: AlertTriangle },
  { key: 'Blocked', label: 'Blocked', icon: OctagonX },
];

export function VehicleFilters({
  activeFilter,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: VehicleFiltersProps) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => {
          const Icon = f.icon;
          const isActive = activeFilter === f.key;
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterChange(f.key)}
              aria-pressed={isActive}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                isActive
                  ? 'border-neutral-900 bg-neutral-900 text-white font-semibold shadow-xs'
                  : 'border-neutral-200 bg-white text-neutral-700 shadow-xs hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="relative lg:w-80">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search ID, origin, destination, cargo..."
          aria-label="Search fleet vehicles"
          className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 placeholder-neutral-400 shadow-xs outline-none transition-colors focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>
    </div>
  );
}
