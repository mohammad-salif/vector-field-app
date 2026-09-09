package gov.in.logistics.field;

import java.util.UUID;

/**
 * Shared BLE UUID and Protocol Constants for Logistics Intelligence Field App.
 * These 128-bit UUIDs are fixed and shared across Android native and TypeScript.
 */
public final class BleConstants {
    private BleConstants() {}

    // Primary Logistics GATT Service UUID (Advertised by Phone A, scanned by Phone B)
    public static final UUID LOGISTICS_SERVICE_UUID =
            UUID.fromString("4a94b57f-e2fb-4b13-bd78-c7a5c0f2be01");

    // Handshake Characteristic (Write / Read / Notify) for HELLO / HELLO_ACK exchange
    public static final UUID HANDSHAKE_CHARACTERISTIC_UUID =
            UUID.fromString("4a94b57f-e2fb-4b13-bd78-c7a5c0f2be02");

    // Data Characteristic (Write / Read / Notify) for BLE test message payload
    public static final UUID DATA_CHARACTERISTIC_UUID =
            UUID.fromString("4a94b57f-e2fb-4b13-bd78-c7a5c0f2be03");

    // Explicit Acknowledgement Characteristic (Read / Notify) for ACK payload
    public static final UUID ACK_CHARACTERISTIC_UUID =
            UUID.fromString("4a94b57f-e2fb-4b13-bd78-c7a5c0f2be04");

    // Standard Client Characteristic Configuration Descriptor (CCCD)
    public static final UUID CCCD_DESCRIPTOR_UUID =
            UUID.fromString("00002902-0000-1000-8000-00805f9b34fb");

    public static final String PROTOCOL_VERSION = "1.0";
}
