import type { User } from '../types'
import { safeAppNextPath } from './safeNextPath'

export const STAFF_ROLES = ['cashier', 'branch_manager', 'general_manager', 'admin'] as const

export function isStaffRole(role: string | undefined): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role)
}

/** Where to send a user after login/register when `next` is absent or invalid. */
export function resolvePostAuthPath(user: User | null | undefined, nextRaw?: string | null): string {
  const next = safeAppNextPath(nextRaw ?? null)
  if (next) return next
  if (isStaffRole(user?.role)) return '/admin'
  return '/dashboard'
}
