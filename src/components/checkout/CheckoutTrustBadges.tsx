import { Lock, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import knetBadge from '@/assets/trust/knet-badge.png'
import sslBadge from '@/assets/trust/secure-ssl-badge.png'
import { cn } from '@/lib/utils'

type Props = {
  variant?: 'compact' | 'panel'
  showKnet?: boolean
  className?: string
}

export function CheckoutTrustBadges({ variant = 'panel', showKnet = true, className }: Props) {
  const { t } = useTranslation()

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap items-center justify-center gap-3', className)}>
        <div className="inline-flex items-center gap-1.5 text-xs text-[#64748B]">
          <Lock className="h-3.5 w-3.5 shrink-0 text-[#3F6F00]" aria-hidden />
          <span>{t('checkoutPage.secureCheckout')}</span>
        </div>
        {showKnet ? (
          <img
            src={knetBadge}
            alt={t('checkoutPage.trustKnetAlt')}
            className="h-8 w-auto rounded-md object-contain"
            loading="lazy"
          />
        ) : null}
        <img
          src={sslBadge}
          alt={t('checkoutPage.trustSslAlt')}
          className="h-8 w-auto object-contain"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-black/10 bg-[#F9F9FA] p-4 sm:p-5',
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#3F6F00]" aria-hidden />
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#3F6F00]">
          {t('checkoutPage.trustTitle')}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {showKnet ? (
          <img
            src={knetBadge}
            alt={t('checkoutPage.trustKnetAlt')}
            className="h-11 w-auto rounded-lg object-contain shadow-sm"
            loading="lazy"
          />
        ) : null}
        <img
          src={sslBadge}
          alt={t('checkoutPage.trustSslAlt')}
          className="h-10 w-auto object-contain"
          loading="lazy"
        />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#64748B]">{t('checkoutPage.trustNote')}</p>
    </div>
  )
}
