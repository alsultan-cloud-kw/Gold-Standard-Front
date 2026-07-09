import kuwaitGovernoratesData from './kuwait-governorates.json'

export type GovernorateArea = {
  en: string
  ar: string
}

export type Governorate = {
  title: {
    en: string
    ar?: string
  }
  areas: GovernorateArea[]
}

export type KuwaitGovernorates = Governorate[]

export const kuwaitGovernorates: KuwaitGovernorates = kuwaitGovernoratesData as KuwaitGovernorates

const GOVERNORATE_AR_FALLBACK: Record<string, string> = {
  'Capital Governorate': 'محافظة العاصمة',
  'Hawalli Governorate': 'محافظة حولي',
  'Mubarak al-Kabeer Governorate': 'محافظة مبارك الكبير',
  'Ahmadi Governorate': 'محافظة الأحمدي',
  'Farwaniya Governorate': 'محافظة الفروانية',
  'Jahra Governorate': 'محافظة الجهراء',
}

export function governorateArabicName(englishName: string): string {
  const hit = kuwaitGovernorates.find((g) => g.title.en === englishName)
  return hit?.title.ar || GOVERNORATE_AR_FALLBACK[englishName] || englishName
}

export function getGovernoratesForDropdown() {
  return kuwaitGovernorates.map((gov) => ({
    id: gov.title.en.toLowerCase().replace(/\s+/g, '-'),
    nameEn: gov.title.en,
    nameAr: gov.title.ar || governorateArabicName(gov.title.en),
    areas: gov.areas,
  }))
}

export function findGovernorateByStoredValue(value: string): Governorate | null {
  const v = value.trim()
  if (!v) return null
  const lower = v.toLowerCase()
  return (
    kuwaitGovernorates.find(
      (gov) =>
        gov.title.en === v ||
        gov.title.ar === v ||
        gov.title.en.toLowerCase() === lower ||
        (gov.title.ar && gov.title.ar === v),
    ) ?? null
  )
}

export function resolveGovernorateEnglishName(value: string): string {
  const hit = findGovernorateByStoredValue(value)
  return hit?.title.en ?? value
}

export function getAreasForGovernorate(governorateName: string): GovernorateArea[] {
  const resolved = resolveGovernorateEnglishName(governorateName)
  const governorate = kuwaitGovernorates.find(
    (gov) =>
      gov.title.en === resolved ||
      gov.title.en.toLowerCase().includes(resolved.toLowerCase()),
  )
  return governorate?.areas ?? []
}

export function areaLabel(area: GovernorateArea, locale: 'ar' | 'en'): string {
  return locale === 'ar' ? area.ar : area.en
}

export function governorateLabel(nameEn: string, locale: 'ar' | 'en'): string {
  return locale === 'ar' ? governorateArabicName(nameEn) : nameEn
}

export function findAreaInGovernorate(
  governorateName: string,
  storedCity: string,
): GovernorateArea | null {
  const areas = getAreasForGovernorate(governorateName)
  const v = storedCity.trim()
  if (!v) return null
  const lower = v.toLowerCase()
  return (
    areas.find(
      (a) => a.en === v || a.ar === v || a.en.toLowerCase() === lower || a.ar === v,
    ) ?? null
  )
}
