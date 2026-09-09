import { useEffect, type ReactNode } from 'react';
import { AlertTriangle, Clock3, MapPin, Route as RouteIcon, Truck, X } from 'lucide-react';
import type { Alert } from '@/types';
import { alertSeverityToBadgeVariant, alertStatusToBadgeVariant } from '@/lib/badgeMappings';
import { Badge } from '@/components/ui/Badge';
import { getDeliveryById } from '@/services/deliveryService';

interface AlertDetailModalProps {
  alert: Alert;
  onClose: () => void;
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 py-2.5 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
      <span className="text-sm font-medium text-neutral-800">{children}</span>
    </div>
  );
}

export function AlertDetailModal({ alert, onClose }: AlertDetailModalProps) {
  const delivery = alert.deliveryId ? getDeliveryById(alert.deliveryId) : undefined;

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
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-detail-title"
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 id="alert-detail-title" className="text-sm font-bold text-neutral-900">Alert details</h2>
              <p className="text-[11px] text-neutral-500">Simulated operational record</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close alert details"
            data-testid="button-close-alert-details"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-2">
          <div className="flex items-start justify-between gap-3 border-b border-neutral-100 py-4">
            <div>
              <p className="font-mono text-lg font-bold text-neutral-900" data-testid={`text-alert-detail-id-${alert.id}`}>{alert.id}</p>
              <p className="mt-1 text-sm text-neutral-500">{alert.type}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge variant={alertSeverityToBadgeVariant(alert.severity)}>{alert.severity}</Badge>
              <Badge variant={alertStatusToBadgeVariant(alert.status)}>{alert.status}</Badge>
            </div>
          </div>

          <p className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wider text-neutral-900">Alert record</p>
          <DetailRow label="Alert ID">{alert.id}</DetailRow>
          <DetailRow label="Alert Type">{alert.type}</DetailRow>
          <DetailRow label="Severity">
            <Badge variant={alertSeverityToBadgeVariant(alert.severity)}>{alert.severity}</Badge>
          </DetailRow>
          <DetailRow label="Status">
            <Badge variant={alertStatusToBadgeVariant(alert.status)}>{alert.status}</Badge>
          </DetailRow>
          <DetailRow label="Location">
            <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-neutral-400" />{alert.location}</span>
          </DetailRow>
          <DetailRow label="Timestamp">
            <span className="flex items-center gap-2"><Clock3 className="h-3.5 w-3.5 text-neutral-400" />{alert.timestamp}</span>
          </DetailRow>

          <p className="mb-1 mt-4 text-[11px] font-bold uppercase tracking-wider text-neutral-900">Related entities</p>
          <DetailRow label="Related Route">
            <span className="flex items-center gap-2"><RouteIcon className="h-3.5 w-3.5 text-neutral-400" />{alert.routeId ?? 'No route linked'}</span>
          </DetailRow>
          <DetailRow label="Related Vehicle">
            <span className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-neutral-400" />{alert.vehicleId ?? 'No vehicle linked'}</span>
          </DetailRow>
          <DetailRow label="Related Delivery">
            {delivery ? (
              <span className="flex flex-col items-end gap-1">
                <span className="font-mono font-medium text-neutral-900">{delivery.id}</span>
                <span className="text-xs text-neutral-500">{delivery.commodity} · {delivery.status}</span>
              </span>
            ) : (
              <span className="text-neutral-400">{alert.deliveryId ?? 'No delivery linked'}</span>
            )}
          </DetailRow>

        </div>

        <div className="flex items-center gap-2 border-t border-neutral-100 px-5 py-3 text-xs text-neutral-400">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
          <span>Simulated alerts — demo environment. No external monitoring data is connected.</span>
        </div>
      </div>
    </div>
  );
}