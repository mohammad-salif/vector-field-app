import type { RiskLevel } from '@/types';
import { getRouteById } from '@/services/mapService';

export interface RouteRisk {
  riskLevel: RiskLevel;
  riskScore: number;
  riskFactor?: string;
}

/**
 * Route risk is intentionally sourced from the shared mock route dataset.
 * This seam can later be replaced with a prediction API without changing
 * the Routes page UI.
 */
export function getRouteRisk(routeId: string): RouteRisk | undefined {
  const route = getRouteById(routeId);
  if (!route) return undefined;

  return {
    riskLevel: route.riskLevel,
    riskScore: route.riskScore,
    riskFactor: route.riskFactor,
  };
}