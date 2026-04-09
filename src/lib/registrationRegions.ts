import countries from 'i18n-iso-countries'
import enLocale from 'i18n-iso-countries/langs/en.json'
import arLocale from 'i18n-iso-countries/langs/ar.json'

countries.registerLocale(enLocale)
countries.registerLocale(arLocale)

export function regionFlagEmoji(iso2: string): string {
  const c = iso2.toUpperCase()
  if (!/^[A-Z]{2}$/.test(c)) return '🏳️'
  const BASE = 0x1f1e6
  return String.fromCodePoint(BASE + c.charCodeAt(0) - 65, BASE + c.charCodeAt(1) - 65)
}

export function regionFlagClassName(iso2: string): string {
  const c = iso2.trim().toLowerCase()
  if (!/^[a-z]{2}$/.test(c)) return ''
  return `fi fi-${c}`
}

export function getSortedIso2RegionCodes(locale: string): string[] {
  const lang = locale.startsWith('ar') ? 'ar' : 'en'
  const codes = Object.keys(countries.getAlpha2Codes()).map((c) => c.toUpperCase())
  const collator = new Intl.Collator(locale, { sensitivity: 'base' })
  return codes.sort((a, b) =>
    collator.compare(
      countries.getName(a, lang) || a,
      countries.getName(b, lang) || b
    )
  )
}

export function getRegionDisplayName(iso2: string, locale: string): string {
  const lang = locale.startsWith('ar') ? 'ar' : 'en'
  const code = iso2.trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(code)) return iso2
  return countries.getName(code, lang) || code
}

/** Pretty label for profile/admin when nationality is stored as ISO alpha-2. */
export function formatNationalityForDisplay(code: string | null | undefined, locale: string): string {
  if (!code?.trim()) return '—'
  const raw = code.trim()
  const v = raw.toUpperCase()
  if (/^[A-Z]{2}$/.test(v)) {
    const name = getRegionDisplayName(v, locale)
    return `${regionFlagEmoji(v)} ${name || v}`
  }
  return raw
}
