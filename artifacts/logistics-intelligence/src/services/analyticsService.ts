import type {
  DeliveryStatus,
  FleetVehicleStatus,
  Incident,
  RouteSegment,
  Severity,
} from '@/types';
import { getDeliveries } from '@/services/deliveryService';
import { getFleetVehicles } from '@/services/fleetService';
import { getIncidents, getRoutes } from '@/services/mapService';

export interface AnalyticsDistributionItem {
  label: string;
  count: number;
  percentage: number;
}

export interface RouteRiskSnapshotItem {
  routeId: string;
  label: string;
  score: number;
}

export interface AnalyticsSnapshot {
  routeAccessibility: AnalyticsDistributionItem[];
  vehicleStatus: AnalyticsDistributionItem[];
  incidentSeverity: AnalyticsDistributionItem[];
  deliveryStatus: AnalyticsDistributionItem[];
  routeRiskSnapshot: RouteRiskSnapshotItem[];
}

function buildDistribution<T>(
  items: T[],
  categories: string[],
  getCategory: (item: T) => string,
): AnalyticsDistributionItem[] {
  const total = items.length;

  return categories.map((label) => {
    const count = items.filter((item) => getCategory(item) === label).length;
    return {
      label,
      count,
      percentage: total === 0 ? 0 : (count / total) * 100,
    };
  });
}

function routeAccessibilityCategory(route: RouteSegment): string {
  if (route.status === 'at-risk') return 'Partially Accessible';
  if (route.status === 'blocked') return 'Blocked';
  return 'Accessible';
}

function vehicleStatusCategory(status: FleetVehicleStatus): string {
  return status;
}

function incidentSeverityCategory(severity: Severity): string {
  return severity === 'moderate'
    ? 'Medium'
    : severity.charAt(0).toUpperCase() + severity.slice(1);
}

function deliveryStatusCategory(status: DeliveryStatus): string {
  return status;
}

export function getAnalyticsSnapshot(): AnalyticsSnapshot {
  const routes = getRoutes();
  const fleetVehicles = getFleetVehicles();
  const incidents = getIncidents();
  const deliveries = getDeliveries();

  return {
    routeAccessibility: buildDistribution(
      routes,
      ['Accessible', 'Partially Accessible', 'Blocked'],
      routeAccessibilityCategory,
    ),
    vehicleStatus: buildDistribution(
      fleetVehicles,
      ['Active', 'Delayed', 'Offline'],
      (vehicle) => vehicleStatusCategory(vehicle.status),
    ),
    incidentSeverity: buildDistribution(
      incidents,
      ['Low', 'Medium', 'High', 'Critical'],
      (incident: Incident) => incidentSeverityCategory(incident.severity),
    ),
    deliveryStatus: buildDistribution(
      deliveries,
      ['Planned', 'In Transit', 'Delayed', 'Delivered', 'At Risk'],
      (delivery) => deliveryStatusCategory(delivery.status),
    ),
    routeRiskSnapshot: routes.map((route) => ({
      routeId: route.id,
      label: route.label,
      score: route.riskScore,
    })),
  };
}