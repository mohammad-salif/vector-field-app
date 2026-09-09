import { mockIncidents } from '@/data/mockData';
import type { Incident, IncidentType, Severity } from '@/types';
import {
  saveIncidentReport,
  getAllIncidentReports,
  queueOutboxRecord,
} from './offline/offlineStorage';
import { syncManager } from './offline/syncManager';
import { getDeviceId } from './offline/deviceIdentity';

export interface ReportIncidentInput {
  type: IncidentType;
  location: string;
  severity: Severity;
  description: string;
  photoName?: string;
  photoDataUrl?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  routeId?: string;
  reportedBy?: string;
}

let nextIncidentNumber =
  Math.max(
    ...mockIncidents.map((incident) => Number(incident.id.replace('INC-', ''))),
  ) + 1;

// Initialize mock incidents marked as SYNCED
const initializedMockIncidents: Incident[] = mockIncidents.map((inc) => ({
  ...inc,
  syncState: inc.syncState || 'SYNCED',
}));

// In-memory reactive store
let activeIncidents: Incident[] = [...initializedMockIncidents];

// Asynchronously hydrate from persistent offline storage (IndexedDB / localStorage)
let isHydrated = false;
export async function hydrateOfflineIncidents(): Promise<Incident[]> {
  if (isHydrated) return activeIncidents;

  try {
    const savedLocalIncidents = await getAllIncidentReports();
    if (savedLocalIncidents && savedLocalIncidents.length > 0) {
      // Merge saved local incidents into active store without duplicates
      const existingIds = new Set(activeIncidents.map((i) => i.id));
      const newItems: Incident[] = [];

      for (const item of savedLocalIncidents) {
        if (!existingIds.has(item.id)) {
          newItems.push(item);
          existingIds.add(item.id);
        } else {
          // Update in-memory copy with stored version (e.g. sync state updates)
          const idx = activeIncidents.findIndex((i) => i.id === item.id);
          if (idx >= 0) {
            activeIncidents[idx] = { ...activeIncidents[idx], ...item };
          }
        }
      }

      activeIncidents = [...newItems, ...activeIncidents];
    }
    isHydrated = true;
  } catch {
    // If hydration fails, fallback to active memory
  }

  return activeIncidents;
}

// Auto-trigger hydration on module load in browser
if (typeof window !== 'undefined') {
  hydrateOfflineIncidents();
}

/**
 * Returns all incidents currently in the service store.
 */
export function getAllIncidents(): Incident[] {
  return [...activeIncidents];
}

/**
 * Returns a single incident by ID.
 */
export function getIncidentById(id: string): Incident | undefined {
  return activeIncidents.find((incident) => incident.id === id);
}

/**
 * Offline-first incident reporting implementation.
 * Validates, creates the incident, persists to IndexedDB, and queues to Outbox.
 * Explicitly marks record as PENDING_SYNC.
 */
export async function reportIncident(
  input: ReportIncidentInput,
): Promise<Incident> {
  const localId = `INC-${nextIncidentNumber++}`;
  const outboxId = `OUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const incident: Incident = {
    id: localId,
    type: input.type,
    location: input.location.trim(),
    severity: input.severity,
    status: 'Reported',
    timestamp: 'Just now',
    position: { x: 500, y: 300 },
    description: input.description.trim(),
    photoName: input.photoName,
    photoDataUrl: input.photoDataUrl,
    latitude: input.latitude,
    longitude: input.longitude,
    accuracyMeters: input.accuracyMeters,
    routeId: input.routeId,
    reportedBy: input.reportedBy || 'Officer V. Rawat (Field Unit 4)',
    // Offline State Model: PENDING_SYNC (or OFFLINE_LOCAL when disconnected)
    syncState: isOnline ? 'PENDING_SYNC' : 'OFFLINE_LOCAL',
    localOnly: true,
    outboxId,
  };

  // 1. Update in-memory reactive list
  activeIncidents = [incident, ...activeIncidents];

  // 2. Persist locally to IndexedDB
  await saveIncidentReport(incident);

  // 3. Queue into persistent Outbox
  await queueOutboxRecord({
    localId: outboxId,
    entityType: 'incident',
    payload: incident,
    createdTimestamp: new Date().toISOString(),
    currentSyncState: 'PENDING_SYNC',
    retryCount: 0,
    sourceDeviceId: getDeviceId(),
  });

  // 4. Notify sync manager to evaluate transport
  syncManager.evaluateSyncAttempt();

  return incident;
}