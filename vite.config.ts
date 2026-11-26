import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
export default defineConfig({
  base: '/expenses/',
  plugins: [
    tailwindcss(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon.ico', 'apple-touch-icon.png', 'icon-*.png', 'pwa-*.png', 'logo.webp'],
      manifest: {
        name: 'Expenses — Personal Finance',
        short_name: 'Expenses',
        description: 'Track your daily expenses quickly and simply',
        theme_color: '#0f1f3d',
        background_color: '#0f1f3d',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/expenses/',
        start_url: '/expenses/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
})
