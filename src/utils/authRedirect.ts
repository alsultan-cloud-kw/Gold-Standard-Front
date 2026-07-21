import type { User } from '../types'
import { resolveAuthReturnPath } from './safeNextPath'
import { getLastAuthMethod } from '@/lib/lastAuthMethod'

export const STAFF_ROLES = ['cashier', 'branch_manager', 'general_manager', 'admin'] as const

export function isStaffRole(role: string | undefined): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role)
}

function isOAuthVerifiedSession(): boolean {
  const method = getLastAuthMethod()
  return method === 'google' || method === 'apple'
}

export { isOAuthVerifiedSession }

/** Where to send a user after login/register when `next` / `returnUrl` is absent or invalid. */
export function resolvePostAuthPath(
  user: User | null | undefined,
  nextRaw?: string | null,
  returnUrlRaw?: string | null,
): string {
  const next = resolveAuthReturnPath(nextRaw, returnUrlRaw)
  // Google/Apple OAuth users are verified by the provider — skip OTP gate.
  if (
    user &&
    user.is_verified === false &&
    !isStaffRole(user.role) &&
    !isOAuthVerifiedSession()
  ) {
    if (next) {
      const q = encodeURIComponent(next)
      return `/verify-account?next=${q}&returnUrl=${q}`
    }
    return '/verify-account'
  }
  if (next) return next
  if (isStaffRole(user?.role)) return '/admin'
  return '/dashboard'
}
