import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'gov.in.logistics.field',
  appName: 'Logistics Intelligence Field',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
