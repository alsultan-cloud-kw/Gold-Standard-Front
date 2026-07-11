/**
 * Public business credentials shown on the storefront (hero trust strip, About page).
 * Set `licenseDocumentUrl` when a commercial licence PDF/image is hosted.
 */
export const GS_BUSINESS = {
  legalNameEn: 'Gold Standard Jewellers and Precious Metals Company',
  legalNameAr: 'شركة جولد ستاندرد للمجوهرات والمعادن الثمينة',
  /** Commercial registration / trade licence document (PDF or image) in /public. */
  licenseDocumentUrl: '/commercial-licence.pdf' as string | null,
  commercialLicenseNo: '279/2026',
  aboutLicenseAnchor: '/about#commercial-licence',
} as const

/** Parent brand — Gold Standard operates as part of Sultan Gold (Kuwait). */
export const SULTAN_GOLD_BRAND = {
  nameEn: 'Sultan Gold',
  nameAr: 'ذهب السلطان',
  /** Update figures here when official numbers change. */
  trustStats: [
    { id: 'years', value: '5+', labelKey: 'home.sultanTrust.yearsInKuwait' },
    { id: 'customers', value: '50,000+', labelKey: 'home.sultanTrust.customersServed' },
    { id: 'goldDelivered', value: '1+', suffixKey: 'home.sultanTrust.goldDeliveredSuffix', labelKey: 'home.sultanTrust.goldDelivered' },
    { id: 'insured', value: '100%', labelKey: 'home.sultanTrust.ordersInsured' },
    { id: 'rating', value: '4.9', showStar: true, labelKey: 'home.sultanTrust.googleRating' },
  ],
} as const

export type SultanGoldTrustStat = (typeof SULTAN_GOLD_BRAND.trustStats)[number]

/** Kuwait Ministry of Commerce — Precious Metals Department hallmarking. */
export const KUWAIT_MOCI_HALLMARK = {
  authorityEn: 'Ministry of Commerce and Industry (MOCI)',
  departmentEn: 'Precious Metals Department',
  authorityAr: 'وزارة التجارة والصناعة',
  departmentAr: 'إدارة المعادن الثمينة',
} as const
