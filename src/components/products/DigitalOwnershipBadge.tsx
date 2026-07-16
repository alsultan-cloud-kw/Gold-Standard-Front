import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Blocks } from 'lucide-react'
import { cn } from '@/lib/utils'

type Variant = 'compact' | 'card' | 'panel'

type Props = {
  variant?: Variant
  /** When set, links to authenticity check for this serial/code */
  verifyCode?: string | null
  /** Override destination (e.g. product page authenticity section) */
  to?: string
  className?: string
}

/**
 * Shared “Digital Ownership Record” mark — customer-facing ownership language
 * (blockchain as the securing technology, not the product name).
 */
export function DigitalOwnershipBadge({
  variant = 'compact',
  verifyCode,
  to,
  className,
}: Props) {
  const { t } = useTranslation()
  const verifyHref =
    to ||
    (verifyCode ? `/verify?code=${encodeURIComponent(verifyCode)}` : '/verify')

  if (variant === 'compact') {
    return (
      <Link
        to={verifyHref}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'inline-flex max-w-full items-center gap-1 rounded-md border border-[#3F6F00]/20 bg-[#ECFCCB]/55 px-1.5 py-0.5 text-[9px] font-semibold leading-tight text-[#3F6F00] transition hover:border-[#3F6F00]/35 hover:bg-[#ECFCCB]/85 sm:gap-1.5 sm:text-[10px]',
          className,
        )}
        title={t('digitalOwnership.securedBy')}
      >
        <Blocks className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden />
        <span className="truncate">{t('digitalOwnership.badge')}</span>
      </Link>
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-xl border border-[#3F6F00]/15 bg-gradient-to-br from-[#ECFCCB]/50 to-white px-2.5 py-2 sm:px-3 sm:py-2.5',
          className,
        )}
      >
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0B0F19] text-[#85E307]">
            <Blocks className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold leading-snug text-[#0B0F19] sm:text-xs">
              {t('digitalOwnership.title')}
            </p>
            <p className="mt-0.5 text-[10px] leading-snug text-[#64748B] sm:text-[11px]">
              {t('digitalOwnership.body')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-[#3F6F00]/20 bg-gradient-to-br from-[#ECFCCB]/40 via-white to-white p-4 sm:p-5',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307]">
          <Blocks className="h-5 w-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#3F6F00]">
            {t('digitalOwnership.kicker')}
          </p>
          <h3 className="text-base font-bold text-[#0B0F19] sm:text-lg">
            {t('digitalOwnership.title')}
          </h3>
        </div>
      </div>
      <p className="text-sm font-semibold leading-relaxed text-[#0C1512]">
        {t('digitalOwnership.securedBy')}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
        {t('digitalOwnership.whatBody')}
      </p>
      <ul className="mt-4 space-y-3 border-t border-[#3F6F00]/15 pt-4">
        {(['tokenize', 'transparency', 'ledger'] as const).map((key) => (
          <li key={key}>
            <p className="text-sm font-bold text-[#0B0F19]">
              {t(`digitalOwnership.pillars.${key}.title`)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[#64748B]">
              {t(`digitalOwnership.pillars.${key}.body`)}
            </p>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm leading-relaxed text-[#64748B]">
        {t('digitalOwnership.certificateBody')}
      </p>
      <Link
        to={verifyHref}
        className="mt-4 inline-flex text-sm font-semibold text-[#3F6F00] underline-offset-2 transition hover:underline"
      >
        {t('digitalOwnership.verifyLink')}
      </Link>
    </div>
  )
}
