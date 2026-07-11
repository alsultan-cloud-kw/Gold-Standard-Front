import { useTranslation } from 'react-i18next'
import {
  BadgeCheck,
  Gem,
  ShieldCheck,
  CreditCard,
  FileCheck,
  RefreshCcw,
  type LucideIcon,
} from 'lucide-react'
import { GS_BUSINESS } from '@/constants/businessCredentials'

const TRUST_ITEMS: ReadonlyArray<{
  id: string
  labelKey: string
  icon: LucideIcon
  showLicenseNo?: boolean
}> = [
  { id: 'moci', labelKey: 'home.heroTrust.mociHallmark', icon: BadgeCheck },
  { id: 'authentic', labelKey: 'home.heroTrust.authentic', icon: Gem },
  { id: 'insured', labelKey: 'home.heroTrust.insuredShipping', icon: ShieldCheck },
  { id: 'knet', labelKey: 'home.heroTrust.knetSecure', icon: CreditCard },
  { id: 'licence', labelKey: 'home.heroTrust.licenseNo', showLicenseNo: true, icon: FileCheck },
  { id: 'buyback', labelKey: 'home.heroTrust.buyback', icon: RefreshCcw },
]

export function HeroTrustStrip() {
  const { t } = useTranslation()

  return (
    <div className="mt-10 border-t border-black/5 pt-6 sm:mt-12 sm:pt-7">
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-4">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <li key={item.id} className="flex min-w-0 items-start gap-2.5">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ECFCCB]">
                <Icon className="h-3 w-3 text-[#3F6F00]" strokeWidth={2.25} aria-hidden />
              </span>
              <span className="min-w-0 text-sm font-semibold leading-snug text-[#0C1512]">
                {item.showLicenseNo ? (
                  <>
                    {t(item.labelKey)} {GS_BUSINESS.commercialLicenseNo}
                  </>
                ) : (
                  t(item.labelKey)
                )}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
