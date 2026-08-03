/** Prefer CMS bilingual names; fallback AR labels for common catalog categories. */

const CATEGORY_AR_FALLBACK: Record<string, string> = {
  'gold bars': 'سبائك ذهب',
  'gold bar': 'سبائك ذهب',
  bars: 'سبائك',
  bullion: 'سبائك',
  'gold coins': 'عملات ذهب',
  'gold coin': 'عملات ذهب',
  coins: 'عملات',
  jewellery: 'مجوهرات',
  jewelry: 'مجوهرات',
  silver: 'فضة',
  platinum: 'بلاتين',
}

type CategoryLike = {
  name_ar?: string | null
  name_en?: string | null
  slug?: string | null
}

function categoryArFallback(cat: CategoryLike): string | null {
  const en = (cat.name_en || '').trim().toLowerCase()
  if (en && CATEGORY_AR_FALLBACK[en]) return CATEGORY_AR_FALLBACK[en]!
  const slug = (cat.slug || '').trim().toLowerCase().replace(/-/g, ' ')
  if (slug && CATEGORY_AR_FALLBACK[slug]) return CATEGORY_AR_FALLBACK[slug]!
  for (const [key, ar] of Object.entries(CATEGORY_AR_FALLBACK)) {
    if (en.includes(key) || slug.includes(key)) return ar
  }
  return null
}

export function categoryDisplayName(cat: CategoryLike | null | undefined, isAr: boolean): string {
  if (!cat) return ''
  if (isAr) {
    const ar = (cat.name_ar || '').trim()
    if (ar) return ar
    return categoryArFallback(cat) || (cat.name_en || '').trim() || (cat.slug || '').trim()
  }
  return (cat.name_en || '').trim() || (cat.name_ar || '').trim() || (cat.slug || '').trim()
}
