import type { Incident, Alert } from '@/types';
import type { OutboxRecord, SyncState, ProcessedMessageRecord } from './types';

const DB_NAME = 'LogisticsFieldOfflineDB';
const DB_VERSION = 2;

const STORE_CACHE = 'operational_cache';
const STORE_INCIDENTS = 'local_incidents';
const STORE_OUTBOX = 'outbox';
const STORE_PROCESSED_MESSAGES = 'processed_messages';
const STORE_RELAYED_ALERTS = 'relayed_alerts';

// Fallback in-memory / localStorage prefix
const STORAGE_PREFIX = 'field_offline_';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase | null> | null = null;
let indexedDBAvailable = typeof window !== 'undefined' && 'indexedDB' in window;

/**
 * Initialize or retrieve the browser-native IndexedDB connection.
 */
export async function getOfflineDB(): Promise<IDBDatabase | null> {
  if (!indexedDBAvailable) return null;
  if (dbInstance) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_CACHE)) {
          db.createObjectStore(STORE_CACHE, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORE_INCIDENTS)) {
          db.createObjectStore(STORE_INCIDENTS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORE_OUTBOX)) {
          db.createObjectStore(STORE_OUTBOX, { keyPath: 'localId' });
        }
        if (!db.objectStoreNames.contains(STORE_PROCESSED_MESSAGES)) {
          db.createObjectStore(STORE_PROCESSED_MESSAGES, { keyPath: 'messageId' });
        }
        if (!db.objectStoreNames.contains(STORE_RELAYED_ALERTS)) {
          db.createObjectStore(STORE_RELAYED_ALERTS, { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        dbInstance = (event.target as IDBOpenDBRequest).result;
        resolve(dbInstance);
      };

      request.onerror = () => {
        // Fallback to localStorage gracefully
        indexedDBAvailable = false;
        resolve(null);
      };
    } catch {
      indexedDBAvailable = false;
      resolve(null);
    }
  });

  return dbInitPromise;
}

// ============================================================================
// 1. OPERATIONAL CACHE (Profile, Vehicle, Delivery, Route, Risk, Alerts)
// ============================================================================

export async function saveOperationalCache<T>(key: string, data: T): Promise<void> {
  const payload = { key, data, updatedAt: new Date().toISOString() };
  const db = await getOfflineDB();

  if (db) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_CACHE, 'readwrite');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.put(payload);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback: localStorage
  try {
    localStorage.setItem(`${STORAGE_PREFIX}cache_${key}`, JSON.stringify(payload));
  } catch {
    // Storage quota or restriction
  }
}

export async function getOperationalCache<T>(key: string): Promise<T | null> {
  const db = await getOfflineDB();

  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_CACHE, 'readonly');
        const store = tx.objectStore(STORE_CACHE);
        const req = store.get(key);
        req.onsuccess = () => {
          if (req.result && req.result.data !== undefined) {
            resolve(req.result.data as T);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  // Fallback: localStorage
  try {
    const item = localStorage.getItem(`${STORAGE_PREFIX}cache_${key}`);
    if (item) {
      const parsed = JSON.parse(item);
      return parsed.data as T;
    }
  } catch {
    // Ignore JSON errors
  }
  return null;
}

// ============================================================================
// 2. INCIDENT REPORTS (Persisting Offline-Created and Cached Incidents)
// ============================================================================

export async function saveIncidentReport(incident: Incident): Promise<void> {
  const db = await getOfflineDB();

  if (db) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_INCIDENTS, 'readwrite');
        const store = tx.objectStore(STORE_INCIDENTS);
        const req = store.put(incident);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback: localStorage
  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}incidents`);
    const list: Incident[] = existingStr ? JSON.parse(existingStr) : [];
    const index = list.findIndex((i) => i.id === incident.id);
    if (index >= 0) {
      list[index] = incident;
    } else {
      list.unshift(incident);
    }
    localStorage.setItem(`${STORAGE_PREFIX}incidents`, JSON.stringify(list));
  } catch {
    // Quota reached or unavailable
  }
}

export async function getIncidentReport(id: string): Promise<Incident | null> {
  const db = await getOfflineDB();

  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_INCIDENTS, 'readonly');
        const store = tx.objectStore(STORE_INCIDENTS);
        const req = store.get(id);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  // Fallback: localStorage
  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}incidents`);
    if (existingStr) {
      const list: Incident[] = JSON.parse(existingStr);
      return list.find((i) => i.id === id) || null;
    }
  } catch {
    // Ignore
  }
  return null;
}

