/** Paths allowed for approved company-desk (B2B AML) users — not the retail storefront. */

export const COMPANY_DESK_HOME = '/gs-kyc'

const COMPANY_DESK_PREFIXES = [
  '/gs-kyc',
  '/customer-kyc',
  '/company-prices',
  '/company-activate',
  '/login',
  '/forgot-password',
  '/verify-account',
  '/sso-callback',
  '/mobile-auth-done',
  '/terms-and-privacy',
  '/terms',
  '/privacy',
  '/data-deletion',
  '/legal',
  '/contact',
] as const

export function isCompanyDeskUser(user: {
  company_desk_active?: boolean
  role?: string
} | null | undefined): boolean {
  if (!user) return false
  if (user.company_desk_active === true) return true
  return false
}

export function isCompanyDeskAllowedPath(pathname: string): boolean {
  const path = (pathname || '/').split('?')[0] || '/'
  return COMPANY_DESK_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`),
  )
}
