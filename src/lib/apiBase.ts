/** Base URL for REST calls (no trailing slash). In Vite dev, defaults to `/api` (proxied → Django). */
export function getApiBaseUrl(): string {
  const env = import.meta.env as unknown as Record<string, string | boolean | undefined>
  const v = env.VITE_BACKEND_API_URL ?? env.VITE_API_URL ?? env.BACKEND_API_URL
  if (typeof v === 'string' && v.trim()) return v.trim().replace(/\/$/, '')
  if (import.meta.env.DEV) return '/api'
  // Vercel/production builds must not fall back to localhost (browser cannot reach it).
  return 'https://api.goldstandardkw.com/api'
}
