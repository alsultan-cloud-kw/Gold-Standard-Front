import { Check, CreditCard, Download, Loader2, Lock, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type { KnetReceiptDetails } from '@/types'
import { buildKnetReceiptFields, isKnetReceiptCaptured } from '@/lib/knetReceipt'
import knetBadge from '@/assets/trust/knet-badge.png'
import { cn } from '@/lib/utils'

type Props = {
  receipt: KnetReceiptDetails
  downloading?: boolean
  onDownloadInvoice?: () => void
  showActions?: boolean
}

export function KnetReceiptPanel({
  receipt,
  downloading = false,
  onDownloadInvoice,
  showActions = true,
}: Props) {
  const { t } = useTranslation()
  const captured = isKnetReceiptCaptured(receipt)
  const fields = buildKnetReceiptFields(receipt, t)

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_40px_-20px_rgba(11,15,25,0.25)]">
      <div
        className={cn(
          'border-b px-6 py-8 text-center sm:px-8',
          captured
            ? 'border-[#059669]/20 bg-[rgba(5,150,105,0.1)]'
            : 'border-red-200/60 bg-[rgba(220,38,38,0.08)]',
        )}
      >
        <div
          className={cn(
            'mx-auto mb-4 flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full',
            captured ? 'bg-[rgba(5,150,105,0.15)]' : 'bg-[rgba(220,38,38,0.12)]',
          )}
        >
          {captured ? (
            <Check className="h-10 w-10 text-[#059669]" strokeWidth={2.5} />
          ) : (
            <XCircle className="h-10 w-10 text-[#DC2626]" />
          )}
        </div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#64748B]">
          {t('knetReceipt.badge')}
        </p>
        <h1 className="type-page-title text-[#0B0F19]">
          {captured ? t('knetReceipt.capturedTitle') : t('knetReceipt.notCapturedTitle')}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#64748B]">
          {t('knetReceipt.subtitle')}
        </p>
        <div className="mt-5 flex justify-center">
          <img
            src={knetBadge}
            alt={t('checkoutPage.trustKnetAlt')}
            className="h-10 w-auto rounded-md object-contain shadow-sm"
          />
        </div>
      </div>

      <div className="px-5 py-6 sm:px-8">
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
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {onDownloadInvoice ? (
              <button
                type="button"
                onClick={onDownloadInvoice}
                disabled={downloading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#3F6F00] bg-[#ECFCCB]/40 px-5 py-3 text-sm font-semibold text-[#0B0F19] transition hover:bg-[#ECFCCB]/70 disabled:opacity-60"
              >
                {downloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {t('checkoutPage.downloadInvoice')}
              </button>
            ) : null}
            <Link
              to="/dashboard"
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-[#85E307] px-5 py-3 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9AEF2A]"
            >
              {t('checkoutPage.viewMyOrders')}
            </Link>
            <Link
              to="/products"
              className="inline-flex flex-1 items-center justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#64748B] transition hover:bg-[#F9F9FA]"
            >
              {t('cartPage.continueShopping')}
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  )
}
