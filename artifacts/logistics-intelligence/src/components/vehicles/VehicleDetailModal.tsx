import { useEffect } from 'react';
import { Truck, X } from 'lucide-react';
import type { FleetVehicle } from '@/types';
import { Badge } from '@/components/ui/Badge';
import {
  fleetStatusToBadgeVariant,
  routeStatusToBadgeVariant,
} from '@/lib/badgeMappings';

interface VehicleDetailModalProps {
  vehicle: FleetVehicle;
  onClose: () => void;
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-2.5 border-b border-neutral-100 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </span>
      <span className="text-sm font-medium text-neutral-800">{children}</span>
    </div>
  );
}

export function VehicleDetailModal({
  vehicle,
  onClose,
}: VehicleDetailModalProps) {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="vehicle-detail-title"
        className="w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-800 shadow-xs">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h3 id="vehicle-detail-title" className="text-sm font-bold text-neutral-900">Vehicle Details</h3>
              <p className="text-[11px] text-neutral-500">Fleet operational record</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            aria-label="Close vehicle details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-2">
          <div className="flex items-center justify-between py-3">
            <span className="text-lg font-bold font-mono text-neutral-900">{vehicle.id}</span>
            <Badge variant={fleetStatusToBadgeVariant(vehicle.status)}>
              {vehicle.status}
            </Badge>
          </div>
          <DetailRow label="Vehicle Type">{vehicle.type}</DetailRow>
          <DetailRow label="Cargo Category">{vehicle.cargoCategory}</DetailRow>
          <DetailRow label="Origin">{vehicle.origin}</DetailRow>
          <DetailRow label="Destination">{vehicle.destination}</DetailRow>
          <DetailRow label="Current Status">
            <Badge variant={fleetStatusToBadgeVariant(vehicle.status)}>
              {vehicle.status}
            </Badge>
          </DetailRow>
          <DetailRow label="Route Status">
            <Badge variant={routeStatusToBadgeVariant(vehicle.routeStatus)}>
              {vehicle.routeStatus.replace('-', ' ')}
            </Badge>
          </DetailRow>
          <DetailRow label="ETA">{vehicle.eta}</DetailRow>
          <DetailRow label="Last Updated">{vehicle.lastUpdated}</DetailRow>
          <DetailRow label="Current Operational Note">
            {vehicle.operationalNote}
          </DetailRow>
        </div>
      </div>
    </div>
  );
}
