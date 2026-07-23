import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Mail,
  MessageCircle,
  FileDown,
  ArrowRight,
  Eye,
  Download,
  Printer,
  Loader2,
  ExternalLink,
} from 'lucide-react'
import AdminPaginationBar from '../../components/admin/AdminPaginationBar'
import { invoicesApi } from '../../services/api'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type InvoiceRow = {
  id: string
  invoice_number: string
  invoice_type_display?: string
  invoice_type?: string
  status_display?: string
  status?: string
  created_at?: string
  sale?: string | null
  purchase?: string | null
  pdf_file?: string | null
  email_sent?: boolean
  whatsapp_sent?: boolean
}

const PAGE_SIZE = 10

export default function AdminInvoices() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [pendingPage, setPendingPage] = useState(1)
  const [allPage, setAllPage] = useState(1)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRow | null>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.getInvoices(),
  })

  const { data: pendingData } = useQuery({
    queryKey: ['invoicesPending'],
    queryFn: () => invoicesApi.getPendingDelivery(),
  })

  const saleId = previewInvoice?.sale || null
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: ['invoicePreview', saleId],
    queryFn: () => invoicesApi.getSaleInvoicePreview(saleId!),
    enabled: previewOpen && !!saleId,
  })
  const previewHtml = (previewData as { html?: string } | undefined)?.html ?? ''

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] })
    queryClient.invalidateQueries({ queryKey: ['invoicesPending'] })
  }

  const generatePdf = useMutation({
    mutationFn: (id: string) => invoicesApi.generatePdf(id),
    onSuccess: () => {
      invalidate()
      toast.success(t('admin.invoicesPage.pdfGenerated'))
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('admin.invoicesPage.pdfFailed')
      toast.error(detail)
    },
  })

  const sendEmail = useMutation({
    mutationFn: (id: string) => invoicesApi.sendEmail(id),
    onSuccess: () => {
      invalidate()
      toast.success(t('admin.invoicesPage.emailSent'))
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('admin.invoicesPage.emailFailed')
      toast.error(detail)
    },
  })

  const sendWhatsApp = useMutation({
    mutationFn: (id: string) => invoicesApi.sendWhatsApp(id),
    onSuccess: () => {
      invalidate()
      toast.success(t('admin.invoicesPage.whatsappSent'))
    },
    onError: (err: unknown) => {
      const detail =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        t('admin.invoicesPage.whatsappFailed')
      toast.error(detail)
    },
  })

  const list: InvoiceRow[] = Array.isArray(invoicesData)
    ? (invoicesData as InvoiceRow[])
    : ((invoicesData as { results?: InvoiceRow[] })?.results ?? [])
  const pending: InvoiceRow[] = Array.isArray(pendingData) ? (pendingData as InvoiceRow[]) : []

  const pendingTotal = pending.length
  const pendingTotalPages = Math.max(1, Math.ceil(pendingTotal / PAGE_SIZE))
  const pendingSlice = useMemo(
    () => pending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE),
    [pending, pendingPage],
  )

  const allTotal = list.length
  const allTotalPages = Math.max(1, Math.ceil(allTotal / PAGE_SIZE))
  const allSlice = useMemo(
    () => list.slice((allPage - 1) * PAGE_SIZE, allPage * PAGE_SIZE),
    [list, allPage],
  )

  useEffect(() => {
    setPendingPage(1)
  }, [pendingData])

  useEffect(() => {
    setAllPage(1)
  }, [invoicesData])

  useEffect(() => {
    if (pendingPage > pendingTotalPages) setPendingPage(pendingTotalPages)
  }, [pendingPage, pendingTotalPages])

  useEffect(() => {
    if (allPage > allTotalPages) setAllPage(allTotalPages)
  }, [allPage, allTotalPages])

  const openPreview = (inv: InvoiceRow) => {
    if (!inv.sale) {
      toast.error(t('admin.invoicesPage.noSaleLinked'))
      return
    }
    setPreviewInvoice(inv)
    setPreviewOpen(true)
  }

  const downloadPdf = async (inv: InvoiceRow) => {
    if (!inv.sale) {
      toast.error(t('admin.invoicesPage.noSaleLinked'))
      return
    }
    try {
      await invoicesApi.downloadSaleInvoicePdf(inv.sale, inv.invoice_number)
      toast.success(t('admin.invoicesPage.pdfDownloaded'))
    } catch (err: unknown) {
      const detail =
        (err as { message?: string })?.message || t('admin.invoicesPage.pdfFailed')
      toast.error(detail)
    }
  }

  const printPreview = () => {
    if (!previewHtml) return
    const w = window.open('', '_blank', 'width=900,height=1100')
    if (!w) {
      toast.error(t('admin.invoicesPage.popupBlocked'))
      return
    }
    w.document.write(previewHtml)
    w.document.close()
    setTimeout(() => {
      w.focus()
      w.print()
    }, 400)
  }

  const actionButtons = (inv: InvoiceRow) => (
    <div className="flex flex-wrap gap-1">
      <button
        type="button"
        onClick={() => openPreview(inv)}
        disabled={!inv.sale}
        className="p-2 text-lime-900 hover:bg-lime-100 rounded disabled:opacity-40"
        title={t('admin.invoicesPage.view')}
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => void downloadPdf(inv)}
        disabled={!inv.sale}
        className="p-2 text-lime-900 hover:bg-lime-100 rounded disabled:opacity-40"
        title={t('admin.invoicesPage.download')}
      >
        <Download className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => generatePdf.mutate(inv.id)}
        disabled={generatePdf.isPending || !inv.sale}
        className="p-2 text-lime-800 hover:bg-lime-100 rounded disabled:opacity-40"
        title={t('admin.invoicesPage.regeneratePdf')}
      >
        <FileDown className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => sendEmail.mutate(inv.id)}
        disabled={sendEmail.isPending || !inv.sale}
        className="p-2 text-lime-800 hover:bg-lime-100 rounded disabled:opacity-40"
        title={t('admin.invoicesPage.sendEmail')}
      >
        <Mail className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => sendWhatsApp.mutate(inv.id)}
        disabled={sendWhatsApp.isPending || !inv.sale}
        className="p-2 text-lime-800 hover:bg-lime-100 rounded disabled:opacity-40"
        title={t('admin.invoicesPage.sendWhatsapp')}
      >
        <MessageCircle className="w-4 h-4" />
      </button>
      {inv.sale ? (
        <Link
          to={`/admin/orders`}
          state={{ highlightSaleId: inv.sale }}
          className="p-2 text-stone-600 hover:bg-stone-100 rounded"
          title={t('admin.invoicesPage.openOrder')}
        >
          <ExternalLink className="w-4 h-4" />
        </Link>
      ) : null}
    </div>
  )

  return (
    <div className="admin-page-inner">
      <div className="admin-page-body">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">
              {t('admin.invoicesPage.title')}
            </h1>
            <p className="text-stone-600 mt-1">{t('admin.invoicesPage.subtitle')}</p>
            <p className="text-xs text-stone-500 mt-2 max-w-2xl">
              {t('admin.invoicesPage.hintVsOrders')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/orders"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-400/50 text-amber-950 hover:bg-amber-50 font-medium"
            >
              <FileText className="w-4 h-4" />
              {t('admin.orders')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/invoices/terms"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-lime-400/50 text-lime-900 hover:bg-lime-100 font-medium"
            >
              <FileText className="w-4 h-4" />
              {t('admin.invoiceTerms.title')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/invoices/templates"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-lime-400/50 text-lime-900 hover:bg-lime-100 font-medium"
            >
              <FileText className="w-4 h-4" />
              {t('admin.invoicesPage.templates')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="gold-card mb-8">
            <h2 className="text-lg font-semibold text-black mb-4">
              {t('admin.invoicesPage.pendingDelivery')}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 text-stone-700 font-medium">
                      {t('admin.invoicesPage.colNumber')}
                    </th>
                    <th className="text-left py-3 px-4 text-stone-700 font-medium">
                      {t('admin.invoicesPage.colType')}
                    </th>
                    <th className="text-left py-3 px-4 text-stone-700 font-medium">
                      {t('admin.invoicesPage.colStatus')}
                    </th>
                    <th className="text-left py-3 px-4 text-stone-700 font-medium">
                      {t('admin.invoicesPage.colActions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSlice.map((inv) => (
                    <tr key={inv.id} className="border-b border-stone-100">
                      <td className="py-3 px-4 font-mono text-black">{inv.invoice_number}</td>
                      <td className="py-3 px-4 text-stone-800">
                        {inv.invoice_type_display || inv.invoice_type}
                      </td>
                      <td className="py-3 px-4 text-stone-800">
                        {inv.status_display || inv.status}
                      </td>
                      <td className="py-3 px-4">{actionButtons(inv)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pendingTotal > PAGE_SIZE && (
              <AdminPaginationBar
                page={pendingPage}
                totalPages={pendingTotalPages}
                total={pendingTotal}
                pageSize={PAGE_SIZE}
                onPageChange={setPendingPage}
                itemLabel={t('admin.invoicesPage.pendingLabel')}
              />
            )}
          </div>
        )}

        {isLoading ? (
          <div className="gold-card p-8 text-center text-stone-700 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t('admin.invoicesPage.loading')}
          </div>
        ) : (
          <div className="gold-card overflow-x-auto">
            <h2 className="text-lg font-semibold text-black mb-4">
              {t('admin.invoicesPage.allInvoices')}
            </h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">
                    {t('admin.invoicesPage.colNumber')}
                  </th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">
                    {t('admin.invoicesPage.colType')}
                  </th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">
                    {t('admin.invoicesPage.colStatus')}
                  </th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">
                    {t('admin.invoicesPage.colCreated')}
                  </th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">
                    {t('admin.invoicesPage.colActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {allSlice.map((inv) => (
                  <tr key={inv.id} className="border-b border-stone-100">
                    <td className="py-3 px-4 font-mono text-black">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-stone-800">
                      {inv.invoice_type_display || inv.invoice_type}
                    </td>
                    <td className="py-3 px-4 text-stone-800">
                      {inv.status_display || inv.status}
                    </td>
                    <td className="py-3 px-4 text-stone-800">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">{actionButtons(inv)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && (
              <p className="py-8 text-center text-stone-700">{t('admin.invoicesPage.empty')}</p>
            )}
            {!isLoading && allTotal > PAGE_SIZE && (
              <AdminPaginationBar
                page={allPage}
                totalPages={allTotalPages}
                total={allTotal}
                pageSize={PAGE_SIZE}
                onPageChange={setAllPage}
                itemLabel={t('admin.invoices')}
              />
            )}
          </div>
        )}
      </div>

      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          setPreviewOpen(open)
          if (!open) setPreviewInvoice(null)
        }}
      >
        <DialogContent className="bg-white border-black/15 text-black max-w-5xl max-h-[95vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-stone-200 shrink-0">
            <DialogTitle className="gold-gradient-text-on-light flex items-center gap-2 text-black">
              <FileText className="w-5 h-5" />
              {t('admin.invoicesPage.previewTitle', {
                number: previewInvoice?.invoice_number || '',
              })}
            </DialogTitle>
            <div className="flex flex-wrap gap-2 mt-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-lime-100 text-lime-950 text-sm font-semibold disabled:opacity-50"
                disabled={!previewHtml || previewLoading}
                onClick={printPreview}
              >
                <Printer className="w-4 h-4" />
                {t('admin.invoicesPage.print')}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 text-amber-950 text-sm font-semibold disabled:opacity-50"
                disabled={!previewInvoice?.sale}
                onClick={() => previewInvoice && void downloadPdf(previewInvoice)}
              >
                <Download className="w-4 h-4" />
                {t('admin.invoicesPage.downloadPdf')}
              </button>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-auto p-4 bg-stone-50">
            {previewLoading ? (
              <div className="flex items-center justify-center gap-2 py-16 text-stone-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('admin.invoicesPage.loadingPreview')}
              </div>
            ) : previewHtml ? (
              <iframe
                ref={iframeRef}
                title={previewInvoice?.invoice_number || 'invoice'}
                srcDoc={previewHtml}
                className="w-full min-h-[70vh] bg-white rounded border border-stone-200"
              />
            ) : (
              <p className="py-12 text-center text-stone-600">{t('admin.invoicesPage.noPreview')}</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
