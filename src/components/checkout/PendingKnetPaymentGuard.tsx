import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Loader2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { ordersApi } from '@/services/api'
import {
  clearKnetPendingSale,
  knetPendingAgeMs,
  KNET_PENDING_AUTO_ABANDON_MS,
  readKnetPendingSale,
  type KnetPendingSale,
} from '@/lib/knetPendingSale'
import { cn } from '@/lib/utils'

/**
 * When the customer starts KNET then backs out without the bank callback,
 * inventory stays consumed until abandon. This banner + stale auto-abandon
 * restores stock (abandon inquires first so CAPTURED still wins).
 */
export function PendingKnetPaymentGuard() {
  const { t } = useTranslation()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [pending, setPending] = useState<KnetPendingSale | null>(null)
  const [busy, setBusy] = useState(false)

  const refreshPending = useCallback(() => {
    setPending(readKnetPendingSale())
  }, [])

  useEffect(() => {
    refreshPending()
  }, [location.pathname, location.search, refreshPending])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') refreshPending()
    }
    window.addEventListener('pageshow', onVis)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.removeEventListener('pageshow', onVis)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [refreshPending])

  const onPaymentReceipt = location.pathname.startsWith('/payment-receipt')
  const search = new URLSearchParams(location.search)
  const knetReturnSignal = Boolean(
    search.get('knet_status') || search.get('result') || search.get('reason'),
  )

  const abandon = useCallback(
    async (saleId: string, opts?: { silent?: boolean }) => {
      setBusy(true)
      try {
        const res = await ordersApi.abandonUnpaidKnet(saleId)
        clearKnetPendingSale()
        setPending(null)
        await queryClient.invalidateQueries({ queryKey: ['products'] })
        await queryClient.invalidateQueries({ queryKey: ['product'] })
        if (res.payment_status === 'paid') {
          if (!opts?.silent) {
            toast.success(t('checkoutPage.knetPendingPaidRedirect'))
          }
          return res
        }
        if (!opts?.silent) {
          toast.success(t('checkoutPage.knetPendingCancelledRestock'))
        }
        return res
      } catch {
        if (!opts?.silent) {
          toast.error(t('checkoutPage.knetPendingCancelFailed'))
        }
        return null
      } finally {
        setBusy(false)
      }
    },
    [queryClient, t],
  )

  // Stale pending (customer left bank, never came back via callback) → restock.
  useEffect(() => {
    if (!pending || onPaymentReceipt || knetReturnSignal || busy) return
    if (knetPendingAgeMs(pending) < KNET_PENDING_AUTO_ABANDON_MS) return
    void abandon(pending.saleId, { silent: true })
  }, [pending, onPaymentReceipt, knetReturnSignal, busy, abandon])

  if (!pending || onPaymentReceipt || knetReturnSignal) return null

  const resumeHref = `/payment-receipt/${pending.saleId}?knet_status=pending&reason=resume`

  return (
    <div
      className="sticky top-[var(--nav-offset,0px)] z-40 border-b border-amber-200 bg-amber-50"
      role="status"
    >
      <div className="page-shell flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium text-amber-950">
          {t('checkoutPage.knetPendingBanner')}
          {pending.invoice ? (
            <span className="ms-1 font-mono text-xs text-amber-800">({pending.invoice})</span>
          ) : null}
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            to={resumeHref}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-amber-300 bg-white px-4 text-sm font-semibold text-[#0B0F19] transition hover:bg-amber-100"
          >
            {t('checkoutPage.knetPendingResume')}
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => void abandon(pending.saleId)}
            className={cn(
              'inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#0B0F19] px-4 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60',
            )}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
            {t('checkoutPage.knetPendingCancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
