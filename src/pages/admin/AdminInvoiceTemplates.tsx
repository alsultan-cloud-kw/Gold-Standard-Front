import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import AdminNav from '../../components/admin/AdminNav'
import { invoicesApi } from '../../services/api'

type TemplateRow = {
  id: string
  name: string
  template_type_display?: string
  template_type?: string
  is_default?: boolean
  is_active?: boolean
}

export default function AdminInvoiceTemplates() {
  const queryClient = useQueryClient()
  const hasTriedAutoCreate = useRef(false)
  const { data: templatesData, isLoading, isSuccess } = useQuery({
    queryKey: ['invoiceTemplates'],
    queryFn: () => invoicesApi.getTemplates(),
  })

  const createDefaultMutation = useMutation({
    mutationFn: () => invoicesApi.createDefaultSaleTemplate(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoiceTemplates'] })
      toast.success('Default "Gold Jewelry Invoice" template is ready')
    },
    onError: () => toast.error('Failed to create default template'),
  })

  const list: TemplateRow[] = Array.isArray(templatesData)
    ? templatesData
    : (templatesData as { results?: TemplateRow[] })?.results ?? []

  // If templates list is empty after load (e.g. migration not run), create the default so it appears
  useEffect(() => {
    if (!isLoading && isSuccess && list.length === 0 && !hasTriedAutoCreate.current) {
      hasTriedAutoCreate.current = true
      createDefaultMutation.mutate()
    }
  }, [isLoading, isSuccess, list.length])

  const hasSaleTemplate = list.some((t) => t.template_type === 'sale')

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <Link
          to="/admin/invoices"
          className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Invoices
        </Link>
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">Invoice Templates</h1>
            <p className="text-stone-600 mt-1">Manage invoice layout and branding for orders</p>
          </div>
          <button
            type="button"
            onClick={() => createDefaultMutation.mutate()}
            disabled={createDefaultMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-500 font-medium text-sm disabled:opacity-50"
          >
            {createDefaultMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            Add default Gold template
          </button>
        </div>

        {!hasSaleTemplate && list.length === 0 && !isLoading && (
          <div className="gold-card p-8 mb-6">
            <div className="flex items-start gap-3">
              <FileText className="w-10 h-10 text-gold-400 shrink-0" />
              <div>
                <h2 className="text-lg font-semibold text-gold-100">No invoice template yet</h2>
                <p className="text-gold-100/80 mt-1">
                  Click &quot;Add default Gold template&quot; to create a beautiful, gold-themed sale invoice template
                  that matches your store. It will appear in the list below and can be selected when viewing or
                  downloading invoices from Orders.
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="gold-card p-8 text-center text-gold-100/70">Loading...</div>
        ) : (
          <div className="gold-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-500/20">
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Type</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Default</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Active</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className="border-b border-gold-500/10">
                    <td className="py-3 px-4 text-gold-100 font-medium">{t.name}</td>
                    <td className="py-3 px-4 text-gold-100/80">{t.template_type_display || t.template_type || '—'}</td>
                    <td className="py-3 px-4">
                      {t.is_default ? (
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-300">Yes</span>
                      ) : (
                        <span className="text-gold-100/60">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {t.is_active ? (
                        <span className="text-emerald-400">Yes</span>
                      ) : (
                        <span className="text-gold-100/60">No</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && (
              <p className="py-8 text-center text-gold-100/70">No invoice templates found. Use &quot;Add default Gold template&quot; to add one.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
