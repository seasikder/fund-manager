import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bagdevisangha.fundmanager',
  appName: 'Bagdevi Sangha Fund Manager',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
