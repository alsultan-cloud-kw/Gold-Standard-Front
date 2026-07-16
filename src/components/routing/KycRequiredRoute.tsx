import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ProtectedRoute, AuthLoadingFallback } from '@/components/routing/ProtectedRoute'
import { useCustomerCompliance } from '@/hooks/useCustomerCompliance'
import { useAuth } from '@/contexts/AuthContext'
import { clearMociKycSkip } from '@/lib/customerCompliance'

function KycComplianceGate({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const { isLoading, complianceComplete, kycComplete, basicProfileComplete } =
    useCustomerCompliance()
  const toasted = useRef(false)

  useEffect(() => {
    if (isLoading || complianceComplete || toasted.current) return
    toasted.current = true
    clearMociKycSkip(user?.id)
    toast.info(t('auth.kyc.requiredForFeature'), {
      id: 'kyc-required-feature',
      description: t('auth.kyc.requiredForFeatureDesc'),
      duration: 6000,
    })
  }, [isLoading, complianceComplete, t, user?.id])

  if (isLoading) {
    return <AuthLoadingFallback message={t('common.loading')} />
  }

  if (!complianceComplete) {
    const reason = !basicProfileComplete ? 'profile' : !kycComplete ? 'kyc' : 'profile'
    return (
      <Navigate
        to={`/dashboard?tab=profile&complete=${reason}`}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <>{children}</>
}

/**
 * Requires signed-in + verified account, then completed profile + Ministry KYC.
 * Used for holdings, checkout, and other compliance-gated commerce surfaces.
 */
export function KycRequiredRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <KycComplianceGate>{children}</KycComplianceGate>
    </ProtectedRoute>
  )
}
