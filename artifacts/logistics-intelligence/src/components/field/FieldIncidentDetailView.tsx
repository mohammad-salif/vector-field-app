import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  Crosshair,
  Camera,
  Route as RouteIcon,
  UserCheck,
} from 'lucide-react';
import type { Incident } from '@/types';
import { FieldBadge, type FieldBadgeVariant } from './FieldBadge';
import { incidentStatusToBadgeVariant, severityToBadgeVariant } from '@/lib/badgeMappings';

interface FieldIncidentDetailViewProps {
  incident: Incident;
  onBack: () => void;
}

export function FieldIncidentDetailView({
  incident,
  onBack,
}: FieldIncidentDetailViewProps) {
  const steps = [
    { key: 'Reported', label: 'Reported', desc: 'Incident logged by field unit' },
    { key: 'Under Review', label: 'Under Review', desc: 'Control room assessment underway' },
    { key: 'Resolved', label: 'Resolved', desc: 'Road cleared & verified' },
  ];

  const currentStepIndex =
    incident.status === 'Reported'
      ? 0
      : incident.status === 'Under Review'
      ? 1
      : 2;

  const statusVar = incidentStatusToBadgeVariant(incident.status);
  const severityVar = severityToBadgeVariant(incident.severity);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-neutral-200/90 pb-3 sm:gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to reports list"
          data-testid="button-incident-detail-back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 shadow-xs transition-colors hover:bg-neutral-100 hover:text-neutral-900 sm:h-8 sm:w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-neutral-900">{incident.id}</span>
          </div>
          <p className="truncate text-xs text-neutral-600">{incident.type}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-1.5">
          {incident.syncState === 'PENDING_SYNC' || incident.syncState === 'OFFLINE_LOCAL' ? (
            <span
              id="detail-sync-badge"
              className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-900"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Pending Sync</span>
            </span>
          ) : incident.syncState === 'FAILED' ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-900">
              <span>Sync Failed</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
              <span>Synced</span>
            </span>
          )}
          <FieldBadge variant={severityVar as FieldBadgeVariant}>
            {incident.severity}
          </FieldBadge>
          <FieldBadge variant={statusVar as FieldBadgeVariant}>
            {incident.status}
          </FieldBadge>
        </div>
      </div>

      {/* Lifecycle Progress Bar */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          Incident Lifecycle Progression
        </p>
        <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
          {steps.map((step, idx) => {
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div
                key={step.key}
                className={`flex flex-col items-center rounded-lg p-1.5 text-center transition-all sm:p-2 ${
                  isCurrent
                    ? 'border border-neutral-900 bg-neutral-100/90 text-neutral-900 shadow-xs'
                    : isCompleted
                    ? 'border border-neutral-200 bg-neutral-50 text-neutral-800'
                    : 'border border-transparent opacity-40 text-neutral-400'
                }`}
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold sm:h-6 sm:w-6 sm:text-xs ${
                    isCurrent
                      ? 'bg-neutral-900 text-white'
                      : isCompleted
                      ? 'bg-neutral-300 text-neutral-900'
                      : 'bg-neutral-100 text-neutral-400'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span className="mt-1 text-[10px] font-semibold leading-tight sm:mt-1.5 sm:text-[11px]">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Location & GPS Telemetry */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <MapPin className="h-4 w-4 text-neutral-700" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
            Location & Spatial Data
          </h2>
        </div>

        <div className="mt-3 space-y-2.5 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Physical Location</span>
            <p className="font-medium text-neutral-800 break-words">{incident.location}</p>
          </div>

          {(incident.latitude || incident.position) && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50/70 p-2.5">
              <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-neutral-600 font-semibold">
                <Crosshair className="h-3 w-3" />
                Coordinates
              </span>
              <p className="mt-1 font-mono text-xs text-neutral-800 break-all">
                {incident.latitude ? `${incident.latitude}° N, ${incident.longitude}° E` : `Grid: X ${incident.position.x}, Y ${incident.position.y}`}
                {incident.accuracyMeters ? ` (±${incident.accuracyMeters}m accuracy)` : ''}
              </p>
            </div>
          )}

          {incident.routeId && (
            <div>
              <span className="text-[10px] uppercase tracking-wider text-neutral-400">Associated Corridor</span>
              <p className="flex items-center gap-1.5 font-medium text-neutral-800">
                <RouteIcon className="h-3.5 w-3.5 text-neutral-700" />
                {incident.routeId}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <AlertTriangle className="h-4 w-4 text-neutral-700" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
            Field Observations & Description
          </h2>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-neutral-700 break-words">
          {incident.description}
        </p>
      </div>

      {/* Attached Photo */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-xs sm:p-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <Camera className="h-4 w-4 text-neutral-700" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
            Field Photography
          </h2>
        </div>

        {incident.photoDataUrl ? (
          <div className="mt-3 flex flex-col gap-2">
            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
              <img
                src={incident.photoDataUrl}
                alt="Field incident preview"
                className="max-h-72 w-full object-cover"
              />
            </div>
            {incident.photoName && (
              <p className="text-[11px] text-neutral-500 truncate">{incident.photoName}</p>
            )}
          </div>
        ) : incident.photoName ? (
          <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700">
            <p className="font-semibold truncate">{incident.photoName}</p>
            <p className="mt-1 text-[11px] text-neutral-500">
              Photo registered locally in demo session.
            </p>
          </div>
        ) : (
          <p className="mt-3 text-xs text-neutral-400 italic">
            No photograph attached to this incident report.
          </p>
        )}
      </div>

      {/* Audit & Reporting Identity */}
      <div className="rounded-xl border border-neutral-200/90 bg-white p-3.5 text-xs shadow-xs sm:p-4">
        <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
          <UserCheck className="h-4 w-4 text-neutral-700" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
            Reporting Official Record
          </h2>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Reported By</span>
            <p className="font-medium text-neutral-800">{incident.reportedBy || 'Officer V. Rawat (Field Unit 4)'}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Timestamp</span>
            <p className="font-medium text-neutral-800">{incident.timestamp}</p>
          </div>
        </div>

        {incident.syncState === 'PENDING_SYNC' || incident.syncState === 'OFFLINE_LOCAL' ? (
          <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50/80 p-2.5 text-[11px] text-amber-900">
            <p className="font-bold flex items-center gap-1.5 text-amber-950">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Sync Status: Offline — Saved Locally (Pending Sync)</span>
            </p>
            <p className="mt-1 leading-relaxed text-amber-800">
              This report is preserved in device storage (IndexedDB) and queued in the Outbox. It will synchronize with Central Dispatch when central connectivity becomes available.
            </p>
          </div>
        ) : (
          <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-[11px] text-neutral-700">
            <p>
              <strong className="text-neutral-900 font-semibold">Central Ops Status:</strong> Disruption is synchronized with Central Dispatch records and visible on Route Risk indices.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

