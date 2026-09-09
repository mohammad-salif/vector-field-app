import { ArrowRight, Package, Route as RouteIcon } from 'lucide-react';
import type { Delivery, RiskLevel } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { deliveryStatusToBadgeVariant, riskToBadgeVariant } from '@/lib/badgeMappings';

const riskLabels: Record<RiskLevel, string> = {
  low: 'Low',
  moderate: 'Medium',
  high: 'High',
  critical: 'Critical',
};

interface DeliveryTableProps {
  deliveries: Delivery[];
  routeRiskById: Record<string, { level: RiskLevel; score: number }>;
  onSelect: (delivery: Delivery) => void;
}

interface DeliveryRowProps {
  delivery: Delivery;
  routeRiskById: Record<string, { level: RiskLevel; score: number }>;
  onSelect: (delivery: Delivery) => void;
}

function DeliveryRow({
  delivery,
  routeRiskById,
  onSelect,
}: DeliveryRowProps) {
  const risk = routeRiskById[delivery.routeId];
  return (
    <tr
      tabIndex={0}
      role="button"
      onClick={() => onSelect(delivery)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(delivery);
        }
      }}
      data-testid={`row-delivery-${delivery.id}`}
      className="cursor-pointer border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50/80 focus-visible:bg-neutral-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-neutral-900"
      aria-label={`View details for delivery ${delivery.id}`}
    >
      <td className="px-4 py-3.5 font-mono text-xs font-bold text-neutral-900">{delivery.id}</td>
      <td className="px-4 py-3.5 font-medium text-neutral-800">{delivery.commodity}</td>
      <td className="px-4 py-3.5 text-neutral-600">{delivery.origin}</td>
      <td className="px-4 py-3.5 text-neutral-600">{delivery.destination}</td>
      <td className="px-4 py-3.5 font-mono text-xs text-neutral-700">{delivery.vehicleId}</td>
      <td className="px-4 py-3.5">
        <Badge variant={deliveryStatusToBadgeVariant(delivery.status)}>{delivery.status}</Badge>
      </td>
      <td className="px-4 py-3.5 font-mono text-xs text-neutral-500">{delivery.eta}</td>
      <td className="px-4 py-3.5">
        {risk ? (
          <Badge variant={riskToBadgeVariant(risk.level)}>
            {riskLabels[risk.level]} <span className="font-mono text-[10px] opacity-75">({risk.score})</span>
          </Badge>
        ) : (
          <span className="text-xs text-neutral-400">Unavailable</span>
        )}
      </td>
    </tr>
  );
}

export function DeliveryTable({ deliveries, routeRiskById, onSelect }: DeliveryTableProps) {
  if (deliveries.length === 0) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-6 py-16 text-center shadow-xs" data-testid="empty-deliveries">
        <Package className="h-7 w-7 text-neutral-400" />
        <p className="text-sm font-bold text-neutral-900">No deliveries match the current view.</p>
        <p className="text-xs text-neutral-500">Try another status or search term.</p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs lg:block">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 font-medium">Delivery ID</th>
              <th className="px-4 py-3 font-medium">Commodity</th>
              <th className="px-4 py-3 font-medium">Origin</th>
              <th className="px-4 py-3 font-medium">Destination</th>
              <th className="px-4 py-3 font-medium">Vehicle ID</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">ETA</th>
              <th className="px-4 py-3 font-medium">Route Risk</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <DeliveryRow key={delivery.id} delivery={delivery} routeRiskById={routeRiskById} onSelect={onSelect} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {deliveries.map((delivery) => {
          const risk = routeRiskById[delivery.routeId];
          return (
            <button
              key={delivery.id}
              type="button"
              onClick={() => onSelect(delivery)}
              data-testid={`card-delivery-${delivery.id}`}
              className="rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-neutral-900">{delivery.id}</p>
                  <p className="mt-1 text-sm font-medium text-neutral-800">{delivery.commodity}</p>
                </div>
                <Badge variant={deliveryStatusToBadgeVariant(delivery.status)}>{delivery.status}</Badge>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-neutral-600">
                <span className="truncate">{delivery.origin}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                <span className="truncate">{delivery.destination}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3 text-xs">
                <div>
                  <p className="text-neutral-400">Vehicle</p>
                  <p className="mt-1 font-mono font-medium text-neutral-700">{delivery.vehicleId}</p>
                </div>
                <div>
                  <p className="text-neutral-400">ETA</p>
                  <p className="mt-1 font-mono font-medium text-neutral-700">{delivery.eta}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <RouteIcon className="h-3.5 w-3.5 text-neutral-400" />
                  <span className="font-mono text-neutral-600">{delivery.routeId}</span>
                </div>
                <div className="text-right">
                  {risk ? <Badge variant={riskToBadgeVariant(risk.level)}>{riskLabels[risk.level]} risk</Badge> : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}