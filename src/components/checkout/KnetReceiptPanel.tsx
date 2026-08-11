import { useCallback, useState } from 'react'
import {
  Check,
  Copy,
  CreditCard,
  Download,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import type { KnetReceiptDetails } from '@/types'
import {
  buildKnetReceiptFields,
  isKnetReceiptCaptured,
  isKnetReceiptDefinitelyFailed,
  knetPaymentRef,
} from '@/lib/knetReceipt'
import { KnetPaymentDeclinedPanel } from '@/components/checkout/KnetPaymentDeclinedPanel'
import knetBadge from '@/assets/trust/knet-badge.png'
import { cn } from '@/lib/utils'

type Props = {
  receipt: KnetReceiptDetails
  downloading?: boolean
  onDownloadInvoice?: () => void
  showActions?: boolean
}

function SuccessSparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      <path d="M14 2l1.8 6.2L22 10l-6.2 1.8L14 18l-1.8-6.2L6 10l6.2-1.8L14 2z" fill="#85E307" />
      <path d="M23 16l.9 3.1L27 20l-3.1.9L23 24l-.9-3.1L19 20l3.1-.9L23 16z" fill="#3F6F00" opacity="0.85" />
      <path d="M5 15l.7 2.4L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.6L5 15z" fill="#85E307" opacity="0.9" />
    </svg>
  )
}

