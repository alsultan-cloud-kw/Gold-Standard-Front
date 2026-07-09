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
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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

  const triggerClass = cn(
    'h-auto min-h-[3rem] w-full justify-between gap-2 px-4 py-3 text-start text-sm font-medium shadow-none',
    'rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100',
    'hover:border-[#85E307]/50 hover:bg-charcoal-800',
    'focus:outline-none focus-visible:border-[#85E307] focus-visible:ring-2 focus-visible:ring-[#85E307]/25',
    'data-[placeholder]:text-gold-100/45 data-[state=open]:border-[#85E307]/60',
    'disabled:cursor-not-allowed disabled:opacity-50',
    '[&_svg]:text-[#85E307] [&_svg]:opacity-90',
    inputClassName,
  )

  const contentClass = cn(
    'z-[80] max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl',
    'border border-black/10 bg-white p-0 text-[#0B0F19]',
    'shadow-[0_18px_40px_-16px_rgba(11,15,25,0.35)]',
  )

  const itemClass = cn(
    'relative cursor-pointer rounded-lg py-2.5 ps-3 pe-10 text-sm font-medium text-[#0B0F19]',
    'outline-none select-none pl-3 pr-10',
    'data-[highlighted]:bg-[#ECFCCB]/75 data-[highlighted]:text-[#0B0F19]',
    'data-[state=checked]:bg-[#ECFCCB] data-[state=checked]:font-semibold data-[state=checked]:text-[#3F6F00]',
    'focus:bg-[#ECFCCB]/75 focus:text-[#0B0F19]',
    '[&_svg]:text-[#3F6F00]',
  )

  const governorateField = (
    <Select
      value={governorateEn || undefined}
      onValueChange={handleGovernorateChange}
    >
      <SelectTrigger className={triggerClass} aria-label={t('checkoutPage.governoratePh')}>
        <SelectValue placeholder={t('checkoutPage.selectGovernorate')} />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className={contentClass} sideOffset={6}>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {governorates.map((gov) => (
            <SelectItem key={gov.id} value={gov.nameEn} className={itemClass}>
              {locale === 'ar' ? gov.nameAr : gov.nameEn}
            </SelectItem>
          ))}
          {governorate.trim() && !findGovernorateByStoredValue(governorate) ? (
            <SelectItem value={governorate} className={itemClass}>
              {governorate}
            </SelectItem>
          ) : null}
        </div>
      </SelectContent>
    </Select>
  )

  const cityPlaceholder = governorateEn
    ? t('checkoutPage.selectCity')
    : t('checkoutPage.selectGovernorateFirst')

  const cityField = (
    <Select
      value={city.trim() ? city : undefined}
      onValueChange={onCityChange}
      disabled={!governorateEn}
    >
      <SelectTrigger className={triggerClass} aria-label={t('checkoutPage.cityPh')}>
        <SelectValue placeholder={cityPlaceholder} />
      </SelectTrigger>
      <SelectContent position="popper" align="start" className={contentClass} sideOffset={6}>
        <div className="max-h-72 overflow-y-auto p-1.5">
          {areas.map((area) => {
            const label = areaLabel(area, locale)
            return (
              <SelectItem key={`${area.en}-${area.ar}`} value={label} className={itemClass}>
                {label}
              </SelectItem>
            )
          })}
          {city.trim() && governorateEn && !findAreaInGovernorate(governorateEn, city) ? (
            <SelectItem value={city} className={itemClass}>
              {city}
            </SelectItem>
          ) : null}
        </div>
      </SelectContent>
    </Select>
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
