import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { XCircle } from 'lucide-react'
import { invoicesApi, ordersApi } from '@/services/api'
import type { KnetReceiptDetails } from '@/types'
import { KnetReceiptPanel } from '@/components/checkout/KnetReceiptPanel'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'

import { useCart } from '../contexts/CartContext'

export default function KnetReceiptPage() {
  const { t } = useTranslation()
  const { saleId } = useParams<{ saleId: string }>()
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

    const load = async () => {
      try {
        try {
          await ordersApi.verifyKnetPayment(saleId)
        } catch {
          /* still load latest receipt snapshot */
        }
        const data = await ordersApi.getKnetReceipt(saleId)
        if (!cancelled) {
          setReceipt(data)
          setError(null)
          
          // Clear cart only if this was a fresh return from a successful payment.
          // We check the pending sale key to avoid clearing if they're just viewing an old receipt.
          const pendingRaw = sessionStorage.getItem('gs_knet_pending_sale')
          if (pendingRaw && (data.status === 'CAPTURED' || data.result === 'CAPTURED')) {
            try {
              const pending = JSON.parse(pendingRaw)
              if (pending.saleId === saleId) {
                clearCart()
                sessionStorage.removeItem('gs_knet_pending_sale')
              }
            } catch {
              // ignore parse errors
            }
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
  }, [saleId, t])

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

  return (
    <div className="min-h-screen bg-[#F9F9FA] py-10 sm:py-12">
      <div className="page-shell py-10 sm:py-12">
        <KnetReceiptPanel
          receipt={receipt}
          downloading={downloading}
          onDownloadInvoice={() => void downloadInvoice()}
        />
      </div>
    </div>
  )
}
