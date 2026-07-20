/**
 * Validates `next` / `returnUrl` query values for post-login/register redirects.
 * Allows same-origin relative paths only (blocks `//evil.com` open redirects).
 */
export function safeAppNextPath(raw: string | null | undefined): string | null {
  if (raw == null || typeof raw !== 'string') return null
  const t = raw.trim()
  if (!t.startsWith('/') || t.startsWith('//')) return null
  // Club invite and other deep links may include query strings
  if (t.includes('://')) return null
  return t
}

/** Prefer `next`, fall back to `returnUrl` (alias used by club invite flows). */
export function resolveAuthReturnPath(
  nextRaw: string | null | undefined,
  returnUrlRaw?: string | null | undefined,
): string | null {
  return safeAppNextPath(nextRaw) ?? safeAppNextPath(returnUrlRaw)
}
