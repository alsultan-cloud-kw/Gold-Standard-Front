import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useCustomerCompliance } from '@/hooks/useCustomerCompliance'
import { clearMociKycSkip } from '@/lib/customerCompliance'

const PROFILE_COMPLETE_PATH = '/dashboard?tab=profile&complete=kyc'

/** Guests cannot purchase. Signed-in customers need profile + Ministry KYC before buy/checkout. */
export function usePurchaseAuth() {
  const { isAuthenticated, isLoading, isClerkSyncing, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { t } = useTranslation()
  const {
    isLoading: complianceLoading,
    complianceComplete,
    kycComplete,
  } = useCustomerCompliance()

  const needsVerification = Boolean(user && user.is_verified === false)
  const needsKyc = isAuthenticated && !complianceLoading && !complianceComplete
  const authPending = isLoading || isClerkSyncing || (isAuthenticated && complianceLoading)

  const loginHref = useCallback(
    (nextPath?: string) => {
      const next = nextPath ?? `${location.pathname}${location.search}`
      return `/login?next=${encodeURIComponent(next)}`
    },
    [location.pathname, location.search],
  )

  /**
   * Returns true if the user may purchase / open checkout.
   * Guests → login. Incomplete profile or KYC → dashboard profile.
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
        navigate('/verify-account')
        return false
      }

      if (!complianceComplete) {
        clearMociKycSkip(user?.id)
        toast.info(t('auth.kyc.requiredToBuy'), {
          id: 'purchase-kyc-required',
          description: t('auth.kyc.requiredToBuyDesc'),
          duration: 6000,
        })
        navigate(
          !kycComplete
            ? PROFILE_COMPLETE_PATH
            : '/dashboard?tab=profile&complete=profile',
        )
        return false
      }

      return true
    },
    [
      authPending,
      isAuthenticated,
      needsVerification,
      complianceComplete,
      kycComplete,
      navigate,
      loginHref,
      t,
      user?.id,
    ],
  )

  return {
    isAuthenticated,
    isLoading: authPending,
    isVerified: isAuthenticated && !needsVerification,
    needsVerification,
    needsKyc,
    complianceComplete,
    ensureCanPurchase,
    loginHref,
  }
}
