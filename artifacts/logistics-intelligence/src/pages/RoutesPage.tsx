import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  CircleAlert,
  Clock3,
  LayoutGrid,
  MapPin,
  Route as RouteIcon,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { RouteSegment, RiskLevel, RouteStatus } from '@/types';
import { getRoutes } from '@/services/mapService';
import { getRouteRisk } from '@/services/routeService';
import { Badge } from '@/components/ui/Badge';
import { riskToBadgeVariant, routeStatusToBadgeVariant } from '@/lib/badgeMappings';

type RouteFilter =
  | 'all'
  | 'accessible'
  | 'partially-accessible'
  | 'blocked'
  | RiskLevel;

interface FilterDefinition {
  key: RouteFilter;
  label: string;
  icon: LucideIcon;
}

const filters: FilterDefinition[] = [
  { key: 'all', label: 'All', icon: LayoutGrid },
  { key: 'accessible', label: 'Accessible', icon: CheckCircle2 },
  {
    key: 'partially-accessible',
    label: 'Partially Accessible',
    icon: AlertTriangle,
  },
  { key: 'blocked', label: 'Blocked', icon: Ban },
  { key: 'low', label: 'Low Risk', icon: ShieldCheck },
  { key: 'moderate', label: 'Medium Risk', icon: CircleAlert },
  { key: 'high', label: 'High Risk', icon: ShieldAlert },
  { key: 'critical', label: 'Critical Risk', icon: Siren },
];

const routeStatusLabels: Record<RouteStatus, string> = {
  accessible: 'Accessible',
  'at-risk': 'Partially Accessible',
  blocked: 'Blocked',
};

const riskLabels: Record<RiskLevel, string> = {
  low: 'Low',
  moderate: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function matchesFilter(route: RouteSegment, filter: RouteFilter) {
  if (filter === 'all') return true;
  if (filter === 'partially-accessible') return route.status === 'at-risk';
  if (
    filter === 'accessible' ||
    filter === 'blocked'
  ) {
    return route.status === filter;
  }
  return route.riskLevel === filter;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  className: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 shadow-xs transition-colors hover:border-neutral-300">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${className}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          {label}
        </p>
        <p className="font-mono text-xl font-bold tabular-nums text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 py-2.5 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </span>
      <span className="text-sm font-medium text-neutral-800">{children}</span>
    </div>
  );
}

