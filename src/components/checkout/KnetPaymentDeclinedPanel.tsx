import { useEffect } from 'react'
import { ArrowLeft, Info, Lock, RefreshCw, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import knetBadge from '@/assets/trust/knet-badge.png'
import { knetDeclineReasonKind } from '@/lib/knetReceipt'
import { cn } from '@/lib/utils'

const KNET_PENDING_SALE_KEY = 'gs_knet_pending_sale'

type Props = {
  /** Raw gateway result string (e.g. FAILURE(NOT CAPTURED)) — used only for soft reason copy. */
  result?: string | null
  className?: string
}

/**
 * Clean payment-declined screen (no receipt IDs / amounts).
 * Inspired by KNET-style decline UX; GS brand tokens and CTAs.
 */
export function KnetPaymentDeclinedPanel({ result, className }: Props) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.toLowerCase().startsWith('ar')
  const titlePrimary = t('knetReceipt.notCapturedTitle')
  const titleSecondary = t('knetReceipt.notCapturedTitle', { lng: isAr ? 'en' : 'ar' })
  const reasonKind = knetDeclineReasonKind(result)

  useEffect(() => {
    try {
      sessionStorage.removeItem(KNET_PENDING_SALE_KEY)
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <div
      className={cn(
        'relative mx-auto flex w-full max-w-lg flex-col items-center px-4 py-8 sm:py-12',
        className,
      )}
    >
      {/* Soft ambient pattern (no layout cost) */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        aria-hidden
        style={{
          backgroundImage:
            'radial-gradient(circle at 70% 20%, rgba(220,38,38,0.08), transparent 42%), radial-gradient(circle at 20% 80%, rgba(133,227,7,0.06), transparent 40%)',
        }}
      />

      <div className="mb-6 flex w-full items-center justify-between gap-3">
        <img
          src={knetBadge}
          alt={t('checkoutPage.trustKnetAlt')}
          className="h-8 w-auto object-contain"
        />
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#3F6F00]">
          <Lock className="h-3.5 w-3.5" aria-hidden />
          {t('knetReceipt.securePayment')}
        </span>
      </div>

      <div
        role="alert"
        aria-live="assertive"
        className="w-full rounded-3xl border border-red-100 bg-white px-6 py-10 text-center shadow-[0_24px_60px_-28px_rgba(220,38,38,0.45)] sm:px-10"
      >
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#DC2626] shadow-[0_10px_24px_-8px_rgba(220,38,38,0.7)]"
          aria-hidden
        >
          <X className="h-8 w-8 text-white" strokeWidth={3} />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#0B0F19] sm:text-3xl">
          {titlePrimary}
        </h1>
        <p
          className="mt-2 text-base font-semibold text-[#DC2626]"
          lang={isAr ? 'en' : 'ar'}
          dir={isAr ? 'ltr' : 'rtl'}
        >
          {titleSecondary}
        </p>

        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-[#64748B]">
          {t('knetReceipt.declinedBody')}
        </p>

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-start">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" aria-hidden />
          <p className="text-sm leading-relaxed text-[#991B1B]">
            <span className="font-semibold">{t('knetReceipt.reasonLabel')}</span>{' '}
            {t(`knetReceipt.declineReason.${reasonKind}`)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex w-full flex-col gap-3">
        <Link
          to="/checkout"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#85E307] px-6 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9AEF2A] active:scale-[0.98]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
          {t('checkoutPage.knetTryAgain')}
        </Link>
        <Link
          to="/products"
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-6 text-sm font-semibold text-[#0B0F19] transition hover:bg-[#F9F9FA] active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          {t('knetReceipt.backToShop')}
        </Link>
        <Link
          to="/dashboard?tab=orders"
          className="mt-1 text-center text-sm font-medium text-[#3F6F00] underline-offset-2 hover:underline"
        >
          {t('knetReceipt.viewAttemptInOrders')}
        </Link>
      </div>
    </div>
  )
}
