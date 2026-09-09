package gov.in.logistics.field;

import android.annotation.SuppressLint;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothGatt;
import android.bluetooth.BluetoothGattCharacteristic;
import android.bluetooth.BluetoothGattDescriptor;
import android.bluetooth.BluetoothGattServer;
import android.bluetooth.BluetoothGattServerCallback;
import android.bluetooth.BluetoothGattService;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothProfile;
import android.bluetooth.le.AdvertiseCallback;
import android.bluetooth.le.AdvertiseData;
import android.bluetooth.le.AdvertiseSettings;
import android.bluetooth.le.BluetoothLeAdvertiser;
import android.content.Context;
import android.os.ParcelUuid;
import android.util.Log;

import org.json.JSONObject;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;

/**
 * Manages the Native Android BLE Peripheral (GATT Server & Advertising) Role for Phone A.
 * Provides real BLE advertising and GATT service hosting for field device discovery and test transfer.
 */
public class BlePeripheralManager {
    private static final String TAG = "BlePeripheral";

    public interface PeripheralListener {
        void onAdvertisingStarted();
        void onAdvertisingFailed(String error);
        void onHandshakeReceived(String clientDeviceId, String protocolVersion);
        void onTestMessageReceived(String messageJson, String messageId, String sourceDeviceId);
        void onClientConnected(String deviceAddress);
        void onClientDisconnected(String deviceAddress);
    }

    private final Context context;
    private final BluetoothManager bluetoothManager;
    private final BluetoothAdapter bluetoothAdapter;
    private BluetoothLeAdvertiser advertiser;
    private BluetoothGattServer gattServer;
    private PeripheralListener listener;
    private boolean isAdvertising = false;
    private String localDeviceId = "DEV-UNKNOWN";

    private BluetoothGattCharacteristic handshakeChar;
    private BluetoothGattCharacteristic dataChar;
    private BluetoothGattCharacteristic ackChar;

    public BlePeripheralManager(Context context, BluetoothManager bluetoothManager, BluetoothAdapter bluetoothAdapter) {
        this.context = context;
        this.bluetoothManager = bluetoothManager;
        this.bluetoothAdapter = bluetoothAdapter;
    }

    public void setListener(PeripheralListener listener) {
        this.listener = listener;
    }

    public void setLocalDeviceId(String deviceId) {
        this.localDeviceId = deviceId;
    }

    public boolean isPeripheralSupported() {
        if (bluetoothAdapter == null) return false;
        return bluetoothAdapter.isMultipleAdvertisementSupported();
    }

    public boolean isAdvertising() {
        return isAdvertising;
    }

    @SuppressLint("MissingPermission")
    public void startAdvertising() {
        if (bluetoothAdapter == null || !bluetoothAdapter.isEnabled()) {
            if (listener != null) listener.onAdvertisingFailed("Bluetooth is disabled.");
            return;
        }

        if (!bluetoothAdapter.isMultipleAdvertisementSupported()) {
            if (listener != null) listener.onAdvertisingFailed("Device does not support BLE Peripheral advertising.");
            return;
        }

        advertiser = bluetoothAdapter.getBluetoothLeAdvertiser();
        if (advertiser == null) {
            if (listener != null) listener.onAdvertisingFailed("BluetoothLeAdvertiser not available on this hardware.");
            return;
        }

        // Setup GATT Server first
        boolean gattReady = setupGattServer();
        if (!gattReady) {
            if (listener != null) listener.onAdvertisingFailed("Failed to open local GATT Server.");
            return;
        }

        AdvertiseSettings settings = new AdvertiseSettings.Builder()
                .setAdvertiseMode(AdvertiseSettings.ADVERTISE_MODE_LOW_LATENCY)
                .setTxPowerLevel(AdvertiseSettings.ADVERTISE_TX_POWER_HIGH)
                .setConnectable(true)
                .setTimeout(0) // Advertise until explicitly stopped
                .build();

        AdvertiseData data = new AdvertiseData.Builder()
                .setIncludeDeviceName(true)
                .addServiceUuid(new ParcelUuid(BleConstants.LOGISTICS_SERVICE_UUID))
                .build();

        advertiser.startAdvertising(settings, data, advertiseCallback);
    }

