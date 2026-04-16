import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, CheckCircle, ExternalLink } from 'lucide-react'
import AdminNav from '../../components/admin/AdminNav'
import { accountingApi } from '../../services/api'
import { toast } from 'sonner'

export default function AdminJournal() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: entries, isLoading } = useQuery({
    queryKey: ['journalEntries'],
    queryFn: () => accountingApi.getJournalEntries(),
  })

  const postMutation = useMutation({
    mutationFn: (id: string) => accountingApi.postJournalEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journalEntries'] })
      toast.success(t('admin.journalEntryPosted'))
    },
    onError: () => toast.error('Failed to post entry'),
  })

  const list = Array.isArray(entries) ? entries : (entries as { results?: unknown[] })?.results ?? []

  // Client-side pagination for journal entries
  const [page, setPage] = useState(1)
  const pageSize = 10
  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageItems = list.slice(start, end)

  return (
    <div className="min-h-screen py-8 bg-[var(--site-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <Link
          to="/admin/accounting"
          className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('admin.backToAccounting')}
        </Link>
        <div className="mb-8">
          <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.journalEntries')}</h1>
          <p className="text-stone-600 mt-1">{t('admin.journalSubtitle')}</p>
        </div>

        {isLoading ? (
          <div className="gold-card p-8 text-center text-stone-800">{t('common.loading')}</div>
        ) : (
          <div className="gold-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.entryNumber')}</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.date')}</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.type')}</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.source')}</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.description')}</th>
                  <th className="text-right py-3 px-4 text-stone-700 font-medium">{t('admin.debits')}</th>
                  <th className="text-right py-3 px-4 text-stone-700 font-medium">{t('admin.credits')}</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.status')}</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((entry: {
                  id: string; entry_number: string; entry_date: string; entry_type_display?: string; entry_type?: string;
                  description_en?: string; total_debits: number; total_credits: number; is_posted?: boolean;
                  source_sale_id?: string | null; source_sale_reference?: string | null;
                  source_purchase_id?: string | null; source_purchase_reference?: string | null;
                  source_buyback_id?: string | null; source_buyback_reference?: string | null;
                }) => {
                  const sourceLink = entry.source_sale_id
                    ? { to: '/admin/orders', label: `${t('admin.sale')} ${entry.source_sale_reference || entry.source_sale_id}` }
                    : entry.source_purchase_id
                    ? { to: '/admin/accounting/purchases', label: `${t('admin.purchase')} ${entry.source_purchase_reference || entry.source_purchase_id}` }
                    : entry.source_buyback_id
                    ? { to: '/admin/trading/buybacks', label: `${t('admin.buyback')} ${entry.source_buyback_reference || entry.source_buyback_id}` }
                    : null
                  return (
                  <tr key={entry.id} className="border-b border-stone-100">
                    <td className="py-3 px-4 font-mono text-black">{entry.entry_number}</td>
                    <td className="py-3 px-4 text-black">{entry.entry_date}</td>
                    <td className="py-3 px-4 text-stone-800">{entry.entry_type_display || entry.entry_type}</td>
                    <td className="py-3 px-4 text-stone-800">
                      {sourceLink ? (
                        <Link to={sourceLink.to} className="inline-flex items-center gap-1 text-lime-800 hover:text-lime-800">
                          {sourceLink.label}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : '—'}
                    </td>
                    <td className="py-3 px-4 text-stone-800 max-w-xs truncate">{entry.description_en || '—'}</td>
                    <td className="py-3 px-4 text-right text-black">{Number(entry.total_debits).toLocaleString(undefined, { minimumFractionDigits: 3 })}</td>
                    <td className="py-3 px-4 text-right text-black">{Number(entry.total_credits).toLocaleString(undefined, { minimumFractionDigits: 3 })}</td>
                    <td className="py-3 px-4">
                      {entry.is_posted ? (
                        <span className="text-green-300 text-sm">{t('admin.posted')}</span>
                      ) : (
                        <span className="text-amber-300 text-sm">{t('admin.draft')}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {!entry.is_posted && (
                        <button
                          onClick={() => postMutation.mutate(entry.id)}
                          disabled={postMutation.isPending}
                          className="flex items-center gap-1 text-sm text-lime-800 hover:text-lime-800"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {t('admin.post')}
                        </button>
                      )}
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
            {list.length === 0 && (
              <p className="py-8 text-center text-stone-600">{t('admin.noEntries')}</p>
            )}
          </div>
        )}
        {!isLoading && total > pageSize && (
          <div className="mt-4 gold-card flex items-center justify-between text-xs text-stone-700">
            <div>
              Page {page} of {totalPages} ({total} entries)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-full border border-lime-400/60 disabled:opacity-40 hover:bg-lime-100"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-full border border-lime-400/60 disabled:opacity-40 hover:bg-lime-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
