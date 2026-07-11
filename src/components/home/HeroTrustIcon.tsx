import { Award, PackageCheck, RefreshCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import knetBadge from '@/assets/trust/knet-badge.png'
import ministryLogo from '@/assets/trust/ministry-logo.png'
import goldBarImg from '@/assets/home/gold-bullion.png'
import { TRUST_VECTOR_ICON_CLASS, TRUST_VECTOR_ICON_STROKE } from '@/constants/trustIcons'
import { cn } from '@/lib/utils'

export type HeroTrustIconId =
  | 'moci'
  | 'authentic'
  | 'insured'
  | 'knet'
  | 'licence'
  | 'buyback'

type HeroTrustIconProps = {
  id: HeroTrustIconId
  className?: string
  size?: 'sm' | 'md'
}

const SIZE = {
  sm: {
    wrap: 'h-8 w-8',
    ministry: 'h-8 w-8',
    gold: 'h-7 w-7',
    vector: 'h-5 w-5',
    knet: 'h-6 max-w-[2.35rem]',
  },
  md: {
    wrap: 'h-9 w-9',
    ministry: 'h-9 w-9',
    gold: 'h-8 w-8',
    vector: TRUST_VECTOR_ICON_CLASS,
    knet: 'h-7 max-w-[2.75rem]',
  },
} as const

export function HeroTrustIcon({ id, className, size = 'md' }: HeroTrustIconProps) {
  const { t } = useTranslation()
  const s = SIZE[size]
  const wrap = cn('flex shrink-0 items-center justify-center', s.wrap, className)
  const vectorClass = size === 'sm' ? cn('h-5 w-5 text-[#3F6F00]') : TRUST_VECTOR_ICON_CLASS

  switch (id) {
    case 'moci':
      return (
        <span className={wrap}>
          <img
            src={ministryLogo}
            alt={t('home.heroTrust.iconAlt.moci')}
            className={cn(s.ministry, 'object-contain')}
            loading="lazy"
            decoding="async"
          />
        </span>
      )
    case 'authentic':
      return (
        <span className={wrap}>
          <img
            src={goldBarImg}
            alt={t('home.heroTrust.iconAlt.authentic')}
            className={cn(s.gold, 'object-contain')}
            loading="lazy"
            decoding="async"
          />
        </span>
      )
    case 'insured':
      return (
        <span className={wrap}>
          <PackageCheck
            className={vectorClass}
            strokeWidth={TRUST_VECTOR_ICON_STROKE}
            aria-hidden
          />
        </span>
      )
    case 'knet':
      return (
        <span className={wrap}>
          <img
            src={knetBadge}
            alt={t('home.heroTrust.iconAlt.knet')}
            className={cn('w-auto object-contain', s.knet)}
            loading="lazy"
            decoding="async"
          />
        </span>
      )
    case 'licence':
      return (
        <span className={wrap}>
          <Award className={vectorClass} strokeWidth={TRUST_VECTOR_ICON_STROKE} aria-hidden />
        </span>
      )
    case 'buyback':
      return (
        <span className={wrap}>
          <RefreshCcw
            className={vectorClass}
            strokeWidth={TRUST_VECTOR_ICON_STROKE}
            aria-hidden
          />
        </span>
      )
    default:
      return null
  }
}