    @SuppressLint("MissingPermission")
    public void stopAdvertising() {
        try {
            if (advertiser != null && isAdvertising) {
                advertiser.stopAdvertising(advertiseCallback);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping advertising: " + e.getMessage());
        } finally {
            isAdvertising = false;
        }

        try {
            if (gattServer != null) {
                gattServer.clearServices();
                gattServer.close();
                gattServer = null;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error closing GATT server: " + e.getMessage());
        }
    }

    @SuppressLint("MissingPermission")
    private boolean setupGattServer() {
        if (gattServer != null) {
            gattServer.close();
            gattServer = null;
        }

        gattServer = bluetoothManager.openGattServer(context, gattServerCallback);
        if (gattServer == null) {
            return false;
        }

        BluetoothGattService service = new BluetoothGattService(
                BleConstants.LOGISTICS_SERVICE_UUID,
                BluetoothGattService.SERVICE_TYPE_PRIMARY
        );

        // 1. Handshake Characteristic
        handshakeChar = new BluetoothGattCharacteristic(
                BleConstants.HANDSHAKE_CHARACTERISTIC_UUID,
                BluetoothGattCharacteristic.PROPERTY_READ |
                        BluetoothGattCharacteristic.PROPERTY_WRITE |
                        BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                BluetoothGattCharacteristic.PERMISSION_READ |
                        BluetoothGattCharacteristic.PERMISSION_WRITE
        );
        BluetoothGattDescriptor handshakeCccd = new BluetoothGattDescriptor(
                BleConstants.CCCD_DESCRIPTOR_UUID,
                BluetoothGattDescriptor.PERMISSION_READ | BluetoothGattDescriptor.PERMISSION_WRITE
        );
        handshakeChar.addDescriptor(handshakeCccd);
        service.addCharacteristic(handshakeChar);

        // 2. Data Characteristic (Test Message)
        dataChar = new BluetoothGattCharacteristic(
                BleConstants.DATA_CHARACTERISTIC_UUID,
                BluetoothGattCharacteristic.PROPERTY_READ |
                        BluetoothGattCharacteristic.PROPERTY_WRITE |
                        BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                BluetoothGattCharacteristic.PERMISSION_READ |
                        BluetoothGattCharacteristic.PERMISSION_WRITE
        );
        BluetoothGattDescriptor dataCccd = new BluetoothGattDescriptor(
                BleConstants.CCCD_DESCRIPTOR_UUID,
                BluetoothGattDescriptor.PERMISSION_READ | BluetoothGattDescriptor.PERMISSION_WRITE
        );
        dataChar.addDescriptor(dataCccd);
        service.addCharacteristic(dataChar);

        // 3. Acknowledgement Characteristic
        ackChar = new BluetoothGattCharacteristic(
                BleConstants.ACK_CHARACTERISTIC_UUID,
                BluetoothGattCharacteristic.PROPERTY_READ |
                        BluetoothGattCharacteristic.PROPERTY_WRITE |
                        BluetoothGattCharacteristic.PROPERTY_NOTIFY,
                BluetoothGattCharacteristic.PERMISSION_READ |
                        BluetoothGattCharacteristic.PERMISSION_WRITE
        );
        BluetoothGattDescriptor ackCccd = new BluetoothGattDescriptor(
                BleConstants.CCCD_DESCRIPTOR_UUID,
                BluetoothGattDescriptor.PERMISSION_READ | BluetoothGattDescriptor.PERMISSION_WRITE
        );
        ackChar.addDescriptor(ackCccd);
        service.addCharacteristic(ackChar);

        return gattServer.addService(service);
    }

    private final AdvertiseCallback advertiseCallback = new AdvertiseCallback() {
        @Override
        public void onStartSuccess(AdvertiseSettings settingsInEffect) {
            super.onStartSuccess(settingsInEffect);
            isAdvertising = true;
            Log.i(TAG, "BLE Peripheral Advertising started successfully.");
            if (listener != null) {
                listener.onAdvertisingStarted();
            }
        }

        @Override
        public void onStartFailure(int errorCode) {
            super.onStartFailure(errorCode);
            isAdvertising = false;
            String msg = "Advertising failed with errorCode: " + errorCode;
            Log.e(TAG, msg);
            if (listener != null) {
                listener.onAdvertisingFailed(msg);
            }
        }
    };

    private final BluetoothGattServerCallback gattServerCallback = new BluetoothGattServerCallback() {
        @Override
        public void onConnectionStateChange(BluetoothDevice device, int status, int newState) {
            super.onConnectionStateChange(device, status, newState);
            if (newState == BluetoothProfile.STATE_CONNECTED) {
                Log.i(TAG, "Client connected: " + device.getAddress());
                if (listener != null) listener.onClientConnected(device.getAddress());
            } else if (newState == BluetoothProfile.STATE_DISCONNECTED) {
                Log.i(TAG, "Client disconnected: " + device.getAddress());
                if (listener != null) listener.onClientDisconnected(device.getAddress());
            }
        }

        @SuppressLint("MissingPermission")
        @Override
        public void onCharacteristicReadRequest(BluetoothDevice device, int requestId, int offset, BluetoothGattCharacteristic characteristic) {
            super.onCharacteristicReadRequest(device, requestId, offset, characteristic);
            byte[] value = characteristic.getValue();
            if (value == null) {
                value = new byte[0];
            }
            if (offset > value.length) {
                gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_INVALID_OFFSET, offset, null);
                return;
            }
            byte[] responseValue = Arrays.copyOfRange(value, offset, value.length);
            gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, responseValue);
        }

        @SuppressLint("MissingPermission")
        @Override
        public void onCharacteristicWriteRequest(BluetoothDevice device, int requestId, BluetoothGattCharacteristic characteristic, boolean preparedWrite, boolean responseNeeded, int offset, byte[] value) {
            super.onCharacteristicWriteRequest(device, requestId, characteristic, preparedWrite, responseNeeded, offset, value);

            if (responseNeeded) {
                gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value);
            }

            if (value == null || value.length == 0) return;
            String receivedPayload = new String(value, StandardCharsets.UTF_8);
            Log.d(TAG, "GATT Write received on " + characteristic.getUuid() + ": " + receivedPayload);

            try {
                if (characteristic.getUuid().equals(BleConstants.HANDSHAKE_CHARACTERISTIC_UUID)) {
                    // Central sent HELLO
                    JSONObject helloObj = new JSONObject(receivedPayload);
                    String clientDevId = helloObj.optString("deviceId", "UNKNOWN");
                    String protoVer = helloObj.optString("protocolVersion", BleConstants.PROTOCOL_VERSION);

                    // Build HELLO_ACK response
                    JSONObject ackObj = new JSONObject();
                    ackObj.put("type", "HELLO_ACK");
                    ackObj.put("protocolVersion", BleConstants.PROTOCOL_VERSION);
                    ackObj.put("deviceId", localDeviceId);

                    byte[] ackBytes = ackObj.toString().getBytes(StandardCharsets.UTF_8);
                    characteristic.setValue(ackBytes);
                    gattServer.notifyCharacteristicChanged(device, characteristic, false);

                    if (listener != null) {
                        listener.onHandshakeReceived(clientDevId, protoVer);
                    }
                } else if (characteristic.getUuid().equals(BleConstants.DATA_CHARACTERISTIC_UUID)) {
                    // Central sent Test Message
                    JSONObject msgObj = new JSONObject(receivedPayload);
                    String messageId = msgObj.optString("messageId", "MSG-TEST");
                    String sourceDevId = msgObj.optString("sourceDeviceId", device.getAddress());

                    // Build explicit ACK
                    JSONObject ackPayload = new JSONObject();
                    ackPayload.put("type", "ACK");
                    ackPayload.put("messageId", messageId);
                    ackPayload.put("status", "RECEIVED");
                    ackPayload.put("receiverDeviceId", localDeviceId);
                    ackPayload.put("timestamp", System.currentTimeMillis());

                    byte[] ackBytes = ackPayload.toString().getBytes(StandardCharsets.UTF_8);
                    if (ackChar != null) {
                        ackChar.setValue(ackBytes);
                        gattServer.notifyCharacteristicChanged(device, ackChar, false);
                    }

                    if (listener != null) {
                        listener.onTestMessageReceived(receivedPayload, messageId, sourceDevId);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error handling GATT write request: " + e.getMessage(), e);
            }
        }

        @SuppressLint("MissingPermission")
        @Override
        public void onDescriptorWriteRequest(BluetoothDevice device, int requestId, BluetoothGattDescriptor descriptor, boolean preparedWrite, boolean responseNeeded, int offset, byte[] value) {
            super.onDescriptorWriteRequest(device, requestId, descriptor, preparedWrite, responseNeeded, offset, value);
            descriptor.setValue(value);
            if (responseNeeded) {
                gattServer.sendResponse(device, requestId, BluetoothGatt.GATT_SUCCESS, offset, value);
            }
        }
    };
}
