import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'app-icon.png'],
        manifest: {
          name: 'Diário Alimentar',
          short_name: 'Diário',
          description: 'Registre suas refeições em um diário alimentar simples e pessoal.',
          theme_color: '#f7f5ed',
          background_color: '#f7f5ed',
          display: 'standalone',
          orientation: 'portrait',
          icons: [{ src: '/app-icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' }]
        }
      })
  ]
});
