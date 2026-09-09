import { useState, useMemo } from 'react';
import {
  FileText,
  MapPin,
  Search,
  ChevronRight,
  PlusCircle,
  Crosshair,
  Camera,
  Bluetooth,
} from 'lucide-react';
import type { Incident, IncidentStatus } from '@/types';
import { FieldBadge, type FieldBadgeVariant } from './FieldBadge';
import { incidentStatusToBadgeVariant, severityToBadgeVariant } from '@/lib/badgeMappings';

interface FieldMyReportsViewProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onNewReport: () => void;
}

type StatusFilter = 'all' | 'pending_sync' | IncidentStatus;

export function FieldMyReportsView({
  incidents,
  onSelectIncident,
  onNewReport,
}: FieldMyReportsViewProps) {
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const filteredIncidents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return incidents.filter((incident) => {
      const matchesFilter =
        filter === 'all'
          ? true
          : filter === 'pending_sync'
          ? incident.syncState === 'PENDING_SYNC' || incident.syncState === 'OFFLINE_LOCAL'
          : incident.status === filter;
      const matchesSearch =
        !q ||
        incident.id.toLowerCase().includes(q) ||
        incident.type.toLowerCase().includes(q) ||
        incident.location.toLowerCase().includes(q) ||
        incident.description.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [incidents, filter, search]);

  const counts = useMemo(() => {
    return {
      all: incidents.length,
      pendingSync: incidents.filter(
        (i) => i.syncState === 'PENDING_SYNC' || i.syncState === 'OFFLINE_LOCAL',
      ).length,
      reported: incidents.filter((i) => i.status === 'Reported').length,
      underReview: incidents.filter((i) => i.status === 'Under Review').length,
      resolved: incidents.filter((i) => i.status === 'Resolved').length,
    };
  }, [incidents]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-200/90 pb-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-bold text-neutral-900">My Field Reports</h1>
          <p className="truncate text-xs text-neutral-500">
            Filed by Officer V. Rawat (Unit 4) • Corridor Delta
          </p>
        </div>
        <button
          type="button"
          onClick={onNewReport}
          data-testid="button-my-reports-new"
          className="flex min-h-[38px] shrink-0 items-center gap-1.5 rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-2 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-black active:scale-[0.98]"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>New Report</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs -mx-1 px-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          data-testid="filter-all"
          className={`flex min-h-[36px] shrink-0 items-center rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'bg-neutral-900 text-white font-bold shadow-xs'
              : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
          }`}
        >
          All ({counts.all})
        </button>
        {counts.pendingSync > 0 && (
          <button
            type="button"
            onClick={() => setFilter('pending_sync')}
            data-testid="filter-pending-sync"
            className={`flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
              filter === 'pending_sync'
                ? 'border border-amber-300 bg-amber-50 text-amber-900 font-bold shadow-xs ring-1 ring-amber-300'
                : 'border border-amber-200 bg-amber-50/60 text-amber-800 hover:bg-amber-100/70'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Pending Sync ({counts.pendingSync})</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setFilter('Reported')}
          data-testid="filter-reported"
          className={`flex min-h-[36px] shrink-0 items-center rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
            filter === 'Reported'
              ? 'border border-red-300 bg-red-50 text-red-800 font-bold'
              : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
          }`}
        >
          Reported ({counts.reported})
        </button>
        <button
          type="button"
          onClick={() => setFilter('Under Review')}
          data-testid="filter-under-review"
          className={`flex min-h-[36px] shrink-0 items-center rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
            filter === 'Under Review'
              ? 'border border-amber-300 bg-amber-50 text-amber-800 font-bold'
              : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
          }`}
        >
          Under Review ({counts.underReview})
        </button>
        <button
          type="button"
          onClick={() => setFilter('Resolved')}
          data-testid="filter-resolved"
          className={`flex min-h-[36px] shrink-0 items-center rounded-lg px-3 py-1.5 font-medium transition-colors whitespace-nowrap ${
            filter === 'Resolved'
              ? 'border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold'
              : 'border border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'
          }`}
        >
          Resolved ({counts.resolved})
        </button>
      </div>

      {/* Search Field */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by ID, route, location..."
          data-testid="input-my-reports-search"
          className="w-full min-h-[42px] rounded-xl border border-neutral-200 bg-white py-2.5 pl-9 pr-3 text-xs text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900 shadow-xs"
        />
        <Search className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 text-neutral-400" />
      </div>

      {/* Incident Reports List */}
      {filteredIncidents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-500 shadow-xs">
          <FileText className="h-8 w-8 text-neutral-400 mb-2" />
          <p className="text-sm font-semibold text-neutral-800">No reports found</p>
          <p className="mt-1 text-xs text-neutral-500">
            {search ? 'Try adjusting your search criteria.' : 'No incident reports logged in this filter.'}
          </p>
          <button
            type="button"
            onClick={onNewReport}
            className="mt-4 flex min-h-[40px] items-center rounded-lg border border-neutral-900 bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-black"
          >
            Create a New Report
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {filteredIncidents.map((incident) => {
            const statusVar = incidentStatusToBadgeVariant(incident.status);
            const severityVar = severityToBadgeVariant(incident.severity);
            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident.id)}
                data-testid={`card-my-report-${incident.id}`}
                className="flex cursor-pointer flex-col gap-2 rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs transition-all hover:border-neutral-300 hover:shadow-sm active:scale-[0.99] sm:p-4"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold text-neutral-900">{incident.id}</span>
                    {incident.syncState === 'PENDING_SYNC' || incident.syncState === 'OFFLINE_LOCAL' ? (
                      <span
                        data-testid={`badge-pending-sync-${incident.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-900"
                        title="Report saved on device, queued for sync"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span>Pending Sync</span>
                      </span>
                    ) : incident.syncState === 'BLUETOOTH_RELAYED' ? (
                      <span
                        data-testid={`badge-bt-relayed-${incident.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-purple-300 bg-purple-50 px-2 py-0.5 text-[9px] font-bold text-purple-900"
                        title="Relayed to nearby peer via Bluetooth"
                      >
                        <Bluetooth className="h-2.5 w-2.5 text-purple-600" />
                        <span>Bluetooth Relayed</span>
                      </span>
                    ) : incident.syncState === 'BLUETOOTH_RECEIVED' ? (
                      <span
                        data-testid={`badge-bt-received-${incident.id}`}
                        className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-900"
                        title="Received via Bluetooth relay from peer"
                      >
                        <Bluetooth className="h-2.5 w-2.5 text-blue-600" />
                        <span>Bluetooth Received</span>
                      </span>
                    ) : incident.syncState === 'FAILED' ? (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-[9px] font-bold text-red-900"
                      >
                        <span>Sync Failed</span>
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-[9px] font-semibold text-neutral-600"
                      >
                        <span>Synced</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <FieldBadge variant={severityVar as FieldBadgeVariant}>
                      {incident.severity}
                    </FieldBadge>
                    <FieldBadge variant={statusVar as FieldBadgeVariant}>
                      {incident.status}
                    </FieldBadge>
                  </div>
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-neutral-900">{incident.type}</h2>
                  <span className="text-[11px] text-neutral-400">{incident.timestamp}</span>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-neutral-700">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                  <span className="truncate">{incident.location}</span>
                </div>

                <p className="line-clamp-2 text-xs text-neutral-600 leading-relaxed">
                  {incident.description}
                </p>

                <div className="flex items-center justify-between border-t border-neutral-100 pt-2 text-[11px] text-neutral-500">
                  <div className="flex items-center gap-2">
                    {(incident.latitude || incident.position) && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-700">
                        <Crosshair className="h-3 w-3" />
                        GPS
                      </span>
                    )}
                    {(incident.photoName || incident.photoDataUrl) && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-600">
                        <Camera className="h-3 w-3" />
                        Photo
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-neutral-900 hover:text-black">
                    View details
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-700" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

