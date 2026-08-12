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
  if (data.contact_name) fd.append('contact_name', data.contact_name)
  if (data.message) fd.append('message', data.message)
  if (data.turnstile_token) fd.append('turnstile_token', data.turnstile_token)
  return fd
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
