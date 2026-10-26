import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base relativo: funciona no GitHub Pages (/acervo/) e dentro do APK (Capacitor).
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 }
});
