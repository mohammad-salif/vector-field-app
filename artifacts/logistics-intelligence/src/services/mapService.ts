import type { Vehicle, RouteSegment, Incident } from '@/types';
import { mockVehicles, mockRoutes, mockIncidents } from '@/data/mockData';

export function getVehicles(): Vehicle[] {
  return mockVehicles;
}

export function getRoutes(): RouteSegment[] {
  return mockRoutes;
}

export function getIncidents(): Incident[] {
  return mockIncidents;
}

export function getVehicleById(id: string): Vehicle | undefined {
  return mockVehicles.find((v) => v.id === id);
}

export function getRouteById(id: string): RouteSegment | undefined {
  return mockRoutes.find((r) => r.id === id);
}

export function getIncidentById(id: string): Incident | undefined {
  return mockIncidents.find((i) => i.id === id);
}
