import type {
  VehicleStatus,
  RiskLevel,
  IncidentStatus,
  Severity,
  RouteStatus,
  FleetVehicleStatus,
  AlertSeverity,
  AlertStatus,
  DeliveryStatus,
} from '@/types';
import type { BadgeProps } from '@/components/ui/Badge';

type BadgeVariant = BadgeProps['variant'];

export function fleetStatusToBadgeVariant(status: FleetVehicleStatus): BadgeVariant {
  const map: Record<FleetVehicleStatus, BadgeVariant> = {
    Active: 'active',
    Delayed: 'delayed',
    Offline: 'offline',
  };
  return map[status];
}

export function statusToBadgeVariant(status: VehicleStatus): BadgeVariant {
  const map: Record<VehicleStatus, BadgeVariant> = {
    'in-transit': 'in-transit',
    idle: 'idle',
    loading: 'loading',
    delayed: 'delayed',
    maintenance: 'maintenance',
  };
  return map[status];
}

export function riskToBadgeVariant(risk: RiskLevel): BadgeVariant {
  const map: Record<RiskLevel, BadgeVariant> = {
    low: 'low',
    moderate: 'moderate',
    high: 'high',
    critical: 'critical',
  };
  return map[risk];
}

export function incidentStatusToBadgeVariant(status: IncidentStatus): BadgeVariant {
  const map: Record<IncidentStatus, BadgeVariant> = {
    Reported: 'reported',
    'Under Review': 'under-review',
    Resolved: 'resolved',
  };
  return map[status];
}

export function severityToBadgeVariant(severity: Severity): BadgeVariant {
  const map: Record<Severity, BadgeVariant> = {
    low: 'low',
    moderate: 'moderate',
    high: 'high',
    critical: 'critical',
  };
  return map[severity];
}

export function routeStatusToBadgeVariant(status: RouteStatus): BadgeVariant {
  const map: Record<RouteStatus, BadgeVariant> = {
    accessible: 'accessible',
    'at-risk': 'at-risk',
    blocked: 'blocked',
  };
  return map[status];
}

export function alertSeverityToBadgeVariant(severity: AlertSeverity): BadgeVariant {
  const map: Record<AlertSeverity, BadgeVariant> = {
    Info: 'neutral',
    Warning: 'moderate',
    High: 'high',
    Critical: 'critical',
  };
  return map[severity];
}

export function alertStatusToBadgeVariant(status: AlertStatus): BadgeVariant {
  const map: Record<AlertStatus, BadgeVariant> = {
    Active: 'reported',
    Acknowledged: 'under-review',
    Resolved: 'resolved',
  };
  return map[status];
}

export function deliveryStatusToBadgeVariant(status: DeliveryStatus): BadgeVariant {
  const map: Record<DeliveryStatus, BadgeVariant> = {
    Planned: 'neutral',
    'In Transit': 'in-transit',
    Delayed: 'delayed',
    Delivered: 'active',
    'At Risk': 'at-risk',
  };
  return map[status];
}
