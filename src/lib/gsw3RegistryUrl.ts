/** Public GSW3 blockchain registry (verify pages live here, not on www). */
export const GSW3_REGISTRY_ORIGIN = 'https://registry.goldstandardkw.com'

const VERIFY_UUID_PATH = /^\/verify\/([0-9a-f-]{36})\/?$/i

/**
 * Resolve a GSW3 verify URL to the registry subdomain.
 * Rewrites mistaken www/main-site `/verify/{uuid}` links that 404.
 */
export function resolveGsw3RegistryUrl(
  url: string | null | undefined,
  barId?: string | null,
): string | null {
  const id = (barId || '').trim()
  const fromBarId = id ? `${GSW3_REGISTRY_ORIGIN}/verify/${id}` : null

  const raw = (url || '').trim()
  if (!raw) return fromBarId

  if (raw.startsWith('/verify/')) {
    const match = raw.match(VERIFY_UUID_PATH)
    if (match) return `${GSW3_REGISTRY_ORIGIN}/verify/${match[1]}`
    return fromBarId
  }

  try {
    const parsed = new URL(raw)
    const match = parsed.pathname.match(VERIFY_UUID_PATH)
    if (match) {
      return `${GSW3_REGISTRY_ORIGIN}/verify/${match[1]}`
    }
    if (parsed.hostname === 'registry.goldstandardkw.com' && parsed.protocol === 'https:') {
      return raw
    }
  } catch {
    return fromBarId
  }

  return fromBarId
}
