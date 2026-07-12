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
      <div
        className={cn(
          'flex flex-wrap items-center justify-center gap-3 rounded-xl border border-black/6 bg-[#F9F9FA] px-3 py-2.5',
          className,
        )}
      >
        <div className="inline-flex items-center gap-1.5 text-xs text-[#64748B]">
          <Lock className="h-3.5 w-3.5 shrink-0 text-[#3F6F00]" aria-hidden />
          <span>{t('checkoutPage.secureCheckout')}</span>
        </div>
        {showKnet ? (
          <img
            src={knetBadge}
            alt={t('checkoutPage.trustKnetAlt')}
            className="h-7 w-auto rounded object-contain"
            loading="lazy"
          />
        ) : null}
        <img
          src={sslBadge}
          alt={t('checkoutPage.trustSslAlt')}
          className="h-7 w-auto object-contain"
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div className={cn('checkout-trust-panel', className)}>
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-[#3F6F00]" aria-hidden />
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#3F6F00]">
          {t('checkoutPage.trustTitle')}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {showKnet ? (
          <img
            src={knetBadge}
            alt={t('checkoutPage.trustKnetAlt')}
            className="h-10 w-auto rounded object-contain sm:h-11"
            loading="lazy"
          />
        ) : null}
        <img
          src={sslBadge}
          alt={t('checkoutPage.trustSslAlt')}
          className="h-9 w-auto object-contain sm:h-10"
          loading="lazy"
        />
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#64748B]">{t('checkoutPage.trustNote')}</p>
    </div>
  )
}
