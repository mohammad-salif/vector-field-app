import { useState, useMemo } from 'react';
import { Map as MapIcon, Activity } from 'lucide-react';
import type { MapFilter, Selection } from '@/types';
import { getVehicles, getRoutes, getIncidents } from '@/services/mapService';
import { MapCanvas } from '@/components/map/MapCanvas';
import { Legend } from '@/components/map/Legend';
import { FilterBar } from '@/components/map/FilterBar';
import { DetailPanel } from '@/components/map/DetailPanel';

export function LiveMapPage() {
  const vehicles = useMemo(() => getVehicles(), []);
  const routes = useMemo(() => getRoutes(), []);
  const incidents = useMemo(() => getIncidents(), []);

  const [activeFilter, setActiveFilter] = useState<MapFilter>('all');
  const [selection, setSelection] = useState<Selection | null>(null);

  const selectedVehicle =
    selection?.type === 'vehicle'
      ? vehicles.find((v) => v.id === selection.id)
      : undefined;
  const selectedIncident =
    selection?.type === 'incident'
      ? incidents.find((i) => i.id === selection.id)
      : undefined;
  const selectedRoute =
    selection?.type === 'route'
      ? routes.find((r) => r.id === selection.id)
      : undefined;

  const activeCount =
    (activeFilter === 'all' || activeFilter === 'vehicles'
      ? vehicles.length
      : 0) +
    (activeFilter === 'all' || activeFilter === 'incidents'
      ? incidents.length
      : 0);

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
            <MapIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Live Map</h1>
            <p className="text-sm text-neutral-500">
              Geographic monitoring — simulated operational view
            </p>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <FilterBar activeFilter={activeFilter} onChange={setActiveFilter} />

      {/* Map area — dominant visual */}
      <div className="relative h-[calc(100vh-220px)] min-h-[420px] w-full">
        <MapCanvas
          vehicles={vehicles}
          routes={routes}
          incidents={incidents}
          activeFilter={activeFilter}
          selection={selection}
          onSelect={setSelection}
        />
        <Legend />

        {/* Status badge */}
        <div className="absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-lg border border-neutral-200/90 bg-white/95 px-2.5 py-1 text-xs font-semibold text-neutral-800 shadow-xs backdrop-blur-md z-10">
          <Activity className="h-3.5 w-3.5 text-emerald-600" />
          <span>
            {activeCount} active elements
          </span>
        </div>

        {/* Detail panel */}
        <DetailPanel
          vehicle={selectedVehicle}
          incident={selectedIncident}
          route={selectedRoute}
          onClose={() => setSelection(null)}
        />
      </div>
    </div>
  );
}
