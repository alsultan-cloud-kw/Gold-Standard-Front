const STORAGE_KEY = 'gs_register_draft_v1'

export type RegisterDraft = {
  step: 'identity' | 'details' | 'verify'
  registrationPath: 'email' | 'phone'
  formData: {
    full_name: string
    country: string
    nationality: string
    civil_id: string
    email: string
    phone_number: string
    role: string
  }
  acceptedLegal: boolean
}

export function loadRegisterDraft(): RegisterDraft | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RegisterDraft
  } catch {
    return null
  }
}

export function saveRegisterDraft(draft: RegisterDraft): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    /* quota / private mode */
  }
}

export function clearRegisterDraft(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
