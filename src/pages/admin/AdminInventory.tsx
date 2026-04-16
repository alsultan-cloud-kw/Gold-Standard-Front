import { useMemo, useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Package, AlertTriangle, Search, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { inventoryApi } from '../../services/api'
import AdminNav from '../../components/admin/AdminNav'
import AdminPaginationBar from '../../components/admin/AdminPaginationBar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type BranchRow = { id: string; code: string; name_en: string }
type InventoryRow = {
  id: string
  product: string
  product_name: string
  product_sku: string
  product_serial_number?: string | null
  branch: string
  branch_name: string
  quantity: number
  reserved_quantity: number
  available_quantity: number
  low_stock_threshold: number
  stock_status: string
  is_low_stock: boolean
}

type LowStockRow = InventoryRow

function asResults<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const p = data as { results?: T[] } | undefined
  return p?.results ?? []
}

const ADJUST_REASONS = [
  { value: 'count_correction', labelKey: 'admin.inventoryReasonCount' },
  { value: 'damage', labelKey: 'admin.inventoryReasonDamage' },
  { value: 'theft', labelKey: 'admin.inventoryReasonTheft' },
  { value: 'expired', labelKey: 'admin.inventoryReasonExpired' },
  { value: 'system_error', labelKey: 'admin.inventoryReasonSystem' },
  { value: 'other', labelKey: 'admin.inventoryReasonOther' },
] as const

