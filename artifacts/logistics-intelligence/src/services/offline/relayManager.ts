/**
 * STORE-AND-FORWARD RELAY MANAGER (PHASE 2)
 * 
 * Handles:
 * - Message validation, loop prevention (hopCount < maxHops)
 * - Deduplication via persistent processed_messages store
 * - Receiving incident reports and operational alerts over Bluetooth
 * - Relaying pending outbox records to connected Bluetooth peers
 * - Maintaining truthful syncState without claiming central server sync
 */

import type { Incident, Alert } from '@/types';
import type {
  BluetoothEnvelope,
  OutboxRecord,
  ProcessedMessageRecord,
} from './types';
import {
  saveIncidentReport,
  getOutboxRecords,
  updateOutboxRecordStatus,
  isMessageProcessed,
  saveProcessedMessage,
  saveRelayedAlert,
  queueOutboxRecord,
} from './offlineStorage';
import { bluetoothTransport } from './bluetoothTransport';
import { getDeviceId } from './deviceIdentity';

export interface RelayResult {
  totalPending: number;
  relayedCount: number;
  failedCount: number;
  details: string;
}

export interface EnvelopeValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates incoming Bluetooth message envelope structure and integrity.
 */
export function validateEnvelope(envelope: any): EnvelopeValidationResult {
  if (!envelope || typeof envelope !== 'object') {
    return { isValid: false, error: 'Malformed message: Envelope is not an object.' };
  }

  if (!envelope.messageId || typeof envelope.messageId !== 'string') {
    return { isValid: false, error: 'Missing or invalid messageId.' };
  }

  if (envelope.protocolVersion !== '1.0') {
    return { isValid: false, error: `Unsupported protocol version: ${envelope.protocolVersion}` };
  }

  if (!['INCIDENT_REPORT', 'OPERATIONAL_ALERT'].includes(envelope.messageType)) {
    return { isValid: false, error: `Unrecognized messageType: ${envelope.messageType}` };
  }

  if (!envelope.sourceDeviceId || typeof envelope.sourceDeviceId !== 'string') {
    return { isValid: false, error: 'Missing sourceDeviceId.' };
  }

  if (typeof envelope.hopCount !== 'number' || envelope.hopCount < 0) {
    return { isValid: false, error: 'Invalid hopCount.' };
  }

  if (typeof envelope.maxHops !== 'number' || envelope.maxHops <= 0) {
    return { isValid: false, error: 'Invalid maxHops.' };
  }

  // Prevent relay loops
  if (envelope.hopCount >= envelope.maxHops) {
    return { isValid: false, error: `Max hops exceeded (${envelope.hopCount}/${envelope.maxHops}). Loop prevented.` };
  }

  if (!envelope.payload) {
    return { isValid: false, error: 'Empty message payload.' };
  }

  return { isValid: true };
}

/**
 * STEP 5, 6, 7 & 8 — Receive and process an incoming message envelope from Bluetooth.
 * Adheres strictly to Store-and-Forward:
 * RECEIVE → VALIDATE → DEDUPLICATE → STORE LOCALLY → MARK RELAYABLE → FORWARD WHEN VALID TRANSPORT AVAILABLE
 */
export async function processIncomingEnvelope(
  envelope: BluetoothEnvelope
): Promise<{ accepted: boolean; duplicate?: boolean; reason?: string }> {
  // 1. Validate envelope integrity
  const validation = validateEnvelope(envelope);
  if (!validation.isValid) {
    return { accepted: false, reason: validation.error };
  }

  // 2. Deduplication check
  const alreadyProcessed = await isMessageProcessed(envelope.messageId);
  if (alreadyProcessed) {
    return {
      accepted: false,
      duplicate: true,
      reason: `Message ${envelope.messageId} already processed. Duplicate safely ignored.`,
    };
  }

  const myDeviceId = getDeviceId();
  // Loop prevention: do not process our own message if reflected back
  if (envelope.sourceDeviceId === myDeviceId) {
    return {
      accepted: false,
      duplicate: true,
      reason: 'Self-originated message ignored.',
    };
  }

  // 3. Process based on message type
  if (envelope.messageType === 'INCIDENT_REPORT') {
    const rawIncident = envelope.payload as Incident;
    if (!rawIncident || !rawIncident.id || !rawIncident.type) {
      return { accepted: false, reason: 'Invalid incident payload structure.' };
    }

    // Mark truthful sync state: BLUETOOTH_RECEIVED
    const receivedIncident: Incident = {
      ...rawIncident,
      syncState: 'BLUETOOTH_RECEIVED',
      reportedBy: rawIncident.reportedBy
        ? `${rawIncident.reportedBy} (Relayed via ${envelope.sourceDeviceId})`
        : `Relayed via Device ${envelope.sourceDeviceId}`,
    };

    // Store locally in IndexedDB (local_incidents)
    await saveIncidentReport(receivedIncident);

    // Queue in Outbox as PENDING_SYNC for store-and-forward when internet or next peer is reachable
    if (envelope.hopCount + 1 < envelope.maxHops) {
      await queueOutboxRecord({
        localId: `RELAY-${envelope.messageId}`,
        entityType: 'incident',
        payload: receivedIncident,
        createdTimestamp: new Date().toISOString(),
        currentSyncState: 'PENDING_SYNC',
        retryCount: 0,
        sourceDeviceId: envelope.sourceDeviceId,
      });
    }

    // Record as processed to guarantee idempotency
    const processedRecord: ProcessedMessageRecord = {
      messageId: envelope.messageId,
      messageType: 'INCIDENT_REPORT',
      receivedAt: new Date().toISOString(),
      sourceDeviceId: envelope.sourceDeviceId,
      sourceUserId: envelope.sourceUserId,
      hopCount: envelope.hopCount + 1,
    };
    await saveProcessedMessage(processedRecord);

    return {
      accepted: true,
      reason: `Incident ${receivedIncident.id} received via Bluetooth relay from ${envelope.sourceDeviceId} and stored locally.`,
    };
  }

  if (envelope.messageType === 'OPERATIONAL_ALERT') {
    const rawAlert = envelope.payload as Alert;
    if (!rawAlert || !rawAlert.id) {
      return { accepted: false, reason: 'Invalid alert payload structure.' };
    }

    const relayedAlert: Alert = {
      ...rawAlert,
      isRelayed: true,
      sourceDeviceId: envelope.sourceDeviceId,
      source: rawAlert.source
        ? `${rawAlert.source} (Relayed via Bluetooth ${envelope.sourceDeviceId})`
        : `Relayed via Device ${envelope.sourceDeviceId}`,
      syncState: 'BLUETOOTH RECEIVED',
      timestamp: `${rawAlert.timestamp || 'Just now'} • Bluetooth Received`,
    };

    // Save in relayed alerts store for offline accessibility in Field App
    await saveRelayedAlert(relayedAlert);

    // Queue in Outbox as PENDING_SYNC for store-and-forward if within hop limit
    if (envelope.hopCount + 1 < envelope.maxHops) {
      await queueOutboxRecord({
        localId: `ALERT-RELAY-${envelope.messageId}`,
        entityType: 'relayed_alert',
        payload: relayedAlert,
        createdTimestamp: new Date().toISOString(),
        currentSyncState: 'PENDING_SYNC',
        retryCount: 0,
        sourceDeviceId: envelope.sourceDeviceId,
      });
    }

    // Record as processed
    const processedRecord: ProcessedMessageRecord = {
      messageId: envelope.messageId,
      messageType: 'OPERATIONAL_ALERT',
      receivedAt: new Date().toISOString(),
      sourceDeviceId: envelope.sourceDeviceId,
      sourceUserId: envelope.sourceUserId,
      hopCount: envelope.hopCount + 1,
    };
    await saveProcessedMessage(processedRecord);

    return {
      accepted: true,
      reason: `Operational Alert ${relayedAlert.id} received via Bluetooth relay and cached offline.`,
    };
  }

  return { accepted: false, reason: `Unhandled message type ${envelope.messageType}` };
}

