import { useState, useRef, useEffect } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Camera,
  Crosshair,
  FileUp,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Route as RouteIcon,
  Trash2,
  CheckCircle2,
  Info,
  WifiOff,
} from 'lucide-react';
import type { Incident, IncidentType, Severity } from '@/types';
import { reportIncident } from '@/services/incidentService';
import { getRoutes } from '@/services/mapService';
import { syncManager } from '@/services/offline';

interface FieldReportIncidentViewProps {
  onBack: () => void;
  onSubmitted: (incident: Incident) => void;
}

const incidentTypes: IncidentType[] = [
  'Road Blockage',
  'Landslide',
  'Flood',
  'Accident',
  'Road Damage',
  'Vehicle Issue',
  'Bridge Damage',
  'Other Field Incident',
];

const severityOptions: Array<{ value: Severity; label: string; description: string; selectedColor: string }> = [
  { value: 'low', label: 'Low', description: 'Minor slowdown, passable', selectedColor: 'border-emerald-300 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/50' },
  { value: 'moderate', label: 'Medium', description: 'Partial disruption, single lane', selectedColor: 'border-amber-300 bg-amber-50 text-amber-800 ring-2 ring-amber-400/50' },
  { value: 'high', label: 'High', description: 'Severe obstruction, heavy delay', selectedColor: 'border-orange-300 bg-orange-50 text-orange-800 ring-2 ring-orange-400/50' },
  { value: 'critical', label: 'Critical', description: 'Total blockage / Structural collapse', selectedColor: 'border-red-300 bg-red-50 text-red-800 ring-2 ring-red-400/50' },
];

