import { useMemo, useState } from 'react';
import { Clock3, Package } from 'lucide-react';
import type { Delivery, RiskLevel } from '@/types';
import { getDeliveries } from '@/services/deliveryService';
import { getFleetVehicleById } from '@/services/fleetService';
import { getRouteById } from '@/services/mapService';
import { DeliveryDetailModal } from '@/components/deliveries/DeliveryDetailModal';
import { DeliveryFilters, type DeliveryFilter } from '@/components/deliveries/DeliveryFilters';
import { DeliverySummaryCards } from '@/components/deliveries/DeliverySummaryCards';
import { DeliveryTable } from '@/components/deliveries/DeliveryTable';

export function DeliveriesPage() {
  const deliveries = useMemo(() => getDeliveries(), []);
  const [activeFilter, setActiveFilter] = useState<DeliveryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const summary = useMemo(
    () => ({
      total: deliveries.length,
      planned: deliveries.filter((delivery) => delivery.status === 'Planned').length,
      inTransit: deliveries.filter((delivery) => delivery.status === 'In Transit').length,
      delayed: deliveries.filter((delivery) => delivery.status === 'Delayed').length,
      delivered: deliveries.filter((delivery) => delivery.status === 'Delivered').length,
      atRisk: deliveries.filter((delivery) => delivery.status === 'At Risk').length,
    }),
    [deliveries],
  );

  const routeRiskById = useMemo(
    () =>
      deliveries.reduce<Record<string, { level: RiskLevel; score: number }>>((riskMap, delivery) => {
        const route = getRouteById(delivery.routeId);
        if (route) riskMap[delivery.routeId] = { level: route.riskLevel, score: route.riskScore };
        return riskMap;
      }, {}),
    [deliveries],
  );

  const filteredDeliveries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return deliveries.filter((delivery) => {
      const matchesFilter = activeFilter === 'all' || delivery.status === activeFilter;
      const searchable = [
        delivery.id,
        delivery.commodity,
        delivery.origin,
        delivery.destination,
        delivery.vehicleId,
      ].join(' ').toLowerCase();
      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [activeFilter, deliveries, searchQuery]);

  const selectedVehicle = selectedDelivery ? getFleetVehicleById(selectedDelivery.vehicleId) : undefined;
  const selectedRoute = selectedDelivery ? getRouteById(selectedDelivery.routeId) : undefined;

  return (
    <div className="flex min-h-full flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Deliveries</h1>
            <p className="text-sm text-neutral-500">Essential commodity delivery visibility — simulated operational data</p>
          </div>
        </div>
      </div>

      <DeliverySummaryCards summary={summary} />
      <DeliveryFilters
        activeFilter={activeFilter}
        searchQuery={searchQuery}
        onFilterChange={setActiveFilter}
        onSearchChange={setSearchQuery}
      />

      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Showing <span className="font-bold text-neutral-900" data-testid="text-filtered-delivery-count">{filteredDeliveries.length}</span> of {deliveries.length} deliveries
        </p>
        <span className="hidden items-center gap-1.5 text-xs text-neutral-500 sm:flex">
          <Clock3 className="h-3.5 w-3.5 text-neutral-400" />
          Static demo schedule
        </span>
      </div>

      <DeliveryTable deliveries={filteredDeliveries} routeRiskById={routeRiskById} onSelect={setSelectedDelivery} />

      <div className="flex items-center justify-center gap-2 pb-2 text-center text-xs text-neutral-500">
        <Package className="h-3.5 w-3.5 text-neutral-400" />
        <span>Simulated delivery data — demo environment</span>
      </div>

      {selectedDelivery ? (
        <DeliveryDetailModal
          delivery={selectedDelivery}
          vehicle={selectedVehicle}
          route={selectedRoute}
          onClose={() => setSelectedDelivery(null)}
        />
      ) : null}
    </div>
  );
}