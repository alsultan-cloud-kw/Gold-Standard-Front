import { useEffect, useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, FileText, Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import AdminNav from '../../components/admin/AdminNav'
import { invoicesApi } from '../../services/api'

type TermRow = {
  id: string
  content: string
  order: number
  is_active: boolean
  updated_at?: string
}

function unwrapTermsList(data: unknown): TermRow[] {
  if (Array.isArray(data)) return data as TermRow[]
  if (data && typeof data === 'object' && 'results' in data) {
    const r = (data as { results?: TermRow[] }).results
    return Array.isArray(r) ? r : []
  }
  return []
}

export default function AdminInvoiceTerms() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [newContent, setNewContent] = useState('')
  const [newOrder, setNewOrder] = useState(0)
  const [newActive, setNewActive] = useState(true)

  const { data, isLoading } = useQuery({
    queryKey: ['invoiceTermsConditions'],
    queryFn: () => invoicesApi.getTermsConditions(),
  })

  const rows = useMemo(() => unwrapTermsList(data), [data])

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['invoiceTermsConditions'] })

  const createMutation = useMutation({
    mutationFn: () =>
      invoicesApi.createTermsCondition({
        content: newContent.trim(),
        order: newOrder,
        is_active: newActive,
      }),
    onSuccess: () => {
      invalidate()
      setNewContent('')
      setNewOrder(0)
      setNewActive(true)
      toast.success(t('admin.invoiceTerms.created'))
    },
    onError: () => toast.error(t('admin.invoiceTerms.saveFailed')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TermRow> }) =>
      invoicesApi.updateTermsCondition(id, payload),
    onSuccess: () => {
      invalidate()
      toast.success(t('admin.invoiceTerms.saved'))
    },
    onError: () => toast.error(t('admin.invoiceTerms.saveFailed')),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.deleteTermsCondition(id),
    onSuccess: () => {
      invalidate()
      toast.success(t('admin.invoiceTerms.deleted'))
    },
    onError: () => toast.error(t('admin.invoiceTerms.deleteFailed')),
  })

  const handleAdd = () => {
    if (!newContent.trim()) {
      toast.error(t('admin.invoiceTerms.contentRequired'))
      return
    }
    createMutation.mutate()
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <Link
          to="/admin/invoices"
          className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('admin.invoiceTerms.backToInvoices')}
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold gold-gradient-text-on-light flex items-center gap-3">
            <FileText className="w-8 h-8 text-lime-800" />
            {t('admin.invoiceTerms.title')}
          </h1>
          <p className="text-stone-600 mt-2">{t('admin.invoiceTerms.subtitle')}</p>
          <p className="text-stone-500 text-sm mt-2">{t('admin.invoiceTerms.fallbackHint')}</p>
        </div>

        <div className="gold-card p-6 mb-8">
          <h2 className="text-lg font-semibold text-black mb-4">{t('admin.invoiceTerms.addHeading')}</h2>
          <label className="block text-sm font-medium text-stone-700 mb-1">{t('admin.invoiceTerms.contentLabel')}</label>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 mb-4"
            placeholder={t('admin.invoiceTerms.contentPlaceholder')}
          />
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">{t('admin.invoiceTerms.orderLabel')}</label>
              <input
                type="number"
                min={0}
                value={newOrder}
                onChange={(e) => setNewOrder(Number(e.target.value) || 0)}
                className="w-28 rounded-lg border border-stone-300 px-3 py-2"
              />
            </div>
            <label className="inline-flex items-center gap-2 mt-6 cursor-pointer">
              <input
                type="checkbox"
                checked={newActive}
                onChange={(e) => setNewActive(e.target.checked)}
                className="rounded border-stone-400"
              />
              <span className="text-sm text-stone-800">{t('admin.invoiceTerms.activeLabel')}</span>
            </label>
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={createMutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-500 text-black border border-black/10 hover:bg-lime-400 font-semibold text-sm disabled:opacity-50"
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t('admin.invoiceTerms.addButton')}
          </button>
        </div>

        {isLoading ? (
          <div className="gold-card p-8 text-center text-stone-700">{t('admin.invoiceTerms.loading')}</div>
        ) : rows.length === 0 ? (
          <div className="gold-card p-8 text-stone-700">{t('admin.invoiceTerms.empty')}</div>
        ) : (
          <div className="space-y-6">
            {rows.map((row) => (
              <TermEditCard
                key={row.id}
                row={row}
                onSave={(payload) => updateMutation.mutate({ id: row.id, payload })}
                onDelete={() => {
                  if (window.confirm(t('admin.invoiceTerms.confirmDelete'))) deleteMutation.mutate(row.id)
                }}
                saving={updateMutation.isPending}
                deleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TermEditCard({
  row,
  onSave,
  onDelete,
  saving,
  deleting,
}: {
  row: TermRow
  onSave: (payload: Partial<TermRow>) => void
  onDelete: () => void
  saving: boolean
  deleting: boolean
}) {
  const { t } = useTranslation()
  const [content, setContent] = useState(row.content)
  const [order, setOrder] = useState(row.order)
  const [isActive, setIsActive] = useState(row.is_active)

  useEffect(() => {
    setContent(row.content)
    setOrder(row.order)
    setIsActive(row.is_active)
  }, [row.id, row.content, row.order, row.is_active])

  const dirty =
    content !== row.content || order !== row.order || isActive !== row.is_active

  return (
    <div className="gold-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">{t('admin.invoiceTerms.orderLabel')}</label>
            <input
              type="number"
              min={0}
              value={order}
              onChange={(e) => setOrder(Number(e.target.value) || 0)}
              className="w-24 rounded-lg border border-stone-300 px-2 py-1.5 text-sm"
            />
          </div>
          <label className="inline-flex items-center gap-2 mt-5 cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-stone-400"
            />
            <span className="text-sm text-stone-800">{t('admin.invoiceTerms.activeLabel')}</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSave({ content: content.trim(), order, is_active: isActive })}
            disabled={saving || !dirty || !content.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-lime-500/90 text-black text-sm font-medium hover:bg-lime-400 disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t('admin.invoiceTerms.save')}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 text-red-800 text-sm hover:bg-red-50 disabled:opacity-40"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {t('admin.invoiceTerms.delete')}
          </button>
        </div>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 text-sm"
      />
    </div>
  )
}
