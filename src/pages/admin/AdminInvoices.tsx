import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FileText, Mail, MessageCircle, FileDown, ArrowRight } from 'lucide-react'
import AdminNav from '../../components/admin/AdminNav'
import { invoicesApi } from '../../services/api'
import { toast } from 'sonner'

export default function AdminInvoices() {
  const queryClient = useQueryClient()
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

  const list = Array.isArray(invoicesData) ? invoicesData : (invoicesData as { results?: unknown[] })?.results ?? []
  const pending = (pendingData as unknown[]) ?? []

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">Invoices</h1>
            <p className="text-stone-600 mt-1">Manage and deliver invoices</p>
          </div>
          <Link
            to="/admin/invoices/templates"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gold-500/50 text-gold-600 hover:bg-gold-500/10"
          >
            <FileText className="w-4 h-4" />
            Invoice Templates
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {pending.length > 0 && (
          <div className="gold-card mb-8">
            <h2 className="text-lg font-semibold text-gold-100 mb-4">Pending Delivery</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gold-500/20">
                    <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Invoice #</th>
                    <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((inv: { id: string; invoice_number: string; invoice_type_display?: string; status_display?: string }) => (
                    <tr key={inv.id} className="border-b border-gold-500/10">
                      <td className="py-3 px-4 font-mono text-gold-100">{inv.invoice_number}</td>
                      <td className="py-3 px-4 text-gold-100/80">{inv.invoice_type_display || inv.invoice_type}</td>
                      <td className="py-3 px-4 text-gold-100/80">{inv.status_display || inv.status}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button
                          onClick={() => generatePdf.mutate(inv.id)}
                          disabled={generatePdf.isPending}
                          className="p-2 text-gold-400 hover:bg-gold-500/10 rounded"
                          title="Generate PDF"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendEmail.mutate(inv.id)}
                          disabled={sendEmail.isPending}
                          className="p-2 text-gold-400 hover:bg-gold-500/10 rounded"
                          title="Send email"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => sendWhatsApp.mutate(inv.id)}
                          disabled={sendWhatsApp.isPending}
                          className="p-2 text-gold-400 hover:bg-gold-500/10 rounded"
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
          </div>
        )}

        {isLoading ? (
          <div className="gold-card p-8 text-center text-gold-100/70">Loading...</div>
        ) : (
          <div className="gold-card overflow-x-auto">
            <h2 className="text-lg font-semibold text-gold-100 mb-4">All Invoices</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-500/20">
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Invoice #</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Created</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((inv: { id: string; invoice_number: string; invoice_type_display?: string; invoice_type?: string; status_display?: string; status?: string; created_at?: string }) => (
                  <tr key={inv.id} className="border-b border-gold-500/10">
                    <td className="py-3 px-4 font-mono text-gold-100">{inv.invoice_number}</td>
                    <td className="py-3 px-4 text-gold-100/80">{inv.invoice_type_display || inv.invoice_type}</td>
                    <td className="py-3 px-4 text-gold-100/80">{inv.status_display || inv.status}</td>
                    <td className="py-3 px-4 text-gold-100/80">{inv.created_at ? new Date(inv.created_at).toLocaleDateString() : '—'}</td>
                    <td className="py-3 px-4 flex gap-2">
                      <button
                        onClick={() => generatePdf.mutate(inv.id)}
                        disabled={generatePdf.isPending}
                        className="p-2 text-gold-400 hover:bg-gold-500/10 rounded"
                        title="Generate PDF"
                      >
                        <FileDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => sendEmail.mutate(inv.id)}
                        disabled={sendEmail.isPending}
                        className="p-2 text-gold-400 hover:bg-gold-500/10 rounded"
                        title="Send email"
                      >
                        <Mail className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => sendWhatsApp.mutate(inv.id)}
                        disabled={sendWhatsApp.isPending}
                        className="p-2 text-gold-400 hover:bg-gold-500/10 rounded"
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
              <p className="py-8 text-center text-gold-100/70">No invoices found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
