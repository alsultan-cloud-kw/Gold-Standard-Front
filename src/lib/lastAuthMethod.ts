/**
 * Remembers the last sign-in method the user completed (Cloudflare-style
 * "Last used" badge on the login page).
 */
export type LastAuthMethod = 'google' | 'apple' | 'email' | 'phone'

const STORAGE_KEY = 'gs_last_auth_method'
const VALID: LastAuthMethod[] = ['google', 'apple', 'email', 'phone']

export function getLastAuthMethod(): LastAuthMethod | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return VALID.includes(raw as LastAuthMethod) ? (raw as LastAuthMethod) : null
  } catch {
    return null
  }
}

export function setLastAuthMethod(method: LastAuthMethod): void {
  try {
    localStorage.setItem(STORAGE_KEY, method)
  } catch {
    // Storage unavailable (private mode) — badge is a nicety, ignore.
  }
}
