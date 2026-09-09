import { useState, useMemo, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  Search,
  CheckCircle2,
  MapPin,
  Clock,
  Info,
  Radio,
  Wifi,
  RefreshCw,
  Bluetooth,
  ArrowRight,
  Shield,
  Truck,
  Package,
  Route as RouteIcon,
  Check,
  ExternalLink,
} from 'lucide-react';
import type { Alert, AlertSeverity, AlertStatus } from '@/types';
import { FieldBadge } from './FieldBadge';
import { getRelayedAlerts } from '@/services/offline';

export type AlertSyncState = 'SYNCED' | 'PENDING SYNC' | 'OFFLINE' | 'BLUETOOTH RECEIVED';

interface FieldAlertsViewProps {
  alerts: Alert[];
  onReportIncident: () => void;
  onViewRoute: () => void;
  onViewDelivery: () => void;
  onViewIncident?: (incidentId: string) => void;
}

type SeverityFilter = 'all' | 'Critical' | 'Warning' | 'Info' | 'Resolved';
type SyncFilter = 'all' | 'SYNCED' | 'PENDING SYNC' | 'OFFLINE' | 'BLUETOOTH RECEIVED';

interface EnrichedFieldAlert extends Alert {
  title: string;
  description: string;
  source: string;
  incidentId?: string;
  affectedCorridor: string;
  affectedVehicle: string;
  affectedDelivery?: string;
}

