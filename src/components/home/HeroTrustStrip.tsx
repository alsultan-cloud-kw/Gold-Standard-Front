import { useTranslation } from 'react-i18next'
import { GS_BUSINESS } from '@/constants/businessCredentials'
import { HeroTrustIcon, type HeroTrustIconId } from '@/components/home/HeroTrustIcon'

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

export function HeroTrustStrip() {
  const { t } = useTranslation()

  return (
    <div className="mt-10 border-t border-black/5 pt-6 sm:mt-12 sm:pt-7">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-5">
        {TRUST_ITEMS.map((item) => (
          <li key={item.id} className="flex min-w-0 items-start gap-3">
            <HeroTrustIcon id={item.id} className="mt-0.5" />
            <span className="min-w-0 pt-1.5 text-sm font-semibold leading-snug text-[#0C1512]">
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