function RouteDetailModal({
  route,
  onClose,
}: {
  route: RouteSegment;
  onClose: () => void;
}) {
  const risk = getRouteRisk(route.id);

  React.useEffect(() => {
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
        role="dialog"
        aria-modal="true"
        aria-labelledby="route-detail-title"
        className="w-full max-w-md overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-800 shadow-xs">
              <RouteIcon className="h-4 w-4" />
            </div>
            <div>
              <h3 id="route-detail-title" className="text-sm font-bold text-neutral-900">Route Details</h3>
              <p className="text-[11px] text-neutral-500">Accessibility & risk profile</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
            aria-label="Close route details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-2">
          <div className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="font-mono text-lg font-bold text-neutral-900">{route.id}</p>
              <p className="text-xs text-neutral-500">{route.label}</p>
            </div>
            <Badge variant={routeStatusToBadgeVariant(route.status)}>
              {routeStatusLabels[route.status]}
            </Badge>
          </div>

          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-neutral-800">
            Route
          </p>
          <DetailRow label="Origin">{route.origin}</DetailRow>
          <DetailRow label="Destination">{route.destination}</DetailRow>
          <DetailRow label="Distance">{route.distance}</DetailRow>
          <DetailRow label="Estimated Travel Time">
            {route.estimatedTravelTime}
          </DetailRow>
          <DetailRow label="Accessibility">
            <Badge variant={routeStatusToBadgeVariant(route.status)}>
              {routeStatusLabels[route.status]}
            </Badge>
          </DetailRow>

          <p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wider text-neutral-800">
            Risk
          </p>
          <DetailRow label="Risk Level">
            <Badge variant={riskToBadgeVariant(route.riskLevel)}>
              {riskLabels[route.riskLevel]}
            </Badge>
          </DetailRow>
          <DetailRow label="Simulated Risk Score">
            {risk?.riskScore ?? route.riskScore} / 100
          </DetailRow>
          <DetailRow label="Simulated Risk Factor">
            {risk?.riskFactor ?? 'No risk factor provided'}
          </DetailRow>

          <p className="mb-1 mt-4 text-xs font-bold uppercase tracking-wider text-neutral-800">
            Alternative
          </p>
          <DetailRow label="Alternative Available">
            {route.alternativeAvailable ? (
              <span className="text-emerald-700 font-medium">Yes</span>
            ) : (
              <span className="text-neutral-400">No alternative available</span>
            )}
          </DetailRow>
          <DetailRow label="Alternative Route ID">
            {route.alternativeRouteId ?? 'No alternative route provided'}
          </DetailRow>
          <DetailRow label="Alternative Travel Time">
            {route.alternativeTravelTime ?? 'No alternative travel time provided'}
          </DetailRow>
        </div>

        <p className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-400">
          Simulated route risk data — not real AI predictions
        </p>
      </div>
    </div>
  );
}

function RouteTable({
  routes,
  onSelect,
}: {
  routes: RouteSegment[];
  onSelect: (route: RouteSegment) => void;
}) {
  if (routes.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-neutral-200 bg-white py-16 shadow-xs">
        <p className="text-sm text-neutral-500">
          No routes match the current filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs lg:block">
        <table className="w-full min-w-[1120px] text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 font-medium">Route ID</th>
              <th className="px-4 py-3 font-medium">Origin</th>
              <th className="px-4 py-3 font-medium">Destination</th>
              <th className="px-4 py-3 font-medium">Distance</th>
              <th className="px-4 py-3 font-medium">Travel Time</th>
              <th className="px-4 py-3 font-medium">Accessibility</th>
              <th className="px-4 py-3 font-medium">Risk Level</th>
              <th className="px-4 py-3 font-medium">Simulated Score</th>
              <th className="px-4 py-3 font-medium">Alternative</th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => (
              <tr
                key={route.id}
                tabIndex={0}
                role="button"
                onClick={() => onSelect(route)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(route);
                  }
                }}
                className="cursor-pointer border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50/80 focus-visible:bg-neutral-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-neutral-900"
                aria-label={`View details for route ${route.id}`}
              >
                <td className="px-4 py-3 font-mono font-bold text-neutral-900">{route.id}</td>
                <td className="px-4 py-3 text-neutral-700">{route.origin}</td>
                <td className="px-4 py-3 text-neutral-700">{route.destination}</td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-800">{route.distance}</td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-800">{route.estimatedTravelTime}</td>
                <td className="px-4 py-3">
                  <Badge variant={routeStatusToBadgeVariant(route.status)}>
                    {routeStatusLabels[route.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={riskToBadgeVariant(route.riskLevel)}>
                    {riskLabels[route.riskLevel]}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs tabular-nums text-neutral-800">
                  {route.riskScore} <span className="text-neutral-400">/ 100</span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {route.alternativeAvailable ? (
                    <span className="font-medium text-emerald-700">Available</span>
                  ) : (
                    <span className="text-neutral-400">Not available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {routes.map((route) => (
          <button
            key={route.id}
            type="button"
            onClick={() => onSelect(route)}
            className="rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono font-bold text-neutral-900">{route.id}</span>
              <Badge variant={riskToBadgeVariant(route.riskLevel)}>
                {riskLabels[route.riskLevel]} risk
              </Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm text-neutral-700">
              <span className="truncate">{route.origin}</span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
              <span className="truncate">{route.destination}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-600">
              <span className="font-mono">{route.distance}</span>
              <span className="font-mono">{route.estimatedTravelTime}</span>
              <Badge variant={routeStatusToBadgeVariant(route.status)}>
                {routeStatusLabels[route.status]}
              </Badge>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-neutral-100 pt-2.5 text-xs text-neutral-500">
              <span>Risk score <strong className="font-mono font-bold text-neutral-900">{route.riskScore}</strong>/100</span>
              <span>{route.alternativeAvailable ? 'Alternative available' : 'No alternative'}</span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

export function RoutesPage() {
  const routes = useMemo(() => getRoutes(), []);
  const [activeFilter, setActiveFilter] = useState<RouteFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<RouteSegment | null>(null);

  const summary = useMemo(
    () => ({
      total: routes.length,
      accessible: routes.filter((route) => route.status === 'accessible').length,
      partiallyAccessible: routes.filter((route) => route.status === 'at-risk').length,
      blocked: routes.filter((route) => route.status === 'blocked').length,
      highCritical: routes.filter(
        (route) => route.riskLevel === 'high' || route.riskLevel === 'critical',
      ).length,
    }),
    [routes],
  );

  const filteredRoutes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return routes.filter((route) => {
      const matchesSearch =
        !query ||
        route.id.toLowerCase().includes(query) ||
        route.origin.toLowerCase().includes(query) ||
        route.destination.toLowerCase().includes(query);
      return matchesSearch && matchesFilter(route, activeFilter);
    });
  }, [activeFilter, routes, searchQuery]);

  return (
    <div className="flex flex-col gap-4 p-4 lg:p-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
            <RouteIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">Routes</h1>
            <p className="text-sm text-neutral-500">
              Route inspection — simulated accessibility and risk data
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <SummaryCard label="Total Routes" value={summary.total} icon={RouteIcon} className="bg-neutral-100 text-neutral-900 border-neutral-200" />
        <SummaryCard label="Accessible" value={summary.accessible} icon={ShieldCheck} className="bg-emerald-50 text-emerald-700 border-emerald-200" />
        <SummaryCard label="Partially Accessible" value={summary.partiallyAccessible} icon={AlertTriangle} className="bg-amber-50 text-amber-700 border-amber-200" />
        <SummaryCard label="Blocked" value={summary.blocked} icon={Ban} className="bg-red-50 text-red-700 border-red-200" />
        <SummaryCard label="High/Critical Risk" value={summary.highCritical} icon={Siren} className="bg-orange-50 text-orange-700 border-orange-200" />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => {
            const Icon = filter.icon;
            const isActive = activeFilter === filter.key;
            return (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                aria-pressed={isActive}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 ${
                  isActive
                    ? 'border-neutral-900 bg-neutral-900 text-white font-semibold shadow-xs'
                    : 'border-neutral-200 bg-white text-neutral-700 shadow-xs hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                {filter.label}
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-96">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search route ID, origin, destination..."
            aria-label="Search routes"
            className="w-full rounded-lg border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 shadow-xs outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
          />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-2">
        <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
          Showing <span className="font-bold text-neutral-900">{filteredRoutes.length}</span> of {routes.length} routes
        </p>
        <span className="hidden items-center gap-1.5 text-xs text-neutral-500 sm:flex">
          Simulated corridor network
        </span>
      </div>

      <RouteTable routes={filteredRoutes} onSelect={setSelectedRoute} />

      <div className="flex items-center justify-center gap-2 text-center text-xs text-neutral-500">
        <MapPin className="h-3.5 w-3.5 text-neutral-400" />
        <span>Simulated route risk data — not real AI predictions or live road conditions</span>
        <Clock3 className="hidden h-3.5 w-3.5 sm:block text-neutral-400" />
      </div>

      {selectedRoute && (
        <RouteDetailModal
          route={selectedRoute}
          onClose={() => setSelectedRoute(null)}
        />
      )}
    </div>
  );
}