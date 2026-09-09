import { useEffect } from 'react';
import { AlertTriangle, ImageOff, MapPin, X } from 'lucide-react';
import type { Incident } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { incidentStatusToBadgeVariant, severityToBadgeVariant } from '@/lib/badgeMappings';

interface IncidentDetailModalProps {
  incident: Incident;
  onClose: () => void;
}

const severityLabels: Record<Incident['severity'], string> = {
  low: 'Low',
  moderate: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-neutral-100 py-2.5 last:border-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{label}</span>
      <span className="text-sm font-medium text-neutral-800">{children}</span>
    </div>
  );
}

export function IncidentDetailModal({ incident, onClose }: IncidentDetailModalProps) {
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
      data-testid="modal-incident-detail"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="incident-detail-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 id="incident-detail-title" className="text-sm font-bold text-neutral-900">Incident Details</h2>
              <p className="text-[11px] text-neutral-500">Simulated event record</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close incident details"
            data-testid="button-close-incident-detail"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-2">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div>
              <p className="font-mono text-lg font-bold text-neutral-900" data-testid={`text-detail-incident-id-${incident.id}`}>
                {incident.id}
              </p>
              <p className="text-xs text-neutral-500">{incident.type}</p>
            </div>
            <Badge variant={incidentStatusToBadgeVariant(incident.status)}>{incident.status}</Badge>
          </div>

          <DetailRow label="Incident Type">{incident.type}</DetailRow>
          <DetailRow label="Location">
            <span className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
              {incident.location}
            </span>
          </DetailRow>
          <DetailRow label="Severity">
            <Badge variant={severityToBadgeVariant(incident.severity)}>
              {severityLabels[incident.severity]}
            </Badge>
          </DetailRow>
          <DetailRow label="Report Timestamp">{incident.timestamp}</DetailRow>
          <DetailRow label="Current Status">
            <Badge variant={incidentStatusToBadgeVariant(incident.status)}>{incident.status}</Badge>
          </DetailRow>

          <div className="border-b border-neutral-100 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-800">Description</p>
            <p className="mt-2 text-sm leading-6 text-neutral-700" data-testid={`text-description-${incident.id}`}>
              {incident.description}
            </p>
          </div>

          <div className="py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-800">Photo</p>
            {incident.photoName ? (
              <div className="mt-2 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 text-sm text-neutral-800">
                <p className="font-medium">{incident.photoName}</p>
                <p className="mt-1 text-xs text-neutral-400">Mock attachment — not uploaded</p>
              </div>
            ) : (
              <div
                className="mt-2 flex items-center gap-3 rounded-lg border border-dashed border-neutral-200 bg-neutral-50/50 px-3 py-4 text-sm text-neutral-400"
                data-testid={`empty-photo-${incident.id}`}
              >
                <ImageOff className="h-4 w-4 shrink-0 text-neutral-400" />
                <span>No photo available</span>
              </div>
            )}
          </div>
        </div>

        <p className="border-t border-neutral-100 px-5 py-3 text-xs text-neutral-400">
          Simulated incident data — demo environment
        </p>
      </div>
    </div>
  );
}