import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth as useClerkAuth } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import type { User } from '../../types'
import { isStaffRole, resolvePostAuthPath } from '../../utils/authRedirect'

export { isStaffRole }

const CATALOG_MANAGER_ROLES: readonly User['role'][] = [
  'branch_manager',
  'general_manager',
  'admin',
]

function isCatalogManagerRole(role: string | undefined): boolean {
  return !!role && (CATALOG_MANAGER_ROLES as readonly string[]).includes(role)
}

export function AuthLoadingFallback({ message }: { message?: string }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
      <div className="w-12 h-12 border-4 border-lime-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-gold-100/70">{message ?? t('common.loading')}</p>
    </div>
  )
}

function AuthLoadingFallbackCompleting() {
  const { t } = useTranslation()
  return <AuthLoadingFallback message={t('common.completingSignIn')} />
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
 * Auth pages only (login, register, forgot password).
 * Redirects signed-in users away — prevents duplicate login errors.
 */
export function GuestOnlyRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth()
  const [searchParams] = useSearchParams()

  if (isLoading || !clerkLoaded) {
    return <AuthLoadingFallback />
  }

  if (isSignedIn && !isAuthenticated) {
    return <AuthLoadingFallbackCompleting />
  }

  if (isAuthenticated) {
    const target = resolvePostAuthPath(user, searchParams.get('next'))
    return <Navigate to={target} replace />
  }

  return <Outlet />
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

/**
 * Catalog managers only — product/category admin in website.
 */
export function CatalogManagerRoute() {
  const { isAuthenticated, isLoading, user } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoadingFallback />
  }

  if (!isAuthenticated) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  if (!isCatalogManagerRole(user?.role)) {
    return <Navigate to="/admin" replace />
  }

  return <Outlet />
}