export async function getAllIncidentReports(): Promise<Incident[]> {
  const db = await getOfflineDB();

  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_INCIDENTS, 'readonly');
        const store = tx.objectStore(STORE_INCIDENTS);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  // Fallback: localStorage
  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}incidents`);
    if (existingStr) {
      return JSON.parse(existingStr);
    }
  } catch {
    // Ignore
  }
  return [];
}

export async function deleteIncidentReport(id: string): Promise<void> {
  const db = await getOfflineDB();

  if (db) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_INCIDENTS, 'readwrite');
        const store = tx.objectStore(STORE_INCIDENTS);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback: localStorage
  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}incidents`);
    if (existingStr) {
      const list: Incident[] = JSON.parse(existingStr);
      const filtered = list.filter((i) => i.id !== id);
      localStorage.setItem(`${STORAGE_PREFIX}incidents`, JSON.stringify(filtered));
    }
  } catch {
    // Ignore
  }
}

// ============================================================================
// 3. OUTBOX QUEUE (Sync State, Queued Operations, Retry Metadata)
// ============================================================================

export async function queueOutboxRecord(record: OutboxRecord): Promise<void> {
  const db = await getOfflineDB();

  if (db) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_OUTBOX, 'readwrite');
        const store = tx.objectStore(STORE_OUTBOX);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback: localStorage
  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}outbox`);
    const list: OutboxRecord[] = existingStr ? JSON.parse(existingStr) : [];
    const index = list.findIndex((r) => r.localId === record.localId);
    if (index >= 0) {
      list[index] = record;
    } else {
      list.push(record);
    }
    localStorage.setItem(`${STORAGE_PREFIX}outbox`, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

export async function getOutboxRecords(): Promise<OutboxRecord[]> {
  const db = await getOfflineDB();

  if (db) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_OUTBOX, 'readonly');
        const store = tx.objectStore(STORE_OUTBOX);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  // Fallback: localStorage
  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}outbox`);
    if (existingStr) {
      return JSON.parse(existingStr);
    }
  } catch {
    // Ignore
  }
  return [];
}

export async function listPendingRecords(): Promise<OutboxRecord[]> {
  const all = await getOutboxRecords();
  return all.filter(
    (record) =>
      record.currentSyncState === 'PENDING_SYNC' ||
      record.currentSyncState === 'OFFLINE_LOCAL' ||
      record.currentSyncState === 'FAILED',
  );
}

export async function updateOutboxRecord(
  localId: string,
  updates: Partial<OutboxRecord>,
): Promise<void> {
  const all = await getOutboxRecords();
  const target = all.find((r) => r.localId === localId);
  if (!target) return;

  const updated: OutboxRecord = {
    ...target,
    ...updates,
  };

  await queueOutboxRecord(updated);
}

export async function updateOutboxRecordStatus(
  localId: string,
  status: OutboxRecord['currentSyncState'],
  errorMessage?: string,
): Promise<void> {
  await updateOutboxRecord(localId, {
    currentSyncState: status,
    ...(errorMessage !== undefined ? { errorMessage } : {}),
  });
}

