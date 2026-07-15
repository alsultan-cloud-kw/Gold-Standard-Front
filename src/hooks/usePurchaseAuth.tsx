import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

/** Guest / unverified customers cannot purchase. */
export function usePurchaseAuth() {
  const { isAuthenticated, isLoading, isClerkSyncing, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()

  /** Explicitly unverified (API sent false). Missing flag treated as OK for older payloads. */
  const needsVerification = Boolean(user && user.is_verified === false)
  const authPending = isLoading || isClerkSyncing

  const loginHref = useCallback(
    (nextPath?: string) => {
      const next = nextPath ?? `${location.pathname}${location.search}`
      return `/login?next=${encodeURIComponent(next)}`
    },
    [location.pathname, location.search],
  )

  /**
   * Returns true if the user may purchase.
   * Guests → login (with return path). Unverified → toast + dashboard.
   */
  const ensureCanPurchase = useCallback(
    (nextPath?: string): boolean => {
      if (authPending) return false

      if (!isAuthenticated) {
        toast.info(t('auth.loginRequiredToBuy'), {
          id: 'purchase-login-required',
          description: t('auth.loginRequiredToBuyDesc'),
        })
        navigate(loginHref(nextPath ?? '/checkout'))
        return false
      }

      if (needsVerification) {
        toast.error(t('auth.verificationRequiredToBuy'), {
          id: 'purchase-verify-required',
          description: t('auth.verificationRequiredToBuyDesc'),
        })
        navigate('/dashboard?tab=profile')
        return false
      }

      return true
    },
    [authPending, isAuthenticated, needsVerification, navigate, loginHref, t],
  )

  return {
    isAuthenticated,
    isLoading: authPending,
    isVerified: isAuthenticated && !needsVerification,
    needsVerification,
    ensureCanPurchase,
    loginHref,
  }
}
