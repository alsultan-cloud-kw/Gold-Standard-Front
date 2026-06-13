/** Cloudflare Turnstile site key (public — safe in the browser bundle). */
export const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? ''

export const isTurnstileConfigured = Boolean(turnstileSiteKey)
