import type { FleetVehicle } from '@/types';
import { mockFleetVehicles } from '@/data/fleetData';

export function getFleetVehicles(): FleetVehicle[] {
  return mockFleetVehicles;
}

export function getFleetVehicleById(id: string): FleetVehicle | undefined {
  return mockFleetVehicles.find((v) => v.id === id);
}
