import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import type { User } from '../../types'

const STAFF_ROLES: readonly User['role'][] = [
  'cashier',
  'branch_manager',
  'general_manager',
  'admin',
]

function isStaffRole(role: string | undefined): boolean {
  return !!role && (STAFF_ROLES as readonly string[]).includes(role)
}

function AuthLoadingFallback() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gold-100/70">Loading…</p>
    </div>
  )
}

/** Any signed-in user (storefront or staff). */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoadingFallback />
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  return <>{children}</>
}

/**
 * Staff-only layout for `/admin/*`.
 * Use as a parent route: `<Route element={<StaffRoute />}>…</Route>`.
 */
export function StaffRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoadingFallback />
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (!isStaffRole(user?.role)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
