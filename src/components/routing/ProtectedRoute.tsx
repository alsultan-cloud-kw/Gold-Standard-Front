import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { useAuth as useClerkAuth } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { RouteErrorBoundary } from '@/components/routing/RouteErrorBoundary'
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

/** In-route loader — keeps global navbar/footer visible (no fixed overlay). */
export function AuthLoadingFallback({ message }: { message?: string }) {
  return (
    <div className="auth-route-loading" aria-busy="true">
      <AppLoadingScreen message={message} variant="page" />
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

  return <RouteErrorBoundary resetHref="/dashboard">{children}</RouteErrorBoundary>
}

/**
 * Auth pages only (login, register, forgot password).
 * Redirects signed-in users away — prevents duplicate login errors.
 */
export function GuestOnlyRoute() {
  const { isAuthenticated, isLoading, isClerkSyncing, user } = useAuth()
  const { isSignedIn, isLoaded: clerkLoaded, signOut } = useClerkAuth()
  const [searchParams] = useSearchParams()
  const [clerkSyncTimedOut, setClerkSyncTimedOut] = useState(false)

  // Avoid endless “completing sign-in” if Clerk→Django exchange stalls.
  useEffect(() => {
    if (!(isSignedIn && !isAuthenticated && clerkLoaded && !isLoading)) {
      setClerkSyncTimedOut(false)
      return
    }
    const id = window.setTimeout(() => {
      setClerkSyncTimedOut(true)
      void signOut().catch(() => undefined)
    }, 12_000)
    return () => window.clearTimeout(id)
  }, [isSignedIn, isAuthenticated, clerkLoaded, isLoading, signOut])

  if (isLoading || !clerkLoaded) {
    return <AuthLoadingFallback />
  }

  if (isClerkSyncing || (isSignedIn && !isAuthenticated && !clerkSyncTimedOut)) {
    return <AuthLoadingFallbackCompleting />
  }

  if (isAuthenticated) {
    return <Navigate to={resolvePostAuthPath(user, searchParams.get('next'))} replace />
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
