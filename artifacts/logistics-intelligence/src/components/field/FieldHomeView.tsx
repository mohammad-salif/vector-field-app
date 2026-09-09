import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  FileText,
  MapPin,
  Route as RouteIcon,
  PlusCircle,
  ArrowRight,
  Truck,
  Package,
  Clock,
  ShieldAlert,
  BellRing,
  Crosshair,
  Compass,
  XCircle,
  CheckCircle2,
} from 'lucide-react';
import type { Incident, FleetVehicle, Delivery, RouteSegment, Alert } from '@/types';
import { FieldBadge } from './FieldBadge';
import { syncManager, type ConnectivityStatus } from '@/services/offline';

interface FieldHomeViewProps {
  vehicle: FleetVehicle;
  delivery: Delivery;
  route: RouteSegment;
  activeAlerts: Alert[];
  userIncidents: Incident[];
  onReportClick: () => void;
  onDeliveryClick: () => void;
  onRouteChangeClick: () => void;
  onAlertsClick: () => void;
  onMyReportsClick: () => void;
  onSelectIncident: (id: string) => void;
}

export function FieldHomeView({
  vehicle,
  delivery,
  route,
  activeAlerts,
  userIncidents,
  onReportClick,
  onDeliveryClick,
  onRouteChangeClick,
  onAlertsClick,
  onMyReportsClick,
  onSelectIncident,
}: FieldHomeViewProps) {
  const [connStatus, setConnStatus] = useState<ConnectivityStatus>({
    state: typeof navigator !== 'undefined' && navigator.onLine ? 'ONLINE' : 'OFFLINE',
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    message: 'Connected',
  });

  useEffect(() => {
    const unsub = syncManager.subscribe(setConnStatus);
    return () => {
      unsub();
    };
  }, []);

  // Primary urgent alert affecting current route / vehicle
  const primaryAlert = activeAlerts[0] || {
    id: 'ALR-OP-104',
    type: 'Corridor Stoppage Alert',
    severity: 'Critical' as const,
    location: 'Corridor Delta • Mile 42',
    timestamp: '15 min ago',
    routeId: 'RTE-104',
    vehicleId: 'VHC-2044',
  };

  return (
    <div id="field-home-container" className="flex flex-col gap-4 sm:gap-5">
      {/* ============================================================ */}
      {/* 1. FIELD OFFICER HEADER                                      */}
      {/* ============================================================ */}
      <div
        id="field-officer-header"
        className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              Field Officer Operational Duty
            </span>
            <h1 className="mt-1 text-base font-bold text-neutral-900 sm:text-lg">
              Officer V. Rawat
            </h1>
            <p className="truncate text-xs text-neutral-600">
              Field Unit 4 • Corridor Delta Assignment
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center">
            {/* Small operational connectivity/status indicator */}
            {connStatus.state === 'OFFLINE' ? (
              <span
                id="home-conn-indicator"
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
                title="Offline: Reports saved locally on device"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>Offline • Reports saved locally</span>
              </span>
            ) : connStatus.state === 'PENDING_SYNC' ? (
              <span
                id="home-conn-indicator"
                className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800"
                title="Pending sync: Reports waiting for backend endpoint"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span>Pending Sync ({connStatus.pendingCount})</span>
              </span>
            ) : (
              <span
                id="home-conn-indicator"
                className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[10px] font-medium text-neutral-600"
                title="Online: Connected"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Online</span>
              </span>
            )}

            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>On Duty</span>
            </span>
          </div>
        </div>

        {/* 8. QUICK OPERATIONAL STATUS SUMMARY (AT-A-GLANCE STRIP) */}
        <div
          id="home-quick-status-strip"
          className="mt-3.5 grid grid-cols-2 gap-2 border-t border-neutral-100 pt-3 sm:grid-cols-4 text-xs"
        >
          {/* Status 1: ROUTE */}
          <div className="rounded-lg border border-red-200 bg-red-50/70 p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 block">
              Route Status
            </span>
            <div className="mt-0.5 flex items-center gap-1 font-bold text-red-900">
              <XCircle className="h-3 w-3 shrink-0 text-red-600" />
              <span className="truncate">Blocked (Risk 96)</span>
            </div>
          </div>

          {/* Status 2: DELIVERY */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
              Delivery Status
            </span>
            <div className="mt-0.5 flex items-center gap-1 font-bold text-amber-900">
              <Clock className="h-3 w-3 shrink-0 text-amber-600" />
              <span className="truncate">Delayed (Held)</span>
            </div>
          </div>

          {/* Status 3: VEHICLE */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block">
              My Vehicle
            </span>
            <div className="mt-0.5 flex items-center gap-1 font-bold text-neutral-900">
              <Truck className="h-3 w-3 shrink-0 text-neutral-600" />
              <span className="truncate font-mono">{vehicle.id}</span>
            </div>
          </div>

          {/* Status 4: RELEVANT ALERTS */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-600 block">
              Active Alerts
            </span>
            <div className="mt-0.5 flex items-center gap-1 font-bold text-neutral-900">
              <BellRing className="h-3 w-3 shrink-0 text-red-600" />
              <span className="truncate">{activeAlerts.length} Relevant</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 7. PRIMARY ACTION: REPORT INCIDENT                           */}
      {/* ============================================================ */}
      <div
        id="section-primary-action"
        className="rounded-xl border border-neutral-900 bg-neutral-900 p-4 text-white shadow-sm sm:p-5"
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white shadow-xs">
            <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Report Road Incident</h2>
              <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Immediate Action
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-neutral-300">
              Encountered a road blockage, landslide, flood, accident, road damage, vehicle issue, or field hazard? Submit an instant report to Dispatch.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
          <button
            type="button"
            id="btn-home-report-incident"
            onClick={onReportClick}
            data-testid="button-field-home-report"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-neutral-950 shadow-xs transition-transform active:scale-[0.98] hover:bg-neutral-100 sm:w-auto"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Report Incident</span>
          </button>

          <button
            type="button"
            id="btn-home-my-reports"
            onClick={onMyReportsClick}
            data-testid="button-field-home-view-my-reports"
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 active:scale-[0.98] sm:w-auto"
          >
            <FileText className="h-4 w-4 text-neutral-300" />
            <span>My Filed Reports ({userIncidents.length})</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MY ROUTE + RISK (HIGH PRIORITY)                           */}
      {/* ============================================================ */}
      <div
        id="section-home-my-route"
        className="rounded-xl border border-red-200 bg-white p-3.5 shadow-xs sm:p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100 pb-2.5">
          <div className="flex items-center gap-2">
            <RouteIcon className="h-4 w-4 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              My Route & Risk
            </h2>
          </div>
          <FieldBadge variant={route.status === 'blocked' ? 'blocked' : route.status === 'at-risk' ? 'at-risk' : 'accessible'}>
            {route.status.toUpperCase()}
          </FieldBadge>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {/* Route Identification & Risk Score */}
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Assigned Route
              </span>
              <h3 className="font-mono text-base font-bold text-neutral-900">
                {route.id} — {route.label}
              </h3>
              <p className="mt-0.5 text-xs text-neutral-600">
                {route.origin} → {route.destination} ({route.distance})
              </p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                Risk Score
              </span>
              <div className="flex items-baseline justify-end gap-1">
                <span className="font-mono text-2xl font-black text-red-600">
                  {route.riskScore}
                </span>
                <span className="text-xs font-semibold text-neutral-500">/ 100</span>
              </div>
              <span className="inline-block rounded bg-red-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-red-800">
                CRITICAL RISK
              </span>
            </div>
          </div>

          {/* Real Risk Reasons from Project Data */}
          <div className="rounded-lg border border-red-200 bg-red-50/80 p-3 text-xs text-red-900">
            <div className="flex items-start gap-2.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  Route is NOT safe — Confirmed Blockage 13.5 mi ahead at Mile 42
                </p>
                <p className="mt-1 leading-relaxed text-red-800">
                  <strong>Risk Factors:</strong> Heavy rockfall obstruction on carriageway (Incident INC-3401) combined with steep gorge terrain saturation and valley fog.
                </p>
                <p className="mt-1.5 font-medium text-red-900">
                  Alternate bypass <span className="font-mono font-bold text-neutral-900">{route.alternativeRouteId || 'ALT-104'}</span> is open and recommended by Dispatch.
                </p>
              </div>
            </div>
          </div>

          {/* Action: View My Route */}
          <button
            type="button"
            id="btn-home-view-my-route"
            onClick={onRouteChangeClick}
            data-testid="button-home-view-route"
            className="flex min-h-[44px] items-center justify-between rounded-xl border border-neutral-900 bg-neutral-900 px-3.5 py-2.5 text-xs font-bold text-white shadow-xs transition-transform active:scale-[0.98] hover:bg-black"
          >
            <div className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-emerald-400" />
              <span>View My Route (Full Map, Risk Details & Bypass)</span>
            </div>
            <ArrowRight className="h-4 w-4 text-neutral-300" />
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. CURRENT LOCATION & TELEMETRY INDICATOR                    */}
      {/* ============================================================ */}
      <div
        id="section-home-location"
        className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Crosshair className="h-4 w-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Current Location & Telemetry
            </h2>
          </div>
          <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[10px] text-neutral-600">
            GPS Interface: Ready
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-neutral-400">
              Current Position
            </span>
            <p className="mt-0.5 font-bold text-neutral-900">
              Sector C • Corridor Delta Mile 28.5
            </p>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Stationary at safe shoulder pull-off. 13.5 miles south of Mile 42 blockage.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-neutral-400">
              Telemetry Fix Status
            </span>
            <p className="mt-0.5 font-mono font-bold text-neutral-800 truncate">
              27.8124° N, 88.5412° E (±8m)
            </p>
            <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
              Simulated sample fix • GPS adapter interface ready
            </p>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. MY DELIVERY                                               */}
      {/* ============================================================ */}
      <div
        id="section-home-my-delivery"
        className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-neutral-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              My Delivery
            </h2>
          </div>
          <FieldBadge variant={delivery.status === 'At Risk' ? 'at-risk' : delivery.status === 'Delayed' ? 'at-risk' : 'accessible'}>
            {delivery.status}
          </FieldBadge>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-neutral-400">
              Delivery ID & Cargo Type
            </span>
            <p className="font-mono font-bold text-neutral-900 mt-0.5 text-sm">
              {delivery.id}
            </p>
            <p className="text-xs font-semibold text-neutral-700 mt-0.5">
              {delivery.commodity} Consignment
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-neutral-400">
              Schedule & Transit Status
            </span>
            <p className="font-semibold text-amber-800 flex items-center gap-1.5 mt-0.5">
              <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>{delivery.eta || 'TBD'} (Held for route clearance)</span>
            </p>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Transit paused at Mile 28.5 pull-off
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-neutral-400">
              Origin Depot
            </span>
            <p className="font-medium text-neutral-800 mt-0.5">
              {delivery.origin}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-neutral-400">
              Destination
            </span>
            <p className="font-medium text-neutral-800 mt-0.5">
              {delivery.destination}
            </p>
          </div>
        </div>

        {/* Action: Open My Delivery */}
        <button
          type="button"
          id="btn-home-view-my-delivery"
          onClick={onDeliveryClick}
          data-testid="button-home-view-delivery"
          className="mt-3.5 flex min-h-[44px] w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs font-bold text-neutral-900 hover:bg-neutral-100 transition-colors shadow-xs active:scale-[0.99]"
        >
          <span>Open Full Delivery Details & Manifest</span>
          <ArrowRight className="h-3.5 w-3.5 text-neutral-600" />
        </button>
      </div>

      {/* ============================================================ */}
      {/* 2. MY VEHICLE                                                */}
      {/* ============================================================ */}
      <div
        id="section-home-my-vehicle"
        className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-neutral-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              My Vehicle
            </h2>
          </div>
          <span className="font-mono text-xs font-bold text-neutral-900">
            {vehicle.id}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3 text-xs">
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-neutral-400">
              Vehicle ID & Type
            </span>
            <p className="mt-0.5 font-mono font-bold text-neutral-900">
              {vehicle.id}
            </p>
            <p className="text-[11px] text-neutral-600">
              {vehicle.type || 'Flatbed Truck'} • {vehicle.cargoCategory || 'General Freight'}
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-neutral-400">
              Current Status
            </span>
            <p className="mt-0.5 font-bold text-amber-800 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>Stationary (Pull-off)</span>
            </p>
            <p className="text-[11px] text-neutral-500">
              Corridor Delta Mile 28.5
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] uppercase font-semibold text-neutral-400">
              Assigned Delivery
            </span>
            <p className="mt-0.5 font-mono font-bold text-neutral-900">
              {delivery.id}
            </p>
            <p className="text-[11px] text-neutral-600">
              {delivery.commodity} Consignment
            </p>
          </div>
        </div>

        <p className="mt-3 rounded-lg border border-neutral-200/80 bg-neutral-50/60 px-3 py-2 text-[11px] text-neutral-600">
          <strong>Operational Note:</strong> Engine safe and idle. Vehicle parked securely at Sector C pull-off awaiting Central Dispatch reroute clearance.
        </p>
      </div>

      {/* ============================================================ */}
      {/* 6. RELEVANT ALERT                                            */}
      {/* ============================================================ */}
      <div
        id="section-home-relevant-alerts"
        className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <BellRing className="h-4 w-4 text-neutral-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              Important Route Alert
            </h2>
          </div>
          <button
            type="button"
            id="btn-home-view-all-alerts"
            onClick={onAlertsClick}
            className="text-xs font-bold text-neutral-900 hover:underline flex items-center gap-1"
          >
            <span>View all ({activeAlerts.length})</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-3">
          <div className="flex items-start justify-between gap-2.5 rounded-lg border border-red-200 bg-red-50/60 p-3 text-xs">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-neutral-900">
                  {primaryAlert.id}
                </span>
                <FieldBadge variant={primaryAlert.severity === 'Critical' ? 'critical' : 'high'}>
                  {primaryAlert.severity}
                </FieldBadge>
                <span className="text-[10px] font-mono text-neutral-500">
                  {primaryAlert.timestamp}
                </span>
              </div>
              <p className="mt-1 font-bold text-red-950">
                {primaryAlert.type}
              </p>
              <p className="text-[11px] text-neutral-700 mt-0.5">
                Affecting {route.id} ({route.label}) • Confirmed blockage at Mile 42. Alternate route {route.alternativeRouteId || 'ALT-104'} recommended.
              </p>
            </div>
          </div>
        </div>

        {/* Action: View Alerts */}
        <button
          type="button"
          id="btn-home-open-alerts"
          onClick={onAlertsClick}
          className="mt-3 flex min-h-[44px] w-full items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-xs font-bold text-neutral-900 hover:bg-neutral-100 transition-colors shadow-xs active:scale-[0.99]"
        >
          <span>View Alerts & Dispatch Advisories ({activeAlerts.length})</span>
          <ArrowRight className="h-3.5 w-3.5 text-neutral-600" />
        </button>
      </div>

      {/* ============================================================ */}
      {/* 9. MY RECENT REPORTS (SUBMITTED BY OPERATOR)                 */}
      {/* ============================================================ */}
      <div
        id="section-home-my-reports"
        className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-neutral-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-800">
              My Filed Reports ({userIncidents.length})
            </h2>
          </div>
          <button
            type="button"
            id="btn-home-view-reports-history"
            onClick={onMyReportsClick}
            className="text-xs font-bold text-neutral-900 hover:underline flex items-center gap-1"
          >
            <span>History</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {userIncidents.slice(0, 2).map((incident) => (
            <div
              key={incident.id}
              id={`home-incident-item-${incident.id}`}
              onClick={() => onSelectIncident(incident.id)}
              className="flex min-h-[48px] cursor-pointer items-center justify-between gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50/60 p-2.5 transition-colors hover:border-neutral-300 hover:bg-neutral-100 active:scale-[0.99]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-neutral-900">
                    {incident.id}
                  </span>
                  <span className="text-xs font-semibold text-neutral-800 truncate">
                    {incident.type}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-500 truncate flex items-center gap-1 mt-0.5">
                  <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
                  <span>{incident.location}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <FieldBadge variant={incident.status === 'Resolved' ? 'resolved' : 'reported'}>
                  {incident.status}
                </FieldBadge>
                <span className="text-[10px] text-neutral-400">{incident.timestamp}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

