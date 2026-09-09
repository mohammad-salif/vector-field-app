import {
  Route as RouteIcon,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Compass,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Info,
  MapPin,
  FileText,
  Truck,
  Crosshair,
  ShieldCheck,
} from 'lucide-react';
import type { RouteSegment, Incident, FleetVehicle } from '@/types';
import { FieldBadge } from './FieldBadge';
import { FieldRouteMap } from './FieldRouteMap';

interface FieldRouteViewProps {
  route: RouteSegment;
  vehicle: FleetVehicle;
  incidentsOnRoute: Incident[];
  onReportIncident: () => void;
  onSelectIncident: (id: string) => void;
}

export function FieldRouteView({
  route,
  vehicle,
  incidentsOnRoute,
  onReportIncident,
  onSelectIncident,
}: FieldRouteViewProps) {
  // Primary incident on Corridor Delta (INC-3401)
  const primaryIncident =
    incidentsOnRoute.find((i) => i.id === 'INC-3401') || incidentsOnRoute[0];

  // Alternate route details based on ALT-104 reference in existing project data
  const alternativeRoute = {
    id: route.alternativeRouteId || 'ALT-104',
    name: 'Lowland Arterial Bypass',
    via: 'Corridor Alpha → Corridor Zeta Junction',
    distance: '242 km',
    detourExtra: '+44 km',
    estimatedTravelTime: route.alternativeTravelTime || '6h 20m',
    status: 'accessible' as const,
    riskLevel: 'low' as const,
    riskScore: 24,
    notes: 'Clear for non-hazardous freight. Lowland corridors remain open and operational.',
  };

  const riskLevels = [
    { key: 'low', label: 'Low', range: '0-30', active: route.riskLevel === 'low' },
    { key: 'moderate', label: 'Medium', range: '31-65', active: route.riskLevel === 'moderate' },
    { key: 'high', label: 'High', range: '66-85', active: route.riskLevel === 'high' },
    { key: 'critical', label: 'Critical', range: '86-100', active: route.riskLevel === 'critical' },
  ];

  return (
    <div id="field-route-container" className="flex flex-col gap-4 sm:gap-5">
      {/* ============================================================ */}
      {/* 0. HEADER: TITLE & IMMEDIATE ACTIONS                          */}
      {/* ============================================================ */}
      <div id="route-header-bar" className="flex items-start justify-between gap-3 border-b border-neutral-200/90 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-neutral-900">{route.id}</span>
            <FieldBadge variant={route.status === 'blocked' ? 'blocked' : route.status === 'at-risk' ? 'at-risk' : 'accessible'}>
              {route.status}
            </FieldBadge>
          </div>
          <h1 className="mt-1 text-base font-bold text-neutral-900 sm:text-lg">
            My Route & Tactical Navigation
          </h1>
          <p className="truncate text-xs text-neutral-500">
            {route.origin} → {route.destination} ({route.distance})
          </p>
        </div>

        <button
          type="button"
          id="btn-report-hazard"
          onClick={onReportIncident}
          data-testid="button-route-report-incident"
          className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-transform active:scale-[0.98] hover:bg-black"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>Report Hazard</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 1. MAP (FIRST IN HIERARCHY): SITUATIONAL AWARENESS          */}
      {/* ============================================================ */}
      <div id="section-route-map">
        <FieldRouteMap
          assignedRoute={route}
          currentVehicle={vehicle}
          incidentOnRoute={primaryIncident}
          onSelectIncident={onSelectIncident}
          onReportIncident={onReportIncident}
        />
      </div>

      {/* ============================================================ */}
      {/* 2. ROUTE STATUS & CURRENT POSITION (WHERE AM I? WHAT ROUTE?) */}
      {/* ============================================================ */}
      <div
        id="section-route-status"
        className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-2">
            <RouteIcon className="h-4 w-4 text-neutral-800" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Assigned Route & Current Position
            </h2>
          </div>
          <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-0.5 font-mono text-[10px] text-neutral-600">
            Field Unit 4 • Officer V. Rawat
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 text-xs">
          {/* Question 1: WHERE AM I? */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-neutral-600 tracking-wider">
              <Crosshair className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>1. Where am I?</span>
            </div>
            <p className="mt-1 font-bold text-neutral-900 text-sm">
              Corridor Delta • Mile 28.5
            </p>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              Sector C approach shoulder pull-off. Vehicle stationary at safe perimeter.
            </p>
            <div className="mt-2 flex items-center gap-2 border-t border-neutral-200/80 pt-2 text-[10px] font-mono text-neutral-500">
              <span>Assigned: <strong>{vehicle.id}</strong></span>
              <span>•</span>
              <span>Dist to Blockage: <strong>13.5 mi ahead</strong></span>
            </div>
          </div>

          {/* Question 2: WHAT ROUTE AM I ON? */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-neutral-600 tracking-wider">
                <Compass className="h-3.5 w-3.5 text-neutral-700 shrink-0" />
                <span>2. What route am I on?</span>
              </div>
              <FieldBadge variant={route.status === 'blocked' ? 'blocked' : route.status === 'at-risk' ? 'at-risk' : 'accessible'}>
                {route.status.toUpperCase()}
              </FieldBadge>
            </div>
            <p className="mt-1 font-mono font-bold text-neutral-900 text-sm">
              {route.id} — {route.label}
            </p>
            <p className="text-[11px] text-neutral-600 mt-0.5">
              {route.origin} → {route.destination} ({route.distance})
            </p>
            <div className="mt-2 flex items-center gap-2 border-t border-neutral-200/80 pt-2 text-[10px] text-neutral-500">
              <span className="font-medium text-red-700">Impassable at Mile 42 due to severe blockage</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3. RISK SCORE & SAFETY DIRECTIVE (IS MY ROUTE SAFE?)         */}
      {/* ============================================================ */}
      <div
        id="section-risk-score"
        className="rounded-xl border border-red-200 bg-white p-3.5 shadow-xs sm:p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-red-100 pb-3">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-700">
              <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
              <span>3. Is MY Route Safe?</span>
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-black text-red-600">
                {route.riskScore}
              </span>
              <span className="text-xs font-semibold text-neutral-500">/ 100</span>
              <FieldBadge variant="critical">
                Critical Risk (Score {route.riskScore})
              </FieldBadge>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-semibold text-neutral-400">Route Status</span>
            <span className="mt-1 flex items-center gap-1 text-xs font-bold text-red-700">
              <XCircle className="h-4 w-4 text-red-600" />
              BLOCKED
            </span>
          </div>
        </div>

        {/* Immediate High-Clarity Safety Verdict */}
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs">
          <div className="flex items-start gap-2.5">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div>
              <p className="font-bold text-red-900">
                ROUTE IS NOT SAFE — TRANSIT STRICTLY SUSPENDED
              </p>
              <p className="mt-0.5 leading-relaxed text-red-800">
                Do not proceed past Mile 28.5 pull-off. Impassable road blockage confirmed 13.5 miles ahead at Mile 42. Standard run time is unavailable.
              </p>
            </div>
          </div>
        </div>

        {/* Risk Index Spectrum Gauge */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 mb-1.5 font-medium">
            <span>Risk Index Spectrum</span>
            <span className="font-bold text-red-700">Critical Bracket (86-100)</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {riskLevels.map((lvl) => (
              <div
                key={lvl.key}
                className={`flex flex-col items-center rounded-lg p-2 text-center transition-all ${
                  lvl.active
                    ? 'border-2 border-red-600 bg-red-50 text-red-900 font-bold shadow-xs'
                    : 'border border-neutral-200 bg-neutral-50 text-neutral-400 opacity-60'
                }`}
              >
                <span className="text-[10px] uppercase font-bold">{lvl.label}</span>
                <span className="text-[9px] font-mono">{lvl.range}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Travel Impact Note */}
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-xs text-neutral-700">
          <Clock className="h-4 w-4 shrink-0 text-red-600" />
          <span>
            <strong>Travel Impact:</strong> Indefinite stoppage on Corridor Delta. Heavy equipment clearance required before reopening.
          </span>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. WHY THIS ROUTE IS AT RISK & BLOCKAGE FACTORS              */}
      {/* ============================================================ */}
      <div
        id="section-risk-reasons"
        className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4"
      >
        <div className="flex items-center justify-between pb-2.5 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              4. Why is MY route risky? • Risk Factors & Blockage
            </h2>
          </div>
          <span className="text-[10px] font-semibold text-neutral-400 uppercase">
            Corridor Factors
          </span>
        </div>

        {/* Factors Supported by Existing Project Data */}
        <div className="mt-3 space-y-2.5 text-xs">
          {/* Factor 1: Confirmed Road Blockage (Incident INC-3401) */}
          <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50/70 p-2.5">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-1">
                <strong className="text-red-900 font-bold">
                  Confirmed Road Blockage (Mile 42 — Incident INC-3401)
                </strong>
                <span className="text-[10px] font-mono text-red-700 font-bold shrink-0">Critical</span>
              </div>
              <p className="mt-0.5 leading-relaxed text-red-800">
                Large rockfall and road surface displacement blocking both inbound and outbound carriageways. Impassable to all vehicle types. Reported by Field Unit 4.
              </p>
            </div>
          </div>

          {/* Factor 2: Steep Mountain Pass Terrain Vulnerability */}
          <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/70 p-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="min-w-0 flex-1">
              <strong className="text-amber-900 font-bold">
                Steep Mountain Gorge Terrain (Mile 38 – Mile 45)
              </strong>
              <p className="mt-0.5 leading-relaxed text-amber-800">
                Vulnerable mountain cutting with elevated soil saturation index and slope stability hazards following rainfall.
              </p>
            </div>
          </div>

          {/* Factor 3: Severe Weather & Reduced Visibility */}
          <div className="flex items-start gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-600" />
            <div className="min-w-0 flex-1">
              <strong className="text-neutral-900 font-bold">
                Severe Weather & High Elevation Valley Fog
              </strong>
              <p className="mt-0.5 leading-relaxed text-neutral-700">
                Intermittent precipitation and dense fog on high-altitude pass sections; visibility reduced to under 40 meters.
              </p>
            </div>
          </div>
        </div>

        {/* Verified Incidents List on Corridor Delta */}
        <div className="mt-3.5 pt-3 border-t border-neutral-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-800 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-neutral-600" />
              Verified Incidents on Corridor Delta ({incidentsOnRoute.length})
            </span>
            <span className="text-[10px] text-neutral-400">Click to view details</span>
          </div>

          <div className="space-y-2">
            {incidentsOnRoute.length === 0 ? (
              <p className="text-xs text-neutral-500 py-2 text-center">No active reports on this route segment.</p>
            ) : (
              incidentsOnRoute.map((incident) => (
                <div
                  key={incident.id}
                  id={`route-incident-card-${incident.id}`}
                  onClick={() => onSelectIncident(incident.id)}
                  data-testid={`route-incident-${incident.id}`}
                  className="flex cursor-pointer items-center justify-between gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5 transition-colors hover:border-neutral-300 hover:bg-neutral-100 active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-neutral-900">{incident.id}</span>
                      <span className="truncate text-xs font-semibold text-neutral-800">{incident.type}</span>
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-neutral-500">
                      <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
                      <span className="truncate">{incident.location}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <FieldBadge variant={incident.status === 'Resolved' ? 'resolved' : 'reported'}>
                      {incident.status}
                    </FieldBadge>
                    <span className="text-[10px] text-neutral-400">{incident.timestamp}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. ALTERNATE ROUTE & AT-A-GLANCE COMPARISON                  */}
      {/* ============================================================ */}
      <div
        id="section-alternate-route"
        className="rounded-xl border border-emerald-200 bg-white p-3.5 shadow-xs sm:p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-emerald-100">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-emerald-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              5. What alternate route should I take?
            </h2>
          </div>
          <FieldBadge variant="accessible">
            Recommended • Open Bypass
          </FieldBadge>
        </div>

        <div className="mt-3 flex flex-col gap-3 text-xs">
          {/* Alternate Route Identity */}
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-1">
              <p className="font-mono text-base font-bold text-neutral-900">
                {alternativeRoute.id} — {alternativeRoute.name}
              </p>
              <span className="font-bold text-emerald-700">
                Low Risk (Score {alternativeRoute.riskScore} / 100)
              </span>
            </div>
            <p className="mt-0.5 text-neutral-600 text-xs">
              Routing via: <strong>{alternativeRoute.via}</strong>
            </p>
          </div>

          {/* At-a-Glance Side-by-Side Comparison: Current Route vs Alternate Route */}
          <div className="rounded-lg border border-neutral-200 bg-neutral-50/90 overflow-hidden">
            <div className="border-b border-neutral-200 bg-neutral-100/80 px-3 py-2 text-[11px] font-bold text-neutral-800 uppercase tracking-wider">
              At-a-Glance Route Comparison
            </div>

            <div className="grid grid-cols-2 divide-x divide-neutral-200 text-xs">
              {/* CURRENT ROUTE COLUMN */}
              <div className="p-3 bg-red-50/40">
                <div className="flex items-center justify-between pb-1.5 border-b border-red-100">
                  <span className="font-mono font-bold text-red-900">CURRENT: {route.id}</span>
                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-800">Blocked</span>
                </div>
                <div className="mt-2 space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block font-medium">Risk Score</span>
                    <strong className="font-mono text-red-700 text-xs">{route.riskScore} / 100 (Critical)</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block font-medium">Distance</span>
                    <span className="font-mono font-semibold text-neutral-800">{route.distance}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block font-medium">Travel Time</span>
                    <span className="font-semibold text-red-700">Stopped / N/A</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block font-medium">Condition</span>
                    <span className="text-red-800 font-medium">Mile 42 Rockfall Blockage</span>
                  </div>
                </div>
              </div>

              {/* ALTERNATE ROUTE COLUMN */}
              <div className="p-3 bg-emerald-50/40">
                <div className="flex items-center justify-between pb-1.5 border-b border-emerald-100">
                  <span className="font-mono font-bold text-emerald-900">ALTERNATE: {alternativeRoute.id}</span>
                  <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">Open</span>
                </div>
                <div className="mt-2 space-y-1.5 text-[11px]">
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block font-medium">Risk Score</span>
                    <strong className="font-mono text-emerald-700 text-xs">{alternativeRoute.riskScore} / 100 (Low)</strong>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block font-medium">Distance</span>
                    <span className="font-mono font-semibold text-neutral-800">{alternativeRoute.distance} ({alternativeRoute.detourExtra})</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block font-medium">Travel Time</span>
                    <span className="font-semibold text-emerald-800">{alternativeRoute.estimatedTravelTime}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-neutral-400 block font-medium">Condition</span>
                    <span className="text-emerald-800 font-medium">Lowland Corridor Clear</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Central Dispatch Operational Directive */}
          <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/80 p-3 text-emerald-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <div>
              <p className="font-bold">
                Recommended Action: Switch to ALT-104 Bypass
              </p>
              <p className="mt-0.5 leading-relaxed text-[11px] text-emerald-800">
                Central Dispatch advises rerouting Vehicle VHC-2044 onto {alternativeRoute.id} via the West Junction turn-around. Detour adds approximately 2 hours to standard run time but guarantees clear passage to Southport Depot without blockage risk.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

