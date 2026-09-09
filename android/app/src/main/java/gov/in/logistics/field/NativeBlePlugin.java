package gov.in.logistics.field;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.os.Build;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

/**
 * Project-owned Capacitor Native BLE Plugin for Android.
 * Bridges React/TypeScript to native Android BLE Central and Peripheral operations.
 */
@CapacitorPlugin(
        name = "NativeBle",
        permissions = {
                @Permission(
                        alias = "bluetooth",
                        strings = {
                                Manifest.permission.BLUETOOTH_SCAN,
                                Manifest.permission.BLUETOOTH_CONNECT,
                                Manifest.permission.BLUETOOTH_ADVERTISE
                        }
                )
        }
)
public class NativeBlePlugin extends Plugin {
    private static final String TAG = "NativeBlePlugin";

    private BluetoothManager bluetoothManager;
    private BluetoothAdapter bluetoothAdapter;
    private BlePeripheralManager peripheralManager;
    private BleCentralManager centralManager;

    @Override
    public void load() {
        super.load();
        Context ctx = getContext();
        bluetoothManager = (BluetoothManager) ctx.getSystemService(Context.BLUETOOTH_SERVICE);
        if (bluetoothManager != null) {
            bluetoothAdapter = bluetoothManager.getAdapter();
        }

        peripheralManager = new BlePeripheralManager(ctx, bluetoothManager, bluetoothAdapter);
        centralManager = new BleCentralManager(ctx, bluetoothManager, bluetoothAdapter);

        // Wire Peripheral listeners to Capacitor event notifications
        peripheralManager.setListener(new BlePeripheralManager.PeripheralListener() {
            @Override
            public void onAdvertisingStarted() {
                JSObject ret = new JSObject();
                ret.put("isAdvertising", true);
                notifyListeners("advertisingStateChanged", ret);
            }

            @Override
            public void onAdvertisingFailed(String error) {
                JSObject ret = new JSObject();
                ret.put("isAdvertising", false);
                ret.put("error", error);
                notifyListeners("advertisingStateChanged", ret);
            }

            @Override
            public void onHandshakeReceived(String clientDeviceId, String protocolVersion) {
                JSObject ret = new JSObject();
                ret.put("clientDeviceId", clientDeviceId);
                ret.put("protocolVersion", protocolVersion);
                notifyListeners("handshakeReceived", ret);
            }

            @Override
            public void onTestMessageReceived(String messageJson, String messageId, String sourceDeviceId) {
                JSObject ret = new JSObject();
                ret.put("messageJson", messageJson);
                ret.put("messageId", messageId);
                ret.put("sourceDeviceId", sourceDeviceId);
                notifyListeners("testMessageReceived", ret);
            }

            @Override
            public void onClientConnected(String deviceAddress) {
                JSObject ret = new JSObject();
                ret.put("deviceAddress", deviceAddress);
                ret.put("state", "CLIENT_CONNECTED");
                notifyListeners("peripheralConnectionChanged", ret);
            }

            @Override
            public void onClientDisconnected(String deviceAddress) {
                JSObject ret = new JSObject();
                ret.put("deviceAddress", deviceAddress);
                ret.put("state", "CLIENT_DISCONNECTED");
                notifyListeners("peripheralConnectionChanged", ret);
            }
        });

        // Wire Central listeners to Capacitor event notifications
        centralManager.setListener(new BleCentralManager.CentralListener() {
            @Override
            public void onScanStarted() {
                JSObject ret = new JSObject();
                ret.put("scanning", true);
                notifyListeners("scanStateChanged", ret);
            }

            @Override
            public void onScanStopped() {
                JSObject ret = new JSObject();
                ret.put("scanning", false);
                notifyListeners("scanStateChanged", ret);
            }

            @Override
            public void onDeviceDiscovered(String deviceId, String name, int rssi) {
                JSObject ret = new JSObject();
                ret.put("id", deviceId);
                ret.put("name", name);
                ret.put("rssi", rssi);
                notifyListeners("deviceDiscovered", ret);
            }

            @Override
            public void onConnectionStateChange(String deviceId, String state) {
                JSObject ret = new JSObject();
                ret.put("deviceId", deviceId);
                ret.put("state", state);
                notifyListeners("connectionStateChanged", ret);
            }

            @Override
            public void onReadyForHandshake(String deviceId) {
                JSObject ret = new JSObject();
                ret.put("deviceId", deviceId);
                notifyListeners("readyForHandshake", ret);
            }

            @Override
            public void onHandshakeCompleted(String peerDeviceId, String protocolVersion) {
                JSObject ret = new JSObject();
                ret.put("peerDeviceId", peerDeviceId);
                ret.put("protocolVersion", protocolVersion);
                notifyListeners("handshakeCompleted", ret);
            }

            @Override
            public void onAckReceived(String messageId, String ackJson) {
                JSObject ret = new JSObject();
                ret.put("messageId", messageId);
                ret.put("ackJson", ackJson);
                notifyListeners("ackReceived", ret);
            }

            @Override
            public void onError(String error) {
                JSObject ret = new JSObject();
                ret.put("error", error);
                notifyListeners("centralError", ret);
            }
        });
    }

