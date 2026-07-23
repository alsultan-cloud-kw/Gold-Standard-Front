import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, Filter, Eye, Loader2, FileText, Download, BookOpen, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { ordersApi, invoicesApi } from '../../services/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Paginated<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

type SaleItem = {
  id: string
  product_name?: string
  product_sku?: string
  product_serial_number?: string
  quantity: number
  unit_price: string
  total_price: string
}

type Sale = {
  id: string
  invoice_number: string
  customer_name: string
  customer_phone?: string
  customer_email?: string | null
  /** Email to show (order email or customer account email). */
  customer_email_display?: string | null
  branch_name?: string
  sale_date: string
  payment_method_display?: string
  delivery_type?: 'physical' | 'locked'
  delivery_type_display?: string
  status: string
  status_display?: string
  total_amount: string
  subtotal?: string
  discount_amount?: string
  tax_amount?: string
  items?: SaleItem[]
  created_at?: string
  pricing_source?: 'live' | 'fallback'
  gold_rate_snapshot?: Record<string, string>
  journal_entry_id?: string | null
  journal_entry_number?: string | null
}

function asResults<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const p = data as Paginated<T> | undefined
  return p?.results ?? []
}

function localISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function calendarToday(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function statusBadgeClass(status: string) {
  switch (status) {
    case 'delivered':
    case 'paid':
      return 'bg-green-500/20 text-green-400'
    case 'locked':
      return 'bg-amber-500/20 text-amber-400'
    case 'pending':
      return 'bg-yellow-500/20 text-yellow-400'
    case 'confirmed':
    case 'shipped':
      return 'bg-blue-500/20 text-blue-400'
    case 'cancelled':
    case 'refunded':
      return 'bg-red-500/20 text-red-400'
    default:
      return 'bg-lime-200/60 text-lime-800'
  }
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

type InvoiceTemplate = { id: string; name: string; template_type?: string; is_default?: boolean }

export default function AdminOrders() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [invoiceTemplateId, setInvoiceTemplateId] = useState<string>('')
  const invoiceIframeRef = useRef<HTMLIFrameElement>(null)
  const [page, setPage] = useState(1)
  const pageSize = 10

  const [allTime, setAllTime] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const end = calendarToday()
    const start = new Date(end)
    start.setDate(start.getDate() - 29)
    return localISODate(start)
  })
  const [endDate, setEndDate] = useState(() => localISODate(calendarToday()))

  const rangeValid = allTime || startDate <= endDate

  const orderListParams = useMemo(() => {
    const p: Record<string, string> = {
      ordering: '-sale_date',
      page_size: '500',
    }
    if (statusFilter) p.status = statusFilter
    if (!allTime && rangeValid) {
      p.start_date = startDate
      p.end_date = endDate
    }
    return p
  }, [statusFilter, allTime, startDate, endDate, rangeValid])

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'orders', 'sales', orderListParams],
    queryFn: () => ordersApi.getOrders(orderListParams) as Promise<unknown>,
    enabled: rangeValid,
  })

  const orders = useMemo(
    () => (rangeValid ? asResults<Sale>(data) : []),
    [data, rangeValid],
  )

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return orders
    const q = searchQuery.toLowerCase()
    return orders.filter(
      (o) =>
        o.invoice_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q) ||
        o.customer_phone?.toLowerCase().includes(q) ||
        o.id?.toLowerCase().includes(q)
    )
  }, [orders, searchQuery])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, orderListParams])

  const applyPreset = useCallback((preset: 'today' | 'last30' | 'month' | 'ytd' | 'all') => {
    const end = calendarToday()
    if (preset === 'all') {
      setAllTime(true)
      setEndDate(localISODate(end))
      return
    }
    setAllTime(false)
    setEndDate(localISODate(end))
    if (preset === 'today') {
      const s = localISODate(end)
      setStartDate(s)
      setEndDate(s)
      return
    }
    if (preset === 'last30') {
      const s = new Date(end)
      s.setDate(s.getDate() - 29)
      setStartDate(localISODate(s))
      return
    }
    if (preset === 'month') {
      setStartDate(localISODate(new Date(end.getFullYear(), end.getMonth(), 1)))
      return
    }
    if (preset === 'ytd') {
      setStartDate(localISODate(new Date(end.getFullYear(), 0, 1)))
    }
  }, [])

  const presetBtn =
    'px-3 py-1.5 text-xs font-medium rounded-lg border border-black/15 text-stone-800 hover:bg-lime-100 transition-colors'

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageItems = filtered.slice(start, end)

  const { data: detailData, isLoading: detailLoading } = useQuery({
    queryKey: ['admin', 'order', detailId],
    queryFn: () => ordersApi.getOrder(detailId!) as Promise<Sale>,
    enabled: !!detailId,
  })

  const { data: templatesData } = useQuery({
    queryKey: ['invoiceTemplates'],
    queryFn: () => invoicesApi.getTemplates(),
    enabled: invoiceModalOpen,
  })
  const invoiceTemplates: InvoiceTemplate[] = Array.isArray(templatesData)
    ? templatesData
    : (templatesData as { results?: InvoiceTemplate[] })?.results ?? []

  const saleTemplates = useMemo(
    () => invoiceTemplates.filter((t) => t.template_type === 'sale'),
    [invoiceTemplates]
  )
  const defaultTemplateId = saleTemplates.find((t) => t.is_default)?.id ?? saleTemplates[0]?.id ?? ''

  const { data: invoicePreviewData, isLoading: invoicePreviewLoading } = useQuery({
    queryKey: ['invoicePreview', detailId, invoiceTemplateId || defaultTemplateId],
    queryFn: () =>
      invoicesApi.getSaleInvoicePreview(
        detailId!,
        invoiceTemplateId || defaultTemplateId || undefined
      ),
    enabled: invoiceModalOpen && !!detailId,
  })
  const invoiceHtml = (invoicePreviewData as { html?: string } | undefined)?.html ?? ''

  const cancelMutation = useMutation({
    mutationFn: (id: string) => ordersApi.cancelSale(id),
    onSuccess: () => {
      toast.success('Order cancelled')
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      if (detailId) queryClient.invalidateQueries({ queryKey: ['admin', 'order', detailId] })
    },
    onError: () => toast.error('Cancel failed (admin only)'),
  })

  const refundMutation = useMutation({
    mutationFn: (id: string) => ordersApi.refundSale(id),
    onSuccess: () => {
      toast.success('Order marked as refunded')
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      if (detailId) queryClient.invalidateQueries({ queryKey: ['admin', 'order', detailId] })
    },
    onError: () => toast.error('Refund failed (admin only)'),
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status: newStatus }: { id: string; status: string }) =>
      ordersApi.updateSale(id, { status: newStatus }),
    onSuccess: (_, { status }) => {
      toast.success(`Status updated to ${statusDisplay[status] ?? status}`)
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      if (detailId) queryClient.invalidateQueries({ queryKey: ['admin', 'order', detailId] })
    },
    onError: () => toast.error('Failed to update status (admin only)'),
  })

  const statusDisplay: Record<string, string> = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    paid: 'Paid',
    shipped: 'Shipped',
    delivered: 'Delivered',
    locked: 'Locked',
    cancelled: 'Cancelled',
    refunded: 'Refunded',
  }

  const statusOptions = [
    '',
    'pending',
    'confirmed',
    'paid',
    'shipped',
    'delivered',
    'sold',
    'locked',
    'cancelled',
    'refunded',
  ]

  return (
    <div className="admin-page-inner">
      <div className="admin-page-body">
        <Link
          to="/admin/accounting"
          className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('admin.backToAccounting')}
        </Link>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.orders')}</h1>
          </div>
        </div>

        <div className="gold-card mb-6">
          <p className="text-sm text-stone-700 mb-3">{t('admin.ordersDateRangeHint')}</p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <p className="text-sm font-medium text-black">{t('admin.dashboardPeriod')}</p>
            <p className="text-sm text-lime-800 font-mono">
              {allTime ? `${t('admin.presetAllTime')} · ${t('admin.dashboardThroughToday')}` : `${startDate} → ${endDate}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button type="button" className={presetBtn} onClick={() => applyPreset('today')}>
              {t('admin.presetToday')}
            </button>
            <button type="button" className={presetBtn} onClick={() => applyPreset('last30')}>
              {t('admin.presetLast30Days')}
            </button>
            <button type="button" className={presetBtn} onClick={() => applyPreset('month')}>
              {t('admin.presetThisMonth')}
            </button>
            <button type="button" className={presetBtn} onClick={() => applyPreset('ytd')}>
              {t('admin.presetYearToDate')}
            </button>
            <button type="button" className={presetBtn} onClick={() => applyPreset('all')}>
              {t('admin.presetAllTime')}
            </button>
          </div>
          <div
            className={`flex flex-col md:flex-row md:items-end gap-4 ${allTime ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <label className="flex flex-col gap-1 text-sm text-stone-700">
              {t('admin.from')}
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setAllTime(false)
                  setStartDate(e.target.value)
                }}
                className="rounded-lg bg-white border border-stone-200 text-black px-3 py-2 text-sm"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-stone-700">
              {t('admin.to')}
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setAllTime(false)
                  setEndDate(e.target.value)
                }}
                className="rounded-lg bg-white border border-stone-200 text-black px-3 py-2 text-sm"
              />
            </label>
          </div>
          {allTime && (
            <p className="text-xs text-stone-500 mt-2">
              {t('admin.dashboardThroughToday')} — {localISODate(calendarToday())}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
            <input
              type="text"
              placeholder="Search by invoice, customer, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/15 rounded-lg text-black"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-3 bg-white border border-black/15 rounded-lg">
            <Filter className="w-5 h-5 text-lime-800 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent gold-gradient-text-on-light border-none outline-none cursor-pointer"
            >
              <option value="">All statuses</option>
              {statusOptions.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="gold-card overflow-x-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-16 text-lime-800">
              <Loader2 className="w-8 h-8 animate-spin mr-2" />
              Loading orders…
            </div>
          )}
          {isError && (
            <div className="py-16 px-4 text-center text-red-400">
              Failed to load orders.{' '}
              {(error as Error)?.message || 'Check that you are logged in and the API is running.'}
            </div>
          )}
          {!isLoading && !isError && filtered.length === 0 && (
            <div className="py-16 px-4 text-center text-stone-600">
              {!rangeValid && <p>{t('admin.invalidDateRange')}</p>}
              {rangeValid && searchQuery.trim() !== '' && <p>{t('admin.noOrdersFound')}</p>}
              {rangeValid && searchQuery.trim() === '' && orders.length === 0 && (
                <p>
                  {allTime
                    ? 'No sales yet. Orders are created as Sales in accounting when checkout completes.'
                    : t('admin.noOrdersInDateRange')}
                </p>
              )}
            </div>
          )}
          {!isLoading && !isError && filtered.length > 0 && (
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-stone-600">{t('admin.invoices')}</th>
                  <th className="text-left py-3 px-4 text-stone-600">{t('admin.customer')}</th>
                  <th className="text-left py-3 px-4 text-stone-600">Total</th>
                  <th className="text-left py-3 px-4 text-stone-600">Status</th>
                  <th className="text-left py-3 px-4 text-stone-600">Date</th>
                  <th className="text-left py-3 px-4 text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-stone-100 hover:bg-lime-50"
                  >
                    <td className="py-3 px-4 text-black font-mono text-sm">
                      {order.invoice_number}
                    </td>
                    <td className="py-3 px-4 text-black">
                      <div>{order.customer_name}</div>
                      {order.customer_phone && (
                        <div className="text-xs text-stone-500">{order.customer_phone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-lime-800">
                      {order.total_amount} KWD
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${statusBadgeClass(order.status)}`}
                      >
                        {order.status_display || order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600 text-sm">
                      {formatDate(order.sale_date)}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        className="p-2 text-lime-800 hover:bg-lime-100 rounded"
                        title={t('admin.details')}
                        onClick={() => setDetailId(order.id)}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!isLoading && !isError && total > pageSize && (
          <div className="gold-card mt-4 flex items-center justify-between text-xs text-stone-700">
            <div>
              Page {page} of {totalPages} ({total} orders)
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

      <Dialog open={!!detailId} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="bg-white border-black/15 text-black max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="gold-gradient-text">
              Order {detailData?.invoice_number || detailId}
            </DialogTitle>
          </DialogHeader>
          {detailLoading && (
            <div className="flex items-center gap-2 text-lime-800 py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading…
            </div>
          )}
          {!detailLoading && detailData && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-stone-500">Customer</span>
                <span>{detailData.customer_name}</span>
                {detailData.customer_phone && (
                  <>
                    <span className="text-stone-500">Phone</span>
                    <span>{detailData.customer_phone}</span>
                  </>
                )}
                {(detailData.customer_email_display ?? detailData.customer_email) && (
                  <>
                    <span className="text-stone-500">Email</span>
                    <span>{detailData.customer_email_display ?? detailData.customer_email}</span>
                  </>
                )}
                <span className="text-stone-500">Status</span>
                <span className="flex items-center gap-2">
                  <select
                    value={detailData.status}
                    onChange={(e) => {
                      const newStatus = e.target.value
                      if (newStatus && newStatus !== detailData.status) {
                        updateStatusMutation.mutate({ id: detailData.id, status: newStatus })
                      }
                    }}
                    disabled={updateStatusMutation.isPending}
                    className="bg-white border border-black/15 rounded px-2 py-1 text-black text-sm cursor-pointer disabled:opacity-50"
                  >
                    {statusOptions.filter(Boolean).map((s) => (
                      <option key={s} value={s}>
                        {statusDisplay[s] ?? s}
                      </option>
                    ))}
                  </select>
                  {updateStatusMutation.isPending && (
                    <Loader2 className="w-4 h-4 animate-spin text-lime-800 shrink-0" />
                  )}
                </span>
                <span className="text-stone-500">Payment</span>
                <span>{detailData.payment_method_display || '—'}</span>
                <span className="text-stone-500">Delivery</span>
                <span>{detailData.delivery_type_display ?? (detailData.delivery_type === 'locked' ? 'Locked in vault' : 'Physical')}</span>
                <span className="text-stone-500">Branch</span>
                <span>{detailData.branch_name || '—'}</span>
                <span className="text-stone-500">Sale date</span>
                <span>{formatDate(detailData.sale_date)}</span>
                <span className="text-stone-500">Total</span>
                <span className="text-lime-800 font-medium">{detailData.total_amount} KWD</span>
                {detailData.journal_entry_id && (
                  <>
                    <span className="text-stone-500">Journal entry</span>
                    <span>
                      <Link
                        to="/admin/accounting/journal"
                        className="inline-flex items-center gap-1 text-lime-800 hover:text-lime-800"
                      >
                        <BookOpen className="w-4 h-4" />
                        {detailData.journal_entry_number || detailData.journal_entry_id}
                      </Link>
                    </span>
                  </>
                )}
                {(detailData.pricing_source || detailData.gold_rate_snapshot) && (
                  <>
                    <span className="text-stone-500">Pricing</span>
                    <span>
                      {detailData.pricing_source === 'live' ? 'Live rate' : detailData.pricing_source === 'fallback' ? 'Stored rate' : '—'}
                      {detailData.gold_rate_snapshot && Object.keys(detailData.gold_rate_snapshot).length > 0 && (
                        <span className="block text-stone-700 text-xs mt-1">
                          Rate snapshot: {Object.entries(detailData.gold_rate_snapshot).map(([k, v]) => `${k}K: ${v}`).join(', ')} KWD/g
                        </span>
                      )}
                    </span>
                  </>
                )}
              </div>
              {detailData.items && detailData.items.length > 0 && (
                <div>
                  <div className="text-stone-500 mb-2">Items</div>
                  <ul className="border border-stone-200 rounded-lg divide-y divide-gold-500/10">
                    {detailData.items.map((item) => (
                      <li
                        key={item.id}
                        className="px-3 py-2 flex justify-between gap-2"
                      >
                        <span>
                          {item.product_name || item.product_sku || 'Item'}
                          {item.product_serial_number && (
                            <span className="text-stone-600 font-mono text-xs ml-1">({item.product_serial_number})</span>
                          )}{' '}
                          × {item.quantity}
                        </span>
                        <span className="text-lime-800 shrink-0">{item.total_price} KWD</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs"
                  onClick={() => setInvoiceModalOpen(true)}
                >
                  <FileText className="w-4 h-4" />
                  {t('admin.viewInvoice')}
                </button>
              </div>
              {detailData.status !== 'cancelled' &&
                detailData.status !== 'refunded' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs"
                      disabled={cancelMutation.isPending}
                      onClick={() => {
                        if (confirm('Cancel this order?')) cancelMutation.mutate(detailData.id)
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 text-xs"
                      disabled={refundMutation.isPending}
                      onClick={() => {
                        if (confirm('Mark as refunded?')) refundMutation.mutate(detailData.id)
                      }}
                    >
                      Refund
                    </button>
                  </div>
                )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice preview modal: show beautiful invoice and allow download */}
      <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
        <DialogContent className="bg-white border-black/15 text-black max-w-5xl max-h-[95vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 py-4 border-b border-stone-200 shrink-0">
            <DialogTitle className="gold-gradient-text-on-light flex items-center gap-2 text-black">
              <FileText className="w-5 h-5" />
              Invoice {detailData?.invoice_number}
            </DialogTitle>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <label className="text-stone-700 text-sm">Template</label>
              <select
                value={invoiceTemplateId || defaultTemplateId}
                onChange={(e) => setInvoiceTemplateId(e.target.value)}
                className="bg-white border border-black/15 rounded px-3 py-2 text-black text-sm"
              >
                {saleTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.is_default ? '(default)' : ''}
                  </option>
                ))}
                {saleTemplates.length === 0 && (
                  <option value="">Default layout</option>
                )}
              </select>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-lime-500 text-black border border-black/10 hover:bg-lime-400 text-sm font-semibold"
                disabled={!detailId || invoicePreviewLoading}
                onClick={() => {
                  if (!detailId) return
                  void (async () => {
                    try {
                      await invoicesApi.downloadSaleInvoicePdf(
                        detailId,
                        detailData?.invoice_number
                          ? `${detailData.invoice_number}.pdf`
                          : undefined,
                      )
                      toast.success('Invoice PDF downloaded')
                    } catch {
                      toast.error('Could not download invoice PDF')
                    }
                  })()
                }}
              >
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-black/15 bg-white text-black hover:bg-stone-50 text-sm font-semibold"
                disabled={!invoiceHtml || invoicePreviewLoading}
                onClick={() => {
                  if (!invoiceHtml) return
                  const w = window.open('', '_blank')
                  if (w) {
                    w.document.write(invoiceHtml)
                    w.document.close()
                    w.focus()
                    setTimeout(() => {
                      w.print()
                      w.close()
                    }, 400)
                  } else {
                    toast.error('Allow pop-ups to print')
                  }
                }}
              >
                Print preview
              </button>
            </div>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden p-4">
            {invoicePreviewLoading ? (
              <div className="flex items-center justify-center h-64 text-lime-800">
                <Loader2 className="w-8 h-8 animate-spin mr-2" />
                Loading invoice…
              </div>
            ) : invoiceHtml ? (
              <iframe
                ref={invoiceIframeRef}
                title="Invoice"
                srcDoc={invoiceHtml}
                className="w-full h-full min-h-[480px] rounded-lg border border-stone-200 bg-white"
                sandbox="allow-same-origin"
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-stone-600">
                No invoice content. Check template or try default.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
