import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion'
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('@react-oauth/google')) {
              return 'vendor-react'
            }
          }
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'personal-os-logo.png',
        'personal-os-emblem.png',
        'personal-os-emblem-192.png',
        'personal-os-emblem-512.png',
      ],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallbackDenylist: [/^\/api\//, /^\/ws\//],
      },
      manifest: {
        name: 'PersonalOS',
        short_name: 'PersonalOS',
        description: 'Offline-ready PersonalOS app',
        theme_color: '#0f0f0f',
        background_color: '#0f0f0f',
        display: 'standalone',
        icons: [
          {
            src: 'personal-os-emblem-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'personal-os-emblem-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'personal-os-emblem-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
})
