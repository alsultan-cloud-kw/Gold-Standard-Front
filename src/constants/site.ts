/** Canonical public site origin (no trailing slash). */
export const SITE_ORIGIN = 'https://www.goldstandardkw.com'

export const SITE_NAME = 'Gold Standard'
export const SITE_NAME_AR = 'جولد ستاندرد'

/** Absolute URL for Open Graph / Twitter share image (square brand mark; scrapers accept it). */
export const SITE_OG_IMAGE = `${SITE_ORIGIN}/favicons/android-chrome-512x512.png`

export function absoluteUrl(path = '/'): string {
  if (!path || path === '/') return `${SITE_ORIGIN}/`
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_ORIGIN}${normalized}`
}
