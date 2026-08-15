import { apiService } from './api'

export type CompanyDeskAccessResponse = {
  has_access: boolean
  authenticated: boolean
  status: 'pending' | 'approved' | 'rejected' | null
  is_active?: boolean
  business_name: string | null
  company_email?: string | null
  reason: string
}

export type CompanyDeskApplyPayload = {
  business_name: string
  business_address: string
  company_email: string
  contact_name?: string
  phone: string
  /** PDF or image of the commercial licence (required). */
  commercial_license_file: File
  /** Front of the activity owner's Kuwait civil ID (required). */
  owner_civil_id_front: File
  /** Back of the activity owner's Kuwait civil ID (required). */
  owner_civil_id_back: File
  message?: string
  turnstile_token?: string
}

export type CompanyDeskApplyResponse = {
  ok: boolean
  status?: string
  message?: string
  already_pending?: boolean
  already_active?: boolean
  reopened?: boolean
  error?: string
}

function buildApplyFormData(data: CompanyDeskApplyPayload): FormData {
  const fd = new FormData()
  fd.append('business_name', data.business_name)
  fd.append('business_address', data.business_address)
  fd.append('company_email', data.company_email)
  fd.append('phone', data.phone)
  fd.append('commercial_license_file', data.commercial_license_file)
  fd.append('owner_civil_id_front', data.owner_civil_id_front)
  fd.append('owner_civil_id_back', data.owner_civil_id_back)
  if (data.contact_name) fd.append('contact_name', data.contact_name)
  if (data.message) fd.append('message', data.message)
  if (data.turnstile_token) fd.append('turnstile_token', data.turnstile_token)
  return fd
}

const APPLY_ERROR_KEYS: Record<string, string> = {
  captcha_failed: 'captcha',
  business_name_required: 'businessName',
  business_address_required: 'businessAddress',
  company_email_required: 'companyEmail',
  phone_required: 'phone',
  commercial_license_required: 'license',
  commercial_license_invalid_type: 'licenseType',
  commercial_license_too_large: 'licenseTooLarge',
  commercial_license_infected: 'licenseInfected',
  commercial_license_scan_unavailable: 'licenseScanUnavailable',
  owner_civil_id_front_required: 'civilIdFront',
  owner_civil_id_back_required: 'civilIdBack',
  owner_civil_id_front_invalid_type: 'civilIdType',
  owner_civil_id_back_invalid_type: 'civilIdType',
  owner_civil_id_front_too_large: 'civilIdTooLarge',
  owner_civil_id_back_too_large: 'civilIdTooLarge',
  owner_civil_id_front_infected: 'civilIdInfected',
  owner_civil_id_back_infected: 'civilIdInfected',
  owner_civil_id_front_scan_unavailable: 'civilIdScanUnavailable',
  owner_civil_id_back_scan_unavailable: 'civilIdScanUnavailable',
}

export function companyDeskApplyErrorKey(code: string | undefined): string {
  if (!code) return 'generic'
  return APPLY_ERROR_KEYS[code] ?? 'generic'
}

export const companyDeskApi = {
  getAccess: () => apiService.get<CompanyDeskAccessResponse>('/accounts/company-desk/access/'),

  apply: (data: CompanyDeskApplyPayload) =>
    apiService.post<CompanyDeskApplyResponse>(
      '/accounts/company-desk/apply/',
      buildApplyFormData(data),
    ),

  requestActivateOtp: (data: { email: string; turnstile_token?: string }) =>
    apiService.post<{
      ok: boolean
      sent?: boolean
      delivery?: { channel?: string; destination?: string }
      business_name?: string
      error?: string
    }>('/accounts/company-desk/activate/request-otp/', data),
}