export function KnetReceiptPanel({
  receipt,
  downloading = false,
  onDownloadInvoice,
  showActions = true,
}: Props) {
  const { t } = useTranslation()
  const captured = isKnetReceiptCaptured(receipt)
  const failed = isKnetReceiptDefinitelyFailed(receipt)
  const pending = !captured && !failed
  const fields = buildKnetReceiptFields(receipt, t)
  const paymentRef = knetPaymentRef(receipt)
  const [copied, setCopied] = useState(false)

  const copyPaymentRef = useCallback(async () => {
    if (!paymentRef) return
    try {
      await navigator.clipboard.writeText(paymentRef)
      setCopied(true)
      toast.success(t('knetReceipt.refCopied'))
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error(t('knetReceipt.refCopyFailed'))
    }
  }, [paymentRef, t])

  // Declined: same KNET detail fields as success + Declined/X hero (certification).
  if (failed) {
    return <KnetPaymentDeclinedPanel receipt={receipt} result={receipt.result} />
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_40px_-20px_rgba(11,15,25,0.25)]">
      {/* Success / pending header */}
      <div
        className={cn(
          'relative overflow-hidden border-b px-6 py-9 text-center sm:px-8 sm:py-10',
          captured
            ? 'border-[#85E307]/25'
            : 'border-amber-200/70 bg-amber-50',
        )}
        role={captured ? 'status' : pending ? 'status' : undefined}
        aria-live="polite"
        style={
          captured
            ? {
                background:
                  'linear-gradient(165deg, #EAF8D4 0%, #F3FBE8 42%, #FFFFFF 100%)',
              }
            : undefined
        }
      >
        {captured ? (
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            aria-hidden
            style={{
              backgroundImage:
                'radial-gradient(ellipse 80% 60% at 0% 50%, rgba(133,227,7,0.22), transparent 55%), radial-gradient(ellipse 70% 50% at 100% 30%, rgba(63,111,0,0.08), transparent 50%)',
            }}
          />
        ) : null}
        {captured ? (
          <div
            className="pointer-events-none absolute -left-8 top-0 h-full w-[55%] opacity-40"
            aria-hidden
            style={{
              background:
                'repeating-linear-gradient(-18deg, transparent, transparent 18px, rgba(255,255,255,0.55) 18px, rgba(255,255,255,0.55) 36px)',
              maskImage: 'linear-gradient(90deg, black 0%, transparent 90%)',
              WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 90%)',
            }}
          />
        ) : null}

        <div className="relative">
          <div className="relative mx-auto mb-5 flex h-[4.75rem] w-[4.75rem] items-center justify-center">
            {captured ? (
              <>
                <div
                  className="absolute inset-[-6px] rounded-full bg-[#85E307]/25 blur-md"
                  aria-hidden
                />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#85E307] shadow-[0_12px_28px_-8px_rgba(63,111,0,0.55)]">
                  <Check className="h-9 w-9 text-white" strokeWidth={3} />
                </div>
                <SuccessSparkles className="absolute -right-3 -top-2" />
              </>
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
                <Loader2 className="h-10 w-10 animate-spin text-amber-700" />
              </div>
            )}
          </div>

          {!captured ? (
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#64748B]">
              {t('knetReceipt.badge')}
            </p>
          ) : null}

          <h1 className="type-page-title text-[#0B0F19]">
            {captured ? t('knetReceipt.successTitle') : t('knetReceipt.pendingTitle')}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#64748B]">
            {captured ? t('knetReceipt.successBody') : t('knetReceipt.pendingSubtitle')}
          </p>

          {captured && paymentRef ? (
            <div className="mx-auto mt-6 flex max-w-md items-center justify-between gap-3 rounded-full border border-[#85E307]/35 bg-[#F4FCE8] px-4 py-2.5 shadow-sm">
              <span className="min-w-0 truncate font-mono text-sm font-bold tracking-wide text-[#0B0F19]">
                {paymentRef}
              </span>
              <button
                type="button"
                onClick={() => void copyPaymentRef()}
                className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-2 text-sm font-semibold text-[#3F6F00] transition hover:bg-white/70 active:scale-[0.98]"
                aria-label={t('knetReceipt.copyRefAria')}
              >
                <Copy className="h-4 w-4" aria-hidden />
                <span>{copied ? t('knetReceipt.copied') : t('knetReceipt.refLabel')}</span>
              </button>
            </div>
          ) : null}

          <div className="mt-5 flex justify-center">
            <img
              src={knetBadge}
              alt={t('checkoutPage.trustKnetAlt')}
              className="h-9 w-auto rounded-md object-contain shadow-sm"
            />
          </div>
        </div>
      </div>

      <div className="px-5 py-6 sm:px-8">
        {captured ? (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#85E307]/30 bg-[#F3FBE8] px-4 py-3.5 sm:items-center">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#85E307]">
              <ShieldCheck className="h-5 w-5 text-[#0B0F19]" strokeWidth={2.25} aria-hidden />
            </div>
            <div className="hidden h-10 w-px shrink-0 bg-[#85E307]/35 sm:block" aria-hidden />
            <div className="min-w-0 text-start">
              <p className="text-sm font-bold text-[#3F6F00]">{t('knetReceipt.trustTitle')}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-[#3F6F00]/90">
                {t('knetReceipt.trustBody')}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#3F6F00]" aria-hidden />
          <h2 className="text-sm font-bold text-[#0B0F19]">{t('knetReceipt.paymentDetails')}</h2>
        </div>

        {receipt.is_vault_held ? (
          <div className="checkout-vault-banner mb-4">
            <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#3F6F00]" aria-hidden />
            <div>
              <p className="font-semibold text-[#0B0F19]">{t('knetReceipt.vaultHeldTitle')}</p>
              <p className="mt-1 text-xs leading-5 text-[#64748B]">{t('knetReceipt.vaultHeldBody')}</p>
            </div>
          </div>
        ) : null}

        <div className="divide-y divide-black/5 rounded-xl border border-black/10 bg-[#F9F9FA]">
          {fields.map((row) => (
            <div
              key={row.label}
              className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
            >
              <span className="text-sm text-[#64748B]">{row.label}</span>
              <span className="break-all text-sm font-semibold text-[#0B0F19] sm:max-w-[60%] sm:text-end">
                {row.value}
              </span>
            </div>
          ))}
        </div>

        {showActions ? (
          <div className="mt-6 space-y-3">
            {pending ? (
              <p className="rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-center text-xs leading-relaxed text-amber-900">
                {t('knetReceipt.downloadOnlyWhenPaid')}
              </p>
            ) : null}

            {captured ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {/* Primary first in DOM → start edge (right in RTL, left in LTR) */}
                <Link
                  to="/dashboard?tab=orders"
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#85E307] px-5 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9AEF2A] active:scale-[0.98]"
                >
                  <FileText className="h-4 w-4" aria-hidden />
                  {t('checkoutPage.viewMyOrders')}
                </Link>
                {onDownloadInvoice ? (
                  <button
                    type="button"
                    onClick={onDownloadInvoice}
                    disabled={downloading}
                    className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-[#85E307]/50 bg-white px-5 text-sm font-semibold text-[#0B0F19] transition hover:bg-[#F3FBE8] disabled:opacity-60 active:scale-[0.98]"
                  >
                    {downloading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[#3F6F00]" />
                    ) : (
                      <Download className="h-4 w-4 text-[#3F6F00]" aria-hidden />
                    )}
                    {t('checkoutPage.downloadInvoice')}
                  </button>
                ) : null}
                <Link
                  to="/products"
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-5 text-sm font-semibold text-[#0B0F19] transition hover:bg-[#F9F9FA] active:scale-[0.98]"
                >
                  {t('cartPage.continueShopping')}
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/products"
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#64748B] transition hover:bg-[#F9F9FA] active:scale-[0.98]"
                >
                  {t('cartPage.continueShopping')}
                </Link>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  )
}