    @PluginMethod
    public void isSupported(PluginCall call) {
        boolean hasLe = getContext().getPackageManager().hasSystemFeature(PackageManager.FEATURE_BLUETOOTH_LE);
        boolean adapterOk = bluetoothAdapter != null;
        boolean canAdvertise = peripheralManager.isPeripheralSupported();

        JSObject ret = new JSObject();
        ret.put("isSupported", hasLe && adapterOk);
        ret.put("isPeripheralSupported", canAdvertise);
        ret.put("isNative", true);
        ret.put("platform", "android");
        call.resolve(ret);
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        boolean enabled = bluetoothAdapter != null && bluetoothAdapter.isEnabled();
        JSObject ret = new JSObject();
        ret.put("isEnabled", enabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requestPermissionForAlias("bluetooth", call, "bluetoothPermCallback");
        } else {
            // Older Android handles Bluetooth permissions via manifest install-time
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        }
    }

    @PermissionCallback
    private void bluetoothPermCallback(PluginCall call) {
        if (getPermissionState("bluetooth") == com.getcapacitor.PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", true);
            call.resolve(ret);
        } else {
            call.reject("Bluetooth permissions were denied.");
        }
    }

    @PluginMethod
    public void startAdvertising(PluginCall call) {
        String deviceId = call.getString("deviceId", "DEV-DEFAULT");
        peripheralManager.setLocalDeviceId(deviceId);

        if (!peripheralManager.isPeripheralSupported()) {
            call.reject("Device hardware does not support BLE Peripheral advertising.");
            return;
        }

        peripheralManager.startAdvertising();
        JSObject ret = new JSObject();
        ret.put("started", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopAdvertising(PluginCall call) {
        peripheralManager.stopAdvertising();
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void startScan(PluginCall call) {
        long timeout = call.getInt("timeout", 10000);
        centralManager.startScan(timeout);
        JSObject ret = new JSObject();
        ret.put("started", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void stopScan(PluginCall call) {
        centralManager.stopScan();
        JSObject ret = new JSObject();
        ret.put("stopped", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void connect(PluginCall call) {
        String deviceId = call.getString("deviceId");
        if (deviceId == null || deviceId.isEmpty()) {
            call.reject("Must provide deviceId (MAC address).");
            return;
        }

        centralManager.connect(deviceId);
        JSObject ret = new JSObject();
        ret.put("initiating", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        centralManager.disconnect();
        JSObject ret = new JSObject();
        ret.put("disconnected", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void sendHandshake(PluginCall call) {
        String deviceId = call.getString("deviceId", "DEV-UNKNOWN");
        String protoVer = call.getString("protocolVersion", BleConstants.PROTOCOL_VERSION);

        boolean success = centralManager.sendHandshake(deviceId, protoVer);
        if (success) {
            JSObject ret = new JSObject();
            ret.put("sent", true);
            call.resolve(ret);
        } else {
            call.reject("Failed to write handshake to peer.");
        }
    }

    @PluginMethod
    public void sendTestMessage(PluginCall call) {
        String message = call.getString("message");
        if (message == null || message.isEmpty()) {
            call.reject("Must provide test message payload.");
            return;
        }

        boolean success = centralManager.sendTestMessage(message);
        if (success) {
            JSObject ret = new JSObject();
            ret.put("sent", true);
            call.resolve(ret);
        } else {
            call.reject("Failed to write test message to peer.");
        }
    }
}
