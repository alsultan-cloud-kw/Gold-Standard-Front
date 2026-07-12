import { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import AdminNav from '../../components/admin/AdminNav'
import AdminPaginationBar from '../../components/admin/AdminPaginationBar'
import { adminApi, accountingApi, inventoryApi, productsApi } from '../../services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

type Branch = { id: string; code: string; name_en: string }
type MetalType = { id: string; display_name_en: string }
type Carat = { id: string; display_name_en: string; carat_value?: number }
type ProductOpt = {
  id: string
  name_en: string
  sku: string
  weight_grams?: string
  metal_type?: { id: string }
  carat?: { id: string }
  /** Live buy rate per gram (used for default purchase price). */
  live_buy_price_per_gram?: number | null
  /** Fallback stored price per gram when live rate is missing. */
  current_price?: number | null
}

type PurchaseItemRow = {
  description: string
  metal_type: string
  carat: string
  weight_grams: string
  price_per_gram: string
  total_price: string
  product: string
  quantity: number
  /** When true, we won't auto-overwrite price_per_gram on carat/product changes. */
  priceUserEdited?: boolean
}

function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const p = data as { results?: T[] }
  return p?.results ?? []
}

export default function AdminPurchases() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)

  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null)

  const { data: purchasesData, isLoading } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => accountingApi.getPurchases(),
  })

  const { data: purchaseDetailsRaw, isLoading: detailsLoading } = useQuery({
    queryKey: ['purchaseDetails', selectedPurchaseId],
    queryFn: () =>
      selectedPurchaseId
        ? accountingApi.getPurchase(selectedPurchaseId)
        : (Promise.resolve(null) as Promise<unknown>),
    enabled: detailsOpen && !!selectedPurchaseId,
  })

  const { data: todayData } = useQuery({
    queryKey: ['todayPurchases'],
    queryFn: () => accountingApi.getTodayPurchases(),
  })

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => inventoryApi.getBranches(),
  })

  const { data: productsData } = useQuery({
    queryKey: ['adminProductsForPurchase'],
    queryFn: () => productsApi.getProductsAdmin({ page_size: 500 }),
  })

  const { data: metalTypesData } = useQuery({
    queryKey: ['metalTypes'],
    queryFn: () => productsApi.getMetalTypes(),
  })

  const { data: caratsData } = useQuery({
    queryKey: ['carats'],
    queryFn: () => productsApi.getCarats(),
  })

  const { data: publicRatesData } = useQuery({
    queryKey: ['daralsabaek-public-rates'],
    queryFn: () => adminApi.getDaralsabaekPublicRates(),
  })

  const branches = asList<Branch>(branchesData)
  const products = asList<ProductOpt>(productsData)
  const metalTypes = asList<MetalType>(metalTypesData)
  const carats = asList<Carat>(caratsData)
  const publicRates = publicRatesData ? (publicRatesData as any) : undefined

  function getLiveBuyPricePerGramForCaratValue(caratValue?: number) {
    if (caratValue == null) return null
    const v = Number(caratValue)
    if (!Number.isFinite(v) || v <= 0) return null
    const rounded = Math.round(v)
    const keys = [`${rounded}K`, `${v}K`]
    const row = publicRates?.carats?.find((x: any) => keys.includes(x?.key))
    const buyTotal = row?.buyTotal
    if (typeof buyTotal === 'number' && buyTotal > 0) return buyTotal
    return null
  }

  const [form, setForm] = useState({
    seller_name: '',
    seller_phone: '',
    seller_id_number: '',
    branch: '',
    purchase_date: new Date().toISOString().slice(0, 16),
    payment_method: 'cash' as 'cash' | 'bank_transfer' | 'check',
    notes: '',
  })

  const [items, setItems] = useState<PurchaseItemRow[]>([
    { description: '', metal_type: '', carat: '', weight_grams: '', price_per_gram: '', total_price: '', product: '', quantity: 1, priceUserEdited: false },
  ])

  const createMutation = useMutation({
    mutationFn: (payload: unknown) => accountingApi.createPurchase(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] })
      queryClient.invalidateQueries({ queryKey: ['todayPurchases'] })
      setModalOpen(false)
      resetForm()
      toast.success('Purchase created. Inventory updated for lines with product.')
    },
    onError: (err: { response?: { data?: Record<string, string[]> } }) => {
      const msg = err?.response?.data
      const first = msg && typeof msg === 'object' && Object.values(msg)[0]
      toast.error(Array.isArray(first) ? first[0] : 'Failed to create purchase')
    },
  })

  function resetForm() {
    setForm({
      seller_name: '',
      seller_phone: '',
      seller_id_number: '',
      branch: branches[0]?.id ?? '',
      purchase_date: new Date().toISOString().slice(0, 16),
      payment_method: 'cash',
      notes: '',
    })
    setItems([
      { description: '', metal_type: '', carat: '', weight_grams: '', price_per_gram: '', total_price: '', product: '', quantity: 1, priceUserEdited: false },
    ])
  }

  const computed = useMemo(() => {
    let totalWeight = 0
    let totalAmount = 0
    for (const it of items) {
      const w = parseFloat(it.weight_grams) || 0
      const p = parseFloat(it.price_per_gram) || 0
      const lineTotal = parseFloat(it.total_price) || w * p
      totalWeight += w
      totalAmount += lineTotal
    }
    return {
      total_weight: totalWeight,
      total_amount: totalAmount,
      price_per_gram: totalWeight > 0 ? totalAmount / totalWeight : 0,
    }
  }, [items])

  function updateItem(index: number, field: keyof PurchaseItemRow, value: string | number) {
    setItems((prev) => {
      const next = [...prev]
      const row = { ...next[index], [field]: value }
      if (field === 'weight_grams' || field === 'price_per_gram') {
        const w = parseFloat(String(row.weight_grams)) || 0
        const p = parseFloat(String(row.price_per_gram)) || 0
        row.total_price = (w * p).toFixed(3)
      }
      if (field === 'price_per_gram') {
        row.priceUserEdited = true
      }
      if (field === 'carat' && value) {
        // Scrap purchase: company pays customer at configured buyTotal (public-rates).
        if (!row.product) {
          const caratObj = carats.find((c) => c.id === String(row.carat))
          const caratValue = caratObj?.carat_value
          const liveBuy = getLiveBuyPricePerGramForCaratValue(caratValue)

          // Only auto-fill if user hasn't manually overridden price.
          if (liveBuy != null && !row.priceUserEdited) {
            row.price_per_gram = liveBuy.toFixed(3)
            row.priceUserEdited = false
            const w = parseFloat(String(row.weight_grams)) || 0
            row.total_price = (w * liveBuy).toFixed(3)
          }
        }
      }
      if (field === 'product' && value) {
        const prod = products.find((x) => x.id === value)
        if (prod) {
          row.description = row.description || prod.name_en
          if (prod.weight_grams) row.weight_grams = String(prod.weight_grams)
          if (prod.metal_type?.id) row.metal_type = prod.metal_type.id
          if (prod.carat?.id) row.carat = prod.carat.id

          // Default price/g from live buyTotal — company payout when purchasing from customer.
          const caratObj = carats.find((c) => String(c.id) === String(prod.carat?.id))
          const caratValue = caratObj?.carat_value
          const liveBuy = getLiveBuyPricePerGramForCaratValue(caratValue)
          const fallback = prod.current_price
          const p = (liveBuy != null ? Number(liveBuy) : Number(fallback)) || 0
          if (p > 0) row.price_per_gram = Number(p).toFixed(3)
          row.priceUserEdited = false

          const w = parseFloat(row.weight_grams) || 0
          const price = parseFloat(row.price_per_gram) || 0
          row.total_price = (w * price).toFixed(3)
        }
      }
      next[index] = row
      return next
    })
  }

  function addRow() {
    setItems((prev) => [
      ...prev,
      { description: '', metal_type: '', carat: '', weight_grams: '', price_per_gram: '', total_price: '', product: '', quantity: 1, priceUserEdited: false },
    ])
  }

  function removeRow(index: number) {
    if (items.length <= 1) return
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.branch) {
      toast.error('Select a branch')
      return
    }
    const payloadItems = items.map((it) => {
      const weight = parseFloat(it.weight_grams) || 0
      const pricePerGram = parseFloat(it.price_per_gram) || 0
      const total = parseFloat(it.total_price) || weight * pricePerGram
      const prod = it.product ? products.find((p) => p.id === it.product) : null
      const metalTypeId = it.metal_type || prod?.metal_type?.id
      const caratId = it.carat || prod?.carat?.id
      const item: Record<string, unknown> = {
        description: it.description || prod?.name_en || 'Purchase item',
        metal_type: metalTypeId,
        carat: caratId,
        weight_grams: weight.toFixed(3),
        price_per_gram: pricePerGram.toFixed(3),
        total_price: total.toFixed(3),
        quantity: it.quantity || 1,
      }
      if (it.product) item.product = it.product
      return item
    })
    const validItems = payloadItems.filter((it) => it.metal_type && it.carat)
    if (validItems.length === 0) {
      toast.error('Each line needs Metal type and Carat (or select a Product to auto-fill).')
      return
    }
    const purchaseDate = form.purchase_date ? new Date(form.purchase_date).toISOString() : new Date().toISOString()
    createMutation.mutate({
      seller_name: form.seller_name || 'Merchant',
      seller_phone: form.seller_phone || '00000000',
      seller_id_number: form.seller_id_number || null,
      branch: form.branch,
      purchase_date: purchaseDate,
      payment_method: form.payment_method,
      total_weight: computed.total_weight.toFixed(3),
      price_per_gram: computed.price_per_gram.toFixed(3),
      total_amount: computed.total_amount.toFixed(3),
      notes: form.notes || null,
      items: validItems,
    })
  }

  const list = asList<{ id: string; purchase_number: string; purchase_date: string; seller_name?: string; branch_name?: string; total_amount: number }>(purchasesData)
  const today = (todayData as { total_amount?: number; count?: number }) ?? {}

  const [purchasePage, setPurchasePage] = useState(1)
  const purchasePageSize = 10
  const purchaseTotal = list.length
  const purchaseTotalPages = Math.max(1, Math.ceil(purchaseTotal / purchasePageSize))
  const purchasePageItems = list.slice(
    (purchasePage - 1) * purchasePageSize,
    purchasePage * purchasePageSize,
  )

  useEffect(() => {
    setPurchasePage(1)
  }, [purchasesData])

  useEffect(() => {
    if (purchasePage > purchaseTotalPages) setPurchasePage(purchaseTotalPages)
  }, [purchasePage, purchaseTotalPages])

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.purchasesTitle')}</h1>
            <p className="text-stone-600 mt-1">{t('admin.purchasesSubtitleLong')}</p>
          </div>
          <button
            type="button"
            onClick={() => { setModalOpen(true); if (branches.length) setForm((f) => ({ ...f, branch: f.branch || branches[0].id })) }}
            className="gold-button inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('admin.addPurchase')}
          </button>
        </div>
        {!!todayData && (
          <div className="gold-card px-6 py-4 flex items-center gap-6 mb-6">
            <div>
              <p className="text-sm text-stone-700">{t('admin.todayPurchases')}</p>
              <p className="text-xl font-bold text-lime-800">
                {Number(today.total_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD
              </p>
            </div>
            <div>
              <p className="text-sm text-stone-700">{t('admin.count')}</p>
              <p className="text-xl font-bold text-black">{today.count ?? 0}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="gold-card p-8 text-center text-stone-800">{t('common.loading')}</div>
        ) : (
          <div className="gold-card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.purchaseNumber')}</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.date')}</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.seller')}</th>
                  <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.branch')}</th>
                  <th className="text-right py-3 px-4 text-stone-700 font-medium">{t('admin.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {purchasePageItems.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-stone-100 cursor-pointer hover:bg-lime-50"
                    onClick={() => {
                      setSelectedPurchaseId(p.id)
                      setDetailsOpen(true)
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setSelectedPurchaseId(p.id)
                        setDetailsOpen(true)
                      }
                    }}
                  >
                    <td className="py-3 px-4 font-mono text-black">{p.purchase_number}</td>
                    <td className="py-3 px-4 text-black">{p.purchase_date}</td>
                    <td className="py-3 px-4 text-black">{p.seller_name || '—'}</td>
                    <td className="py-3 px-4 text-stone-800">{p.branch_name || '—'}</td>
                    <td className="py-3 px-4 text-right text-lime-800 font-medium">
                      {Number(p.total_amount).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && (
              <p className="py-8 text-center text-stone-600">{t('admin.noPurchasesFound')}</p>
            )}
            {!isLoading && purchaseTotal > purchasePageSize && (
              <AdminPaginationBar
                page={purchasePage}
                totalPages={purchaseTotalPages}
                total={purchaseTotal}
                pageSize={purchasePageSize}
                onPageChange={setPurchasePage}
                itemLabel="purchases"
              />
            )}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--panel-bg)] border border-stone-200 text-stone-800">
          <DialogHeader>
            <DialogTitle className="gold-gradient-text-on-light">{t('admin.addPurchaseFromMerchant')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">{t('admin.sellerName')} *</label>
                <input
                  type="text"
                  value={form.seller_name}
                  onChange={(e) => setForm((f) => ({ ...f, seller_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                  placeholder="Merchant name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">{t('admin.sellerPhone')}</label>
                <input
                  type="text"
                  value={form.seller_phone}
                  onChange={(e) => setForm((f) => ({ ...f, seller_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">{t('admin.branch')} *</label>
                <select
                  value={form.branch}
                  onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name_en} ({b.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Purchase date</label>
                <input
                  type="datetime-local"
                  value={form.purchase_date}
                  onChange={(e) => setForm((f) => ({ ...f, purchase_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">{t('admin.paymentMethod')}</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value as 'cash' | 'bank_transfer' | 'check' }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                >
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                rows={2}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-stone-700">Items (set Product to receive into inventory)</label>
                <button type="button" onClick={addRow} className="text-sm text-amber-700 hover:underline">+ Add line</button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {items.map((item, idx) => (
                  <div key={idx} className="flex flex-wrap items-end gap-2 p-2 border border-stone-200 rounded-lg bg-white/80">
                    <div className="w-32">
                      <span className="text-xs text-stone-500">Product</span>
                      <select
                        value={item.product}
                        onChange={(e) => updateItem(idx, 'product', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded bg-white"
                      >
                        <option value="">—</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.sku} – {p.name_en}</option>
                        ))}
                      </select>
                    </div>
                    {item.product && (
                      <div className="w-20">
                        <span className="text-xs text-stone-500">Qty</span>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-[120px]">
                      <span className="text-xs text-stone-500">Description</span>
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(idx, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                        placeholder="Item description"
                      />
                    </div>
                    <div className="w-24">
                      <span className="text-xs text-stone-500">Metal</span>
                      <select
                        value={item.metal_type}
                        onChange={(e) => updateItem(idx, 'metal_type', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded bg-white"
                      >
                        <option value="">—</option>
                        {metalTypes.map((m) => (
                          <option key={m.id} value={m.id}>{m.display_name_en}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <span className="text-xs text-stone-500">Carat</span>
                      <select
                        value={item.carat}
                        onChange={(e) => updateItem(idx, 'carat', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded bg-white"
                      >
                        <option value="">—</option>
                        {carats.map((c) => (
                          <option key={c.id} value={c.id}>{c.display_name_en}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-20">
                      <span className="text-xs text-stone-500">Weight (g)</span>
                      <input
                        type="number"
                        step="0.001"
                        value={item.weight_grams}
                        onChange={(e) => updateItem(idx, 'weight_grams', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                      />
                    </div>
                    <div className="w-20">
                      <span className="text-xs text-stone-500">Price/g</span>
                      <input
                        type="number"
                        step="0.001"
                        value={item.price_per_gram}
                        onChange={(e) => updateItem(idx, 'price_per_gram', e.target.value)}
                        className="w-full px-2 py-1.5 text-sm border border-stone-300 rounded"
                      />
                    </div>
                    <div className="w-20">
                      <span className="text-xs text-stone-500">Total</span>
                      <input
                        type="text"
                        value={item.total_price}
                        readOnly
                        className="w-full px-2 py-1.5 text-sm border border-stone-200 rounded bg-stone-50"
                      />
                    </div>
                    <button type="button" onClick={() => removeRow(idx)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Remove line">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Total: {computed.total_weight.toFixed(3)} g · {computed.total_amount.toFixed(3)} KWD
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-100">
                Cancel
              </button>
              <button type="submit" disabled={createMutation.isPending} className="gold-button">
                {createMutation.isPending ? 'Saving…' : 'Create purchase'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailsOpen}
        onOpenChange={(v) => {
          setDetailsOpen(v)
          if (!v) setSelectedPurchaseId(null)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[var(--panel-bg)] border border-stone-200 text-stone-800">
          <DialogHeader>
            <DialogTitle className="gold-gradient-text-on-light">Purchase details</DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <div className="p-4 text-stone-600">Loading…</div>
          ) : !purchaseDetailsRaw ? (
            <div className="p-4 text-stone-600">No purchase selected.</div>
          ) : (
            (() => {
              const pd = purchaseDetailsRaw as any
              const items = Array.isArray(pd.items) ? pd.items : []
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-stone-600">Purchase #</p>
                      <p className="text-black font-semibold">{pd.purchase_number || '—'}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-stone-600">Date</p>
                      <p className="text-black font-semibold">{pd.purchase_date || '—'}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-stone-600">Seller</p>
                      <p className="text-black font-semibold">{pd.seller_name || '—'}</p>
                      {pd.seller_phone && <p className="text-xs text-stone-600 mt-1">{pd.seller_phone}</p>}
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-stone-600">Branch / Payment</p>
                      <p className="text-black font-semibold">{pd.branch_name || '—'}</p>
                      {pd.payment_method_display && <p className="text-xs text-stone-600 mt-1">{pd.payment_method_display}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-stone-600">Total weight (g)</p>
                      <p className="text-black font-semibold">{Number(pd.total_weight ?? 0).toFixed(3)}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-stone-600">Price / g</p>
                      <p className="text-black font-semibold">{Number(pd.price_per_gram ?? 0).toFixed(3)}</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-stone-600">Total amount</p>
                      <p className="text-black font-semibold">{Number(pd.total_amount ?? 0).toFixed(3)} KWD</p>
                    </div>
                  </div>

                  {pd.notes && (
                    <div className="p-3 bg-white rounded-lg">
                      <p className="text-xs text-stone-600">Notes</p>
                      <p className="text-black whitespace-pre-wrap">{pd.notes}</p>
                    </div>
                  )}

                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm font-semibold text-black mb-3">Line items</p>
                    {items.length === 0 ? (
                      <p className="text-stone-600">No items on this purchase.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-stone-200">
                              <th className="text-left py-2 px-3 text-stone-700 font-medium">Product</th>
                              <th className="text-left py-2 px-3 text-stone-700 font-medium">Metal</th>
                              <th className="text-left py-2 px-3 text-stone-700 font-medium">Carat</th>
                              <th className="text-right py-2 px-3 text-stone-700 font-medium">Qty</th>
                              <th className="text-right py-2 px-3 text-stone-700 font-medium">Weight (g)</th>
                              <th className="text-right py-2 px-3 text-stone-700 font-medium">Price / g</th>
                              <th className="text-right py-2 px-3 text-stone-700 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((it: any, idx: number) => (
                              <tr key={it.id || idx} className="border-b border-stone-100">
                                <td className="py-2 px-3 text-black">
                                  {it.product_sku || it.product_name ? (
                                    `${it.product_sku || ''} ${it.product_name || ''}`.trim()
                                  ) : (
                                    it.description || '—'
                                  )}
                                </td>
                                <td className="py-2 px-3 text-stone-800">{it.metal_type_name || '—'}</td>
                                <td className="py-2 px-3 text-stone-800">{it.carat_display || '—'}</td>
                                <td className="py-2 px-3 text-right text-black">{Number(it.quantity ?? 1)}</td>
                                <td className="py-2 px-3 text-right text-lime-800">{Number(it.weight_grams ?? 0).toFixed(3)}</td>
                                <td className="py-2 px-3 text-right text-lime-800">{Number(it.price_per_gram ?? 0).toFixed(3)}</td>
                                <td className="py-2 px-3 text-right text-black font-semibold">
                                  {Number(it.total_price ?? 0).toFixed(3)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
