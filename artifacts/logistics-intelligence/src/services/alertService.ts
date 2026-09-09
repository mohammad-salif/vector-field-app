import type { Alert } from '@/types';
import { mockAlerts } from '@/data/alertData';

export function getAlerts(): Alert[] {
  return mockAlerts;
}

export function getAlertById(id: string): Alert | undefined {
  return mockAlerts.find((alert) => alert.id === id);
}