export function FieldReportIncidentView({
  onBack,
  onSubmitted,
}: FieldReportIncidentViewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const availableRoutes = getRoutes();

  const [type, setType] = useState<IncidentType | ''>('');
  const [routeId, setRouteId] = useState<string>('RTE-104');
  const [location, setLocation] = useState('');
  const [severity, setSeverity] = useState<Severity>('moderate');
  const [description, setDescription] = useState('');
  const [photoName, setPhotoName] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // GPS State
  const [isLocating, setIsLocating] = useState(false);
  const [gpsCoordinates, setGpsCoordinates] = useState<{
    latitude: number;
    longitude: number;
    accuracyMeters?: number;
  } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showCoordinatesEditor, setShowCoordinatesEditor] = useState(false);

  // Form State
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const unsub = syncManager.subscribe((status) => {
      setIsOnline(status.isOnline);
    });
    return () => {
      unsub();
    };
  }, []);

  // Browser Geolocation Trigger (Non-blocking)
  function handleCaptureGps() {
    setGpsError(null);

    if (!('geolocation' in navigator)) {
      setGpsError('Browser geolocation is not supported on this device. Please enter the location manually.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        const accuracy = Math.round(position.coords.accuracy);

        setGpsCoordinates({
          latitude: lat,
          longitude: lng,
          accuracyMeters: accuracy,
        });
        setIsLocating(false);

        // Pre-fill location text if empty
        if (!location.trim()) {
          setLocation(`Field GPS: ${lat}, ${lng} (±${accuracy}m)`);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('GPS permission was denied. You can continue reporting by entering the location manually below.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setGpsError('Satellite signal unavailable. Please provide manual landmark or mile-marker details.');
        } else {
          setGpsError('GPS lookup timed out. Please enter the location manually.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      },
    );
  }

  // Handle Photo Selection
  function handlePhotoSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setPhotoName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleRemovePhoto() {
    setPhotoName('');
    setPhotoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!type) {
      setFormError('Please select the incident or disruption type.');
      return;
    }
    if (!location.trim()) {
      setFormError('Please specify the location or landmark description.');
      return;
    }
    if (!description.trim()) {
      setFormError('Please provide a brief description of the disruption.');
      return;
    }

    setFormError('');
    setIsSubmitting(true);

    try {
      const newIncident = await reportIncident({
        type,
        location: location.trim(),
        severity,
        description: description.trim(),
        photoName: photoName || undefined,
        photoDataUrl: photoPreview || undefined,
        latitude: gpsCoordinates?.latitude,
        longitude: gpsCoordinates?.longitude,
        accuracyMeters: gpsCoordinates?.accuracyMeters,
        routeId: routeId || undefined,
        reportedBy: 'Officer V. Rawat (Field Unit 4)',
      });

      setIsSubmitting(false);
      onSubmitted(newIncident);
    } catch {
      setFormError('Failed to record the incident. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Header */}
      <div className="flex items-center gap-3 border-b border-neutral-200/90 pb-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Field Home"
          data-testid="button-field-report-back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-neutral-300 bg-white text-neutral-700 shadow-xs transition-colors hover:bg-neutral-100 hover:text-neutral-900 sm:h-8 sm:w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-bold text-neutral-900">Report Road Disruption</h1>
          <p className="text-xs text-neutral-500">Official field incident submission</p>
        </div>
      </div>

      {/* Offline Reporting Readiness Notice */}
      <div
        id="report-incident-offline-notice"
        className={`rounded-xl border p-3 text-xs ${
          isOnline
            ? 'border-neutral-200 bg-neutral-50/80 text-neutral-700'
            : 'border-amber-300 bg-amber-50/90 text-amber-900'
        }`}
      >
        <div className="flex items-start gap-2">
          {isOnline ? (
            <Info className="h-4 w-4 text-neutral-500 shrink-0 mt-0.5" />
          ) : (
            <WifiOff className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0 flex-1 text-[11px] leading-relaxed">
            {isOnline ? (
              <p>
                <strong className="text-neutral-950 font-bold">Offline-Ready Storage:</strong> Incidents are securely saved to local browser storage (IndexedDB) and queued in your device outbox.
              </p>
            ) : (
              <p>
                <strong className="text-amber-950 font-bold">Operating Offline:</strong> Your report will be safely saved on this device and marked <span className="font-bold underline">Pending Sync</span>. It will be preserved across restarts and queued for synchronization.
              </p>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 sm:gap-5">
        {/* 1. Incident Type */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
            Disruption Type <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {incidentTypes.map((incidentType) => {
              const isSelected = type === incidentType;
              return (
                <button
                  key={incidentType}
                  type="button"
                  onClick={() => setType(incidentType)}
                  data-testid={`button-select-type-${incidentType.toLowerCase().replace(/\s+/g, '-')}`}
                  className={`flex min-h-[68px] flex-col items-start justify-between rounded-xl border p-2.5 text-left transition-all active:scale-[0.98] sm:p-3 ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-900 text-white shadow-xs'
                      : 'border-neutral-200 bg-white text-neutral-800 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-xs font-bold leading-tight">{incidentType}</span>
                  <span className={`mt-1 text-[10px] ${isSelected ? 'text-neutral-300' : 'text-neutral-400'}`}>
                    {isSelected ? 'Selected' : 'Tap to select'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Corridor Correlation */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
            Affected Corridor / Route <span className="text-[11px] font-normal text-neutral-500">(Optional)</span>
          </label>
          <div className="relative">
            <select
              value={routeId}
              onChange={(e) => setRouteId(e.target.value)}
              data-testid="select-field-corridor"
              className="w-full min-h-[44px] appearance-none rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 pr-9 text-sm text-neutral-900 shadow-xs outline-none focus:border-neutral-900"
            >
              <option value="">Select known corridor (or leave unassigned)</option>
              {availableRoutes.map((route) => (
                <option key={route.id} value={route.id}>
                  {route.label} ({route.origin} → {route.destination})
                </option>
              ))}
            </select>
            <RouteIcon className="pointer-events-none absolute right-3.5 top-3.5 h-4 w-4 text-neutral-500" />
          </div>
        </div>

        {/* 3. Location & GPS */}
        <div className="space-y-2.5 rounded-xl border border-neutral-200/90 bg-white p-3 sm:p-3.5 shadow-xs">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
              Location & Coordinates <span className="text-red-600">*</span>
            </label>
            <button
              type="button"
              onClick={handleCaptureGps}
              disabled={isLocating}
              data-testid="button-capture-gps"
              className="flex min-h-[36px] w-full items-center justify-center gap-1.5 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs font-semibold text-neutral-800 shadow-xs transition-colors hover:bg-neutral-100 disabled:opacity-60 sm:w-auto"
            >
              {isLocating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-neutral-700" />
              ) : (
                <Crosshair className="h-3.5 w-3.5 text-neutral-700" />
              )}
              {isLocating ? 'Acquiring...' : 'Use Current GPS'}
            </button>
          </div>

          {/* GPS Success Pill */}
          {gpsCoordinates && (
            <div className="flex flex-col gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800 sm:flex-row sm:items-center sm:justify-between sm:px-3 sm:py-2">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
                <span className="break-all">
                  GPS Fix: <strong>{gpsCoordinates.latitude}° N, {gpsCoordinates.longitude}° E</strong>
                  {gpsCoordinates.accuracyMeters ? ` (±${gpsCoordinates.accuracyMeters}m)` : ''}
                </span>
              </span>
              <button
                type="button"
                onClick={() => setShowCoordinatesEditor(!showCoordinatesEditor)}
                className="self-end underline text-[11px] font-semibold text-emerald-900 hover:text-black sm:self-auto"
              >
                {showCoordinatesEditor ? 'Hide Details' : 'View'}
              </button>
            </div>
          )}

          {/* GPS Non-blocking error / fallback note */}
          {gpsError && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-800" role="alert">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 text-amber-700 mt-0.5" />
                <p>{gpsError}</p>
              </div>
            </div>
          )}

          {/* Manual Location Text Input */}
          <div className="space-y-1">
            <span className="text-[11px] text-neutral-500">
              Physical Location / Landmark Description
            </span>
            <div className="relative">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Corridor Delta — Mile 42, 2km north of South Bridge"
                required
                data-testid="input-field-location"
                className="w-full min-h-[44px] rounded-lg border border-neutral-200 bg-neutral-50/70 py-2.5 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900 focus:bg-white"
              />
              <MapPin className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-neutral-400" />
            </div>
          </div>

          {/* Coordinates Review / Edit Toggle */}
          {showCoordinatesEditor && gpsCoordinates && (
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Latitude</span>
                <input
                  type="number"
                  step="any"
                  value={gpsCoordinates.latitude}
                  onChange={(e) =>
                    setGpsCoordinates({
                      ...gpsCoordinates,
                      latitude: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full min-h-[36px] rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-neutral-500">Longitude</span>
                <input
                  type="number"
                  step="any"
                  value={gpsCoordinates.longitude}
                  onChange={(e) =>
                    setGpsCoordinates({
                      ...gpsCoordinates,
                      longitude: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full min-h-[36px] rounded border border-neutral-300 bg-white px-2 py-1 text-xs text-neutral-900"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. Severity Assessment */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
            Severity Level <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {severityOptions.map((option) => {
              const isSelected = severity === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSeverity(option.value)}
                  data-testid={`button-severity-${option.value}`}
                  className={`flex min-h-[64px] flex-col items-start rounded-xl border p-2.5 text-left transition-all active:scale-[0.98] ${
                    isSelected
                      ? option.selectedColor
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  <span className="text-xs font-bold">{option.label}</span>
                  <span className="mt-1 text-[10px] leading-tight opacity-85">{option.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Field Observations Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
            Field Observations & Description <span className="text-red-600">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Specify extent of blockage, estimated clearance requirements, or equipment needed..."
            required
            data-testid="textarea-field-description"
            className="w-full min-h-[96px] resize-y rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900 shadow-xs"
          />
        </div>

        {/* 6. Photo Selection */}
        <div className="space-y-2 rounded-xl border border-neutral-200/90 bg-white p-3 sm:p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-800">
              Field Photograph <span className="text-[11px] font-normal text-neutral-500">(Optional)</span>
            </label>
            <span className="text-[10px] uppercase tracking-wider text-neutral-400">Local Attachment</span>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoSelected}
            className="sr-only"
            data-testid="input-field-photo-file"
          />

          {photoPreview ? (
            <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-2.5">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-neutral-100">
                <img
                  src={photoPreview}
                  alt="Incident snapshot"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  aria-label="Remove photo"
                  className="absolute right-2 top-2 rounded-md bg-neutral-900/80 p-1.5 text-white hover:bg-black"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p className="truncate text-xs text-neutral-600">{photoName}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              data-testid="button-choose-field-photo"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 py-3 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-400 hover:bg-neutral-100"
            >
              <Camera className="h-4 w-4 text-neutral-700" />
              Capture or Select Photo
            </button>
          )}

          <p className="text-[11px] leading-relaxed text-neutral-500">
            Honesty Notice: Photos are loaded locally into browser session memory. No remote cloud storage is active in Phase 1.
          </p>
        </div>

        {/* Validation error */}
        {formError && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700 font-medium" role="alert">
            {formError}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="button-submit-field-report"
            className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl border border-neutral-900 bg-neutral-900 px-5 py-3.5 text-sm font-bold text-white shadow-xs transition-transform active:scale-[0.98] hover:bg-black disabled:opacity-60 sm:order-2 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Recording...</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Submit Incident Report</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onBack}
            data-testid="button-cancel-field-report"
            className="flex min-h-[44px] w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm font-semibold text-neutral-700 shadow-xs transition-colors hover:bg-neutral-100 hover:text-neutral-900 sm:order-1 sm:w-auto"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
