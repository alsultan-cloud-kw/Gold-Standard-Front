import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { invoicesApi, ordersApi } from '@/services/api'
import type { KnetReceiptDetails } from '@/types'
import { KnetReceiptPanel } from '@/components/checkout/KnetReceiptPanel'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { isKnetReceiptCaptured } from '@/lib/knetReceipt'

import { useCart } from '../contexts/CartContext'

const VERIFY_POLL_MS = 1_800
const VERIFY_DEADLINE_MS = 18_000

export default function KnetReceiptPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { saleId } = useParams<{ saleId: string }>()
  const [searchParams] = useSearchParams()
  const { clearCart } = useCart()
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

    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), ms)
        }),
      ])

    const load = async () => {
      try {
        const urlStatus = (searchParams.get('knet_status') || '').toLowerCase()
        const reason = (searchParams.get('reason') || '').toLowerCase()
        const userCancelled =
          reason === 'cancelled' || reason === 'canceled' || reason === 'user_cancel'
        const shouldPoll =
          urlStatus === 'pending' ||
          urlStatus === 'failed' ||
          reason === 'missing_trandata' ||
          reason === 'decrypt_failed' ||
          reason === 'resume' ||
          reason === 'payment_url_missing' ||
          userCancelled ||
          !urlStatus

        let paid = false
        if (shouldPoll) {
          const deadline = Date.now() + VERIFY_DEADLINE_MS
          while (!cancelled && Date.now() < deadline) {
            try {
              const verify = await withTimeout(ordersApi.verifyKnetPayment(saleId), 7_000)
              if (verify.payment_status === 'paid') {
                paid = true
                break
              }
              if (
                verify.payment_status === 'failed' &&
                reason !== 'missing_trandata' &&
                reason !== 'decrypt_failed' &&
                !userCancelled
              ) {
                break
              }
            } catch {
              // keep polling
            }
            await new Promise((r) => setTimeout(r, VERIFY_POLL_MS))
          }
        } else {
          try {
            await ordersApi.verifyKnetPayment(saleId)
          } catch {
            /* still load latest receipt snapshot */
          }
        }

        const data = await ordersApi.getKnetReceipt(saleId)
        if (cancelled) return

        setReceipt(data)
        setError(null)

        const captured = isKnetReceiptCaptured(data) || paid
        if (captured) {
          // Never leave ?knet_status=failed in the address bar after a real capture.
          if (urlStatus && urlStatus !== 'success') {
            navigate(`/payment-receipt/${saleId}?knet_status=success`, { replace: true })
          }
          clearCart()
          sessionStorage.removeItem('gs_knet_pending_sale')
        }
      } catch {
        if (!cancelled) setError(t('knetReceipt.loadError'))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [saleId, t, clearCart, navigate, searchParams])

  const downloadInvoice = async () => {
    if (!saleId || !isKnetReceiptCaptured(receipt)) {
      toast.error(t('knetReceipt.downloadOnlyWhenPaid'))
      return
    }
    setDownloading(true)
    try {
      await invoicesApi.downloadSaleInvoicePdf(
        saleId,
        receipt?.invoice_number ? `${receipt.invoice_number}.pdf` : undefined,
      )
    } catch (err) {
      const detail = err instanceof Error && err.message ? err.message : ''
      toast.error(detail || t('checkoutPage.invoiceLoadError'))
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <AppLoadingScreen
        variant="fullscreen"
        message={t('checkoutPage.knetVerifyingTitle')}
      />
    )
  }

  if (error || !receipt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F9FA] px-4 py-16">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <XCircle className="mx-auto mb-4 h-10 w-10 text-[#DC2626]" />
          <h1 className="mb-2 text-xl font-semibold text-[#0B0F19]">{t('knetReceipt.errorTitle')}</h1>
          <p className="text-sm text-[#64748B]">{error || t('knetReceipt.loadError')}</p>
          <Link
            to="/checkout"
            className="mt-6 inline-flex rounded-xl bg-[#85E307] px-6 py-3 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9AEF2A]"
          >
            {t('checkoutPage.knetTryAgain')}
          </Link>
        </div>
      </div>
    )
  }

  const captured = isKnetReceiptCaptured(receipt)

  return (
    <div className="min-h-screen bg-[#F9F9FA] py-10 sm:py-12">
      <div className="page-shell py-10 sm:py-12">
        <KnetReceiptPanel
          receipt={receipt}
          downloading={downloading}
          onDownloadInvoice={captured ? () => void downloadInvoice() : undefined}
        />
      </div>
    </div>
  )
}