export function FieldAlertsView({
  alerts,
  onReportIncident,
  onViewRoute,
  onViewDelivery,
  onViewIncident,
}: FieldAlertsViewProps) {
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [syncFilter, setSyncFilter] = useState<SyncFilter>('all');
  const [search, setSearch] = useState('');
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Local acknowledgment state dictionary for prototype session
  const [ackState, setAckState] = useState<Record<string, boolean>>({});
  const [relayedAlerts, setRelayedAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    getRelayedAlerts().then((stored) => {
      if (stored && stored.length > 0) {
        setRelayedAlerts(stored);
      }
    });
  }, []);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
    }
    function handleOffline() {
      setIsOnline(false);
    }
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 1. DATA SCOPING: strictly scoped to Officer Rawat (VHC-2044, RTE-104, DLV-6006)
  const enrichedScopedAlerts = useMemo<EnrichedFieldAlert[]>(() => {
    // Start with assigned alerts passed from portal plus relayed alerts
    const rawList = [...alerts, ...relayedAlerts];

    // Ensure dedicated operational and weather alerts exist for RTE-104
    if (!rawList.some((a) => a.id === 'ALR-OP-104')) {
      rawList.push({
        id: 'ALR-OP-104',
        type: 'Accessibility Disruption',
        severity: 'Info',
        routeId: 'RTE-104',
        vehicleId: 'VHC-2044',
        deliveryId: 'DLV-6006',
        location: 'Corridor Delta Bypass Approach',
        timestamp: '15 min ago',
        status: 'Active',
      });
    }

    if (!rawList.some((a) => a.id === 'ALR-WX-104')) {
      rawList.push({
        id: 'ALR-WX-104',
        type: 'High Route Risk',
        severity: 'Warning',
        routeId: 'RTE-104',
        vehicleId: 'VHC-2044',
        deliveryId: null,
        location: 'Valley Pass — Mile 36 to Mile 44',
        timestamp: '50 min ago',
        status: 'Active',
      });
    }

    // Filter strictly to user's assigned route, vehicle, delivery OR relayed alerts
    const strictlyUserAlerts = rawList.filter(
      (a) =>
        a.routeId === 'RTE-104' ||
        a.vehicleId === 'VHC-2044' ||
        a.deliveryId === 'DLV-6006' ||
        a.isRelayed ||
        a.syncState === 'BLUETOOTH RECEIVED' ||
        a.syncState === 'BLUETOOTH_RECEIVED',
    );

    return strictlyUserAlerts.map((alert) => {
      let title: string = alert.title || alert.type;
      let description: string =
        alert.description || `Operational advisory for route ${alert.routeId || 'assigned corridor'}.`;
      let source: string = alert.source || 'Central Logistics Dispatch';
      let incidentId: string | undefined;

      if (alert.isRelayed || alert.syncState === 'BLUETOOTH RECEIVED' || alert.syncState === 'BLUETOOTH_RECEIVED') {
        title = alert.title || `Relayed Alert: ${alert.type}`;
        description = alert.description || 'Received via Bluetooth relay from nearby field peer.';
        source = alert.source || (alert.sourceDeviceId ? `Relayed via Device ${alert.sourceDeviceId}` : 'Relayed via Bluetooth');
      } else if (alert.id === 'ALR-7001') {
        title = 'Route Blockage Confirmed';
        description =
          'Impassable debris & rockfall confirmed at Mile 42. Main corridor is completely closed. Vehicle VHC-2044 held at safe staging turnout.';
        source = 'Highway Patrol & Road Sensor S-42';
        incidentId = 'INC-3401';
      } else if (alert.id === 'ALR-WX-104') {
        title = 'High Route Risk & Weather Warning';
        description =
          'Valley Pass cold front causing dense fog and continuous drizzle. Visibility reduced below 40m between Mile 36 and Mile 44. Road traction degraded.';
        source = 'Mountain Weather Station S-42 & Automated Telemetry';
      } else if (alert.id === 'ALR-OP-104') {
        title = 'Alternate Bypass Available (ALT-104)';
        description =
          'Central Dispatch has authorized alternate bypass ALT-104 (Lowland Arterial) for general freight. Estimated travel time is 6h 20m (+1h 20m variance).';
        source = 'Central Logistics Dispatch Directive';
      } else if (alert.id === 'ALR-7008') {
        title = 'Previous Hazard Cleared';
        description =
          'Earlier debris clearance and slope stabilizer inspection at Mile 38 completed. Mile 38 sector declared cleared and open to transit.';
        source = 'Sector Engineering Corps Inspection';
        incidentId = 'INC-3405';
      }

      return {
        ...alert,
        title,
        description,
        source,
        incidentId,
        affectedCorridor: 'RTE-104 (Corridor Delta)',
        affectedVehicle: 'VHC-2044',
        affectedDelivery: alert.deliveryId ? 'DLV-6006 (Food Consignment)' : undefined,
      };
    });
  }, [alerts, relayedAlerts]);

  // 2. ALERT PRIORITY SORTING: Critical ↓ Warning ↓ Info, then Active before Resolved
  const prioritizedAlerts = useMemo(() => {
    const severityRank: Record<string, number> = {
      Critical: 1,
      High: 2,
      Warning: 2,
      Info: 3,
    };

    return [...enrichedScopedAlerts].sort((a, b) => {
      const isResolvedA = a.status === 'Resolved';
      const isResolvedB = b.status === 'Resolved';

      // If one is resolved and the other is not, active/warning/critical comes first
      if (isResolvedA !== isResolvedB) {
        return isResolvedA ? 1 : -1;
      }

      const rankA = severityRank[a.severity] || 4;
      const rankB = severityRank[b.severity] || 4;

      if (rankA !== rankB) {
        return rankA - rankB;
      }

      // Secondary sort: preserve chronological order (earlier index/most recent first)
      return 0;
    });
  }, [enrichedScopedAlerts]);

  // Determine offline-first readiness state for an alert
  function getAlertSyncState(alert: EnrichedFieldAlert): AlertSyncState {
    // Genuinely received via Bluetooth relay
    if (
      alert.isRelayed ||
      alert.syncState === 'BLUETOOTH RECEIVED' ||
      alert.syncState === 'BLUETOOTH_RECEIVED' ||
      alert.timestamp?.includes('Bluetooth Received')
    ) {
      return 'BLUETOOTH RECEIVED';
    }

    const isAcknowledged = ackState[alert.id] || alert.status === 'Acknowledged';

    // If device is offline
    if (!isOnline) {
      if (isAcknowledged && !alert.status.includes('Acknowledged')) {
        return 'PENDING SYNC';
      }
      return 'OFFLINE';
    }

    if (isAcknowledged && alert.status !== 'Acknowledged') {
      return 'PENDING SYNC';
    }

    return 'SYNCED';
  }

  // 3. FILTERING & SEARCH
  const filteredAlerts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return prioritizedAlerts.filter((alert) => {
      // Severity Filter
      let matchesSeverity = true;
      if (severityFilter === 'Critical') {
        matchesSeverity = alert.severity === 'Critical' && alert.status !== 'Resolved';
      } else if (severityFilter === 'Warning') {
        matchesSeverity =
          (alert.severity === 'Warning' || alert.severity === 'High') &&
          alert.status !== 'Resolved';
      } else if (severityFilter === 'Info') {
        matchesSeverity = alert.severity === 'Info' && alert.status !== 'Resolved';
      } else if (severityFilter === 'Resolved') {
        matchesSeverity = alert.status === 'Resolved';
      }

      // Sync State Filter
      const currentSync = getAlertSyncState(alert);
      let matchesSync = true;
      if (syncFilter !== 'all') {
        matchesSync = currentSync === syncFilter;
      }

      // Text search
      const matchesSearch =
        !q ||
        alert.id.toLowerCase().includes(q) ||
        alert.title.toLowerCase().includes(q) ||
        alert.description.toLowerCase().includes(q) ||
        alert.location.toLowerCase().includes(q) ||
        alert.source.toLowerCase().includes(q);

      return matchesSeverity && matchesSync && matchesSearch;
    });
  }, [prioritizedAlerts, severityFilter, syncFilter, search, isOnline, ackState]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: enrichedScopedAlerts.length,
      critical: enrichedScopedAlerts.filter(
        (a) => a.severity === 'Critical' && a.status !== 'Resolved',
      ).length,
      warning: enrichedScopedAlerts.filter(
        (a) =>
          (a.severity === 'Warning' || a.severity === 'High') &&
          a.status !== 'Resolved',
      ).length,
      info: enrichedScopedAlerts.filter(
        (a) => a.severity === 'Info' && a.status !== 'Resolved',
      ).length,
      resolved: enrichedScopedAlerts.filter((a) => a.status === 'Resolved').length,
    };
  }, [enrichedScopedAlerts]);

  // Handle local acknowledgment
  function handleToggleAcknowledge(alertId: string) {
    setAckState((prev) => ({
      ...prev,
      [alertId]: !prev[alertId],
    }));
  }

  return (
    <div id="field-alerts-screen" className="flex flex-col gap-4 sm:gap-5 pb-8">
      {/* Top Header: Operational Alerts for 1 Officer */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200/90 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-neutral-600">
            <Radio className="h-3.5 w-3.5 text-red-600 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              Personal Field Comms
            </span>
          </div>
          <h1 className="mt-0.5 text-base font-bold text-neutral-950 sm:text-lg">
            Operational Alerts
          </h1>
          <p className="truncate text-xs text-neutral-500">
            Scoped to Officer V. Rawat • Vehicle VHC-2044 • Corridor Delta (RTE-104)
          </p>
        </div>

        <button
          type="button"
          onClick={onReportIncident}
          id="btn-alerts-report-incident"
          className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-neutral-900 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-transform active:scale-[0.98] hover:bg-black"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
          <span>Report Incident</span>
        </button>
      </div>

      {/* Scope Assurance Notice (Field Officer specific, not global control room) */}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 text-xs text-neutral-700">
        <div className="flex items-start gap-2">
          <Info className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 text-[11px] leading-relaxed">
            <span className="font-bold text-neutral-900">Personal Operational Feed:</span>{' '}
            Showing only actionable alerts affecting your assigned route (RTE-104), vehicle (VHC-2044), and cargo delivery (DLV-6006). Global network telemetry is filtered.
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CONNECTIVITY & SYNC STATUS (Truthful prototype/readiness)     */}
      {/* ============================================================ */}
      <div
        id="alerts-connectivity-panel"
        className="rounded-2xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4 text-xs"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
          <div className="flex items-center gap-1.5 font-bold text-neutral-900">
            <Wifi className="h-3.5 w-3.5 text-neutral-700" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-800">
              Comms & Sync Status
            </span>
          </div>
          <span className="rounded-md bg-neutral-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-neutral-600 border border-neutral-200">
            Offline-First Architecture
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {/* Network */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
              Network
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-bold">
              {isOnline ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-900">Online</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span className="text-amber-900">Offline</span>
                </>
              )}
            </div>
            <p className="mt-0.5 text-[10px] text-neutral-500">
              {isOnline ? 'Cellular link detected' : 'Operating on local cache'}
            </p>
          </div>

          {/* Last Sync */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
              Last Sync
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-bold text-neutral-900">
              <RefreshCw className="h-3 w-3 text-neutral-600" />
              <span>Just now</span>
            </div>
            <p className="mt-0.5 text-[10px] text-neutral-500">
              Alert buffer synchronized
            </p>
          </div>

          {/* Bluetooth Readiness */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-2.5">
            <span className="text-[10px] font-semibold uppercase text-neutral-400 block">
              Bluetooth
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-bold text-neutral-900">
              <Bluetooth className="h-3 w-3 text-neutral-600" />
              <span>Ready / Standby</span>
            </div>
            <p className="mt-0.5 text-[10px] text-neutral-500">
              Telemetry interface ready (Prototype)
            </p>
          </div>
        </div>
      </div>

      {/* Severity Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs -mx-1 px-1">
        <button
          type="button"
          onClick={() => setSeverityFilter('all')}
          className={`flex min-h-[44px] shrink-0 items-center rounded-xl px-3.5 py-2 font-semibold transition-colors whitespace-nowrap ${
            severityFilter === 'all'
              ? 'bg-neutral-900 text-white font-bold shadow-xs'
              : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
          }`}
        >
          All ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('Critical')}
          className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 font-semibold transition-colors whitespace-nowrap ${
            severityFilter === 'Critical'
              ? 'border border-red-300 bg-red-600 text-white font-bold shadow-xs'
              : 'border border-red-200 bg-red-50 text-red-800 hover:bg-red-100'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-red-500" />
          <span>Critical ({counts.critical})</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('Warning')}
          className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 font-semibold transition-colors whitespace-nowrap ${
            severityFilter === 'Warning'
              ? 'border border-amber-300 bg-amber-500 text-white font-bold shadow-xs'
              : 'border border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span>Warning ({counts.warning})</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('Info')}
          className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 font-semibold transition-colors whitespace-nowrap ${
            severityFilter === 'Info'
              ? 'border border-neutral-300 bg-neutral-800 text-white font-bold shadow-xs'
              : 'border border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
          }`}
        >
          <span>Info ({counts.info})</span>
        </button>

        <button
          type="button"
          onClick={() => setSeverityFilter('Resolved')}
          className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 font-semibold transition-colors whitespace-nowrap ${
            severityFilter === 'Resolved'
              ? 'border border-emerald-300 bg-emerald-600 text-white font-bold shadow-xs'
              : 'border border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Resolved ({counts.resolved})</span>
        </button>
      </div>

      {/* Offline Sync State Selector / Filter */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
          Sync Status Filter:
        </span>
        {(['all', 'SYNCED', 'PENDING SYNC', 'OFFLINE', 'BLUETOOTH RECEIVED'] as SyncFilter[]).map(
          (st) => (
            <button
              key={st}
              type="button"
              onClick={() => setSyncFilter(st)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                syncFilter === st
                  ? 'bg-neutral-900 text-white font-bold'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {st === 'all' ? 'All Sync States' : st}
            </button>
          ),
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search assigned alerts by keyword, location, or source..."
          id="input-alerts-search"
          className="w-full min-h-[44px] rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900 shadow-xs"
        />
        <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
      </div>

      {/* ============================================================ */}
      {/* ALERTS FEED (Sorted: Critical ↓ Warning ↓ Info)               */}
      {/* ============================================================ */}
      <div className="flex flex-col gap-3">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500 shadow-xs">
            <BellRing className="h-8 w-8 text-neutral-400 mb-2" />
            <p className="text-sm font-semibold text-neutral-800">No matching alerts found</p>
            <p className="mt-1 text-xs text-neutral-500">
              No alerts match the selected severity or sync filter for your corridor.
            </p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'Critical' && alert.status !== 'Resolved';
            const isWarning =
              (alert.severity === 'Warning' || alert.severity === 'High') &&
              alert.status !== 'Resolved';
            const isResolved = alert.status === 'Resolved';
            const isAcknowledged = ackState[alert.id] || alert.status === 'Acknowledged';
            const syncState = getAlertSyncState(alert);

            return (
              <div
                key={alert.id}
                id={`alert-card-${alert.id}`}
                className={`flex flex-col gap-3 rounded-2xl border p-4 shadow-xs transition-all sm:p-5 ${
                  isResolved
                    ? 'border-emerald-200 bg-emerald-50/30'
                    : isCritical
                    ? 'border-red-300 bg-red-50/40 ring-1 ring-red-200'
                    : isWarning
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                {/* 1. Header Line: ID, Severity, Status, Sync Readiness Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-neutral-900">
                      {alert.id}
                    </span>

                    {/* Severity Badge */}
                    <FieldBadge
                      variant={
                        isResolved
                          ? 'resolved'
                          : isCritical
                          ? 'critical'
                          : isWarning
                          ? 'high'
                          : 'neutral'
                      }
                    >
                      {isResolved ? 'Resolved' : alert.severity}
                    </FieldBadge>

                    {/* Status Badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isResolved
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : isAcknowledged
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                      }`}
                    >
                      {isResolved ? (
                        'Resolved'
                      ) : isAcknowledged ? (
                        <>
                          <Check className="h-3 w-3" />
                          <span>Acknowledged</span>
                        </>
                      ) : (
                        'Active'
                      )}
                    </span>
                  </div>

                  {/* Offline-First Readiness State Badge */}
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider ${
                      syncState === 'SYNCED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : syncState === 'PENDING SYNC'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : syncState === 'BLUETOOTH RECEIVED'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-neutral-100 text-neutral-700 border border-neutral-300'
                    }`}
                    title="Offline-first data and hardware sync state"
                  >
                    {syncState === 'BLUETOOTH RECEIVED' && (
                      <Bluetooth className="h-2.5 w-2.5 text-blue-600" />
                    )}
                    <span>{syncState}</span>
                  </span>
                </div>

                {/* 2. Short Title & Location */}
                <div>
                  <h2 className="text-sm font-bold text-neutral-950 sm:text-base">
                    {alert.title}
                  </h2>
                  <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-neutral-600">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                    <span>{alert.location}</span>
                  </p>
                </div>

                {/* 3. Concise Description */}
                <p className="text-xs leading-relaxed text-neutral-800">
                  {alert.description}
                </p>

                {/* 4. Affected Route / Vehicle / Delivery & Source Metadata */}
                <div className="rounded-xl border border-neutral-200/80 bg-white/80 p-2.5 text-xs space-y-1.5">
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 text-[11px]">
                    <div className="flex items-center gap-1.5 text-neutral-700">
                      <RouteIcon className="h-3 w-3 text-neutral-500 shrink-0" />
                      <span className="font-semibold text-neutral-500">Route:</span>
                      <span className="font-mono font-bold text-neutral-900">{alert.affectedCorridor}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-neutral-700">
                      <Truck className="h-3 w-3 text-neutral-500 shrink-0" />
                      <span className="font-semibold text-neutral-500">Vehicle:</span>
                      <span className="font-mono font-bold text-neutral-900">{alert.affectedVehicle}</span>
                    </div>

                    {alert.affectedDelivery ? (
                      <div className="flex items-center gap-1.5 text-neutral-700">
                        <Package className="h-3 w-3 text-neutral-500 shrink-0" />
                        <span className="font-semibold text-neutral-500">Cargo:</span>
                        <span className="font-semibold text-neutral-900 truncate">
                          {alert.affectedDelivery}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-neutral-500">
                        <Package className="h-3 w-3 text-neutral-400 shrink-0" />
                        <span>Cargo: N/A</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 text-[10px] text-neutral-500">
                    <span>
                      <strong className="text-neutral-600">Source:</strong> {alert.source}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="h-3 w-3 text-neutral-400" />
                      {alert.timestamp}
                    </span>
                  </div>
                </div>

                {/* 5. Contextual Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-neutral-200/60">
                  {/* VIEW MY ROUTE */}
                  <button
                    type="button"
                    onClick={onViewRoute}
                    className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-900 bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-black active:scale-[0.98]"
                  >
                    <RouteIcon className="h-3.5 w-3.5 text-emerald-400" />
                    <span>View My Route</span>
                    <ArrowRight className="h-3 w-3 text-neutral-300" />
                  </button>

                  {/* VIEW MY DELIVERY */}
                  {alert.deliveryId && (
                    <button
                      type="button"
                      onClick={onViewDelivery}
                      className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-neutral-800 shadow-2xs hover:bg-neutral-50 active:scale-[0.98]"
                    >
                      <Package className="h-3.5 w-3.5 text-neutral-600" />
                      <span>View My Delivery</span>
                      <ArrowRight className="h-3 w-3 text-neutral-400" />
                    </button>
                  )}

                  {/* VIEW INCIDENT (If linked to an incident record) */}
                  {alert.incidentId && onViewIncident && (
                    <button
                      type="button"
                      onClick={() => onViewIncident(alert.incidentId!)}
                      className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-neutral-300 bg-white px-3.5 py-2 text-xs font-bold text-neutral-800 shadow-2xs hover:bg-neutral-50 active:scale-[0.98]"
                    >
                      <ExternalLink className="h-3.5 w-3.5 text-neutral-600" />
                      <span>View Incident ({alert.incidentId})</span>
                    </button>
                  )}

                  {/* Acknowledge Toggle (Local interaction model supported by AlertStatus) */}
                  {!isResolved && (
                    <button
                      type="button"
                      onClick={() => handleToggleAcknowledge(alert.id)}
                      className={`flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ml-auto ${
                        isAcknowledged
                          ? 'border border-blue-300 bg-blue-50 text-blue-900'
                          : 'border border-neutral-200 bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      <Check className={`h-3.5 w-3.5 ${isAcknowledged ? 'text-blue-700' : 'text-neutral-500'}`} />
                      <span>{isAcknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
