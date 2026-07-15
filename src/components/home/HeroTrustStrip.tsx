import { useTranslation } from 'react-i18next'
import { GS_BUSINESS } from '@/constants/businessCredentials'
import { HeroTrustIcon, type HeroTrustIconId } from '@/components/home/HeroTrustIcon'
import { cn } from '@/lib/utils'

const TRUST_ITEMS: ReadonlyArray<{
  id: HeroTrustIconId
  labelKey: string
  showLicenseNo?: boolean
}> = [
  { id: 'moci', labelKey: 'home.heroTrust.mociHallmark' },
  { id: 'authentic', labelKey: 'home.heroTrust.authentic' },
  { id: 'insured', labelKey: 'home.heroTrust.insuredShipping' },
  { id: 'knet', labelKey: 'home.heroTrust.knetSecure' },
  { id: 'licence', labelKey: 'home.heroTrust.licenseNo', showLicenseNo: true },
  { id: 'buyback', labelKey: 'home.heroTrust.buyback' },
]

type HeroTrustStripProps = {
  /** `hero` = under hero with top border; `embedded` = inside another section */
  variant?: 'hero' | 'embedded'
  className?: string
}

export function HeroTrustStrip({ variant = 'hero', className }: HeroTrustStripProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'hero-trust-strip',
        variant === 'hero' && 'mt-5 border-t border-black/5 pt-4 sm:mt-12 sm:pt-7',
        variant === 'embedded' && 'mt-0 border-0 pt-0',
        className,
      )}
    >
      <ul className="hero-trust-strip__list grid grid-cols-2 gap-x-3 gap-y-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-6 xl:gap-5">
        {TRUST_ITEMS.map((item) => (
          <li key={item.id} className="hero-trust-strip__item flex min-w-0 items-start gap-2 sm:gap-3">
            <HeroTrustIcon id={item.id} className="mt-0.5 shrink-0" size="sm" />
            <span className="hero-trust-strip__label min-w-0 pt-0.5 text-[11px] font-semibold leading-snug text-[#0C1512] sm:pt-1.5 sm:text-sm">
              {item.showLicenseNo ? (
                <>
                  {t(item.labelKey)} {GS_BUSINESS.commercialLicenseNo}
                </>
              ) : (
                t(item.labelKey)
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
