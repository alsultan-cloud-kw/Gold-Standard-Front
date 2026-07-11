import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, ScanLine } from 'lucide-react'
import { HeroTrustIcon } from '@/components/home/HeroTrustIcon'
import { TRUST_VECTOR_ICON_CLASS, TRUST_VECTOR_ICON_STROKE } from '@/constants/trustIcons'
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
  const verifyHref = verifyCode
    ? `/verify?code=${encodeURIComponent(verifyCode)}`
    : '/verify'

  return (
    <div className={cn('space-y-4', className)}>
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

        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TRUST_BULLETS.map((item) => (
            <li key={item.id} className="flex min-w-0 items-start gap-2.5">
              <HeroTrustIcon id={item.id} size="sm" className="mt-0.5" />
              <span className="min-w-0 pt-1 text-sm font-semibold leading-snug text-[#0C1512]">
                {t(item.labelKey)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        to={verifyHref}
        className="group flex items-center gap-4 rounded-2xl border border-[#3F6F00]/20 bg-[#ECFCCB]/40 px-4 py-3.5 transition-colors hover:border-[#3F6F00]/35 hover:bg-[#ECFCCB]/70 sm:px-5"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center">
          <ScanLine className={TRUST_VECTOR_ICON_CLASS} strokeWidth={TRUST_VECTOR_ICON_STROKE} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[#0C1512]">
            {t('productDetail.verifyCta')}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-[#64748B]">
            {t('productDetail.verifyHint')}
          </span>
        </span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-[#3F6F00] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          aria-hidden
        />
      </Link>
    </div>
  )
}
