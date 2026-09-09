/**
 * DEVICE IDENTITY SERVICE (STEP 8)
 * 
 * Separates USER identity from DEVICE identity:
 * - USER: Operational officer running the app (Officer V. Rawat, BDG-8821, Unit 4)
 * - DEVICE: Local hardware node participating in Bluetooth store-and-forward relay
 * 
 * Persistent across app restarts, non-secret, locally stored.
 */

const STORAGE_KEY_DEVICE_ID = 'field_device_id';
const STORAGE_KEY_DEVICE_CREATED = 'field_device_created_at';

let cachedDeviceId: string | null = null;

function generateDeterministicShortId(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Returns the persistent local device identifier.
 * Generates one on first launch and retains it across restarts.
 */
export function getDeviceId(): string {
  if (cachedDeviceId) return cachedDeviceId;

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_DEVICE_ID);
      if (stored) {
        cachedDeviceId = stored;
        return stored;
      }

      // Generate a clean, human-readable operational device identifier
      const newId = `DEV-4091-${generateDeterministicShortId()}`;
      localStorage.setItem(STORAGE_KEY_DEVICE_ID, newId);
      localStorage.setItem(STORAGE_KEY_DEVICE_CREATED, new Date().toISOString());
      cachedDeviceId = newId;
      return newId;
    } catch {
      // In case localStorage is blocked
      cachedDeviceId = `DEV-4091-FALLBACK`;
      return cachedDeviceId;
    }
  }

  return 'DEV-4091-SRV';
}

export interface DeviceMetadata {
  deviceId: string;
  assignedOfficer: string;
  unit: string;
  corridor: string;
  firstRegistered: string;
}

export function getDeviceMetadata(): DeviceMetadata {
  const deviceId = getDeviceId();
  let firstRegistered = new Date().toISOString();
  if (typeof window !== 'undefined' && window.localStorage) {
    firstRegistered = localStorage.getItem(STORAGE_KEY_DEVICE_CREATED) || firstRegistered;
  }

  return {
    deviceId,
    assignedOfficer: 'Officer V. Rawat (BDG-8821)',
    unit: 'Field Unit 4',
    corridor: 'Corridor Delta (RTE-104)',
    firstRegistered,
  };
}
