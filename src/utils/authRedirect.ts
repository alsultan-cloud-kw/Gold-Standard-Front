import type { User } from '../types'
import { resolveAuthReturnPath } from './safeNextPath'

export const STAFF_ROLES = ['cashier', 'branch_manager', 'general_manager', 'admin'] as const

export function isStaffRole(role: string | undefined): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role)
}

/** Where to send a user after login/register when `next` / `returnUrl` is absent or invalid. */
export function resolvePostAuthPath(
  user: User | null | undefined,
  nextRaw?: string | null,
  returnUrlRaw?: string | null,
): string {
  const next = resolveAuthReturnPath(nextRaw, returnUrlRaw)
  // Email/phone accounts must confirm via SES or WhatsApp before full access.
  if (user && user.is_verified === false && !isStaffRole(user.role)) {
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
