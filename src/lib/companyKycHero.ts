/** Company desk /gs-kyc gate hero art. Prefer Cloudinary when set. */
export const COMPANY_KYC_HERO_IMAGE =
  (import.meta.env.VITE_COMPANY_KYC_HERO_URL as string | undefined)?.trim() ||
  '/images/company-kyc-verify.jpg'
