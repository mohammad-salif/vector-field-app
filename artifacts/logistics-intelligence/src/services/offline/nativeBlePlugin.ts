import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

export interface DiscoveredBleDevice {
  id: string;
  name: string;
  rssi: number;
}

export interface NativeBlePluginInterface {
  isSupported(): Promise<{
    isSupported: boolean;
    isPeripheralSupported: boolean;
    isNative: boolean;
    platform: string;
  }>;
  isEnabled(): Promise<{ isEnabled: boolean }>;
  requestPermissions(): Promise<{ granted: boolean }>;
  startAdvertising(options: { deviceId: string }): Promise<{ started: boolean }>;
  stopAdvertising(): Promise<{ stopped: boolean }>;
  startScan(options?: { timeout?: number }): Promise<{ started: boolean }>;
  stopScan(): Promise<{ stopped: boolean }>;
  connect(options: { deviceId: string }): Promise<{ initiating: boolean }>;
  disconnect(): Promise<{ disconnected: boolean }>;
  sendHandshake(options: { deviceId: string; protocolVersion: string }): Promise<{ sent: boolean }>;
  sendTestMessage(options: { message: string }): Promise<{ sent: boolean }>;

  addListener(
    eventName: 'deviceDiscovered',
    listenerFunc: (device: DiscoveredBleDevice) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'connectionStateChanged',
    listenerFunc: (event: { deviceId: string; state: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'readyForHandshake',
    listenerFunc: (event: { deviceId: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'handshakeCompleted',
    listenerFunc: (event: { peerDeviceId: string; protocolVersion: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'handshakeReceived',
    listenerFunc: (event: { clientDeviceId: string; protocolVersion: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'testMessageReceived',
    listenerFunc: (event: { messageJson: string; messageId: string; sourceDeviceId: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'ackReceived',
    listenerFunc: (event: { messageId: string; ackJson: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'advertisingStateChanged',
    listenerFunc: (event: { isAdvertising: boolean; error?: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'centralError',
    listenerFunc: (event: { error: string }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'scanStateChanged',
    listenerFunc: (event: { scanning: boolean }) => void
  ): Promise<PluginListenerHandle>;

  addListener(
    eventName: 'peripheralConnectionChanged',
    listenerFunc: (event: { deviceAddress: string; state: string }) => void
  ): Promise<PluginListenerHandle>;
}

export const NativeBle = registerPlugin<NativeBlePluginInterface>('NativeBle');
