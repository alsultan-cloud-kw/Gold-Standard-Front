import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { accountsApi, authApi } from '@/services/api'
import {
  MinistryKycModal,
  type KycAnswerMap,
} from '@/components/auth/MinistryKycModal'
import {
  asSingleCustomerProfile,
  isCustomerKycComplete,
  readMociKycSkip,
  resolveKycQuestions,
  writeMociKycSkip,
} from '@/lib/customerCompliance'

/**
 * Soft reminder for Ministry KYC on general browsing — can be dismissed.
 * Holdings, checkout, and buy still require KYC via KycRequiredRoute / usePurchaseAuth.
 */
export default function MinistryKycGate() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { user, isAuthenticated, isLoading, isClerkSyncing } = useAuth()
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(() => readMociKycSkip(user?.id))
  const [saving, setSaving] = useState(false)

  const enabled =
    isAuthenticated &&
    !!user &&
    !isLoading &&
    !isClerkSyncing &&
    user.is_verified !== false &&
    pathname !== '/verify-account'

  const { data: profileData, isFetched: profileFetched } = useQuery({
    queryKey: ['myCustomerProfile'],
    queryFn: () => accountsApi.getMyProfile() as Promise<unknown>,
    enabled,
    staleTime: 15_000,
  })

  const { data: questionsData } = useQuery({
    queryKey: ['kycQuestions'],
    queryFn: () => authApi.getKycQuestions(),
    enabled,
    staleTime: 60_000,
  })

  const profile = asSingleCustomerProfile(profileData)
  const questions = useMemo(
    () => resolveKycQuestions(questionsData),
    [questionsData],
  )

  const incomplete = useMemo(() => {
    if (!enabled || !profileFetched || !profile || questions.length === 0) return false
    return !isCustomerKycComplete(profile, questions)
  }, [enabled, profileFetched, profile, questions])

  useEffect(() => {
    setDismissed(readMociKycSkip(user?.id))
  }, [user?.id])

  useEffect(() => {
    if (profile?.kyc_registration_complete === true) {
      writeMociKycSkip(user?.id, false)
      setDismissed(false)
    }
  }, [profile?.kyc_registration_complete, user?.id])

  const open = incomplete && !dismissed

  const dismissForBrowsing = useCallback(() => {
    writeMociKycSkip(user?.id, true)
    setDismissed(true)
    toast.info(t('auth.kyc.skippedToast'), {
      id: 'moci-kyc-skipped',
      duration: 4500,
    })
  }, [t, user?.id])

  const onSubmit = useCallback(
    async (answers: KycAnswerMap) => {
      if (!profile?.id) {
        toast.error(t('auth.kyc.saveFailed'))
        throw new Error('missing profile')
      }
      setSaving(true)
      try {
        await accountsApi.updateProfile(profile.id, {
          kyc_registration_answers: answers,
        })
        writeMociKycSkip(user?.id, false)
        await queryClient.invalidateQueries({ queryKey: ['myCustomerProfile'] })
        toast.success(t('auth.kyc.savedToast'))
      } catch (err) {
        toast.error(t('auth.kyc.saveFailed'))
        throw err
      } finally {
        setSaving(false)
      }
    },
    [profile?.id, queryClient, t, user?.id],
  )

  if (!open) return null

  const initial: KycAnswerMap = {}
  const saved = profile?.kyc_registration_answers
  if (saved && typeof saved === 'object') {
    for (const [k, v] of Object.entries(saved)) {
      if (typeof v === 'string' || typeof v === 'boolean') initial[k] = v
    }
  }

  return (
    <MinistryKycModal
      open
      required={false}
      questions={questions}
      initialAnswers={initial}
      saving={saving}
      onSubmit={onSubmit}
      onClose={dismissForBrowsing}
    />
  )
}
