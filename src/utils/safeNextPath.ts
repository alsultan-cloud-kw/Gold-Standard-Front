/**
 * Validates `next` query values for post-login/register redirects.
 * Allows same-origin relative paths only (blocks `//evil.com` open redirects).
 */
export function safeAppNextPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null
  const t = raw.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return null
  return t
}
