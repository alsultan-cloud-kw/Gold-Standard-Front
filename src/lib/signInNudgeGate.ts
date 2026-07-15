import { cancelGoogleOneTap } from '@/lib/googleOneTap'

/** localStorage — user dismissed the custom nudge (24h). */
export const SIGNIN_NUDGE_DISMISS_KEY = 'gs_google_signin_nudge_dismissed_until'
const DISMISS_MS = 24 * 60 * 60 * 1000

/** sessionStorage — auto-prompt already ran this tab session (prevents multi-fire). */
export const SIGNIN_NUDGE_SESSION_KEY = 'gs_signin_nudge_session_done'

/** sessionStorage — suppress nudge after a successful (or in-flight) sign-in. */
export const SIGNIN_NUDGE_SUPPRESS_KEY = 'gs_signin_nudge_suppress'

export function isSignInNudgeDismissed(): boolean {
  try {
    return Number(localStorage.getItem(SIGNIN_NUDGE_DISMISS_KEY) || '0') > Date.now()
  } catch {
    return false
  }
}

export function dismissSignInNudge(ms = DISMISS_MS): void {
  try {
    localStorage.setItem(SIGNIN_NUDGE_DISMISS_KEY, String(Date.now() + ms))
  } catch {
    // ignore
  }
  cancelGoogleOneTap()
}

export function wasSignInNudgeShownThisSession(): boolean {
  try {
    return sessionStorage.getItem(SIGNIN_NUDGE_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function markSignInNudgeShownThisSession(): void {
  try {
    sessionStorage.setItem(SIGNIN_NUDGE_SESSION_KEY, '1')
  } catch {
    // ignore
  }
}

export function isSignInNudgeSuppressed(): boolean {
  try {
    return sessionStorage.getItem(SIGNIN_NUDGE_SUPPRESS_KEY) === '1'
  } catch {
    return false
  }
}

/** Call as soon as JWT is stored / OAuth sync starts — blocks One Tap + custom modal. */
export function suppressSignInNudge(): void {
  try {
    sessionStorage.setItem(SIGNIN_NUDGE_SUPPRESS_KEY, '1')
    sessionStorage.setItem(SIGNIN_NUDGE_SESSION_KEY, '1')
  } catch {
    // ignore
  }
  cancelGoogleOneTap()
}

/** After logout — allow nudge again in this tab (respects 24h dismiss). */
export function clearSignInNudgeSuppress(): void {
  try {
    sessionStorage.removeItem(SIGNIN_NUDGE_SUPPRESS_KEY)
    sessionStorage.removeItem(SIGNIN_NUDGE_SESSION_KEY)
  } catch {
    // ignore
  }
}

export function hasDjangoJwt(): boolean {
  try {
    return Boolean(localStorage.getItem('access_token'))
  } catch {
    return false
  }
}
