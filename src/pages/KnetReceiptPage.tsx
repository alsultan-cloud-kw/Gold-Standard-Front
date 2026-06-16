import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, CreditCard, Download, Loader2, XCircle } from 'lucide-react'
import { invoicesApi, ordersApi } from '@/services/api'
import type { KnetReceiptDetails } from '@/types'

function normalizeResult(value?: string | null) {
  return (value || '').replace(/\+/g, ' ').trim().toUpperCase()
}

function isCaptured(receipt: KnetReceiptDetails | null) {
  const result = normalizeResult(receipt?.result)
  return receipt?.payment_status === 'paid' || ['CAPTURED', 'SUCCESS', 'PROCESSED', 'APPROVED'].includes(result)
}

export default function KnetReceiptPage() {
  const { t } = useTranslation()
  const { saleId } = useParams<{ saleId: string }>()
  const [receipt, setReceipt] = useState<KnetReceiptDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    if (!saleId) {
      setError(t('knetReceipt.missingSale'))
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    ordersApi.getKnetReceipt(saleId)
      .then((data) => {
        if (!cancelled) {
          setReceipt(data)
          setError(null)
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('knetReceipt.loadError'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [saleId, t])

  const captured = isCaptured(receipt)
  const fields = useMemo(() => {
    if (!receipt) return []
    return [
      [t('knetReceipt.merchant'), receipt.merchant_name],
      [t('knetReceipt.orderNumber'), receipt.invoice_number],
      [t('knetReceipt.paymentId'), receipt.payment_id || t('knetReceipt.unavailable')],
      [t('knetReceipt.transactionId'), receipt.transaction_id || t('knetReceipt.unavailable')],
      [t('knetReceipt.trackId'), receipt.track_id || t('knetReceipt.unavailable')],
      [t('knetReceipt.referenceId'), receipt.reference_id || t('knetReceipt.unavailable')],
      [t('knetReceipt.amount'), `${receipt.amount} ${receipt.currency}`],
      [t('knetReceipt.dateTime'), `${receipt.transaction_datetime} (${receipt.transaction_timezone})`],
      [t('knetReceipt.status'), receipt.result || receipt.payment_status],
    ]
  }, [receipt, t])

  const downloadInvoice = async () => {
    if (!saleId) return
    setDownloading(true)
    try {
      const res = await invoicesApi.getSaleInvoicePreview(saleId)
      const html = res.html || ''
      const w = window.open('', '_blank')
      if (!w) return
      w.document.open()
      w.document.write(html)
      w.document.close()
      w.focus()
      setTimeout(() => w.print(), 350)
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-amber-600" />
          <p className="text-sm text-stone-600">{t('knetReceipt.loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-lg">
          <XCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
          <h1 className="mb-2 text-xl font-semibold text-stone-950">{t('knetReceipt.errorTitle')}</h1>
          <p className="text-sm text-stone-600">{error || t('knetReceipt.loadError')}</p>
          <Link to="/checkout" className="gold-button mt-6 inline-flex">
            {t('checkoutPage.knetTryAgain')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl">
          <div className={`px-8 py-8 text-center ${captured ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${captured ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
              {captured ? <Check className="h-8 w-8" /> : <XCircle className="h-8 w-8" />}
            </div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              {t('knetReceipt.badge')}
            </p>
            <h1 className="text-2xl font-bold text-stone-950">
              {captured ? t('knetReceipt.capturedTitle') : t('knetReceipt.notCapturedTitle')}
            </h1>
            <p className="mt-2 text-sm text-stone-600">{t('knetReceipt.subtitle')}</p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-stone-900">
              <CreditCard className="h-4 w-4 text-amber-600" />
              {t('knetReceipt.paymentDetails')}
            </div>
            <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200">
              {fields.map(([label, value]) => (
                <div key={label} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-sm text-stone-500">{label}</span>
                  <span className="break-all text-sm font-semibold text-stone-950 sm:text-end">{value}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void downloadInvoice()}
                disabled={downloading}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-600 px-5 py-2.5 font-semibold text-amber-800 transition hover:bg-amber-50 disabled:opacity-60"
              >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t('checkoutPage.downloadInvoice')}
              </button>
              <Link to="/dashboard" className="inline-flex flex-1 items-center justify-center rounded-xl bg-stone-950 px-5 py-2.5 font-semibold text-white transition hover:bg-stone-800">
                {t('checkoutPage.viewMyOrders')}
              </Link>
              <Link to="/products" className="inline-flex flex-1 items-center justify-center rounded-xl border border-stone-300 px-5 py-2.5 font-semibold text-stone-700 transition hover:bg-stone-50">
                {t('cartPage.continueShopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
