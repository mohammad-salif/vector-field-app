package gov.in.logistics.field;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCallback;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.BluetoothLeScanner;
import android.bluetooth.le.ScanCallback;
import android.bluetooth.le.ScanFilter;
import android.bluetooth.le.ScanResult;
import android.bluetooth.le.ScanSettings;
import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.os.ParcelUuid;
import android.util.Log;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Manages the Native Android BLE Central (Scanner & GATT Client) Role for Phone B.
 * Scans for nearby logistics devices, connects to GATT Server, performs HELLO handshake,
 * sends test messages, and receives explicit acknowledgements.
 */
public class BleCentralManager {
    private static final String TAG = "BleCentral";

    public interface CentralListener {
        void onScanStarted();
        void onScanStopped();
        void onDeviceDiscovered(String deviceId, String name, int rssi);
        void onConnectionStateChange(String deviceId, String state);
        void onReadyForHandshake(String deviceId);
        void onHandshakeCompleted(String peerDeviceId, String protocolVersion);
        void onAckReceived(String messageId, String ackJson);
        void onError(String error);
    }

    private final Context context;
    private final BluetoothManager bluetoothManager;
    private final BluetoothAdapter bluetoothAdapter;
    private BluetoothLeScanner scanner;
    private BluetoothGatt activeGatt;
    private CentralListener listener;
    private boolean isScanning = false;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());

    private BluetoothGattCharacteristic handshakeChar;
    private BluetoothGattCharacteristic dataChar;
    private BluetoothGattCharacteristic ackChar;

    public BleCentralManager(Context context, BluetoothManager bluetoothManager, BluetoothAdapter bluetoothAdapter) {
        this.context = context;
        this.bluetoothManager = bluetoothManager;
        this.bluetoothAdapter = bluetoothAdapter;
    }

    public void setListener(CentralListener listener) {
        this.listener = listener;
    }

    public boolean isScanning() {
        return isScanning;
    }

    public boolean isConnected() {
        return activeGatt != null;
    }

    @SuppressLint("MissingPermission")
    public void startScan(long timeoutMs) {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            if (listener != null) listener.onError("Bluetooth is disabled.");
            return;
        }

        scanner = bluetoothAdapter.getBluetoothLeScanner();
        if (scanner == null) {
            if (listener != null) listener.onError("BluetoothLeScanner unavailable.");
            return;
        }

        List<ScanFilter> filters = new ArrayList<>();
        filters.add(new ScanFilter.Builder()
                .setServiceUuid(new ParcelUuid(BleConstants.LOGISTICS_SERVICE_UUID))
                .build());

        ScanSettings settings = new ScanSettings.Builder()
                .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
                .build();

        try {
            isScanning = true;
            scanner.startScan(filters, settings, scanCallback);
            if (listener != null) listener.onScanStarted();

            if (timeoutMs > 0) {
                mainHandler.postDelayed(this::stopScan, timeoutMs);
            }
        } catch (Exception e) {
            isScanning = false;
            Log.e(TAG, "Failed to start BLE scan: " + e.getMessage());
            if (listener != null) listener.onError("Failed to start scan: " + e.getMessage());
        }
    }

    @SuppressLint("MissingPermission")
    public void stopScan() {
        if (!isScanning) return;
        isScanning = false;
        try {
            if (scanner != null && bluetoothAdapter != null && bluetoothAdapter.isEnabled()) {
                scanner.stopScan(scanCallback);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping scan: " + e.getMessage());
        }
        if (listener != null) listener.onScanStopped();
    }

    @SuppressLint("MissingPermission")
    public void connect(String deviceAddress) {
        stopScan();

        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            if (listener != null) listener.onError("Bluetooth is disabled.");
            return;
        }

        try {
            BluetoothDevice device = bluetoothAdapter.getRemoteDevice(deviceAddress);
            if (listener != null) listener.onConnectionStateChange(deviceAddress, "CONNECTING");

            activeGatt = device.connectGatt(context, false, gattCallback, BluetoothDevice.TRANSPORT_LE);
        } catch (Exception e) {
            Log.e(TAG, "Error connecting to device " + deviceAddress + ": " + e.getMessage());
            if (listener != null) listener.onError("Connection error: " + e.getMessage());
        }
    }

    @SuppressLint("MissingPermission")
    public void disconnect() {
        try {
            if (activeGatt != null) {
                activeGatt.disconnect();
                activeGatt.close();
                activeGatt = null;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error disconnecting GATT: " + e.getMessage());
        }
        handshakeChar = null;
        dataChar = null;
        ackChar = null;
    }

    @SuppressLint("MissingPermission")
    public boolean sendHandshake(String clientDeviceId, String protocolVersion) {
        if (activeGatt == null || handshakeChar == null) {
            if (listener != null) listener.onError("Not connected or Handshake characteristic missing.");
            return false;
        }

        try {
            JSONObject helloObj = new JSONObject();
            helloObj.put("type", "HELLO");
            helloObj.put("protocolVersion", protocolVersion);
            helloObj.put("deviceId", clientDeviceId);

            byte[] payload = helloObj.toString().getBytes(StandardCharsets.UTF_8);
            handshakeChar.setValue(payload);
            handshakeChar.setWriteType(BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);
            return activeGatt.writeCharacteristic(handshakeChar);
        } catch (Exception e) {
            Log.e(TAG, "Failed to write Handshake: " + e.getMessage());
            if (listener != null) listener.onError("Handshake error: " + e.getMessage());
            return false;
        }
    }

    @SuppressLint("MissingPermission")
    public boolean sendTestMessage(String messageJson) {
        if (activeGatt == null || dataChar == null) {
            if (listener != null) listener.onError("Not connected or Data characteristic missing.");
            return false;
        }

        try {
            byte[] payload = messageJson.getBytes(StandardCharsets.UTF_8);
            dataChar.setValue(payload);
            dataChar.setWriteType(BluetoothGattCharacteristic.WRITE_TYPE_DEFAULT);
            return activeGatt.writeCharacteristic(dataChar);
        } catch (Exception e) {
            Log.e(TAG, "Failed to write Test Message: " + e.getMessage());
            if (listener != null) listener.onError("Write error: " + e.getMessage());
            return false;
        }
    }

    private final ScanCallback scanCallback = new ScanCallback() {
        @SuppressLint("MissingPermission")
        @Override
        public void onScanResult(int callbackType, ScanResult result) {
            super.onScanResult(callbackType, result);
            BluetoothDevice dev = result.getDevice();
            if (dev == null) return;
            String name = dev.getName();
            if (name == null || name.isEmpty()) {
                name = "Field BLE Peer (" + dev.getAddress().substring(Math.max(0, dev.getAddress().length() - 5)) + ")";
            }
            if (listener != null) {
                listener.onDeviceDiscovered(dev.getAddress(), name, result.getRssi());
            }
        }

        @Override
        public void onScanFailed(int errorCode) {
            super.onScanFailed(errorCode);
            isScanning = false;
            String msg = "Scan failed with error code: " + errorCode;
            Log.e(TAG, msg);
            if (listener != null) listener.onError(msg);
        }
    };

    private final BluetoothGattCallback gattCallback = new BluetoothGattCallback() {
        @SuppressLint("MissingPermission")
        @Override
        public void onConnectionStateChange(BluetoothGatt gatt, int status, int newState) {
            super.onConnectionStateChange(gatt, status, newState);
            String addr = gatt.getDevice().getAddress();
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                Log.i(TAG, "Connected to GATT server: " + addr);
                if (listener != null) listener.onConnectionStateChange(addr, "CONNECTED");
                // Discover services
                gatt.discoverServices();
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                Log.i(TAG, "Disconnected from GATT server: " + addr);
                if (listener != null) listener.onConnectionStateChange(addr, "DISCONNECTED");
                disconnect();
            }
        }

        @SuppressLint("MissingPermission")
        @Override
        public void onServicesDiscovered(BluetoothGatt gatt, int status) {
            super.onServicesDiscovered(gatt, status);
            if (status != BluetoothGatt.GATT_SUCCESS) {
                if (listener != null) listener.onError("Service discovery failed with status: " + status);
                return;
            }

            BluetoothGattService service = gatt.getService(BleConstants.LOGISTICS_SERVICE_UUID);
            if (service == null) {
                if (listener != null) listener.onError("Logistics Service (" + BleConstants.LOGISTICS_SERVICE_UUID + ") not found on device.");
                return;
            }

            handshakeChar = service.getCharacteristic(BleConstants.HANDSHAKE_CHARACTERISTIC_UUID);
            dataChar = service.getCharacteristic(BleConstants.DATA_CHARACTERISTIC_UUID);
            ackChar = service.getCharacteristic(BleConstants.ACK_CHARACTERISTIC_UUID);

            if (handshakeChar == null || dataChar == null || ackChar == null) {
                if (listener != null) listener.onError("Required BLE characteristics missing from peer.");
                return;
            }

            // Enable notifications on ACK characteristic
            gatt.setCharacteristicNotification(ackChar, true);
            BluetoothGattDescriptor ackCccd = ackChar.getDescriptor(BleConstants.CCCD_DESCRIPTOR_UUID);
            if (ackCccd != null) {
                ackCccd.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
                gatt.writeDescriptor(ackCccd);
            }

            // Enable notifications on Handshake characteristic as well
            gatt.setCharacteristicNotification(handshakeChar, true);
            BluetoothGattDescriptor hsCccd = handshakeChar.getDescriptor(BleConstants.CCCD_DESCRIPTOR_UUID);
            if (hsCccd != null) {
                hsCccd.setValue(BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE);
                gatt.writeDescriptor(hsCccd);
            }

            Log.i(TAG, "GATT services and characteristics ready for Handshake.");
            if (listener != null) {
                listener.onReadyForHandshake(gatt.getDevice().getAddress());
            }
        }

        @Override
        public void onCharacteristicChanged(BluetoothGatt gatt, BluetoothGattCharacteristic characteristic) {
            super.onCharacteristicChanged(gatt, characteristic);
            byte[] val = characteristic.getValue();
            if (val == null || val.length == 0) return;
            String text = new String(val, StandardCharsets.UTF_8);
            Log.d(TAG, "Notification received on " + characteristic.getUuid() + ": " + text);

            try {
                if (characteristic.getUuid().equals(BleConstants.HANDSHAKE_CHARACTERISTIC_UUID)) {
                    JSONObject obj = new JSONObject(text);
                    if ("HELLO_ACK".equals(obj.optString("type"))) {
                        String peerDevId = obj.optString("deviceId", "UNKNOWN");
                        String protoVer = obj.optString("protocolVersion", BleConstants.PROTOCOL_VERSION);
                        if (listener != null) {
                            listener.onHandshakeCompleted(peerDevId, protoVer);
                        }
                    }
                } else if (characteristic.getUuid().equals(BleConstants.ACK_CHARACTERISTIC_UUID)) {
                    JSONObject obj = new JSONObject(text);
                    String messageId = obj.optString("messageId", "UNKNOWN");
                    if (listener != null) {
                        listener.onAckReceived(messageId, text);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error handling characteristic notification: " + e.getMessage());
            }
        }
    };
}
