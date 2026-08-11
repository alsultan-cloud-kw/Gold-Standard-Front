import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { invoicesApi, ordersApi } from '@/services/api'
import type { KnetReceiptDetails } from '@/types'
import { KnetReceiptPanel } from '@/components/checkout/KnetReceiptPanel'
import { KnetPaymentDeclinedPanel } from '@/components/checkout/KnetPaymentDeclinedPanel'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import {
  isExplicitKnetFailure,
  isKnetGatewayErrorCode,
  isKnetReceiptCaptured,
  isKnetReceiptDefinitelyFailed,
  isKnetTerminalFailResult,
  knetGatewayErrorCodeFromSearch,
} from '@/lib/knetReceipt'
import { cn } from '@/lib/utils'

import { useCart } from '../contexts/CartContext'

const KNET_PENDING_SALE_KEY = 'gs_knet_pending_sale'
const VERIFY_POLL_MS = 1_800
const VERIFY_DEADLINE_MS = 18_000
const VERIFY_DEADLINE_FAIL_MS = 4_000
const FETCH_TIMEOUT_MS = 8_000

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
  const clearCartRef = useRef(clearCart)
  clearCartRef.current = clearCart

  const urlStatus = (searchParams.get('knet_status') || '').toLowerCase()
  const urlResult = searchParams.get('result') || ''
  const urlErrorCode = knetGatewayErrorCodeFromSearch(searchParams)
  const urlLooksFailed =
    isKnetTerminalFailResult(urlResult)
    || isKnetGatewayErrorCode(urlErrorCode)
    || isExplicitKnetFailure(urlStatus, urlResult, searchParams.get('reason'), urlErrorCode)

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
        const reason = (searchParams.get('reason') || '').toLowerCase()
        const userCancelled =
          reason === 'cancelled' || reason === 'canceled' || reason === 'user_cancel'
        const parseGap = reason === 'missing_trandata' || reason === 'decrypt_failed'
        const urlFail = !parseGap && (
          isKnetTerminalFailResult(urlResult)
          || isKnetGatewayErrorCode(urlErrorCode)
          || isExplicitKnetFailure(urlStatus, urlResult, reason, urlErrorCode)
        )

        const shouldPoll =
          urlStatus === 'pending' ||
          urlStatus === 'failed' ||
          urlStatus === 'success' ||
          parseGap ||
          reason === 'resume' ||
          reason === 'payment_url_missing' ||
          reason === 'awaiting_server_confirm' ||
          reason === 'verification_timeout' ||
          userCancelled ||
          Boolean(urlErrorCode) ||
          !urlStatus

        let paid = false
        let sawFailed = false
        if (shouldPoll) {
          const deadlineMs = urlFail ? VERIFY_DEADLINE_FAIL_MS : VERIFY_DEADLINE_MS
          const deadline = Date.now() + deadlineMs
          while (!cancelled && Date.now() < deadline) {
            try {
              const verify = await withTimeout(ordersApi.verifyKnetPayment(saleId), 7_000)
              if (verify.payment_status === 'paid') {
                paid = true
                break
              }
              if (verify.payment_status === 'failed') {
                sawFailed = true
                break
              }
            } catch {
              // keep polling
            }
            if (urlFail) break
            await new Promise((r) => setTimeout(r, VERIFY_POLL_MS))
          }
        } else {
          try {
            await withTimeout(ordersApi.verifyKnetPayment(saleId), 7_000)
          } catch {
            /* still load latest receipt snapshot */
          }
        }

        const shouldAbandon =
          !paid &&
          (sawFailed
            || userCancelled
            || urlStatus === 'failed'
            || urlFail
            || reason === 'payment_url_missing'
            || reason === 'verification_timeout'
            || reason === 'gateway_error'
            || reason === 'payment_failed'
            || parseGap)

        if (!cancelled && shouldAbandon) {
          try {
            sessionStorage.removeItem(KNET_PENDING_SALE_KEY)
          } catch {
            /* ignore */
          }
          try {
            const abandoned = await withTimeout(ordersApi.abandonUnpaidKnet(saleId), FETCH_TIMEOUT_MS)
            if (abandoned.payment_status === 'paid') {
              paid = true
            } else {
              sawFailed = true
            }
          } catch {
            /* inventory may still release via KNET error callback / beat */
            sawFailed = sawFailed || urlFail
          }
        }

        let data: KnetReceiptDetails | null = null
        try {
          data = await withTimeout(ordersApi.getKnetReceipt(saleId), FETCH_TIMEOUT_MS)
        } catch {
          if (!cancelled && urlFail) {
            // Still show declined panel even if receipt snapshot times out.
            setReceipt(null)
            setError(t('knetReceipt.loadError'))
            setLoading(false)
            return
          }
          throw new Error('receipt_load_failed')
        }
        if (cancelled) return

        setReceipt(data)
        setError(null)

        const captured = isKnetReceiptCaptured(data) || paid
        const failed =
          isKnetReceiptDefinitelyFailed(data)
          || ((urlFail || sawFailed) && !captured)
        if (captured) {
          if (urlStatus && urlStatus !== 'success') {
            navigate(`/payment-receipt/${saleId}?knet_status=success`, { replace: true })
          }
          clearCartRef.current()
          try {
            sessionStorage.removeItem(KNET_PENDING_SALE_KEY)
          } catch {
            /* ignore */
          }
        } else if (failed) {
          try {
            sessionStorage.removeItem(KNET_PENDING_SALE_KEY)
          } catch {
            /* ignore */
          }
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
  }, [saleId, t, navigate, searchParams, urlResult, urlStatus, urlErrorCode])

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
        message={
          urlLooksFailed
            ? t('knetReceipt.loadingDeclined')
            : t('checkoutPage.knetVerifyingTitle')
        }
      />
    )
  }

  if (error || !receipt) {
    if (urlLooksFailed) {
      return (
        <div className="min-h-[100dvh] bg-[#F9F9FA]">
          <div className="page-shell flex min-h-[100dvh] items-center justify-center py-10">
            <KnetPaymentDeclinedPanel result={urlResult || urlErrorCode || undefined} />
          </div>
        </div>
      )
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F9FA] px-4 py-16">
        <div className="max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm" role="alert">
          <XCircle className="mx-auto mb-4 h-10 w-10 text-[#DC2626]" aria-hidden />
          <h1 className="mb-2 text-xl font-semibold text-[#0B0F19]">{t('knetReceipt.errorTitle')}</h1>
          <p className="text-sm text-[#64748B]">{error || t('knetReceipt.loadError')}</p>
          <Link
            to="/checkout"
            className="mt-6 inline-flex min-h-11 rounded-xl bg-[#85E307] px-6 py-3 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9AEF2A] active:scale-[0.98]"
          >
            {t('checkoutPage.knetTryAgain')}
          </Link>
        </div>
      </div>
    )
  }

  const captured = isKnetReceiptCaptured(receipt)
  const failed = isKnetReceiptDefinitelyFailed(receipt) || (urlLooksFailed && !captured)

  return (
    <div className={cn('min-h-[100dvh] bg-[#F9F9FA]', failed ? '' : 'py-10 sm:py-12')}>
      <div
        className={cn(
          'page-shell',
          failed ? 'flex min-h-[100dvh] items-center justify-center py-10' : 'py-10 sm:py-12',
        )}
      >
        <KnetReceiptPanel
          receipt={receipt}
          downloading={downloading}
          onDownloadInvoice={captured ? () => void downloadInvoice() : undefined}
        />
      </div>
    </div>
  )
}
