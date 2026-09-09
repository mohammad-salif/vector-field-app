import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Camera, FileUp, MapPin, X } from 'lucide-react';
import type { Incident, IncidentType, Severity } from '@/types';
import { reportIncident } from '@/services/incidentService';

interface ReportIncidentModalProps {
  onClose: () => void;
  onSubmitted: (incident: Incident) => void;
}

const incidentTypes: IncidentType[] = [
  'Landslide',
  'Flood',
  'Road Damage',
  'Bridge Damage',
  'Other Accessibility Disruption',
];

const severityOptions: Array<{ value: Severity; label: string }> = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function ReportIncidentModal({ onClose, onSubmitted }: ReportIncidentModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [type, setType] = useState<IncidentType | ''>('');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<Severity>('moderate');
  const [description, setDescription] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!type || !location.trim() || !description.trim()) {
      setFormError('Complete the incident type, location, and description before submitting.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);
    try {
      const incident = await reportIncident({
        type,
        location,
        severity,
        description,
        photoName: photoName || undefined,
      });
      onSubmitted(incident);
    } catch {
      setFormError('The mock report could not be created. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
      onClick={onClose}
      role="presentation"
      data-testid="modal-report-incident"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-incident-title"
        className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-neutral-100 text-neutral-900 shadow-xs">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div>
              <h2 id="report-incident-title" className="text-sm font-bold text-neutral-900">Report Incident</h2>
              <p className="text-[11px] text-neutral-500">Log a simulated accessibility event</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report incident form"
            data-testid="button-close-report-incident"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
                Incident Type <span className="text-red-500">*</span>
              </span>
              <select
                value={type}
                onChange={(event) => setType(event.target.value as IncidentType)}
                required
                data-testid="select-report-incident-type"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-xs outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              >
                <option value="">Select type</option>
                {incidentTypes.map((incidentType) => (
                  <option key={incidentType} value={incidentType}>{incidentType}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Severity</span>
              <select
                value={severity}
                onChange={(event) => setSeverity(event.target.value as Severity)}
                data-testid="select-report-incident-severity"
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-xs outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
              >
                {severityOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Location <span className="text-red-500">*</span>
            </span>
            <input
              type="text"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. Corridor Delta — Mile 44"
              required
              data-testid="input-report-incident-location"
              className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-xs outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </label>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-neutral-700" />
              <div>
                <p className="text-sm font-medium text-neutral-900">Location / GPS</p>
                <p className="mt-1 text-xs leading-5 text-neutral-500">
                  GPS capture is unavailable in this demo. The location above is entered manually.
                </p>
              </div>
              <span className="ml-auto whitespace-nowrap rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-[10px] uppercase tracking-wider text-neutral-500">
                Placeholder
              </span>
            </div>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
              Description <span className="text-red-500">*</span>
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe the accessibility disruption..."
              required
              rows={4}
              data-testid="textarea-report-incident-description"
              className="w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm leading-5 text-neutral-900 shadow-xs outline-none placeholder:text-neutral-400 focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900"
            />
          </label>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-600">Photo</span>
            <div className="mt-1.5 flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50/50 px-3 py-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? '')}
                data-testid="input-report-incident-photo"
                className="sr-only"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                data-testid="button-choose-incident-photo"
                className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 shadow-xs transition-colors hover:border-neutral-300 hover:bg-neutral-50"
              >
                <Camera className="h-4 w-4" />
                Choose photo
              </button>
              {photoName ? (
                <span className="flex min-w-0 items-center gap-2 text-xs text-neutral-700">
                  <FileUp className="h-3.5 w-3.5 shrink-0 text-neutral-900" />
                  <span className="max-w-[220px] truncate">{photoName}</span>
                </span>
              ) : (
                <span className="text-xs text-neutral-400">Optional UI-only attachment</span>
              )}
            </div>
            <p className="mt-1.5 text-xs text-neutral-400">Files stay local to this demo and are never uploaded.</p>
          </div>

          {formError && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert" data-testid="status-report-incident-error">
              {formError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 border-t border-neutral-100 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              data-testid="button-cancel-report-incident"
              className="rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 shadow-xs transition-colors hover:border-neutral-300 hover:bg-neutral-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="button-submit-report-incident"
              className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Recording...' : 'Record incident'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}