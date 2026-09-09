import { useMemo, useState } from 'react';
import { AlertTriangle, Clock3 } from 'lucide-react';
import type { Alert } from '@/types';
import { getAlerts } from '@/services/alertService';
import { AlertDetailModal } from '@/components/alerts/AlertDetailModal';
import { AlertFilters, type AlertFilter } from '@/components/alerts/AlertFilters';
import { AlertSummaryCards } from '@/components/alerts/AlertSummaryCards';
import { AlertTable } from '@/components/alerts/AlertTable';

export function AlertsPage() {
  const alerts = useMemo(() => getAlerts(), []);
  const [activeFilter, setActiveFilter] = useState<AlertFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);

  const summary = useMemo(
    () => ({
      total: alerts.length,
      active: alerts.filter((alert) => alert.status === 'Active').length,
      acknowledged: alerts.filter((alert) => alert.status === 'Acknowledged').length,
      resolved: alerts.filter((alert) => alert.status === 'Resolved').length,
      highCritical: alerts.filter(
        (alert) => alert.severity === 'High' || alert.severity === 'Critical',
      ).length,
    }),
    [alerts],
  );

  const filteredAlerts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return alerts.filter((alert) => {
      const matchesFilter =
        activeFilter === 'all' ||
        alert.severity === activeFilter ||
        alert.status === activeFilter;
      const searchable = [
        alert.id,
        alert.type,
        alert.routeId,
        alert.vehicleId,
        alert.deliveryId ?? '',
        alert.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return matchesFilter && (!query || searchable.includes(query));
    });
  }, [activeFilter, alerts, searchQuery]);

  return (
    <div className="flex min-h-full flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Alerts</h1>
            <p className="text-sm text-neutral-500">
              Centralized operational alert view — simulated data
            </p>
          </div>
        </div>
      </div>

      <AlertSummaryCards summary={summary} />
      <AlertFilters
        activeFilter={activeFilter}
        searchQuery={searchQuery}
        onFilterChange={setActiveFilter}
        onSearchChange={setSearchQuery}
      />

      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Showing <span className="font-bold text-neutral-900" data-testid="text-filtered-alert-count">{filteredAlerts.length}</span> of {alerts.length} alerts
        </p>
        <span className="hidden items-center gap-1.5 text-xs text-neutral-500 sm:flex">
          <Clock3 className="h-3.5 w-3.5 text-neutral-400" />
          Latest alerts first
        </span>
      </div>

      <AlertTable alerts={filteredAlerts} onSelect={setSelectedAlert} />

      <div className="flex items-center justify-center gap-2 pb-2 text-center text-xs text-neutral-500">
        <AlertTriangle className="h-3.5 w-3.5 text-neutral-400" />
        <span>Simulated alerts — demo environment. Delivery links are shown where available.</span>
      </div>

      {selectedAlert && (
        <AlertDetailModal alert={selectedAlert} onClose={() => setSelectedAlert(null)} />
      )}
    </div>
  );
}