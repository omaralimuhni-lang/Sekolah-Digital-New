import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo-v2.png'],
        manifest: {
          name: 'Sekolah Digital',
          short_name: 'Sekolah Digital',
          description: 'Aplikasi Manajemen Sekolah Digital PWA',
          theme_color: '#4f46e5',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'logo-v2.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'logo-v2.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'pwa-192x192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: 'pwa-512x512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any'
            },
            {
              src: 'pwa-192x192.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'maskable'
            },
            {
              src: 'pwa-512x512.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2,ttf,eot}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 15000000, // 15MB
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api/],
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.destination === 'document' || request.destination === 'script' || request.destination === 'style',
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'sd-assets-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'sd-images-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] }
              }
            },
            {
              urlPattern: ({ url, sameOrigin }) =>
                sameOrigin &&
                !url.pathname.startsWith('/api') &&
                !url.pathname.startsWith('/socket.io'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'sd-general-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
