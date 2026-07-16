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
  company_email: string
  contact_name?: string
  phone?: string
  commercial_license?: string
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

export const companyDeskApi = {
  getAccess: () => apiService.get<CompanyDeskAccessResponse>('/accounts/company-desk/access/'),

  apply: (data: CompanyDeskApplyPayload) =>
    apiService.post<CompanyDeskApplyResponse>('/accounts/company-desk/apply/', data),
}