export async function deleteOutboxRecord(localId: string): Promise<void> {
  const db = await getOfflineDB();

  if (db) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_OUTBOX, 'readwrite');
        const store = tx.objectStore(STORE_OUTBOX);
        const req = store.delete(localId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback: localStorage
  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}outbox`);
    if (existingStr) {
      const list: OutboxRecord[] = JSON.parse(existingStr);
      const filtered = list.filter((r) => r.localId !== localId);
      localStorage.setItem(`${STORAGE_PREFIX}outbox`, JSON.stringify(filtered));
    }
  } catch {
    // Ignore
  }
}

/**
 * Clear successfully synchronized records from the local outbox.
 */
export async function clearSyncedRecords(): Promise<void> {
  const all = await getOutboxRecords();
  const synced = all.filter((r) => r.currentSyncState === 'SYNCED');
  for (const item of synced) {
    await deleteOutboxRecord(item.localId);
  }
}

// ============================================================================
// PROCESSED MESSAGES (DEDUPLICATION & LOOP PREVENTION)
// ============================================================================

export async function isMessageProcessed(messageId: string): Promise<boolean> {
  const db = await getOfflineDB();
  if (db && db.objectStoreNames.contains(STORE_PROCESSED_MESSAGES)) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PROCESSED_MESSAGES, 'readonly');
        const store = tx.objectStore(STORE_PROCESSED_MESSAGES);
        const req = store.get(messageId);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
      } catch {
        resolve(false);
      }
    });
  }

  // Fallback: localStorage
  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}processed_msgs`);
    if (existingStr) {
      const list: ProcessedMessageRecord[] = JSON.parse(existingStr);
      return list.some((m) => m.messageId === messageId);
    }
  } catch {
    // Ignore
  }
  return false;
}

export async function saveProcessedMessage(record: ProcessedMessageRecord): Promise<void> {
  const db = await getOfflineDB();
  if (db && db.objectStoreNames.contains(STORE_PROCESSED_MESSAGES)) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_PROCESSED_MESSAGES, 'readwrite');
        const store = tx.objectStore(STORE_PROCESSED_MESSAGES);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  // Fallback: localStorage
  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}processed_msgs`);
    const list: ProcessedMessageRecord[] = existingStr ? JSON.parse(existingStr) : [];
    if (!list.some((m) => m.messageId === record.messageId)) {
      list.push(record);
      // Keep last 200 messages to prevent unbounded growth
      if (list.length > 200) list.splice(0, list.length - 200);
      localStorage.setItem(`${STORAGE_PREFIX}processed_msgs`, JSON.stringify(list));
    }
  } catch {
    // Ignore
  }
}

export async function getProcessedMessages(): Promise<ProcessedMessageRecord[]> {
  const db = await getOfflineDB();
  if (db && db.objectStoreNames.contains(STORE_PROCESSED_MESSAGES)) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_PROCESSED_MESSAGES, 'readonly');
        const store = tx.objectStore(STORE_PROCESSED_MESSAGES);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as ProcessedMessageRecord[]) || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}processed_msgs`);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch {
    return [];
  }
}

// ============================================================================
// RELAYED ALERTS (OFFLINE PERSISTENCE FOR BLUETOOTH RECEIVED ALERTS)
// ============================================================================

export async function saveRelayedAlert(alert: Alert): Promise<void> {
  const db = await getOfflineDB();
  if (db && db.objectStoreNames.contains(STORE_RELAYED_ALERTS)) {
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(STORE_RELAYED_ALERTS, 'readwrite');
        const store = tx.objectStore(STORE_RELAYED_ALERTS);
        const req = store.put(alert);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      } catch (err) {
        reject(err);
      }
    });
  }

  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}relayed_alerts`);
    const list: Alert[] = existingStr ? JSON.parse(existingStr) : [];
    const idx = list.findIndex((a) => a.id === alert.id);
    if (idx >= 0) {
      list[idx] = alert;
    } else {
      list.push(alert);
    }
    localStorage.setItem(`${STORAGE_PREFIX}relayed_alerts`, JSON.stringify(list));
  } catch {
    // Ignore
  }
}

export async function getRelayedAlerts(): Promise<Alert[]> {
  const db = await getOfflineDB();
  if (db && db.objectStoreNames.contains(STORE_RELAYED_ALERTS)) {
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_RELAYED_ALERTS, 'readonly');
        const store = tx.objectStore(STORE_RELAYED_ALERTS);
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result as Alert[]) || []);
        req.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  try {
    const existingStr = localStorage.getItem(`${STORAGE_PREFIX}relayed_alerts`);
    return existingStr ? JSON.parse(existingStr) : [];
  } catch {
    return [];
  }
}