/**
 * STEP 4 & 10 — Relay pending incident reports to a connected Bluetooth peer.
 * Requires explicit user trigger and active connection.
 */
export async function relayPendingReportsToBluetooth(): Promise<RelayResult> {
  const currentState = bluetoothTransport.getState();
  if (currentState !== 'Connected') {
    return {
      totalPending: 0,
      relayedCount: 0,
      failedCount: 0,
      details: 'Cannot relay reports: No Bluetooth peer is currently connected. Connect to a nearby device first.',
    };
  }

  const outbox = await getOutboxRecords();
  const pending = outbox.filter(
    (r) => r.currentSyncState === 'PENDING_SYNC' || r.currentSyncState === 'OFFLINE_LOCAL'
  );

  if (pending.length === 0) {
    return {
      totalPending: 0,
      relayedCount: 0,
      failedCount: 0,
      details: 'Outbox is clean. No pending reports requiring Bluetooth relay.',
    };
  }

  let relayedCount = 0;
  let failedCount = 0;
  const myDeviceId = getDeviceId();

  for (const record of pending) {
    const envelope: BluetoothEnvelope = {
      messageId: `BLE-MSG-${record.localId}`,
      messageType: record.entityType === 'incident' ? 'INCIDENT_REPORT' : 'OPERATIONAL_ALERT',
      sourceDeviceId: myDeviceId,
      sourceUserId: 'Officer V. Rawat (BDG-8821)',
      createdAt: new Date().toISOString(),
      payload: record.payload,
      protocolVersion: '1.0',
      hopCount: 0,
      maxHops: 3,
      acknowledgementStatus: 'PENDING',
    };

    const transmitResult = await bluetoothTransport.sendEnvelope(envelope);

    if (transmitResult.success && transmitResult.ack) {
      // ONLY mark BLUETOOTH_RELAYED after genuine acknowledged transfer
      await updateOutboxRecordStatus(record.localId, 'BLUETOOTH_RELAYED');

      // Update the incident record in local store as well
      if (record.entityType === 'incident') {
        const inc = record.payload as Incident;
        if (inc && inc.id) {
          await saveIncidentReport({
            ...inc,
            syncState: 'BLUETOOTH_RELAYED',
          });
        }
      }

      // Mark message as processed to avoid re-accepting if echoed
      await saveProcessedMessage({
        messageId: envelope.messageId,
        messageType: envelope.messageType,
        receivedAt: new Date().toISOString(),
        sourceDeviceId: myDeviceId,
        sourceUserId: 'Officer V. Rawat (BDG-8821)',
        hopCount: 0,
      });

      relayedCount++;
    } else {
      // Keep item PENDING_SYNC, record failure metadata
      failedCount++;
      await updateOutboxRecordStatus(
        record.localId,
        'PENDING_SYNC',
        transmitResult.error || 'Bluetooth transfer unacknowledged.'
      );
    }
  }

  return {
    totalPending: pending.length,
    relayedCount,
    failedCount,
    details:
      relayedCount > 0
        ? `Successfully relayed ${relayedCount} report(s) via Bluetooth. Relayed reports remain preserved on-device.`
        : `Transfer unacknowledged. Reports remain safely pending in local Outbox.`,
  };
}
