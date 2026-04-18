import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  // Root-relative assets so deep links (e.g. /products/slug) load /assets/* correctly.
  // Relative base ('./') breaks shared URLs: ./assets/ resolves under /products/assets/.
  base: '/',
  envPrefix: ['VITE_', 'BACKEND_'],
  plugins: [inspectAttr(), react()],
  server: {
    proxy: {
      // Same-origin in dev → no browser CORS. Target must match `python manage.py runserver` host/port.
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/media': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      // Home news section → Sultan Gold Laravel test API (avoids browser CORS in dev)
      '/sultan-gold-news-api': {
        target: 'https://apii.test.sultangold.net',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/sultan-gold-news-api/, '/public/api'),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
