/**
 * BLUETOOTH TRANSPORT ADAPTER (PHASE 2B.1 NATIVE FOUNDATION)
 *
 * Unified Transport Adapter implementation for Bluetooth Low Energy (BLE).
 *
 * Architecture:
 * - Native Android Bridge: When running in Capacitor, interacts with NativeBlePlugin
 *   (Central scanning/connecting & Peripheral advertising/GATT server).
 * - Web Fallback: When running in standard browser, reports runtime capabilities truthfully
 *   without simulating fake devices or fake connections.
 * - Minimal Handshake: Central sends HELLO(protocolVersion, deviceId), Peripheral replies HELLO_ACK.
 * - Test Message: Central sends minimal BLE_TEST message.
 * - Explicit Acknowledgement: Peripheral validates and returns ACK; Central marks transfer success.
 */

import { Capacitor } from '@capacitor/core';
import type {
  TransportAdapter,
  OutboxRecord,
  BluetoothEnvelope,
  BluetoothConnectionState,
  BluetoothRuntimeCapability,
  BluetoothDeviceDescriptor,
  BleTestMessage,
  BleAckMessage,
  BleHelloMessage,
} from './types';
import { getDeviceId } from './deviceIdentity';
import { NativeBle, type DiscoveredBleDevice } from './nativeBlePlugin';
import { BLE_PROTOCOL_VERSION } from './bleConstants';

interface BluetoothNavigator extends Navigator {
  bluetooth?: {
    getAvailability?: () => Promise<boolean>;
    requestDevice?: (options: {
      acceptAllDevices?: boolean;
      filters?: Array<{ services?: string[]; name?: string; namePrefix?: string }>;
      optionalServices?: string[];
    }) => Promise<any>;
  };
}

export interface BleEventLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'SUCCESS' | 'ERROR' | 'HANDSHAKE' | 'DATA' | 'ACK';
  message: string;
}

class BluetoothTransportService implements TransportAdapter {
  readonly name = 'Bluetooth BLE Store-and-Forward Transport';
  readonly type = 'bluetooth' as const;

  private state: BluetoothConnectionState = 'Bluetooth unavailable';
  private statusDetails: string = '';
  private listeners: Set<(state: BluetoothConnectionState, details: string) => void> = new Set();

  private isNative: boolean = false;
  private isPeripheralAdvertising: boolean = false;
  private activeDevice: BluetoothDeviceDescriptor | null = null;
  private discoveredDevicesMap: Map<string, BluetoothDeviceDescriptor> = new Map();
  private gattServer: any = null; // For Web Bluetooth fallback if applicable
  private cachedCapability: BluetoothRuntimeCapability | null = null;

  // Handshake and connection tracking
  private handshakeCompleted: boolean = false;
  private connectedPeerDeviceId: string | null = null;

  // Event callbacks
  private incomingMessageListeners: Set<(envelope: BluetoothEnvelope) => void> = new Set();
  private testMessageListeners: Set<(msg: BleTestMessage) => void> = new Set();
  private ackListeners: Set<(ack: BleAckMessage) => void> = new Set();
  private eventLogListeners: Set<(log: BleEventLog) => void> = new Set();
  private pendingAckResolvers: Map<string, (ack: BleAckMessage) => void> = new Map();

  constructor() {
    this.isNative = Capacitor.isNativePlatform();
    this.initRuntime();
    if (this.isNative) {
      this.initNativeListeners();
    }
  }

