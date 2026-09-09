import { ArrowRight, Clock3, MapPin, Route as RouteIcon, Truck } from 'lucide-react';
import type { Alert } from '@/types';
import { alertSeverityToBadgeVariant, alertStatusToBadgeVariant } from '@/lib/badgeMappings';
import { Badge } from '@/components/ui/Badge';

interface AlertTableProps {
  alerts: Alert[];
  onSelect: (alert: Alert) => void;
}

function AlertRow({ alert, onSelect }: { alert: Alert; onSelect: (alert: Alert) => void }) {
  return (
    <tr
      tabIndex={0}
      role="button"
      onClick={() => onSelect(alert)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(alert);
        }
      }}
      className="cursor-pointer border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50/80 focus-visible:bg-neutral-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-neutral-900"
      aria-label={`View details for alert ${alert.id}`}
      data-testid={`row-alert-${alert.id}`}
    >
      <td className="px-4 py-3.5 font-mono text-xs font-bold text-neutral-900">{alert.id}</td>
      <td className="px-4 py-3.5">
        <span className="font-medium text-neutral-800">{alert.type}</span>
      </td>
      <td className="px-4 py-3.5">
        <Badge variant={alertSeverityToBadgeVariant(alert.severity)}>{alert.severity}</Badge>
      </td>
      <td className="px-4 py-3.5 font-mono text-xs text-neutral-700">{alert.routeId ?? 'No route linked'}</td>
      <td className="px-4 py-3.5 font-mono text-xs text-neutral-500">{alert.vehicleId ?? 'No vehicle linked'}</td>
      <td className="px-4 py-3.5 font-mono text-xs text-neutral-500">{alert.deliveryId ?? 'No delivery linked'}</td>
      <td className="max-w-[14rem] px-4 py-3.5 text-neutral-600">
        <span className="flex items-start gap-1.5"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />{alert.location}</span>
      </td>
      <td className="whitespace-nowrap px-4 py-3.5 font-mono text-xs text-neutral-400">{alert.timestamp}</td>
      <td className="px-4 py-3.5"><Badge variant={alertStatusToBadgeVariant(alert.status)}>{alert.status}</Badge></td>
    </tr>
  );
}

export function AlertTable({ alerts, onSelect }: AlertTableProps) {
  if (alerts.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-16 text-center shadow-xs">
        <AlertTriangleIcon />
        <p className="text-sm font-bold text-neutral-900">No alerts match the current view.</p>
        <p className="text-xs text-neutral-500">Try clearing the search or selecting a different filter.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs lg:block">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 font-medium">Alert ID</th>
              <th className="px-4 py-3 font-medium">Alert Type</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Related Route</th>
              <th className="px-4 py-3 font-medium">Related Vehicle</th>
              <th className="px-4 py-3 font-medium">Related Delivery</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Timestamp</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>{alerts.map((alert) => <AlertRow key={alert.id} alert={alert} onSelect={onSelect} />)}</tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {alerts.map((alert) => (
          <button
            key={alert.id}
            type="button"
            onClick={() => onSelect(alert)}
            data-testid={`card-alert-${alert.id}`}
            className="rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono text-xs font-bold text-neutral-900">{alert.id}</p>
                <p className="mt-1 text-sm font-medium text-neutral-800">{alert.type}</p>
              </div>
              <Badge variant={alertSeverityToBadgeVariant(alert.severity)}>{alert.severity}</Badge>
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-neutral-600">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span>{alert.location}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-3 text-xs">
              <span className="flex items-center gap-1.5 text-neutral-600"><RouteIcon className="h-3.5 w-3.5 text-neutral-400" />{alert.routeId ?? 'No route linked'}</span>
              <span className="flex items-center gap-1.5 text-neutral-600"><Truck className="h-3.5 w-3.5 text-neutral-400" />{alert.vehicleId ?? 'No vehicle linked'}</span>
              <span className="flex items-center gap-1.5 text-neutral-400"><Clock3 className="h-3.5 w-3.5" />{alert.timestamp}</span>
              <span className="flex items-center justify-end gap-1.5 text-right"><Badge variant={alertStatusToBadgeVariant(alert.status)}>{alert.status}</Badge><ArrowRight className="h-3.5 w-3.5 text-neutral-400" /></span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

function AlertTriangleIcon() {
  return <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-400"><Clock3 className="h-4 w-4" /></span>;
}