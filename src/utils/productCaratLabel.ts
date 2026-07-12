import type { Carat } from '@/types'

type CaratLike = Pick<Carat, 'carat_value' | 'display_name_en' | 'display_name_ar'> | null | undefined

function resolveCaratValue(carat: CaratLike): number | null {
  if (!carat) return null

  if (typeof carat.carat_value === 'number' && Number.isFinite(carat.carat_value)) {
    return carat.carat_value
  }

  const fromEn = carat.display_name_en?.match(/(\d+(?:\.\d+)?)/)?.[1]
  if (fromEn) return Number(fromEn)

  const fromAr = carat.display_name_ar?.match(/(\d+(?:\.\d+)?)/)?.[1]
  if (fromAr) return Number(fromAr)

  return null
}

/** Storefront carat label — Arabic: عيار 24 · English: 24K */
export function formatProductCaratLabel(carat: CaratLike, language?: string): string | null {
  if (!carat) return null

  const value = resolveCaratValue(carat)
  const isAr = language?.startsWith('ar') ?? false

  if (value != null) {
    const formatted = Number.isInteger(value) ? String(value) : String(value)
    return isAr ? `عيار ${formatted}` : `${formatted}K`
  }

  const fallback = isAr ? carat.display_name_ar : carat.display_name_en
  if (!fallback) return null

  if (isAr) {
    return fallback.replace(/ذهبية\s*/gi, 'عيار ').replace(/\s+/g, ' ').trim()
  }

  return fallback
}