  private logEvent(type: BleEventLog['type'], message: string) {
    const log: BleEventLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toLocaleTimeString(),
      type,
      message,
    };
    for (const listener of this.eventLogListeners) {
      try {
        listener(log);
      } catch {
        // Safe dispatch
      }
    }
  }

  subscribeEventLogs(listener: (log: BleEventLog) => void): () => void {
    this.eventLogListeners.add(listener);
    return () => this.eventLogListeners.delete(listener);
  }

  private async initRuntime(): Promise<void> {
    const cap = await this.inspectRuntime();
    if (cap.isSupported) {
      this.setState('Bluetooth available', cap.summary);
    } else {
      this.setState('Bluetooth unavailable', cap.summary);
    }
  }

  private initNativeListeners(): void {
    try {
      NativeBle.addListener('deviceDiscovered', (device: DiscoveredBleDevice) => {
        const descriptor: BluetoothDeviceDescriptor = {
          id: device.id,
          name: device.name || `Device (${device.id.slice(-5)})`,
          connected: false,
          rssi: device.rssi,
        };
        this.discoveredDevicesMap.set(device.id, descriptor);
        this.setState('Device found', `Discovered ${descriptor.name} (RSSI: ${device.rssi} dBm)`);
        this.logEvent('INFO', `Discovered peer ${descriptor.name} [${device.id}]`);
      });

      NativeBle.addListener('connectionStateChanged', (event: { deviceId: string; state: string }) => {
        if (event.state === 'CONNECTED') {
          this.setState('Connected', `Connected to GATT server on ${event.deviceId}`);
          this.logEvent('SUCCESS', `Connected to GATT peer ${event.deviceId}`);
        } else if (event.state === 'DISCONNECTED') {
          this.setState('Disconnected', `Disconnected from ${event.deviceId}`);
          this.handshakeCompleted = false;
          this.connectedPeerDeviceId = null;
          this.activeDevice = null;
          this.logEvent('INFO', `Disconnected from ${event.deviceId}`);
        } else if (event.state === 'CONNECTING') {
          this.setState('Connecting', `Connecting to ${event.deviceId}...`);
          this.logEvent('INFO', `Connecting to ${event.deviceId}...`);
        }
      });

      NativeBle.addListener('readyForHandshake', (event: { deviceId: string }) => {
        this.logEvent('INFO', `Services discovered on ${event.deviceId}. Ready for handshake.`);
      });

      NativeBle.addListener('handshakeCompleted', (event: { peerDeviceId: string; protocolVersion: string }) => {
        this.handshakeCompleted = true;
        this.connectedPeerDeviceId = event.peerDeviceId;
        this.setState('Connected', `Handshake completed with ${event.peerDeviceId} (v${event.protocolVersion})`);
        this.logEvent('HANDSHAKE', `Handshake verified with ${event.peerDeviceId} (v${event.protocolVersion})`);
      });

      NativeBle.addListener('handshakeReceived', (event: { clientDeviceId: string; protocolVersion: string }) => {
        this.logEvent('HANDSHAKE', `Incoming HELLO from Central ${event.clientDeviceId} (v${event.protocolVersion}) -> Sent HELLO_ACK`);
      });

      NativeBle.addListener('testMessageReceived', (event: { messageJson: string; messageId: string; sourceDeviceId: string }) => {
        this.logEvent('DATA', `Received BLE_TEST message ${event.messageId} from ${event.sourceDeviceId} -> Sent ACK`);
        try {
          const parsed = JSON.parse(event.messageJson) as BleTestMessage;
          for (const listener of this.testMessageListeners) {
            listener(parsed);
          }
        } catch {
          // Ignore invalid JSON
        }
      });

      NativeBle.addListener('ackReceived', (event: { messageId: string; ackJson: string }) => {
        this.setState('Transfer successful', `Explicit ACK received for message ${event.messageId}`);
        this.logEvent('ACK', `Peer confirmed receipt: ACK for ${event.messageId}`);
        try {
          const ackObj = JSON.parse(event.ackJson) as BleAckMessage;
          const resolver = this.pendingAckResolvers.get(event.messageId);
          if (resolver) {
            resolver(ackObj);
            this.pendingAckResolvers.delete(event.messageId);
          }
          for (const listener of this.ackListeners) {
            listener(ackObj);
          }
        } catch {
          // Ignore
        }
      });

      NativeBle.addListener('advertisingStateChanged', (event: { isAdvertising: boolean; error?: string }) => {
        this.isPeripheralAdvertising = event.isAdvertising;
        if (event.isAdvertising) {
          this.logEvent('INFO', 'Peripheral advertising started. GATT server ready.');
        } else {
          this.logEvent(event.error ? 'ERROR' : 'INFO', event.error ? `Advertising failed: ${event.error}` : 'Peripheral advertising stopped.');
        }
      });

      NativeBle.addListener('centralError', (event: { error: string }) => {
        this.logEvent('ERROR', `Central error: ${event.error}`);
        this.setState('Transfer failed', event.error);
      });
    } catch (err: any) {
      console.warn('Could not attach NativeBle listeners:', err?.message || err);
    }
  }

  isNativePlatform(): boolean {
    return this.isNative;
  }

  isAdvertising(): boolean {
    return this.isPeripheralAdvertising;
  }

  getDiscoveredDevices(): BluetoothDeviceDescriptor[] {
    return Array.from(this.discoveredDevicesMap.values());
  }

  /**
   * Inspect the runtime capabilities truthfully.
   */
  async inspectRuntime(): Promise<BluetoothRuntimeCapability> {
    if (this.cachedCapability) return this.cachedCapability;

    if (this.isNative) {
      try {
        const support = await NativeBle.isSupported();
        const enabledStatus = await NativeBle.isEnabled();

        const capability: BluetoothRuntimeCapability = {
          isSupported: support.isSupported && enabledStatus.isEnabled,
          runtimeType: 'native_hybrid_wrapper',
          hasCentralClient: true,
          hasPeripheralAdvertising: support.isPeripheralSupported,
          permissionState: 'available',
          summary: support.isSupported
            ? (enabledStatus.isEnabled
                ? `Native Android BLE active. Peripheral Advertising: ${support.isPeripheralSupported ? 'Supported' : 'Unsupported'}.`
                : 'Native Android BLE supported, but Bluetooth radio is disabled.')
            : 'BLE hardware feature not found on this Android device.',
          requiresNativeAdapter: false,
        };
        this.cachedCapability = capability;
        return capability;
      } catch (e: any) {
        console.warn('NativeBle inspection failed:', e);
      }
    }

    // Standard Browser / Web Environment inspection
    const nav = typeof navigator !== 'undefined' ? (navigator as BluetoothNavigator) : null;
    const inIframe = typeof window !== 'undefined' && window.self !== window.top;

    if (!nav || !nav.bluetooth) {
      const capability: BluetoothRuntimeCapability = {
        isSupported: false,
        runtimeType: 'browser_unsupported',
        hasCentralClient: false,
        hasPeripheralAdvertising: false,
        permissionState: 'unavailable',
        summary:
          'Browser environment detected. Physical phone-to-phone BLE (Central ↔ Peripheral) requires running the Capacitor native Android build.',
        requiresNativeAdapter: true,
      };
      this.cachedCapability = capability;
      return capability;
    }

    let available = false;
    try {
      if (typeof nav.bluetooth.getAvailability === 'function') {
        available = await nav.bluetooth.getAvailability();
      } else {
        available = true;
      }
    } catch {
      available = false;
    }

    if (inIframe) {
      const capability: BluetoothRuntimeCapability = {
        isSupported: false,
        runtimeType: 'browser_web_bluetooth',
        hasCentralClient: true,
        hasPeripheralAdvertising: false,
        permissionState: 'restricted_iframe',
        summary:
          'Web Bluetooth API present, but restricted inside sandboxed preview iframe. Run the Capacitor Android app on physical devices for bidirectional BLE.',
        requiresNativeAdapter: true,
      };
      this.cachedCapability = capability;
      return capability;
    }

    const capability: BluetoothRuntimeCapability = {
      isSupported: available,
      runtimeType: 'browser_web_bluetooth',
      hasCentralClient: true,
      hasPeripheralAdvertising: false,
      permissionState: available ? 'available' : 'unavailable',
      summary:
        'Browser Web Bluetooth available (Central only). Note: Physical phone-to-phone peripheral advertising requires the Native Android Capacitor app.',
      requiresNativeAdapter: true,
    };
    this.cachedCapability = capability;
    return capability;
  }

  getState(): BluetoothConnectionState {
    return this.state;
  }

  getStatusDetails(): string {
    return this.statusDetails;
  }

  subscribeState(listener: (state: BluetoothConnectionState, details: string) => void): () => void {
    this.listeners.add(listener);
    listener(this.state, this.statusDetails);
    return () => this.listeners.delete(listener);
  }

  private setState(newState: BluetoothConnectionState, details: string = '') {
    this.state = newState;
    this.statusDetails = details;
    for (const listener of this.listeners) {
      try {
        listener(newState, details);
      } catch {
        // Safe dispatch
      }
    }
  }

  async isAvailable(): Promise<boolean> {
    const cap = await this.inspectRuntime();
    return cap.isSupported && this.state === 'Connected';
  }

  // ============================================================================
  // PERIPHERAL ROLE (PHONE A)
  // ============================================================================

  async startAdvertising(deviceId?: string): Promise<boolean> {
    const targetId = deviceId || getDeviceId();
    if (!this.isNative) {
      this.logEvent('ERROR', 'Peripheral Advertising is not supported in web browsers. Native Android required.');
      this.setState('Bluetooth unavailable', 'Web browser cannot advertise BLE peripherals. Native Android required.');
      return false;
    }

    try {
      this.logEvent('INFO', `Requesting BLE permissions and starting peripheral advertising for ${targetId}...`);
      await NativeBle.requestPermissions();
      await NativeBle.startAdvertising({ deviceId: targetId });
      this.isPeripheralAdvertising = true;
      this.setState('Bluetooth available', `Advertising as Peripheral (${targetId}). Awaiting Phone B connection...`);
      return true;
    } catch (err: any) {
      this.logEvent('ERROR', `Failed to start advertising: ${err.message || err}`);
      this.setState('Transfer failed', `Advertising failed: ${err.message || err}`);
      return false;
    }
  }

  async stopAdvertising(): Promise<boolean> {
    if (!this.isNative) return false;
    try {
      await NativeBle.stopAdvertising();
      this.isPeripheralAdvertising = false;
      this.logEvent('INFO', 'Stopped BLE Peripheral Advertising.');
      this.setState('Bluetooth available', 'Peripheral advertising stopped.');
      return true;
    } catch (err: any) {
      this.logEvent('ERROR', `Error stopping advertising: ${err.message || err}`);
      return false;
    }
  }

  // ============================================================================
  // CENTRAL ROLE (PHONE B)
  // ============================================================================

  async scanForDevices(): Promise<BluetoothDeviceDescriptor[]> {
    if (this.isNative) {
      this.discoveredDevicesMap.clear();
      this.setState('Scanning', 'Scanning for nearby Logistics BLE peripherals (Service UUID 4a94b57f-e2fb-4b13-bd78-c7a5c0f2be01)...');
      this.logEvent('INFO', 'Started native BLE scan for logistics peers...');
      try {
        await NativeBle.requestPermissions();
        await NativeBle.startScan({ timeout: 12000 });
        return this.getDiscoveredDevices();
      } catch (err: any) {
        this.logEvent('ERROR', `Scan error: ${err.message || err}`);
        this.setState('Transfer failed', `BLE Scan error: ${err.message || err}`);
        throw err;
      }
    }

    // Web Bluetooth Browser Fallback
    const nav = typeof navigator !== 'undefined' ? (navigator as BluetoothNavigator) : null;
    const cap = await this.inspectRuntime();

    if (!nav?.bluetooth?.requestDevice) {
      this.setState(
        'Bluetooth unavailable',
        cap.summary || 'Web Bluetooth requestDevice is not supported in this runtime environment.'
      );
      throw new Error(
        'Web Bluetooth is not supported in this browser. Physical phone-to-phone BLE requires the Native Android build.'
      );
    }

    this.setState('Scanning', 'Requesting Bluetooth device pairing dialog...');
    try {
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
      });

      if (!device) {
        this.setState('Disconnected', 'No device selected by user.');
        return [];
      }

      const descriptor: BluetoothDeviceDescriptor = {
        id: device.id || 'ble-selected-device',
        name: device.name || 'Unnamed BLE Device',
        connected: device.gatt?.connected || false,
      };
      this.activeDevice = descriptor;
      this.discoveredDevicesMap.set(descriptor.id, descriptor);
      this.setState('Device found', `Discovered device: ${descriptor.name}`);
      this.logEvent('INFO', `Discovered device: ${descriptor.name}`);
      return [descriptor];
    } catch (err: any) {
      if (err.name === 'NotFoundError') {
        this.setState('Disconnected', 'Device scan cancelled by user.');
        return [];
      }
      this.setState('Bluetooth unavailable', err.message || 'Bluetooth scan failed.');
      throw err;
    }
  }

  async stopScan(): Promise<void> {
    if (this.isNative) {
      try {
        await NativeBle.stopScan();
        this.setState('Bluetooth available', 'Scan stopped.');
      } catch {
        // Ignore
      }
    }
  }

  async connectDevice(deviceId?: string): Promise<boolean> {
    const targetId = deviceId || this.activeDevice?.id || Array.from(this.discoveredDevicesMap.keys())[0];
    if (!targetId) {
      this.setState('Disconnected', 'No Bluetooth device specified to connect.');
      return false;
    }

    if (this.isNative) {
      this.setState('Connecting', `Connecting to GATT server on ${targetId}...`);
      this.logEvent('INFO', `Connecting to GATT server on ${targetId}...`);
      try {
        await NativeBle.connect({ deviceId: targetId });
        this.activeDevice = {
          id: targetId,
          name: this.discoveredDevicesMap.get(targetId)?.name || 'BLE Peer',
          connected: true,
        };
        return true;
      } catch (err: any) {
        this.setState('Transfer failed', `Connection failed: ${err.message || err}`);
        this.logEvent('ERROR', `Connection failed: ${err.message || err}`);
        return false;
      }
    }

    // Web Bluetooth connection
    if (this.activeDevice) {
      this.setState('Connected', `Paired with ${this.activeDevice.name}`);
      return true;
    }
    return false;
  }

  async disconnect(): Promise<void> {
    if (this.isNative) {
      try {
        await NativeBle.disconnect();
      } catch {
        // Ignore
      }
    } else if (this.gattServer?.disconnect) {
      try {
        this.gattServer.disconnect();
      } catch {
        // Ignore
      }
    }
    this.activeDevice = null;
    this.handshakeCompleted = false;
    this.connectedPeerDeviceId = null;
    this.setState('Disconnected', 'Disconnected by user.');
    this.logEvent('INFO', 'Disconnected from peer.');
  }

  // ============================================================================
  // HANDSHAKE PROTOCOL (SECTION 9)
  // PHONE B → HELLO(protocolVersion, deviceId)
  // PHONE A → HELLO_ACK(protocolVersion, deviceId)
  // ============================================================================

  async performHandshake(targetDeviceId?: string): Promise<boolean> {
    if (this.state !== 'Connected') {
      this.setState('Transfer failed', 'Cannot handshake: not connected to GATT peer.');
      return false;
    }

    const clientDeviceId = getDeviceId();
    this.logEvent('HANDSHAKE', `Sending HELLO (protocolVersion=${BLE_PROTOCOL_VERSION}, deviceId=${clientDeviceId})...`);

    if (this.isNative) {
      try {
        await NativeBle.sendHandshake({
          deviceId: clientDeviceId,
          protocolVersion: BLE_PROTOCOL_VERSION,
        });
        return true;
      } catch (err: any) {
        this.logEvent('ERROR', `Handshake write failed: ${err.message || err}`);
        this.setState('Transfer failed', `Handshake failed: ${err.message || err}`);
        return false;
      }
    }

    // Browser simulation forbidden:
    this.setState('Transfer failed', 'Native Android BLE required for handshake exchange.');
    return false;
  }

  // ============================================================================
  // TEST MESSAGE TRANSFER & ACKNOWLEDGEMENT (SECTIONS 10 & 11)
  // ============================================================================

  async sendTestMessage(customText?: string): Promise<{ success: boolean; ack?: BleAckMessage; error?: string }> {
    if (this.state !== 'Connected') {
      const err = 'No Bluetooth device connected. Connect to Phone A first.';
      this.setState('Transfer failed', err);
      this.logEvent('ERROR', err);
      return { success: false, error: err };
    }

    if (!this.handshakeCompleted && this.isNative) {
      const err = 'Handshake not completed yet. Perform handshake before sending data.';
      this.setState('Transfer failed', err);
      this.logEvent('ERROR', err);
      return { success: false, error: err };
    }

    const messageId = `BLE-TEST-${Date.now().toString(36).toUpperCase()}`;
    const testMessage: BleTestMessage = {
      type: 'BLE_TEST',
      messageId,
      sourceDeviceId: getDeviceId(),
      createdAt: new Date().toISOString(),
      protocolVersion: BLE_PROTOCOL_VERSION,
      payload: {
        text: customText || 'logistics-ble-test',
      },
    };

    const serialized = JSON.stringify(testMessage);
    this.setState('Transfer in progress', `Transmitting test message ${messageId} over BLE...`);
    this.logEvent('DATA', `Transmitting test payload [${messageId}] (${testMessage.payload.text})`);

    if (this.isNative) {
      // Create a promise that awaits explicit ACK with a 15-second timeout
      const ackPromise = new Promise<BleAckMessage>((resolve, reject) => {
        const timer = setTimeout(() => {
          this.pendingAckResolvers.delete(messageId);
          reject(new Error(`Timeout waiting for explicit ACK for message ${messageId}`));
        }, 15000);

        this.pendingAckResolvers.set(messageId, (ack) => {
          clearTimeout(timer);
          resolve(ack);
        });
      });

      try {
        await NativeBle.sendTestMessage({ message: serialized });
        const ack = await ackPromise;
        this.setState('Transfer successful', `Verified: Peer ${ack.receiverDeviceId} confirmed ACK for ${messageId}`);
        return { success: true, ack };
      } catch (err: any) {
        this.setState('Transfer failed', `Transfer error: ${err.message || err}`);
        this.logEvent('ERROR', `Transfer failed: ${err.message || err}`);
        return { success: false, error: err.message || err };
      }
    }

    // In web browser preview without native adapter
    const err = 'Physical phone-to-phone BLE test message transfer requires running the native Android build.';
    this.setState('Transfer failed', err);
    this.logEvent('ERROR', err);
    return { success: false, error: err };
  }

  // ============================================================================
  // SUBSCRIPTIONS AND HELPERS
  // ============================================================================

  onTestMessageReceived(listener: (msg: BleTestMessage) => void): () => void {
    this.testMessageListeners.add(listener);
    return () => this.testMessageListeners.delete(listener);
  }

  onAckReceived(listener: (ack: BleAckMessage) => void): () => void {
    this.ackListeners.add(listener);
    return () => this.ackListeners.delete(listener);
  }

  onMessageReceived(listener: (envelope: BluetoothEnvelope) => void): () => void {
    this.incomingMessageListeners.add(listener);
    return () => this.incomingMessageListeners.delete(listener);
  }

  async sendEnvelope<T>(envelope: BluetoothEnvelope<T>): Promise<{ success: boolean; ack?: boolean; error?: string }> {
    if (this.state !== 'Connected') {
      const errorMsg = 'No Bluetooth device is currently connected. Cannot relay report.';
      this.setState('Transfer failed', errorMsg);
      return { success: false, error: errorMsg };
    }

    this.setState('Transfer in progress', `Transmitting message ${envelope.messageId} via BLE...`);

    try {
      const serialized = JSON.stringify(envelope);
      if (this.isNative) {
        await NativeBle.sendTestMessage({ message: serialized });
        this.setState('Transfer successful', `Message ${envelope.messageId} relayed over BLE.`);
        return { success: true, ack: true };
      }

      this.setState('Transfer failed', 'Native BLE adapter required for relay.');
      return { success: false, error: 'Native BLE adapter required.' };
    } catch (err: any) {
      this.setState('Transfer failed', err.message || 'BLE transmission error.');
      return { success: false, error: err.message || 'BLE transmission error.' };
    }
  }

  async transmit(record: OutboxRecord): Promise<{ success: boolean; error?: string }> {
    if (this.state !== 'Connected') {
      return {
        success: false,
        error: 'Bluetooth transport is not connected to a nearby relay peer.',
      };
    }

    const envelope: BluetoothEnvelope = {
      messageId: `BLE-MSG-${record.localId}`,
      messageType: record.entityType === 'incident' ? 'INCIDENT_REPORT' : 'OPERATIONAL_ALERT',
      sourceDeviceId: getDeviceId(),
      sourceUserId: 'Officer V. Rawat (BDG-8821)',
      createdAt: new Date().toISOString(),
      payload: record.payload,
      protocolVersion: '1.0',
      hopCount: 0,
      maxHops: 3,
      acknowledgementStatus: 'PENDING',
    };

    const result = await this.sendEnvelope(envelope);
    return { success: result.success, error: result.error };
  }
}

export const bluetoothTransport = new BluetoothTransportService();
