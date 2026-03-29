import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Eye, Loader2, BookOpen, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import AdminNav from '../../components/admin/AdminNav'
import { tradingApi } from '../../services/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Paginated<T> = { count?: number; next?: string | null; previous?: string | null; results: T[] }

type BuybackItem = {
  id: string
  carat_display?: string
  carat_value?: number
  weight_grams: string
  price_per_gram: string
  total_price: string
}

type Buyback = {
  id: string
  buyback_number: string
  customer_name: string
  customer_phone?: string
  customer_email?: string | null
  branch_name?: string
  sell_date: string
  payment_method_display?: string
  status: string
  status_display?: string
  total_weight: string
  total_amount: string
  pricing_source?: string
  items?: BuybackItem[]
  created_at?: string
  journal_entry_id?: string | null
  journal_entry_number?: string | null
}

function asResults<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const p = data as Paginated<T> | undefined
  return p?.results ?? []
}

function formatDate(iso: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusClass(s: string) {
  switch (s) {
    case 'paid':
      return 'bg-green-500/20 text-green-400'
    case 'confirmed':
      return 'bg-blue-500/20 text-blue-400'
    case 'cancelled':
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-yellow-500/20 text-yellow-400'
  }
}

export default function AdminTradingBuybacks() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [detailId, setDetailId] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'trading', 'buybacks', statusFilter],
    queryFn: () =>
      tradingApi.getBuybacks(
        statusFilter ? { status: statusFilter } : undefined
      ) as Promise<unknown>,
  })

  const buybacks = useMemo(() => asResults<Buyback>(data), [data])
  const total = buybacks.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageItems = buybacks.slice(start, end)

  const { data: detailData } = useQuery({
    queryKey: ['admin', 'buyback', detailId],
    queryFn: () => tradingApi.getBuyback(detailId!),
    enabled: !!detailId,
  })
  const detail = detailId ? (detailData as Buyback | undefined) : null

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      tradingApi.updateBuyback(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'trading', 'buybacks'] })
      if (detailId) queryClient.invalidateQueries({ queryKey: ['admin', 'buyback', detailId] })
      toast.success('Status updated')
    },
    onError: () => toast.error('Failed to update status'),
  })

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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.tradingSellOrders')}</h1>
            <p className="text-stone-600 mt-1">{t('admin.tradingBuybacksSubtitle')}</p>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gold-500/30 bg-white text-stone-800 text-sm"
          >
            <option value="">{t('admin.allStatuses')}</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {isLoading ? (
          <div className="gold-card p-8 flex items-center justify-center gap-2 text-gold-100/80">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading…
          </div>
        ) : (
          <div className="gold-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-500/20">
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Number</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Customer</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Date</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-gold-100/70 font-medium">Weight</th>
                  <th className="text-right py-3 px-4 text-gold-100/70 font-medium">Amount</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buybacks.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gold-100/60">
                      No buyback orders yet.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((b) => (
                    <tr key={b.id} className="border-b border-gold-500/10">
                      <td className="py-3 px-4 font-mono text-gold-100 text-sm">{b.buyback_number}</td>
                      <td className="py-3 px-4 text-gold-100">{b.customer_name}</td>
                      <td className="py-3 px-4 text-gold-100/80 text-sm">{formatDate(b.sell_date)}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 rounded text-xs ${statusClass(b.status)}`}>
                          {b.status_display ?? b.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gold-100 tabular-nums">{b.total_weight} g</td>
                      <td className="py-3 px-4 text-right text-gold-400 tabular-nums">
                        {Number(b.total_amount).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => setDetailId(b.id)}
                          className="text-gold-400 hover:text-gold-300 flex items-center gap-1 text-sm"
                        >
                          <Eye className="w-4 h-4" /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && total > pageSize && (
          <div className="mt-4 gold-card flex items-center justify-between text-xs text-gold-100/70">
            <div>
              Page {page} of {totalPages} ({total} buybacks)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
              >
                Next
              </button>
            </div>
          </div>
        )}

        <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
          <DialogContent className="bg-charcoal-900 border-gold-500/30 text-gold-100 max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="gold-gradient-text">
                Buyback {detail?.buyback_number ?? ''}
              </DialogTitle>
            </DialogHeader>
            {detail && (
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <span className="text-gold-100/60">Customer</span>
                  <span>{detail.customer_name}</span>
                  <span className="text-gold-100/60">Phone</span>
                  <span>{detail.customer_phone ?? '—'}</span>
                  <span className="text-gold-100/60">Email</span>
                  <span>{detail.customer_email ?? '—'}</span>
                  <span className="text-gold-100/60">Branch</span>
                  <span>{detail.branch_name ?? '—'}</span>
                  <span className="text-gold-100/60">Date</span>
                  <span>{formatDate(detail.sell_date)}</span>
                  <span className="text-gold-100/60">Payment</span>
                  <span>{detail.payment_method_display ?? detail.payment_method ?? '—'}</span>
                  <span className="text-gold-100/60">Status</span>
                  <span>
                    <select
                      value={detail.status}
                      onChange={(e) =>
                        updateStatusMutation.mutate({ id: detail.id, status: e.target.value })
                      }
                      disabled={updateStatusMutation.isPending}
                      className="bg-charcoal-800 border border-gold-500/30 rounded px-2 py-1 text-gold-100"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="paid">Paid</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </span>
                  {detail.journal_entry_id && (
                    <>
                      <span className="text-gold-100/60">Journal entry</span>
                      <span>
                        <Link
                          to="/admin/accounting/journal"
                          className="inline-flex items-center gap-1 text-gold-400 hover:text-gold-300"
                        >
                          <BookOpen className="w-4 h-4" />
                          {detail.journal_entry_number || detail.journal_entry_id}
                        </Link>
                      </span>
                    </>
                  )}
                </div>
                {detail.items && detail.items.length > 0 && (
                  <div>
                    <div className="text-gold-100/60 mb-2">Items</div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gold-500/20">
                          <th className="text-left py-1">Carat</th>
                          <th className="text-right py-1">Weight</th>
                          <th className="text-right py-1">Rate (KWD/g)</th>
                          <th className="text-right py-1">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detail.items.map((i) => (
                          <tr key={i.id} className="border-b border-gold-500/10">
                            <td className="py-1">{i.carat_display ?? `${i.carat_value}K`}</td>
                            <td className="text-right">{i.weight_grams} g</td>
                            <td className="text-right">{Number(i.price_per_gram).toFixed(3)}</td>
                            <td className="text-right">{Number(i.total_price).toFixed(3)} KWD</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-2 border-t border-gold-500/20">
                  <span className="text-gold-100/60">Total:</span>
                  <span className="font-semibold text-gold-400">
                    {Number(detail.total_amount).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
