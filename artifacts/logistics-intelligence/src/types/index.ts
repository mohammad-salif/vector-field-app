export type RouteStatus = 'accessible' | 'at-risk' | 'blocked';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type VehicleStatus = 'in-transit' | 'idle' | 'loading' | 'delayed' | 'maintenance';
export type IncidentStatus = 'Reported' | 'Under Review' | 'Resolved';
export type Severity = 'low' | 'moderate' | 'high' | 'critical';
export type SyncState =
  | 'SYNCED'
  | 'PENDING_SYNC'
  | 'FAILED'
  | 'OFFLINE_LOCAL'
  | 'BLUETOOTH_RELAYED'
  | 'BLUETOOTH_RECEIVED';
export type IncidentType =
  | 'Road Blockage'
  | 'Landslide'
  | 'Flood'
  | 'Accident'
  | 'Road Damage'
  | 'Bridge Damage'
  | 'Vehicle Issue'
  | 'Other Field Incident'
  | 'Other Accessibility Disruption';
export type CargoCategory =
  | 'Perishables'
  | 'Hazardous Materials'
  | 'General Freight'
  | 'Medical Supplies'
  | 'Construction'
  | 'Electronics';

export type DeliveryCommodity =
  | 'Medicines'
  | 'Food'
  | 'Agricultural Produce'
  | 'Construction Materials';

export type DeliveryStatus =
  | 'Planned'
  | 'In Transit'
  | 'Delayed'
  | 'Delivered'
  | 'At Risk';

export interface Delivery {
  id: string;
  commodity: DeliveryCommodity;
  origin: string;
  destination: string;
  vehicleId: string;
  routeId: string;
  status: DeliveryStatus;
  eta: string;
}

export interface MapPoint {
  x: number;
  y: number;
}

export interface RouteSegment {
  id: string;
  label: string;
  points: MapPoint[];
  status: RouteStatus;
  riskLevel: RiskLevel;
  riskScore: number;
  riskFactor?: string;
  distance: string;
  estimatedTravelTime: string;
  alternativeAvailable: boolean;
  alternativeRouteId?: string;
  alternativeTravelTime?: string;
  origin: string;
  destination: string;
}

export interface Vehicle {
  id: string;
  cargoCategory: CargoCategory;
  status: VehicleStatus;
  origin: string;
  destination: string;
  estimatedArrival: string;
  routeStatus: RouteStatus;
  position: MapPoint;
  routeId: string;
}

export interface Incident {
  id: string;
  type: string;
  location: string;
  severity: Severity;
  status: IncidentStatus;
  timestamp: string;
  position: MapPoint;
  description: string;
  photoName?: string;
  photoDataUrl?: string;
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number;
  routeId?: string;
  reportedBy?: string;
  syncState?: SyncState;
  localOnly?: boolean;
  outboxId?: string;
}

export type MapFilter =
  | 'all'
  | 'vehicles'
  | 'accessible'
  | 'at-risk'
  | 'blocked'
  | 'incidents';

export type SelectionType = 'vehicle' | 'incident' | 'route';

export interface Selection {
  type: SelectionType;
  id: string;
}

export type FleetVehicleStatus = 'Active' | 'Delayed' | 'Offline';
export type FleetVehicleType =
  | 'Refrigerated Truck'
  | 'Flatbed Truck'
  | 'Box Truck'
  | 'Tanker Truck'
  | 'Cargo Van'
  | 'Heavy Haul';

export interface FleetVehicle {
  id: string;
  type: FleetVehicleType;
  cargoCategory: CargoCategory;
  origin: string;
  destination: string;
  status: FleetVehicleStatus;
  routeStatus: RouteStatus;
  eta: string;
  lastUpdated: string;
  operationalNote: string;
}

export type VehicleListFilter =
  | 'all'
  | 'Active'
  | 'Delayed'
  | 'Offline'
  | 'At Risk'
  | 'Blocked';

export type AlertType =
  | 'High Route Risk'
  | 'Road Blockage'
  | 'Delivery Delay'
  | 'Accessibility Disruption'
  | 'Vehicle Risk';

export type AlertSeverity = 'Info' | 'Warning' | 'High' | 'Critical';
export type AlertStatus = 'Active' | 'Acknowledged' | 'Resolved';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  routeId?: string;
  vehicleId?: string;
  deliveryId?: string | null;
  location: string;
  timestamp: string;
  status: AlertStatus;
  title?: string;
  description?: string;
  source?: string;
  sourceDeviceId?: string;
  isRelayed?: boolean;
  syncState?: SyncState | 'BLUETOOTH RECEIVED';
}
