import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { dbWriterPlugin } from './vite-plugin-db-writer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dbWriterPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'vite.svg'],
      manifest: {
        name: 'Qué Comemos',
        short_name: 'Qué Comemos',
        description: 'Decide qué cocinar hoy basándote en los ingredientes que tienes en casa',
        theme_color: '#FF1744',
        background_color: '#FFF9E6',
        display: 'standalone',
        icons: [
          {
            src: 'vite.svg',
            sizes: 'any',
            type: 'image/svg+xml',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/www\.themealdb\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'themealdb-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
              },
            },
          },
        ],
      },
    }),
  ],
})
