import { useTranslation } from 'react-i18next'
import { HeroTrustIcon } from '@/components/home/HeroTrustIcon'
import { DigitalOwnershipBadge } from '@/components/products/DigitalOwnershipBadge'
import { ProductAuthenticityAssurance } from '@/components/products/ProductAuthenticityAssurance'
import { cn } from '@/lib/utils'

const TRUST_BULLETS: ReadonlyArray<{
  id: 'moci' | 'authentic' | 'insured'
  labelKey: 'home.heroTrust.mociHallmark' | 'home.heroTrust.authentic' | 'home.heroTrust.insuredShipping'
}> = [
  { id: 'moci', labelKey: 'home.heroTrust.mociHallmark' },
  { id: 'authentic', labelKey: 'home.heroTrust.authentic' },
  { id: 'insured', labelKey: 'home.heroTrust.insuredShipping' },
]

type Props = {
  verifyCode?: string | null
  className?: string
}

export function ProductTrustPanel({ verifyCode, className }: Props) {
  const { t } = useTranslation()

  return (
    <div className={cn('space-y-4', className)}>
      <DigitalOwnershipBadge variant="compact" verifyCode={verifyCode} className="sm:text-[11px]" />

      <ProductAuthenticityAssurance verifyCode={verifyCode} />

      <div className="rounded-2xl border border-black/10 bg-white p-4 sm:p-5">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#3F6F00]">
          {t('productDetail.trustKicker')}
        </p>
        <h2 className="mb-2 text-base font-bold text-[#0C1512] sm:text-lg">
          {t('productDetail.trustTitle')}
        </h2>
        <p className="mb-4 text-sm leading-relaxed text-[#64748B]">
          {t('productDetail.trustBody')}
        </p>

        <ul className="grid grid-cols-2 gap-2 sm:gap-3">
          {TRUST_BULLETS.map((item) => (
            <li key={item.id} className="flex min-w-0 items-start gap-2 sm:gap-2.5">
              <HeroTrustIcon id={item.id} size="sm" className="mt-0.5" />
              <span className="min-w-0 pt-0.5 text-[11px] font-semibold leading-snug text-[#0C1512] sm:pt-1 sm:text-sm">
                {t(item.labelKey)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
