import type {
  OutboxRecord,
  TransportAdapter,
  ConnectivityStatus,
} from './types';
import {
  listPendingRecords,
  getOutboxRecords,
} from './offlineStorage';
import { bluetoothTransport } from './bluetoothTransport';

// ============================================================================
// TRANSPORT ADAPTER BOUNDARY (Extensible for Phase 2 Bluetooth & Central Backend)
// ============================================================================

/**
 * Internet Transport Adapter boundary.
 * Currently not implemented as no live central backend synchronization endpoint exists yet.
 */
export class InternetTransportAdapter implements TransportAdapter {
  readonly name = 'Central Logistics Cloud API';
  readonly type = 'internet' as const;

  async isAvailable(): Promise<boolean> {
    // Truthfully report false: No production backend endpoint connected yet
    return false;
  }

  async transmit(_record: OutboxRecord): Promise<{ success: boolean; error?: string }> {
    return {
      success: false,
      error: 'Backend API endpoint not configured. Record retained in offline outbox.',
    };
  }
}

// ============================================================================
// SYNC MANAGER
// ============================================================================

type SyncChangeCallback = (status: ConnectivityStatus) => void;

class SyncManager {
  private internetAdapter: TransportAdapter = new InternetTransportAdapter();
  private bluetoothAdapter: TransportAdapter = bluetoothTransport;
  private listeners: Set<SyncChangeCallback> = new Set();
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private isSyncing = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleNetworkOnline);
      window.addEventListener('offline', this.handleNetworkOffline);
    }
  }

  private handleNetworkOnline = () => {
    this.isOnline = true;
    this.notifyStatusChange();
    this.evaluateSyncAttempt();
  };

  private handleNetworkOffline = () => {
    this.isOnline = false;
    this.notifyStatusChange();
  };

  /**
   * Register listener for connectivity/sync status changes.
   */
  public subscribe(callback: SyncChangeCallback): () => void {
    this.listeners.add(callback);
    // Initial emission
    this.getStatus().then(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private async notifyStatusChange(): Promise<void> {
    const status = await this.getStatus();
    this.listeners.forEach((cb) => {
      try {
        cb(status);
      } catch {
        // Safe callback execution
      }
    });
  }

  /**
   * Evaluate connectivity and compute truthful user-facing status.
   */
  public async getStatus(): Promise<ConnectivityStatus> {
    const pendingRecords = await listPendingRecords();
    const pendingCount = pendingRecords.length;

    if (!this.isOnline) {
      return {
        state: 'OFFLINE',
        isOnline: false,
        pendingCount,
        message:
          pendingCount > 0
            ? `Offline • ${pendingCount} ${pendingCount === 1 ? 'report' : 'reports'} saved on device (Pending Sync)`
            : 'Offline • Reports saved on device',
      };
    }

    if (this.isSyncing) {
      return {
        state: 'SYNCING',
        isOnline: true,
        pendingCount,
        message: 'Syncing • Handshaking with local transport queue...',
      };
    }

    if (pendingCount > 0) {
      return {
        state: 'PENDING_SYNC',
        isOnline: true,
        pendingCount,
        message: `${pendingCount} ${pendingCount === 1 ? 'report' : 'reports'} waiting to sync (Saved on device)`,
      };
    }

    return {
      state: 'ONLINE',
      isOnline: true,
      pendingCount: 0,
      message: 'Connected • All operational reports synced',
    };
  }

  /**
   * Triggered upon reconnection or new report queueing.
   * Checks transport availability without faking server sync.
   */
  public async evaluateSyncAttempt(): Promise<void> {
    const pending = await listPendingRecords();
    if (pending.length === 0) return;

    this.isSyncing = true;
    await this.notifyStatusChange();

    // Check transport adapters (Internet, then Bluetooth)
    const internetReady = await this.internetAdapter.isAvailable();
    const bluetoothReady = await this.bluetoothAdapter.isAvailable();

    if (!internetReady && !bluetoothReady) {
      // Truthfully leave records in PENDING_SYNC state
      // Do NOT claim "Synced" and do NOT fake successful transmission
      this.isSyncing = false;
      await this.notifyStatusChange();
      return;
    }

    // When real transport is implemented in future, transmission will happen here
    this.isSyncing = false;
    await this.notifyStatusChange();
  }

  /**
   * Returns all pending records in the outbox.
   */
  public async getPendingOutbox(): Promise<OutboxRecord[]> {
    return listPendingRecords();
  }

  /**
   * Return entire outbox for inspection or developer verification.
   */
  public async getAllOutbox(): Promise<OutboxRecord[]> {
    return getOutboxRecords();
  }

  /**
   * Manually trigger sync evaluation.
   */
  public triggerSync(): Promise<void> {
    return this.evaluateSyncAttempt();
  }
}

export const syncManager = new SyncManager();
