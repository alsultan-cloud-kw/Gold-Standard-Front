/** Company desk /gs-kyc gate art. Prefer Cloudinary for the hero when set. */
export const COMPANY_KYC_HERO_IMAGE =
  (import.meta.env.VITE_COMPANY_KYC_HERO_URL as string | undefined)?.trim() ||
  '/images/kuwaitandgold-bg.jpg'

export const COMPANY_KYC_SHIELD_IMAGE = '/images/shield.jpg'
