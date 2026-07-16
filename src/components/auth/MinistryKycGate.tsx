import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { accountsApi, authApi } from '@/services/api'
import type { KycQuestion } from '@/components/auth/KycRegistrationFields'
import {
  MinistryKycModal,
  type KycAnswerMap,
} from '@/components/auth/MinistryKycModal'
import { DEFAULT_MOCI_KYC_QUESTIONS } from '@/lib/defaultMociKycQuestions'
import type { CustomerProfile } from '@/types'

const SKIP_STORAGE_PREFIX = 'gs.mociKyc.skipped.'

function asSingleProfile(data: unknown): CustomerProfile | null {
  if (!data) return null
  if (Array.isArray(data)) {
    const first = data[0]
    return first && typeof first === 'object' ? (first as CustomerProfile) : null
  }
  if (typeof data === 'object' && data !== null && 'results' in data) {
    const results = (data as { results?: unknown[] }).results
    const first = Array.isArray(results) ? results[0] : null
    return first && typeof first === 'object' ? (first as CustomerProfile) : null
  }
  if (typeof data === 'object' && data !== null && 'id' in data) {
    return data as CustomerProfile
  }
  return null
}

function asQuestions(data: unknown): KycQuestion[] {
  const list =
    data && typeof data === 'object' && data !== null && 'questions' in data
      ? (data as { questions: unknown }).questions
      : null
  return Array.isArray(list) ? (list as KycQuestion[]) : []
}

function answersLookComplete(
  answers: Record<string, string | boolean> | null | undefined,
  questions: KycQuestion[],
): boolean {
  if (!answers || typeof answers !== 'object') return false
  for (const q of questions) {
    if (!q.is_required) continue
    const raw = answers[q.question_key]
    if (q.input_type === 'boolean') {
      if (raw !== true && String(raw).toLowerCase() !== 'true') return false
      continue
    }
    if (q.input_type === 'multi_select') {
      const parts = String(raw ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      if (!parts.length) return false
      continue
    }
    if (raw == null || String(raw).trim() === '') return false
  }
  return true
}

function readSkipped(userId: string | number | undefined): boolean {
  if (userId == null) return false
  try {
    return sessionStorage.getItem(`${SKIP_STORAGE_PREFIX}${userId}`) === '1'
  } catch {
    return false
  }
}

function writeSkipped(userId: string | number | undefined, value: boolean) {
  if (userId == null) return
  try {
    const key = `${SKIP_STORAGE_PREFIX}${userId}`
    if (value) sessionStorage.setItem(key, '1')
    else sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

/**
 * Soft reminder for Ministry KYC — does not block shopping or checkout.
 * Returning customers can dismiss and buy; profile banner still asks them to finish later.
 */
export default function MinistryKycGate() {
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoading, isClerkSyncing } = useAuth()
  const queryClient = useQueryClient()
  const [dismissed, setDismissed] = useState(() => readSkipped(user?.id))
  const [saving, setSaving] = useState(false)

  const enabled = isAuthenticated && !!user && !isLoading && !isClerkSyncing

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

  const profile = asSingleProfile(profileData)
  const questions = useMemo(() => {
    const fromApi = asQuestions(questionsData)
    return fromApi.length > 0 ? fromApi : DEFAULT_MOCI_KYC_QUESTIONS
  }, [questionsData])

  const incomplete = useMemo(() => {
    if (!enabled || !profileFetched || !profile || questions.length === 0) return false
    if (profile.kyc_registration_complete === true) return false
    if (profile.kyc_registration_complete === false) return true
    return !answersLookComplete(profile.kyc_registration_answers, questions)
  }, [enabled, profileFetched, profile, questions])

  useEffect(() => {
    setDismissed(readSkipped(user?.id))
  }, [user?.id])

  useEffect(() => {
    if (profile?.kyc_registration_complete === true) {
      writeSkipped(user?.id, false)
      setDismissed(false)
    }
  }, [profile?.kyc_registration_complete, user?.id])

  const open = incomplete && !dismissed

  const dismissForShopping = useCallback(() => {
    writeSkipped(user?.id, true)
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
        writeSkipped(user?.id, false)
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
      onClose={dismissForShopping}
    />
  )
}
