import { useState, useEffect } from 'react';
import {
  Bluetooth,
  Radio,
  RefreshCw,
  Send,
  CheckCircle2,
  AlertTriangle,
  X,
  Smartphone,
  ShieldCheck,
  Info,
  Layers,
  ArrowRight,
  Wifi,
  WifiOff,
  Activity,
  Terminal,
} from 'lucide-react';
import {
  bluetoothTransport,
  getDeviceId,
  getDeviceMetadata,
  type BluetoothConnectionState,
  type BluetoothRuntimeCapability,
  type BluetoothDeviceDescriptor,
  type BleEventLog,
  type BleTestMessage,
  type BleAckMessage,
} from '@/services/offline';

interface FieldBluetoothRelayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRelayCompleted?: () => void;
}

export function FieldBluetoothRelayModal({
  isOpen,
  onClose,
}: FieldBluetoothRelayModalProps) {
  const [role, setRole] = useState<'CENTRAL' | 'PERIPHERAL'>('CENTRAL');
  const [btState, setBtState] = useState<BluetoothConnectionState>(bluetoothTransport.getState());
  const [statusDetails, setStatusDetails] = useState<string>(bluetoothTransport.getStatusDetails());
  const [capability, setCapability] = useState<BluetoothRuntimeCapability | null>(null);
  const [discoveredDevices, setDiscoveredDevices] = useState<BluetoothDeviceDescriptor[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAdvertising, setIsAdvertising] = useState<boolean>(bluetoothTransport.isAdvertising());
  const [isHandshaking, setIsHandshaking] = useState<boolean>(false);
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [testPayloadText, setTestPayloadText] = useState<string>('logistics-ble-test');
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    ack?: BleAckMessage;
  } | null>(null);
  const [logs, setLogs] = useState<BleEventLog[]>([]);

  const deviceMeta = getDeviceMetadata();

  useEffect(() => {
    if (!isOpen) return;

    // Subscribe to bluetooth transport state
    const unsubscribeState = bluetoothTransport.subscribeState((state, details) => {
      setBtState(state);
      setStatusDetails(details);
    });

    // Inspect runtime capabilities
    bluetoothTransport.inspectRuntime().then((cap) => {
      setCapability(cap);
    });

    // Subscribe to real-time event logs
    const unsubscribeLogs = bluetoothTransport.subscribeEventLogs((log) => {
      setLogs((prev) => [log, ...prev].slice(0, 30));
    });

    // Subscribe to incoming test messages (if acting as Peripheral)
    const unsubscribeTest = bluetoothTransport.onTestMessageReceived((msg: BleTestMessage) => {
      setTestResult({
        success: true,
        message: `Received verified test message from ${msg.sourceDeviceId}: "${msg.payload.text}"`,
      });
    });

    return () => {
      unsubscribeState();
      unsubscribeLogs();
      unsubscribeTest();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleToggleAdvertising() {
    if (isAdvertising) {
      await bluetoothTransport.stopAdvertising();
      setIsAdvertising(false);
    } else {
      const success = await bluetoothTransport.startAdvertising(deviceMeta.deviceId);
      setIsAdvertising(success);
    }
  }

  async function handleScan() {
    setIsScanning(true);
    setTestResult(null);
    try {
      const devices = await bluetoothTransport.scanForDevices();
      setDiscoveredDevices(devices);
      if (devices.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(devices[0].id);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Bluetooth scan failed.',
      });
    } finally {
      setIsScanning(false);
    }
  }

  async function handleConnect(devId?: string) {
    const target = devId || selectedDeviceId;
    if (!target) return;
    setTestResult(null);
    const success = await bluetoothTransport.connectDevice(target);
    if (success) {
      setSelectedDeviceId(target);
      setTestResult({
        success: true,
        message: `Connected to GATT peer ${target}. Ready for handshake.`,
      });
    } else {
      setTestResult({
        success: false,
        message: 'Could not connect to GATT service on selected device.',
      });
    }
  }

  async function handleDisconnect() {
    await bluetoothTransport.disconnect();
    setSelectedDeviceId(null);
    setTestResult(null);
  }

  async function handleHandshake() {
    setIsHandshaking(true);
    setTestResult(null);
    try {
      const success = await bluetoothTransport.performHandshake(selectedDeviceId || undefined);
      if (success) {
        setTestResult({
          success: true,
          message: 'Handshake HELLO sent to peer. Awaiting confirmation.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Handshake failed.',
      });
    } finally {
      setIsHandshaking(false);
    }
  }

  async function handleSendTestMessage() {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const result = await bluetoothTransport.sendTestMessage(testPayloadText);
      if (result.success && result.ack) {
        setTestResult({
          success: true,
          message: `Transfer Successful! Peer ${result.ack.receiverDeviceId} returned explicit ACK for test message.`,
          ack: result.ack,
        });
      } else {
        setTestResult({
          success: false,
          message: result.error || 'Test message transfer failed.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Test message transfer failed.',
      });
    } finally {
      setIsSendingTest(false);
    }
  }

  const isConnected = btState === 'Connected';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="bt-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-neutral-900/60 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="ble-foundation-modal"
        className="w-full max-w-xl max-h-[92vh] flex flex-col rounded-t-2xl sm:rounded-2xl border border-neutral-200 bg-white shadow-xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3.5 sm:px-5 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
              <Bluetooth className="h-5 w-5" />
            </div>
            <div>
              <h2 id="bt-modal-title" className="text-sm sm:text-base font-bold text-neutral-900">
                Native Android BLE Foundation
              </h2>
              <p className="text-xs text-neutral-500">
                Physical Device A ↔ B Proof of Concept (Phase 2B.1)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Role Selector Tabs (Phone A vs Phone B) */}
        <div className="flex border-b border-neutral-200 bg-neutral-50 px-4 pt-2 gap-2 text-xs font-semibold">
          <button
            type="button"
            id="tab-role-central"
            onClick={() => setRole('CENTRAL')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              role === 'CENTRAL'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Phone B: Central (Scanner/Sender)</span>
          </button>
          <button
            type="button"
            id="tab-role-peripheral"
            onClick={() => setRole('PERIPHERAL')}
            className={`flex items-center gap-1.5 px-3 py-2 border-b-2 transition-colors ${
              role === 'PERIPHERAL'
                ? 'border-blue-600 text-blue-700 bg-white rounded-t-lg'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Phone A: Peripheral (Advertiser/Receiver)</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
          {/* Hardware & Identity Strip */}
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-neutral-600" />
                <span className="font-semibold text-neutral-900">Device Node Identity</span>
              </div>
              <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
                {deviceMeta.deviceId}
              </span>
            </div>
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px] text-neutral-600 border-t border-neutral-200/60 pt-2">
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase tracking-wider">Field User</span>
                <span className="font-medium text-neutral-800">{deviceMeta.assignedOfficer}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px] uppercase tracking-wider">Assigned Corridor</span>
                <span className="font-medium text-neutral-800">{deviceMeta.corridor}</span>
              </div>
            </div>
          </div>

          {/* Connection Status & Runtime Audit */}
          <div className="rounded-xl border border-neutral-200 p-3.5 space-y-2.5 bg-white shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-neutral-800">BLE Transport State</span>
              <span
                id="ble-state-badge"
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  isConnected
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : isAdvertising
                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                    : btState === 'Scanning'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-neutral-100 text-neutral-700 border-neutral-200'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    isConnected
                      ? 'bg-emerald-500'
                      : isAdvertising
                      ? 'bg-blue-500 animate-pulse'
                      : isScanning
                      ? 'bg-amber-500 animate-ping'
                      : 'bg-neutral-400'
                  }`}
                />
                <span>{btState}</span>
              </span>
            </div>

            {statusDetails && (
              <p className="text-[11px] leading-relaxed text-neutral-600 bg-neutral-50 rounded-lg p-2 border border-neutral-100 font-mono">
                {statusDetails}
              </p>
            )}

            {capability && (
              <div className="rounded-lg border border-neutral-200/80 bg-neutral-50/90 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-neutral-800 font-semibold text-[11px]">
                  <Info className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  <span>Runtime Environment Audit</span>
                </div>
                <p className="text-[11px] text-neutral-600 leading-relaxed">
                  {capability.summary}
                </p>
                {capability.requiresNativeAdapter && (
                  <div className="flex items-start gap-1.5 text-[10px] text-neutral-500 pt-1 border-t border-neutral-200/60">
                    <ShieldCheck className="h-3.5 w-3.5 text-neutral-400 shrink-0 mt-0.5" />
                    <span>
                      Standard web browser preview detected. Physical two-phone verification requires installing the Capacitor Android APK on Phone A and Phone B.
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ROLE VIEW: PHONE A (PERIPHERAL / GATT SERVER) */}
          {role === 'PERIPHERAL' && (
            <div className="rounded-xl border border-neutral-200 p-3.5 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 text-xs">
                    Phone A: Peripheral Role (GATT Server)
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Advertises Logistics Service (UUID 4a94b57f-e2fb-4b13-bd78-c7a5c0f2be01)
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-toggle-advertising"
                  onClick={handleToggleAdvertising}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs transition-all ${
                    isAdvertising
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isAdvertising ? 'Stop Advertising' : 'Start BLE Advertising'}
                </button>
              </div>

              <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-[11px] text-neutral-600 space-y-1 font-mono">
                <div>
                  <span className="text-neutral-400">GATT Service: </span>
                  <span className="text-neutral-800">4a94b57f-e2fb-4b13-bd78-c7a5c0f2be01</span>
                </div>
                <div>
                  <span className="text-neutral-400">Handshake Char: </span>
                  <span className="text-neutral-800">4a94b57f-e2fb-4b13-bd78-c7a5c0f2be02 (HELLO/ACK)</span>
                </div>
                <div>
                  <span className="text-neutral-400">Data Char: </span>
                  <span className="text-neutral-800">4a94b57f-e2fb-4b13-bd78-c7a5c0f2be03 (TEST_DATA)</span>
                </div>
                <div>
                  <span className="text-neutral-400">Ack Char: </span>
                  <span className="text-neutral-800">4a94b57f-e2fb-4b13-bd78-c7a5c0f2be04 (EXPLICIT_ACK)</span>
                </div>
              </div>
            </div>
          )}

          {/* ROLE VIEW: PHONE B (CENTRAL / GATT CLIENT) */}
          {role === 'CENTRAL' && (
            <div className="rounded-xl border border-neutral-200 p-3.5 space-y-3 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-neutral-900 text-xs">
                    Phone B: Central Role (Scanner & Client)
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Discovers Phone A, establishes connection, performs handshake and sends test message
                  </p>
                </div>
                <button
                  type="button"
                  id="btn-scan-ble-devices"
                  onClick={handleScan}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 font-bold text-white text-xs hover:bg-black disabled:opacity-50"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="h-3.5 w-3.5" />
                      <span>Scan for Peers</span>
                    </>
                  )}
                </button>
              </div>

              {/* Discovered Devices */}
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-neutral-700">
                  Discovered Devices ({discoveredDevices.length})
                </span>
                {discoveredDevices.length === 0 ? (
                  <div className="py-3 text-center text-[11px] text-neutral-500 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                    No peers discovered yet. Ensure Phone A has "Start BLE Advertising" active, then click Scan.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {discoveredDevices.map((dev) => (
                      <div
                        key={dev.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                          selectedDeviceId === dev.id
                            ? 'border-blue-300 bg-blue-50/60'
                            : 'border-neutral-200 bg-neutral-50'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-neutral-900">{dev.name}</p>
                          <p className="font-mono text-[10px] text-neutral-500">
                            ID: {dev.id} {dev.rssi ? `| Signal: ${dev.rssi} dBm` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {isConnected && selectedDeviceId === dev.id ? (
                            <button
                              type="button"
                              onClick={handleDisconnect}
                              className="px-2.5 py-1 rounded bg-white border border-red-200 text-red-600 font-medium text-xs hover:bg-red-50"
                            >
                              Disconnect
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleConnect(dev.id)}
                              className="px-2.5 py-1 rounded bg-blue-600 text-white font-bold text-xs hover:bg-blue-700"
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 1: Handshake */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                      1
                    </span>
                    <span className="font-semibold text-neutral-800">Protocol Handshake</span>
                  </div>
                  <button
                    type="button"
                    id="btn-perform-handshake"
                    onClick={handleHandshake}
                    disabled={!isConnected || isHandshaking}
                    className="px-3 py-1 rounded bg-white border border-neutral-300 font-semibold text-neutral-800 hover:bg-neutral-100 disabled:opacity-40"
                  >
                    {isHandshaking ? 'Handshaking...' : 'Send HELLO'}
                  </button>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Sends protocol version 1.0 and device identity packet. Peripheral responds with HELLO_ACK.
                </p>
              </div>

              {/* Step 2: Send BLE Test Message */}
              <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-[10px]">
                      2
                    </span>
                    <span className="font-semibold text-neutral-800">Send BLE Test Message</span>
                  </div>
                  <button
                    type="button"
                    id="btn-send-ble-test"
                    onClick={handleSendTestMessage}
                    disabled={!isConnected || isSendingTest}
                    className="px-3 py-1 rounded bg-neutral-900 font-bold text-white hover:bg-black disabled:opacity-40"
                  >
                    {isSendingTest ? 'Transmitting...' : 'Send Test'}
                  </button>
                </div>
                <input
                  type="text"
                  value={testPayloadText}
                  onChange={(e) => setTestPayloadText(e.target.value)}
                  placeholder="Test message payload text"
                  className="w-full rounded border border-neutral-300 bg-white px-2 py-1 text-[11px] font-mono"
                />
                <p className="text-[11px] text-neutral-500">
                  Sends minimal JSON payload: <code className="font-mono text-neutral-700">{'{"type":"BLE_TEST","payload":{"text":"..."}}'}</code>.
                </p>
              </div>
            </div>
          )}

          {/* Test Feedback Banner */}
          {testResult && (
            <div
              id="ble-test-result-banner"
              className={`rounded-xl p-3 border ${
                testResult.success
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-red-200 bg-red-50 text-red-900'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {testResult.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                )}
                <span>{testResult.message}</span>
              </div>
              {testResult.ack && (
                <div className="mt-2 pt-2 border-t border-emerald-200 text-[11px] font-mono space-y-0.5">
                  <div>ACK Status: {testResult.ack.status}</div>
                  <div>Receiver Peer: {testResult.ack.receiverDeviceId}</div>
                  <div>Timestamp: {new Date(testResult.ack.timestamp).toLocaleTimeString()}</div>
                </div>
              )}
            </div>
          )}

          {/* Live BLE Protocol Event Log */}
          <div className="rounded-xl border border-neutral-200 p-3 bg-neutral-900 text-neutral-200 font-mono text-[10px] space-y-1.5">
            <div className="flex items-center justify-between text-neutral-400 border-b border-neutral-800 pb-1">
              <div className="flex items-center gap-1.5">
                <Terminal className="h-3.5 w-3.5 text-neutral-400" />
                <span className="font-bold">BLE Protocol Log (Live)</span>
              </div>
              <span>{logs.length} events</span>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <p className="text-neutral-500 italic py-1">Awaiting BLE events...</p>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="flex items-start gap-1.5">
                    <span className="text-neutral-500 shrink-0">[{log.timestamp}]</span>
                    <span
                      className={`font-semibold shrink-0 ${
                        log.type === 'SUCCESS' || log.type === 'ACK'
                          ? 'text-emerald-400'
                          : log.type === 'HANDSHAKE'
                          ? 'text-purple-400'
                          : log.type === 'DATA'
                          ? 'text-blue-400'
                          : log.type === 'ERROR'
                          ? 'text-red-400'
                          : 'text-neutral-300'
                      }`}
                    >
                      {log.type}:
                    </span>
                    <span className="text-neutral-300 break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 bg-neutral-50/80 px-4 py-3 sm:px-5">
          <span className="text-[11px] text-neutral-500">
            Phase 2B.1 Native BLE Proof of Concept
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 font-semibold text-neutral-700 hover:bg-neutral-100 text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
