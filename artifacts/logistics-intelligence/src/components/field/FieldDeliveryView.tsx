import {
  Package,
  Truck,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Route as RouteIcon,
  ShieldAlert,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { Delivery, FleetVehicle, RouteSegment } from '@/types';
import { FieldBadge } from './FieldBadge';

interface FieldDeliveryViewProps {
  delivery: Delivery;
  vehicle: FleetVehicle;
  route: RouteSegment;
  onViewRoute: () => void;
  onReportIncident: () => void;
}

export function FieldDeliveryView({
  delivery,
  vehicle,
  route,
  onViewRoute,
  onReportIncident,
}: FieldDeliveryViewProps) {
  return (
    <div className="flex flex-col gap-4 sm:gap-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-neutral-200/90 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-neutral-900">{delivery.id}</span>
            <FieldBadge variant="at-risk">
              {delivery.status}
            </FieldBadge>
          </div>
          <h1 className="mt-1 text-base font-bold text-neutral-900 sm:text-lg">
            {delivery.commodity} Consignment
          </h1>
          <p className="truncate text-xs text-neutral-500">
            Assigned to Vehicle {vehicle.id} • Officer V. Rawat
          </p>
        </div>

        <button
          type="button"
          onClick={onReportIncident}
          data-testid="button-delivery-report-disruption"
          className="flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-2 text-xs font-semibold text-white shadow-xs transition-transform active:scale-[0.98] hover:bg-black"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Report Blockage</span>
        </button>
      </div>

      {/* Primary Status Banner */}
      <div className="rounded-xl border border-red-200 bg-red-50/80 p-3.5 text-xs text-red-900 shadow-xs sm:p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-bold text-red-900">Delivery Delayed — Corridor Stoppage</p>
            <p className="leading-relaxed text-red-800">
              Transit is currently halted near Mile 42 on {route.label} due to verified road blockage. Cargo is secure aboard {vehicle.type} ({vehicle.id}). Awaiting road clearance or reroute authorization via {route.alternativeRouteId || 'ALT-104'}.
            </p>
          </div>
        </div>
      </div>

      {/* Core Delivery Specifications Grid */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-800 pb-2.5 border-b border-neutral-100">
          Delivery Specifications
        </h2>

        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Delivery ID</span>
            <p className="mt-0.5 font-mono text-sm font-bold text-neutral-900">{delivery.id}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Cargo Type</span>
            <p className="mt-0.5 text-sm font-bold text-neutral-900">{delivery.commodity}</p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Origin / Dispatch</span>
            <p className="mt-0.5 font-semibold text-neutral-800 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <span>{delivery.origin}</span>
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Destination</span>
            <p className="mt-0.5 font-semibold text-neutral-800 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <span>{delivery.destination}</span>
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Assigned Vehicle</span>
            <p className="mt-0.5 font-semibold text-neutral-800 flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
              <span>{vehicle.id} ({vehicle.type})</span>
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5">
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Estimated Arrival (ETA)</span>
            <p className="mt-0.5 font-semibold text-neutral-800 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="text-amber-800 font-bold">{delivery.eta} (Held for Clearance)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Route & Corridor Link Card */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4">
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <RouteIcon className="h-4 w-4 text-neutral-700" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
              Assigned Route Condition
            </h2>
          </div>
          <FieldBadge variant="blocked">
            {route.status}
          </FieldBadge>
        </div>

        <div className="mt-3 flex flex-col gap-2.5 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-neutral-900 text-sm">{route.label} ({route.id})</p>
              <p className="text-neutral-500 text-[11px]">{route.origin} → {route.destination} ({route.distance})</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase text-neutral-400">Risk Score</span>
              <p className="font-mono text-sm font-bold text-red-600">{route.riskScore}/100 (Critical)</p>
            </div>
          </div>

          <p className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 leading-relaxed text-neutral-700">
            <strong>Impact Assessment:</strong> Road stoppage at Mile 42 prevents southern transit. Standard delivery schedule of 3h 15m is superseded. Alternate bypass {route.alternativeRouteId} (6h 20m) is accessible.
          </p>

          <button
            type="button"
            onClick={onViewRoute}
            data-testid="button-delivery-view-route-details"
            className="flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-bold text-neutral-900 shadow-xs transition-colors hover:bg-neutral-100"
          >
            <span>View Route Risk & Alternate Bypass</span>
            <ArrowRight className="h-3.5 w-3.5 text-neutral-700" />
          </button>
        </div>
      </div>

      {/* Consignment Manifest */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-800 pb-2.5 border-b border-neutral-100">
          Consignment Manifest Details
        </h2>

        <div className="mt-3 divide-y divide-neutral-100 text-xs">
          <div className="flex items-center justify-between py-2">
            <span className="text-neutral-600">Item Classification</span>
            <span className="font-semibold text-neutral-900">Packaged Dry & Ambient Foodstuffs</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-neutral-600">Consignment Weight</span>
            <span className="font-mono font-semibold text-neutral-900">8,400 kg</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-neutral-600">Temperature Sensitive</span>
            <span className="font-semibold text-neutral-900">No (Ambient Storage)</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-neutral-600">Priority Level</span>
            <span className="font-semibold text-amber-700">High Priority (Civil Relief Supply)</span>
          </div>
        </div>
      </div>

      {/* Operational Protocol Note */}
      <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
        <div className="flex items-start gap-2">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-700" />
          <p className="leading-relaxed">
            <strong className="text-neutral-900 font-semibold">Field Driver Guidance:</strong> Maintain vehicle stationary position at safe shoulder until official reroute clearance or road clearance order is transmitted.
          </p>
        </div>
      </div>
    </div>
  );
}
