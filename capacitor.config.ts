import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.github.thesousaleo.acervo',
  appName: 'Acervo',
  webDir: 'dist',
  backgroundColor: '#06080F',
  android: {
    // O app desenha por trás das barras do sistema; o CSS usa as safe areas.
    adjustMarginsForEdgeToEdge: 'disable'
  },
  plugins: {
    StatusBar: { overlaysWebView: true, style: 'DARK', backgroundColor: '#00000000' }
  }
};

export default config;
