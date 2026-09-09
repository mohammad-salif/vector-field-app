/**
 * Shared BLE Service and Characteristic UUIDs for Logistics Intelligence Field App.
 * These 128-bit UUIDs are fixed and shared across native Android (Java/Kotlin) and TypeScript.
 * DO NOT regenerate UUIDs dynamically.
 */

// Primary GATT Service advertised by Peripheral (Phone A) and scanned by Central (Phone B)
export const LOGISTICS_SERVICE_UUID = '4a94b57f-e2fb-4b13-bd78-c7a5c0f2be01';

// Handshake Characteristic: Handles HELLO and HELLO_ACK exchange
export const HANDSHAKE_CHARACTERISTIC_UUID = '4a94b57f-e2fb-4b13-bd78-c7a5c0f2be02';

// Data Characteristic: Transmits the BLE test payload
export const DATA_CHARACTERISTIC_UUID = '4a94b57f-e2fb-4b13-bd78-c7a5c0f2be03';

// Acknowledgement Characteristic: Transmits explicit ACK from Receiver to Sender
export const ACK_CHARACTERISTIC_UUID = '4a94b57f-e2fb-4b13-bd78-c7a5c0f2be04';

// Standard Client Characteristic Configuration Descriptor (CCCD) for enabling notifications
export const CCCD_DESCRIPTOR_UUID = '00002902-0000-1000-8000-00805f9b34fb';

export const BLE_PROTOCOL_VERSION = '1.0';
