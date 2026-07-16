import type { User } from '../types'
import { safeAppNextPath } from './safeNextPath'

export const STAFF_ROLES = ['cashier', 'branch_manager', 'general_manager', 'admin'] as const

export function isStaffRole(role: string | undefined): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role)
}

/** Where to send a user after login/register when `next` is absent or invalid. */
export function resolvePostAuthPath(user: User | null | undefined, nextRaw?: string | null): string {
  const next = safeAppNextPath(nextRaw ?? null)
  // Email/phone accounts must confirm via SES or WhatsApp before full access.
  if (user && user.is_verified === false && !isStaffRole(user.role)) {
    return '/verify-account'
  }
  if (next) return next
  if (isStaffRole(user?.role)) return '/admin'
  return '/dashboard'
}
