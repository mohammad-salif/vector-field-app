import type { Delivery } from '@/types';
import { mockDeliveries } from '@/data/deliveryData';

export function getDeliveries(): Delivery[] {
  return mockDeliveries;
}

export function getDeliveryById(id: string): Delivery | undefined {
  return mockDeliveries.find((delivery) => delivery.id === id);
}