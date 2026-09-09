import { useEffect } from 'react';
import { ArrowRight, Clock3, Package, Route as RouteIcon, Truck, X } from 'lucide-react';
import type { Delivery, FleetVehicle, RiskLevel, RouteSegment } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { deliveryStatusToBadgeVariant, riskToBadgeVariant } from '@/lib/badgeMappings';
import { DeliveryProgress } from '@/components/deliveries/DeliveryProgress';

const riskLabels: Record<RiskLevel, string> = {
  low: 'Low',
  moderate: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function DetailRow({ label, children, testId }: { label: string; children: React.ReactNode; testId: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-neutral-100 py-2.5 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
      <span className="text-right text-sm font-medium text-neutral-800" data-testid={testId}>{children}</span>
    </div>
  );
}

interface DeliveryDetailModalProps {
  delivery: Delivery;
  vehicle?: FleetVehicle;
  route?: RouteSegment;
  onClose: () => void;
}

export function DeliveryDetailModal({ delivery, vehicle, route, onClose }: DeliveryDetailModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      role="presentation"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delivery-detail-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900">Delivery details</p>
              <h2 id="delivery-detail-title" className="mt-0.5 font-mono text-lg font-bold text-neutral-900" data-testid="text-selected-delivery-id">
                {delivery.id}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close delivery details"
            data-testid="button-close-delivery-details"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-neutral-900">{delivery.commodity}</p>
              <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
                <span>{delivery.origin}</span>
                <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                <span>{delivery.destination}</span>
              </div>
            </div>
            <Badge variant={deliveryStatusToBadgeVariant(delivery.status)}>{delivery.status}</Badge>
          </div>

          <DeliveryProgress status={delivery.status} />

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-neutral-900">Delivery record</p>
            <div className="rounded-lg border border-neutral-200 bg-white px-3 shadow-xs">
              <DetailRow label="Commodity" testId="text-detail-commodity">{delivery.commodity}</DetailRow>
              <DetailRow label="Origin" testId="text-detail-origin">{delivery.origin}</DetailRow>
              <DetailRow label="Destination" testId="text-detail-destination">{delivery.destination}</DetailRow>
              <DetailRow label="Current status" testId="text-detail-status">{delivery.status}</DetailRow>
              <DetailRow label="ETA" testId="text-detail-eta">
                <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5 text-neutral-400" />{delivery.eta}</span>
              </DetailRow>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <Truck className="h-4 w-4 text-neutral-900" />
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-neutral-900">Vehicle relationship</p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white px-3 shadow-xs">
              <DetailRow label="Vehicle ID" testId="text-detail-vehicle-id">{delivery.vehicleId}</DetailRow>
              <DetailRow label="Vehicle type" testId="text-detail-vehicle-type">{vehicle?.type ?? 'Vehicle record unavailable'}</DetailRow>
              <DetailRow label="Vehicle status" testId="text-detail-vehicle-status">{vehicle?.status ?? 'Unavailable'}</DetailRow>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-2">
              <RouteIcon className="h-4 w-4 text-neutral-900" />
              <p className="text-xs font-bold uppercase tracking-[0.13em] text-neutral-900">Current route relationship</p>
            </div>
            <div className="rounded-lg border border-neutral-200 bg-white px-3 shadow-xs">
              <DetailRow label="Route ID" testId="text-detail-route-id">{delivery.routeId}</DetailRow>
              <DetailRow label="Route" testId="text-detail-route-label">{route?.label ?? 'Route record unavailable'}</DetailRow>
              <DetailRow label="Route segment" testId="text-detail-route-segment">
                {route ? (
                  <span className="inline-flex items-center gap-1.5">
                    <span>{route.origin}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
                    <span>{route.destination}</span>
                  </span>
                ) : (
                  'Unavailable'
                )}
              </DetailRow>
              <DetailRow label="Route risk" testId="text-detail-route-risk">
                {route ? (
                  <Badge variant={riskToBadgeVariant(route.riskLevel)}>
                    {riskLabels[route.riskLevel]} ({route.riskScore}/100)
                  </Badge>
                ) : (
                  'Unavailable'
                )}
              </DetailRow>
              <DetailRow label="Accessibility" testId="text-detail-route-status">{route?.status ?? 'Unavailable'}</DetailRow>
            </div>
          </div>
        </div>

        <p className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-400">
          Simulated delivery data — demo environment. ETA and route risk are static mock values.
        </p>
      </section>
    </div>
  );
}