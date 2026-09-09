import { ArrowRight, MapPin } from 'lucide-react';
import type { Incident } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { incidentStatusToBadgeVariant, severityToBadgeVariant } from '@/lib/badgeMappings';

interface IncidentTableProps {
  incidents: Incident[];
  onSelect: (incident: Incident) => void;
}

const severityLabels: Record<Incident['severity'], string> = {
  low: 'Low',
  moderate: 'Medium',
  high: 'High',
  critical: 'Critical',
};

function IncidentBadges({ incident }: { incident: Incident }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={severityToBadgeVariant(incident.severity)}>
        {severityLabels[incident.severity]}
      </Badge>
      <Badge variant={incidentStatusToBadgeVariant(incident.status)}>{incident.status}</Badge>
    </div>
  );
}

export function IncidentTable({ incidents, onSelect }: IncidentTableProps) {
  if (incidents.length === 0) {
    return (
      <div
        className="flex min-h-40 items-center justify-center rounded-xl border border-neutral-200 bg-white px-6 py-16 text-center shadow-xs"
        data-testid="empty-incidents"
      >
        <div>
          <p className="text-sm font-bold text-neutral-900">No incidents match the current view.</p>
          <p className="mt-1 text-xs text-neutral-500">Try a different filter or search term.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xs lg:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              <th className="px-4 py-3 font-medium">Incident ID</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Location</th>
              <th className="px-4 py-3 font-medium">Severity</th>
              <th className="px-4 py-3 font-medium">Report Time</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr
                key={incident.id}
                tabIndex={0}
                role="button"
                onClick={() => onSelect(incident)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(incident);
                  }
                }}
                aria-label={`View details for incident ${incident.id}`}
                data-testid={`row-incident-${incident.id}`}
                className="cursor-pointer border-b border-neutral-100 transition-colors last:border-0 hover:bg-neutral-50/80 focus-visible:bg-neutral-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-neutral-900"
              >
                <td className="px-4 py-3 font-mono font-bold text-neutral-900">{incident.id}</td>
                <td className="px-4 py-3 text-neutral-700">{incident.type}</td>
                <td className="max-w-[290px] px-4 py-3 text-neutral-600">
                  <span className="block truncate">{incident.location}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={severityToBadgeVariant(incident.severity)}>
                    {severityLabels[incident.severity]}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-neutral-400">{incident.timestamp}</td>
                <td className="px-4 py-3">
                  <Badge variant={incidentStatusToBadgeVariant(incident.status)}>{incident.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 lg:hidden">
        {incidents.map((incident) => (
          <button
            key={incident.id}
            type="button"
            onClick={() => onSelect(incident)}
            data-testid={`card-incident-${incident.id}`}
            className="rounded-xl border border-neutral-200 bg-white p-4 text-left shadow-xs transition-colors hover:border-neutral-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-mono font-bold text-neutral-900">{incident.id}</p>
                <p className="mt-1 text-sm text-neutral-700">{incident.type}</p>
              </div>
              <Badge variant={severityToBadgeVariant(incident.severity)}>
                {severityLabels[incident.severity]}
              </Badge>
            </div>
            <div className="mt-3 flex items-start gap-2 text-sm text-neutral-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-400" />
              <span>{incident.location}</span>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <span className="text-neutral-400">Reported {incident.timestamp}</span>
              <span className="flex items-center gap-1.5 font-medium text-neutral-700">
                {incident.status}
                <ArrowRight className="h-3.5 w-3.5 text-neutral-400" />
              </span>
            </div>
          </button>
        ))}
      </div>
    </>
  );
}