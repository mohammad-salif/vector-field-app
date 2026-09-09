import type { SyncState, Incident, Alert } from '@/types';

export type { SyncState };

export type OutboxEntityType = 'incident' | 'status_update' | 'relayed_alert';

export interface OutboxRecord {
  localId: string;
  entityType: OutboxEntityType;
  payload: Incident | Alert | Record<string, unknown>;
  createdTimestamp: string;
  currentSyncState: SyncState;
  retryCount: number;
  lastAttemptTimestamp?: string;
  sourceDeviceId?: string;
  errorMessage?: string;
}

export type ConnectivityState =
  | 'ONLINE'
  | 'OFFLINE'
  | 'SYNCING'
  | 'PENDING_SYNC';

export interface ConnectivityStatus {
  state: ConnectivityState;
  isOnline: boolean;
  pendingCount: number;
  message: string;
  lastSyncTimestamp?: string;
}

export interface CachedOperationalData {
  userProfile: {
    id: string;
    name: string;
    unit: string;
    corridor: string;
    role: string;
  };
  assignedVehicleId: string;
  assignedDeliveryId: string;
  assignedRouteId: string;
  cachedAt: string;
}

// ============================================================================
// PHASE 2: BLUETOOTH STORE-AND-FORWARD SPECIFICATION
// ============================================================================

export type BluetoothMessageType =
  | 'INCIDENT_REPORT'
  | 'OPERATIONAL_ALERT';

export interface BluetoothEnvelope<T = unknown> {
  messageId: string;
  messageType: BluetoothMessageType;
  sourceDeviceId: string;
  sourceUserId?: string;
  createdAt: string;
  payload: T;
  protocolVersion: '1.0';
  hopCount: number;
  maxHops: number;
  ttlExpiresAt?: string;
  acknowledgementStatus?: 'PENDING' | 'ACKNOWLEDGED' | 'REJECTED';
}

export type BluetoothConnectionState =
  | 'Bluetooth unavailable'
  | 'Bluetooth available'
  | 'Scanning'
  | 'Device found'
  | 'Connecting'
  | 'Connected'
  | 'Disconnected'
  | 'Transfer in progress'
  | 'Transfer successful'
  | 'Transfer failed';

export interface BluetoothRuntimeCapability {
  isSupported: boolean;
  runtimeType: 'browser_web_bluetooth' | 'browser_unsupported' | 'native_hybrid_wrapper';
  hasCentralClient: boolean;
  hasPeripheralAdvertising: boolean;
  permissionState: 'available' | 'unavailable' | 'restricted_iframe';
  summary: string;
  requiresNativeAdapter: boolean;
}

export interface BluetoothDeviceDescriptor {
  id: string;
  name: string;
  connected: boolean;
  rssi?: number;
}

export interface ProcessedMessageRecord {
  messageId: string;
  messageType: BluetoothMessageType;
  receivedAt: string;
  sourceDeviceId: string;
  sourceUserId?: string;
  hopCount: number;
}

// Phase 2B.1 BLE Foundation Test and Handshake Types
export interface BleTestMessage {
  type: 'BLE_TEST';
  messageId: string;
  sourceDeviceId: string;
  createdAt: string;
  protocolVersion: '1.0';
  payload: {
    text: string;
  };
}

export interface BleAckMessage {
  type: 'ACK';
  messageId: string;
  status: 'RECEIVED';
  receiverDeviceId: string;
  timestamp: number;
}

export interface BleHelloMessage {
  type: 'HELLO';
  protocolVersion: '1.0';
  deviceId: string;
}

export interface BleHelloAckMessage {
  type: 'HELLO_ACK';
  protocolVersion: '1.0';
  deviceId: string;
}

export interface TransportAdapter {
  readonly name: string;
  readonly type: 'internet' | 'bluetooth';
  isAvailable(): Promise<boolean>;
  transmit(record: OutboxRecord): Promise<{ success: boolean; error?: string }>;
}
