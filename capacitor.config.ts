import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ibexprojectorsindia.app',
  appName: 'IbexProjectorsIndia',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    backgroundColor: '#F8FAFC',
    allowMixedContent: false,
  },
};

export default config;
