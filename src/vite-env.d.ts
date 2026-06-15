/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_API_URL?: string
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string
  readonly VITE_CLERK_PROXY_URL?: string
  readonly VITE_TURNSTILE_SITE_KEY?: string
  /** Google OAuth Web client ID (same as Clerk → Google custom credentials). Enables One Tap UI. */
  readonly VITE_GOOGLE_CLIENT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
