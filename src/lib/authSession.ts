/** Absolute website session length (aligned with Django SIMPLE_JWT). */
export const SESSION_DURATION_MS = 30 * 60 * 1000

export const SESSION_EXPIRES_AT_KEY = 'gs_session_expires_at'

export const SESSION_EXPIRED_EVENT = 'gs:session-expired'

let expiredNotified = false
let pendingExpiredUi = false

export function decodeJwtExpMs(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2 || !parts[1]) return null
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    const json = JSON.parse(atob(padded)) as { exp?: unknown }
    if (typeof json.exp !== 'number') return null
    return json.exp * 1000
  } catch {
    return null
  }
}

export function getSessionExpiresAt(): number | null {
  const raw = localStorage.getItem(SESSION_EXPIRES_AT_KEY)
  if (!raw) return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

function writeSessionExpiresAt(expiresAt: number) {
  localStorage.setItem(SESSION_EXPIRES_AT_KEY, String(expiresAt))
}

/**
 * Start (or restart) the absolute website session clock.
 * Always 30 minutes from login — independent of refresh-token lifetime (shared with mobile).
 */
export function beginAuthSession(_access: string, _refresh: string) {
  expiredNotified = false
  pendingExpiredUi = false
  writeSessionExpiresAt(Date.now() + SESSION_DURATION_MS)
}

/**
 * Ensure a deadline exists for tokens loaded from storage (first visit after upgrade).
 * Caps remaining life at 30 minutes.
 */
export function hydrateSessionDeadline() {
  if (getSessionExpiresAt() != null) return
  const access = localStorage.getItem('access_token')
  const refresh = localStorage.getItem('refresh_token')
  if (!access && !refresh) return
  const now = Date.now()
  const fromAccess = access ? decodeJwtExpMs(access) : null
  // Prefer access exp when present; never exceed 30 minutes from now.
  const candidate = fromAccess ?? now + SESSION_DURATION_MS
  writeSessionExpiresAt(Math.min(candidate, now + SESSION_DURATION_MS))
}

export function isAuthSessionExpired(): boolean {
  const exp = getSessionExpiresAt()
  if (exp == null) {
    const access = localStorage.getItem('access_token')
    if (!access) return true
    const accessExp = decodeJwtExpMs(access)
    if (accessExp == null) return false
    return Date.now() >= accessExp
  }
  return Date.now() >= exp
}

export function clearSessionDeadline() {
  localStorage.removeItem(SESSION_EXPIRES_AT_KEY)
}

export function clearAuthTokensAndDeadline() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  clearSessionDeadline()
}

export function resetSessionExpiredFlag() {
  expiredNotified = false
  pendingExpiredUi = false
}

/** Clear tokens and broadcast once — UI shows the branded session modal. */
export function notifySessionExpired() {
  if (expiredNotified) return
  expiredNotified = true
  pendingExpiredUi = true
  clearAuthTokensAndDeadline()
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
  }
}

/** True once if expiry fired before the modal listener was ready. */
export function consumePendingSessionExpiredUi(): boolean {
  if (!pendingExpiredUi) return false
  pendingExpiredUi = false
  return true
}

export function acknowledgeSessionExpiredUi() {
  pendingExpiredUi = false
}

export function msUntilSessionExpiry(): number {
  const exp = getSessionExpiresAt()
  if (exp == null) return 0
  return Math.max(0, exp - Date.now())
}
