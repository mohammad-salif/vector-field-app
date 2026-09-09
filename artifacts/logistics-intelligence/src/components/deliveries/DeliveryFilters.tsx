import { CheckCircle2, CircleDot, Clock3, LayoutGrid, Search, ShieldAlert, TriangleAlert } from 'lucide-react';
import type { DeliveryStatus } from '@/types';

export type DeliveryFilter = 'all' | DeliveryStatus;

interface DeliveryFiltersProps {
  activeFilter: DeliveryFilter;
  searchQuery: string;
  onFilterChange: (filter: DeliveryFilter) => void;
  onSearchChange: (query: string) => void;
}

const filters: Array<{ key: DeliveryFilter; label: string; icon: typeof LayoutGrid }> = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'Planned', label: 'Planned', icon: CircleDot },
  { key: 'In Transit', label: 'In Transit', icon: Clock3 },
  { key: 'Delayed', label: 'Delayed', icon: TriangleAlert },
  { key: 'Delivered', label: 'Delivered', icon: CheckCircle2 },
  { key: 'At Risk', label: 'At Risk', icon: ShieldAlert },
];

export function DeliveryFilters({
  activeFilter,
  searchQuery,
  onFilterChange,
  onSearchChange,
}: DeliveryFiltersProps) {
  return (
    <div className="flex flex-col gap-3">
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
              data-testid={`button-filter-deliveries-${filter.key.toLowerCase().replaceAll(' ', '-')}`}
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

      <div className="relative w-full lg:w-[28rem]">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search delivery, commodity, location, vehicle..."
          aria-label="Search deliveries"
          data-testid="input-search-deliveries"
          className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 shadow-xs outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
        />
      </div>
    </div>
  );
}