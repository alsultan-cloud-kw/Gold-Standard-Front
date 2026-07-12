import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileText, Mail, MessageCircle, FileDown, ArrowRight } from 'lucide-react'
import AdminPaginationBar from '../../components/admin/AdminPaginationBar'
import { invoicesApi } from '../../services/api'
import { toast } from 'sonner'

type InvoiceRow = {
  id: string
  invoice_number: string
  invoice_type_display?: string
  invoice_type?: string
  status_display?: string
  status?: string
  created_at?: string
}

const PAGE_SIZE = 10

export default function AdminInvoices() {
  const queryClient = useQueryClient()
  const [pendingPage, setPendingPage] = useState(1)
  const [allPage, setAllPage] = useState(1)
  const { data: invoicesData, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesApi.getInvoices(),
  })

  const { data: pendingData } = useQuery({
    queryKey: ['invoicesPending'],
    queryFn: () => invoicesApi.getPendingDelivery(),
  })

  const generatePdf = useMutation({
    mutationFn: (id: string) => invoicesApi.generatePdf(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoicesPending'] })
      toast.success('PDF generation requested')
    },
    onError: () => toast.error('Failed to generate PDF'),
  })

  const sendEmail = useMutation({
    mutationFn: (id: string) => invoicesApi.sendEmail(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('Email send requested')
    },
    onError: () => toast.error('Failed to send email'),
  })

  const sendWhatsApp = useMutation({
    mutationFn: (id: string) => invoicesApi.sendWhatsApp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      toast.success('WhatsApp send requested')
    },
    onError: () => toast.error('Failed to send via WhatsApp'),
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

  return (
    <div className="admin-page-inner">
      <div className="admin-page-body">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">Invoices</h1>
            <p className="text-stone-600 mt-1">Manage and deliver invoices</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/admin/invoices/terms"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-lime-400/50 text-lime-900 hover:bg-lime-100 font-medium"
            >
              <FileText className="w-4 h-4" />
              Terms &amp; Conditions
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/admin/invoices/templates"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-lime-400/50 text-lime-900 hover:bg-lime-100 font-medium"
            >
              <FileText className="w-4 h-4" />
              Invoice Templates
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {pending.length > 0 && (
          <div className="gold-card mb-8">
            <h2 className="text-lg font-semibold text-black mb-4">Pending Delivery</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 text-stone-700 font-medium">Invoice #</th>
                    <th className="text-left py-3 px-4 text-stone-700 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-stone-700 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-stone-700 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingSlice.map((inv) => (
                    <tr key={inv.id} className="border-b border-stone-100">
                      <td className="py-3 px-4 font-mono text-black">{inv.invoice_number}</td>
                      <td className="py-3 px-4 text-stone-800">{inv.invoice_type_display || inv.invoice_type}</td>
                      <td className="py-3 px-4 text-stone-800">{inv.status_display || inv.status}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button
                          onClick={() => generatePdf.mutate(inv.id)}
                          disabled={generatePdf.isPending}
                          className="p-2 text-lime-800 hover:bg-lime-100 rounded"
                          title="Generate PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendEmail.mutate(inv.id)}
                          disabled={sendEmail.isPending}
                          className="p-2 text-lime-800 hover:bg-lime-100 rounded"
                          title="Send email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendWhatsApp.mutate(inv.id)}
                          disabled={sendWhatsApp.isPending}
                          className="p-2 text-lime-800 hover:bg-lime-100 rounded"
                          title="Send WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </td>
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
                itemLabel="pending"
              />
            )}
          </div>
        )}

        {isLoading ? (
          <div className="gold-card p-8 text-center text-stone-700">Loading...</div>
        ) : (
          <div className="gold-card overflow-x-auto">
            <h2 className="text-lg font-semibold text-black mb-4">All Invoices</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">Invoice #</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">Created</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {allSlice.map((inv) => (
                  <tr key={inv.id} className="border-b border-stone-100">
                    <td className="py-3 px-4 font-mono text-black">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-stone-800">{inv.invoice_type_display || inv.invoice_type}</td>
                    <td className="py-3 px-4 text-stone-800">{inv.status_display || inv.status}</td>
                    <td className="py-3 px-4 text-stone-800">{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => generatePdf.mutate(inv.id)}
                        disabled={generatePdf.isPending}
                        className="p-2 text-lime-800 hover:bg-lime-100 rounded"
                        title="Generate PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => sendEmail.mutate(inv.id)}
                        disabled={sendEmail.isPending}
                        className="p-2 text-lime-800 hover:bg-lime-100 rounded"
                        title="Send email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => sendWhatsApp.mutate(inv.id)}
                        disabled={sendWhatsApp.isPending}
                        className="p-2 text-lime-800 hover:bg-lime-100 rounded"
                        title="Send WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && (
              <p className="py-8 text-center text-stone-700">No invoices found.</p>
            )}
            {!isLoading && allTotal > PAGE_SIZE && (
              <AdminPaginationBar
                page={allPage}
                totalPages={allTotalPages}
                total={allTotal}
                pageSize={PAGE_SIZE}
                onPageChange={setAllPage}
                itemLabel="invoices"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
