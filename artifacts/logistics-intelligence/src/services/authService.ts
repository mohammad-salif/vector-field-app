/**
 * Field Authentication Service & Adapter Boundary
 *
 * Provides authentication state management and user profile data for the Field User App.
 * Structured as an adapter boundary ready to connect to Supabase Auth or a custom backend provider.
 */

export interface FieldUserProfile {
  id: string;
  officerId: string;
  name: string;
  callsign: string;
  designation: string;
  unit: string;
  email: string;
  phone: string;
  emergencyContact: string;
  status: 'On Duty' | 'Off Duty' | 'Standby';
  vehicleId: string;
  deliveryId: string;
  routeId: string;
  lastSyncTime: string;
}

export interface NotificationPreferences {
  criticalAlerts: boolean;
  routeRiskUpdates: boolean;
  dispatchAdvisories: boolean;
}

const STORAGE_AUTH_KEY = 'field_auth_session';
const STORAGE_PROFILE_KEY = 'field_user_profile';
const STORAGE_PREFS_KEY = 'field_notification_prefs';

const DEFAULT_OFFICER_PROFILE: FieldUserProfile = {
  id: 'usr-rawat-4091',
  officerId: 'OFF-4091',
  name: 'Officer V. Rawat',
  callsign: 'DELTA-4-LEAD',
  designation: 'Senior Field Logistics Operator',
  unit: 'Field Unit 4 (Mountain Sector)',
  email: 'v.rawat@field.logistics.gov.in',
  phone: '+91 98451-20441',
  emergencyContact: '+91 98451-00000 (Dispatch HQ)',
  status: 'On Duty',
  vehicleId: 'VHC-2044',
  deliveryId: 'DLV-6006',
  routeId: 'RTE-104',
  lastSyncTime: 'Just now',
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  criticalAlerts: true,
  routeRiskUpdates: true,
  dispatchAdvisories: true,
};

export function getStoredUserProfile(): FieldUserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_PROFILE_KEY);
    if (raw) {
      return { ...DEFAULT_OFFICER_PROFILE, ...JSON.parse(raw) };
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_OFFICER_PROFILE;
}

export function saveStoredUserProfile(profile: Partial<FieldUserProfile>): FieldUserProfile {
  const current = getStoredUserProfile();
  // Only allow editing personal fields; operational fields are immutable system-assigned values
  const updated: FieldUserProfile = {
    ...current,
    name: profile.name?.trim() || current.name,
    phone: profile.phone?.trim() || current.phone,
    email: profile.email?.trim() || current.email,
    callsign: profile.callsign?.trim() || current.callsign,
    emergencyContact: profile.emergencyContact?.trim() || current.emergencyContact,
    lastSyncTime: 'Just now',
    // Immutables:
    officerId: current.officerId,
    unit: current.unit,
    vehicleId: current.vehicleId,
    deliveryId: current.deliveryId,
    routeId: current.routeId,
  };

  try {
    localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage quota errors
  }
  return updated;
}

export function getNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_PREFS_KEY);
    if (raw) {
      return { ...DEFAULT_NOTIFICATIONS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_NOTIFICATIONS;
}

export function saveNotificationPreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(STORAGE_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore
  }
}

export function isSessionAuthenticated(): boolean {
  try {
    return localStorage.getItem(STORAGE_AUTH_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSessionAuthenticated(authenticated: boolean): void {
  try {
    if (authenticated) {
      localStorage.setItem(STORAGE_AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    }
  } catch {
    // ignore
  }
}
