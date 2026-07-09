import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  areaLabel,
  findAreaInGovernorate,
  findGovernorateByStoredValue,
  getAreasForGovernorate,
  getGovernoratesForDropdown,
  governorateLabel,
  resolveGovernorateEnglishName,
} from '@/data/kuwaitGovernorates'

type KuwaitLocationFieldsProps = {
  governorate: string
  city: string
  onGovernorateChange: (value: string) => void
  onCityChange: (value: string) => void
  inputClassName: string
  governorateFirst?: boolean
}

export function KuwaitLocationFields({
  governorate,
  city,
  onGovernorateChange,
  onCityChange,
  inputClassName,
  governorateFirst = true,
}: KuwaitLocationFieldsProps) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'ar' ? 'ar' : 'en'
  const governorates = useMemo(() => getGovernoratesForDropdown(), [])

  const governorateEn = useMemo(() => {
    if (!governorate.trim()) return ''
    return resolveGovernorateEnglishName(governorate)
  }, [governorate])

  const areas = useMemo(
    () => (governorateEn ? getAreasForGovernorate(governorateEn) : []),
    [governorateEn],
  )

  const handleGovernorateChange = (nextEn: string) => {
    onGovernorateChange(nextEn)
    onCityChange('')
  }

  const selectClass = `${inputClassName} appearance-none cursor-pointer`

  const governorateField = (
    <select
      className={selectClass}
      value={governorateEn}
      onChange={(e) => handleGovernorateChange(e.target.value)}
      autoComplete="address-level1"
      aria-label={t('checkoutPage.governoratePh')}
    >
      <option value="">{t('checkoutPage.selectGovernorate')}</option>
      {governorates.map((gov) => (
        <option key={gov.id} value={gov.nameEn}>
          {locale === 'ar' ? gov.nameAr : gov.nameEn}
        </option>
      ))}
      {governorate.trim() && !findGovernorateByStoredValue(governorate) ? (
        <option value={governorate}>{governorate}</option>
      ) : null}
    </select>
  )

  const cityField = (
    <select
      className={selectClass}
      value={city}
      onChange={(e) => onCityChange(e.target.value)}
      disabled={!governorateEn}
      autoComplete="address-level2"
      aria-label={t('checkoutPage.cityPh')}
    >
      <option value="">
        {governorateEn ? t('checkoutPage.selectCity') : t('checkoutPage.selectGovernorateFirst')}
      </option>
      {areas.map((area) => {
        const label = areaLabel(area, locale)
        return (
          <option key={`${area.en}-${area.ar}`} value={label}>
            {label}
          </option>
        )
      })}
      {city.trim() && governorateEn && !findAreaInGovernorate(governorateEn, city) ? (
        <option value={city}>{city}</option>
      ) : null}
    </select>
  )

  if (governorateFirst) {
    return (
      <>
        {governorateField}
        {cityField}
      </>
    )
  }

  return (
    <>
      {cityField}
      {governorateField}
    </>
  )
}

export function formatGovernorateDisplay(value: string, locale: 'ar' | 'en'): string {
  const en = resolveGovernorateEnglishName(value)
  return governorateLabel(en, locale)
}
