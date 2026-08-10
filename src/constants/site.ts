/** Canonical public site origin (no trailing slash). */
export const SITE_ORIGIN = 'https://www.goldstandardkw.com'

export const SITE_NAME = 'Gold Standard'
export const SITE_NAME_AR = 'جولد ستاندرد'

/** Absolute URL for Open Graph / Twitter share image (1200×630). */
export const SITE_OG_IMAGE = `${SITE_ORIGIN}/og/share-kw.jpg`
export const SITE_OG_IMAGE_WIDTH = 1200
export const SITE_OG_IMAGE_HEIGHT = 630

export function absoluteUrl(path = '/'): string {
  if (!path || path === '/') return `${SITE_ORIGIN}/`
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${SITE_ORIGIN}${normalized}`
}
