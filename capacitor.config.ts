import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.gaptekman.dyad',
  appName: 'Dyad',
  webDir: 'dist-native',
  backgroundColor: '#111211',
  // Keep these origins stable: IndexedDB belongs to the native WebView origin.
  // Bundle local assets; never point a release build at the hosted website.
  server: { hostname: 'localhost', androidScheme: 'https', iosScheme: 'capacitor' },
  android: { allowMixedContent: false, webContentsDebuggingEnabled: false },
  ios: { contentInset: 'automatic', backgroundColor: '#111211' },
};

export default config;
