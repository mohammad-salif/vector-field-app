import { getFleetVehicleById } from '@/services/fleetService';
import { getDeliveryById } from '@/services/deliveryService';
import { getRouteById } from '@/services/mapService';
import { getAlerts } from '@/services/alertService';
import { saveOperationalCache, getOperationalCache } from './offlineStorage';
import type { FleetVehicle, Delivery, RouteSegment, Alert } from '@/types';

export const CACHE_KEY_VEHICLE = 'user_vehicle_VHC-2044';
export const CACHE_KEY_DELIVERY = 'user_delivery_DLV-6006';
export const CACHE_KEY_ROUTE = 'user_route_RTE-104';
export const CACHE_KEY_ALERTS = 'user_alerts_RTE-104';
export const CACHE_KEY_PROFILE = 'user_profile_OFF-4091';

/**
 * Initializes and warms the user-scoped operational cache in IndexedDB.
 * Only caches Officer Rawat's relevant operational data (never the whole network).
 */
export async function initializeOperationalCache(): Promise<void> {
  try {
    // 1. User Profile
    const profile = {
      officerId: 'OFF-4091',
      fullName: 'Officer V. Rawat',
      callSign: 'Field Unit 4',
      badgeNumber: 'BDG-8821',
      corridorAssignment: 'Corridor Delta (RTE-104)',
      assignedVehicleId: 'VHC-2044',
      assignedDeliveryId: 'DLV-6006',
      assignedRouteId: 'RTE-104',
      role: 'Senior Field Transport Officer',
      department: 'High-Altitude Freight & Emergency Logistics',
    };
    await saveOperationalCache(CACHE_KEY_PROFILE, profile);

    // 2. Assigned Vehicle
    const vehicle = getFleetVehicleById('VHC-2044');
    if (vehicle) {
      await saveOperationalCache(CACHE_KEY_VEHICLE, vehicle);
    }

    // 3. Assigned Delivery
    const delivery = getDeliveryById('DLV-6006');
    if (delivery) {
      await saveOperationalCache(CACHE_KEY_DELIVERY, delivery);
    }

    // 4. Assigned Route (includes risk and alternate route)
    const route = getRouteById('RTE-104');
    if (route) {
      await saveOperationalCache(CACHE_KEY_ROUTE, route);
    }

    // 5. Relevant alerts
    const alerts = getAlerts().filter(
      (a) =>
        a.routeId === 'RTE-104' ||
        a.vehicleId === 'VHC-2044' ||
        a.deliveryId === 'DLV-6006',
    );
    await saveOperationalCache(CACHE_KEY_ALERTS, alerts);
  } catch {
    // Cache warm up failed silently without affecting runtime
  }
}

/**
 * Retrieves cached vehicle or returns fallback.
 */
export async function getCachedVehicle(): Promise<FleetVehicle | null> {
  return getOperationalCache<FleetVehicle>(CACHE_KEY_VEHICLE);
}

/**
 * Retrieves cached delivery or returns fallback.
 */
export async function getCachedDelivery(): Promise<Delivery | null> {
  return getOperationalCache<Delivery>(CACHE_KEY_DELIVERY);
}

/**
 * Retrieves cached route or returns fallback.
 */
export async function getCachedRoute(): Promise<RouteSegment | null> {
  return getOperationalCache<RouteSegment>(CACHE_KEY_ROUTE);
}

/**
 * Retrieves cached alerts or returns fallback.
 */
export async function getCachedAlerts(): Promise<Alert[] | null> {
  return getOperationalCache<Alert[]>(CACHE_KEY_ALERTS);
}

// Auto-warm in browser environment
if (typeof window !== 'undefined') {
  initializeOperationalCache();
}
