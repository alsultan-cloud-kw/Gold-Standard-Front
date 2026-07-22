import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { accountsApi, authApi } from '@/services/api'
import {
  asSingleCustomerProfile,
  isBasicProfileComplete,
  isCivilIdUploaded,
  isCustomerKycComplete,
  resolveKycQuestions,
} from '@/lib/customerCompliance'
import { isStaffRole } from '@/utils/authRedirect'

/**
 * Customer profile + Ministry KYC readiness for gated commerce features.
 * Staff/admin must complete the same profile, KYC, and Civil ID before storefront checkout.
 */
export function useCustomerCompliance() {
  const { user, isAuthenticated, isLoading: authLoading, isClerkSyncing } = useAuth()
  const authPending = authLoading || isClerkSyncing
  const staffRole = isStaffRole(user?.role)
  const enabled = isAuthenticated && !!user && !authPending

  const profileQuery = useQuery({
    queryKey: ['myCustomerProfile'],
    queryFn: () => accountsApi.getMyProfile() as Promise<unknown>,
    enabled,
    staleTime: 15_000,
  })

  const questionsQuery = useQuery({
    queryKey: ['kycQuestions'],
    queryFn: () => authApi.getKycQuestions(),
    enabled,
    staleTime: 60_000,
  })

  const profile = asSingleCustomerProfile(profileQuery.data)
  const questions = useMemo(
    () => resolveKycQuestions(questionsQuery.data),
    [questionsQuery.data],
  )

  const profileFetched = !enabled || profileQuery.isFetched
  const questionsFetched = !enabled || questionsQuery.isFetched
  const isLoading =
    authPending || (enabled && (!profileFetched || !questionsFetched || profileQuery.isLoading))

  const basicProfileComplete = isBasicProfileComplete(user)
  const kycComplete = profileFetched && questionsFetched
    ? isCustomerKycComplete(profile, questions)
    : false
  const civilIdComplete = profileFetched ? isCivilIdUploaded(profile) : false

  const complianceComplete = basicProfileComplete && kycComplete && civilIdComplete

  return {
    isLoading,
    enabled,
    staffRole,
    profile,
    questions,
    basicProfileComplete,
    kycComplete,
    civilIdComplete,
    complianceComplete,
    profileFetched,
    refetchProfile: profileQuery.refetch,
  }
}