export default function AdminInventory() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const [branchFilter, setBranchFilter] = useState('')
  const [search, setSearch] = useState('')
  const [adjustRow, setAdjustRow] = useState<InventoryRow | null>(null)
  const [newQty, setNewQty] = useState('')
  const [thresholdDraft, setThresholdDraft] = useState('')
  const [adjustReason, setAdjustReason] = useState<string>('count_correction')
  const [adjustNotes, setAdjustNotes] = useState('')

  const { data: summary } = useQuery({
    queryKey: ['inventoryDashboardSummary'],
    queryFn: () => inventoryApi.getInventoryDashboardSummary(),
  })

  const { data: branchesRaw } = useQuery({
    queryKey: ['inventoryBranches'],
    queryFn: () => inventoryApi.getBranches(),
  })

  const { data: stockRaw, isLoading: stockLoading } = useQuery({
    queryKey: ['inventoryStock', branchFilter],
    queryFn: () =>
      inventoryApi.getInventory({
        page_size: 500,
        ...(branchFilter ? { branch: branchFilter } : {}),
      }),
  })

  const { data: lowStockRaw } = useQuery({
    queryKey: ['lowStock'],
    queryFn: inventoryApi.getLowStock,
  })

  const branches = useMemo(() => asResults<BranchRow>(branchesRaw), [branchesRaw])
  const stockRows = useMemo(() => asResults<InventoryRow>(stockRaw), [stockRaw])
  const lowStockRows = useMemo(() => (Array.isArray(lowStockRaw) ? (lowStockRaw as LowStockRow[]) : []), [lowStockRaw])

  const filteredStock = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return stockRows
    return stockRows.filter(
      (r) =>
        r.product_name?.toLowerCase().includes(q) ||
        r.product_sku?.toLowerCase().includes(q) ||
        (r.product_serial_number && String(r.product_serial_number).toLowerCase().includes(q))
    )
  }, [stockRows, search])

  const stockPageSize = 10
  const [stockPage, setStockPage] = useState(1)
  const stockTotal = filteredStock.length
  const stockTotalPages = Math.max(1, Math.ceil(stockTotal / stockPageSize))
  const stockPageRows = useMemo(
    () => filteredStock.slice((stockPage - 1) * stockPageSize, stockPage * stockPageSize),
    [filteredStock, stockPage],
  )

  const [lowStockPage, setLowStockPage] = useState(1)
  const lowStockPageSize = 10
  const lowStockTotal = lowStockRows.length
  const lowStockTotalPages = Math.max(1, Math.ceil(lowStockTotal / lowStockPageSize))
  const lowStockPageRows = useMemo(
    () => lowStockRows.slice((lowStockPage - 1) * lowStockPageSize, lowStockPage * lowStockPageSize),
    [lowStockRows, lowStockPage],
  )

  useEffect(() => {
    setStockPage(1)
  }, [search, branchFilter])

  useEffect(() => {
    if (stockPage > stockTotalPages) setStockPage(stockTotalPages)
  }, [stockPage, stockTotalPages])

  useEffect(() => {
    setLowStockPage(1)
  }, [lowStockRaw])

  useEffect(() => {
    if (lowStockPage > lowStockTotalPages) setLowStockPage(lowStockTotalPages)
  }, [lowStockPage, lowStockTotalPages])

  const adjustMutation = useMutation({
    mutationFn: async () => {
      if (!adjustRow) throw new Error('No row')
      const n = parseInt(newQty, 10)
      if (!Number.isFinite(n) || n < 0) throw new Error(t('admin.inventoryInvalidQty'))
      await inventoryApi.adjustInventory(adjustRow.id, {
        new_quantity: n,
        reason: adjustReason,
        notes: adjustNotes.trim() || undefined,
      })
    },
    onSuccess: () => {
      toast.success(t('admin.inventoryAdjustSaved'))
      qc.invalidateQueries({ queryKey: ['inventoryStock'] })
      qc.invalidateQueries({ queryKey: ['lowStock'] })
      qc.invalidateQueries({ queryKey: ['inventoryDashboardSummary'] })
      setAdjustRow(null)
      setNewQty('')
      setAdjustNotes('')
    },
    onError: (e: Error) => toast.error(e.message || t('common.error')),
  })

  const thresholdMutation = useMutation({
    mutationFn: async () => {
      if (!adjustRow) throw new Error('No row')
      const th = parseInt(thresholdDraft, 10)
      if (!Number.isFinite(th) || th < 0) throw new Error(t('admin.inventoryInvalidThreshold'))
      await inventoryApi.patchInventory(adjustRow.id, { low_stock_threshold: th })
    },
    onSuccess: () => {
      toast.success(t('admin.inventoryThresholdSaved'))
      qc.invalidateQueries({ queryKey: ['inventoryStock'] })
      qc.invalidateQueries({ queryKey: ['lowStock'] })
      qc.invalidateQueries({ queryKey: ['inventoryDashboardSummary'] })
      setAdjustRow(null)
    },
    onError: (e: Error) => toast.error(e.message || t('common.error')),
  })

  function openAdjust(row: InventoryRow) {
    setAdjustRow(row)
    setNewQty(String(row.quantity))
    setThresholdDraft(String(row.low_stock_threshold))
    setAdjustReason('count_correction')
    setAdjustNotes('')
  }

  const inputClass =
    'w-full px-3 py-2 bg-white border border-black/15 rounded-lg text-black text-sm'

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.inventory')}</h1>
            <p className="text-stone-600 mt-1">{t('admin.inventorySubtitle')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="gold-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-lime-100/80 flex items-center justify-center">
                <Package className="w-6 h-6 text-lime-800" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-black tabular-nums">
                  {summary?.total_inventory_lines ?? '—'}
                </h3>
                <p className="text-sm text-stone-600">{t('admin.inventoryStatLines')}</p>
              </div>
            </div>
          </div>
          <div className="gold-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-black tabular-nums">
                  {summary != null ? summary.total_units_on_hand : '—'}
                </h3>
                <p className="text-sm text-stone-600">{t('admin.inventoryStatUnits')}</p>
              </div>
            </div>
          </div>
          <div className="gold-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-black tabular-nums">
                  {summary?.low_stock_lines ?? '—'}
                </h3>
                <p className="text-sm text-stone-600">{t('admin.inventoryStatLow')}</p>
              </div>
            </div>
          </div>
          <div className="gold-card">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-black tabular-nums">
                  {summary?.out_of_stock_lines ?? '—'}
                </h3>
                <p className="text-sm text-stone-600">{t('admin.inventoryStatOut')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-500" />
            <input
              type="text"
              placeholder={t('admin.inventorySearchPh')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-black/15 rounded-lg text-black"
            />
          </div>
          <select
            className="lg:w-64 px-3 py-3 bg-white border border-black/15 rounded-lg text-black"
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
          >
            <option value="">{t('admin.inventoryAllBranches')}</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.code} — {b.name_en}
              </option>
            ))}
          </select>
        </div>

        <div className="gold-card mb-8 overflow-x-auto">
          <h2 className="text-xl font-bold text-black mb-4">{t('admin.inventoryStockTable')}</h2>
          {stockLoading ? (
            <p className="text-stone-600 text-sm py-8">{t('common.loading')}</p>
          ) : filteredStock.length === 0 ? (
            <p className="text-stone-600 text-sm py-8">{t('admin.inventoryNoRows')}</p>
          ) : (
            <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-600 border-b border-stone-200">
                  <th className="py-2 pe-3">{t('admin.inventoryColProduct')}</th>
                  <th className="py-2 pe-3">{t('admin.inventoryColBranch')}</th>
                  <th className="py-2 pe-3 text-end">{t('admin.inventoryColQty')}</th>
                  <th className="py-2 pe-3 text-end">{t('admin.inventoryColReserved')}</th>
                  <th className="py-2 pe-3 text-end">{t('admin.inventoryColAvailable')}</th>
                  <th className="py-2 pe-3 text-end">{t('admin.inventoryColMin')}</th>
                  <th className="py-2 pe-3">{t('admin.inventoryColStatus')}</th>
                  <th className="py-2 text-end">{t('admin.inventoryColActions')}</th>
                </tr>
              </thead>
              <tbody>
                {stockPageRows.map((row) => (
                  <tr key={row.id} className="border-b border-stone-100 last:border-0">
                    <td className="py-3 pe-3">
                      <p className="font-medium text-black">{row.product_name}</p>
                      <p className="text-xs text-stone-500 font-mono">
                        {row.product_sku}
                        {row.product_serial_number ? ` · ${row.product_serial_number}` : ''}
                      </p>
                    </td>
                    <td className="py-3 pe-3 text-stone-800">{row.branch_name}</td>
                    <td className="py-3 pe-3 text-end tabular-nums text-black">{row.quantity}</td>
                    <td className="py-3 pe-3 text-end tabular-nums text-stone-800">{row.reserved_quantity}</td>
                    <td className="py-3 pe-3 text-end tabular-nums text-amber-900">{row.available_quantity}</td>
                    <td className="py-3 pe-3 text-end tabular-nums text-stone-700">{row.low_stock_threshold}</td>
                    <td className="py-3 pe-3">
                      <span
                        className={
                          row.stock_status === 'out_of_stock'
                            ? 'text-red-700'
                            : row.is_low_stock
                              ? 'text-amber-800'
                              : 'text-emerald-700'
                        }
                      >
                        {row.stock_status === 'out_of_stock'
                          ? t('admin.inventoryStatusOut')
                          : row.is_low_stock
                            ? t('admin.inventoryStatusLow')
                            : t('admin.inventoryStatusOk')}
                      </span>
                    </td>
                    <td className="py-3 text-end">
                      <button
                        type="button"
                        onClick={() => openAdjust(row)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-lime-300/50 text-lime-900 hover:bg-lime-100 text-xs font-medium"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        {t('admin.inventoryAdjust')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!stockLoading && stockTotal > stockPageSize && (
              <AdminPaginationBar
                page={stockPage}
                totalPages={stockTotalPages}
                total={stockTotal}
                pageSize={stockPageSize}
                onPageChange={setStockPage}
                itemLabel="lines"
              />
            )}
            </>
          )}
        </div>

        <div className="gold-card">
          <h2 className="text-xl font-bold text-black mb-4">{t('admin.inventoryLowAlerts')}</h2>
          {lowStockRows.length === 0 ? (
            <p className="text-stone-600 text-sm py-6">{t('admin.inventoryNoLow')}</p>
          ) : (
            <>
            <div className="space-y-3">
              {lowStockPageRows.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white rounded-lg gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-black">{item.product_name}</p>
                    <p className="text-xs text-stone-600">{item.branch_name}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-medium text-red-700 tabular-nums">
                      {item.available_quantity} {t('admin.inventoryLeft')}
                    </p>
                    <p className="text-xs text-stone-600">
                      {t('admin.inventoryMinLabel')}: {item.low_stock_threshold}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {lowStockTotal > lowStockPageSize && (
              <AdminPaginationBar
                page={lowStockPage}
                totalPages={lowStockTotalPages}
                total={lowStockTotal}
                pageSize={lowStockPageSize}
                onPageChange={setLowStockPage}
                itemLabel="alerts"
              />
            )}
            </>
          )}
        </div>

        <Dialog open={!!adjustRow} onOpenChange={(o) => !o && setAdjustRow(null)}>
          <DialogContent className="bg-white border-black/15 text-black max-w-md">
            <DialogHeader>
              <DialogTitle>{t('admin.inventoryAdjustTitle')}</DialogTitle>
            </DialogHeader>
            {adjustRow && (
              <div className="space-y-4 pt-2">
                <p className="text-sm text-stone-700">
                  {adjustRow.product_name}{' '}
                  <span className="text-stone-500 font-mono">({adjustRow.product_sku})</span>
                </p>
                <p className="text-xs text-stone-500">
                  {adjustRow.branch_name} · {t('admin.inventoryReservedHint')}: {adjustRow.reserved_quantity}
                </p>
                <div>
                  <label className="text-xs text-stone-600">{t('admin.inventoryNewQty')}</label>
                  <input type="number" min={0} className={inputClass} value={newQty} onChange={(e) => setNewQty(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs text-stone-600">{t('admin.inventoryLowThreshold')}</label>
                  <input
                    type="number"
                    min={0}
                    className={inputClass}
                    value={thresholdDraft}
                    onChange={(e) => setThresholdDraft(e.target.value)}
                  />
                  <p className="text-xs text-stone-500 mt-1">{t('admin.inventoryThresholdHint')}</p>
                </div>
                <div>
                  <label className="text-xs text-stone-600">{t('admin.inventoryReason')}</label>
                  <select className={inputClass} value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)}>
                    {ADJUST_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {t(r.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-stone-600">{t('admin.inventoryNotes')}</label>
                  <textarea className={inputClass + ' min-h-[72px]'} value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} />
                </div>
                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    type="button"
                    disabled={adjustMutation.isPending}
                    onClick={() => adjustMutation.mutate()}
                    className="px-4 py-2 rounded-lg bg-lime-400 text-black font-semibold hover:bg-lime-300 disabled:opacity-50"
                  >
                    {adjustMutation.isPending ? t('common.loading') : t('admin.inventorySaveQty')}
                  </button>
                  <button
                    type="button"
                    disabled={thresholdMutation.isPending}
                    onClick={() => thresholdMutation.mutate()}
                    className="px-4 py-2 rounded-lg border border-lime-400/50 text-black hover:bg-lime-100 disabled:opacity-50"
                  >
                    {thresholdMutation.isPending ? t('common.loading') : t('admin.inventorySaveThreshold')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustRow(null)}
                    className="px-4 py-2 rounded-lg text-stone-700 hover:text-black"
                  >
                    {t('admin.cancel')}
                  </button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
