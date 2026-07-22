import type { KycQuestion } from '@/components/auth/KycRegistrationFields'
import { DEFAULT_MOCI_KYC_QUESTIONS } from '@/lib/defaultMociKycQuestions'
import type { CustomerProfile } from '@/types'

const SKIP_STORAGE_PREFIX = 'gs.mociKyc.skipped.'

export function asSingleCustomerProfile(data: unknown): CustomerProfile | null {
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

export function asKycQuestions(data: unknown): KycQuestion[] {
  const list =
    data && typeof data === 'object' && data !== null && 'questions' in data
      ? (data as { questions: unknown }).questions
      : null
  return Array.isArray(list) ? (list as KycQuestion[]) : []
}

export function resolveKycQuestions(data: unknown): KycQuestion[] {
  const fromApi = asKycQuestions(data)
  return fromApi.length > 0 ? fromApi : DEFAULT_MOCI_KYC_QUESTIONS
}

export function answersLookComplete(
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

/** Ministry KYC answers complete for this customer profile. */
export function isCustomerKycComplete(
  profile: CustomerProfile | null | undefined,
  questions: KycQuestion[],
): boolean {
  if (!profile || questions.length === 0) return false
  if (profile.kyc_registration_complete === true) return true
  if (profile.kyc_registration_complete === false) return false
  return answersLookComplete(profile.kyc_registration_answers, questions)
}

/** Basic identity present on the signed-in user (name + contact + date of birth). */
export function isBasicProfileComplete(user: {
  full_name?: string | null
  email?: string | null
  phone_number?: string | null
  date_of_birth?: string | null
} | null | undefined): boolean {
  if (!user) return false
  const name = String(user.full_name ?? '').trim()
  const email = String(user.email ?? '').trim()
  const phone = String(user.phone_number ?? '').trim()
  const dob = String(user.date_of_birth ?? '').trim()
  return name.length > 1 && (email.length > 0 || phone.length > 0) && dob.length > 0
}

/** Civil ID front + back uploaded on the customer profile. */
export function isCivilIdUploaded(profile: CustomerProfile | null | undefined): boolean {
  if (!profile) return false
  const front = String(profile.civil_id_front ?? '').trim()
  const back = String(profile.civil_id_back ?? '').trim()
  return front.length > 0 && back.length > 0
}

export type PurchaseComplianceReason = 'profile' | 'kyc' | 'civil_id'

/** First missing requirement for dashboard deep-link / messaging. */
export function purchaseComplianceReason(
  user: Parameters<typeof isBasicProfileComplete>[0],
  profile: CustomerProfile | null | undefined,
  questions: KycQuestion[],
): PurchaseComplianceReason | null {
  if (!isBasicProfileComplete(user)) return 'profile'
  if (!isCustomerKycComplete(profile, questions)) return 'kyc'
  if (!isCivilIdUploaded(profile)) return 'civil_id'
  return null
}

export function clearMociKycSkip(userId: string | number | undefined) {
  if (userId == null) return
  try {
    sessionStorage.removeItem(`${SKIP_STORAGE_PREFIX}${userId}`)
  } catch {
    /* ignore */
  }
}

export function readMociKycSkip(userId: string | number | undefined): boolean {
  if (userId == null) return false
  try {
    return sessionStorage.getItem(`${SKIP_STORAGE_PREFIX}${userId}`) === '1'
  } catch {
    return false
  }
}

export function writeMociKycSkip(userId: string | number | undefined, value: boolean) {
  if (userId == null) return
  try {
    const key = `${SKIP_STORAGE_PREFIX}${userId}`
    if (value) sessionStorage.setItem(key, '1')
    else sessionStorage.removeItem(key)
  } catch {
    /* ignore */
  }
}

export { SKIP_STORAGE_PREFIX }
