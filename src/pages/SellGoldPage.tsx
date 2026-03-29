import { useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Scale, RefreshCw } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { ordersApi, tradingApi } from '../services/api'
import { toast } from 'sonner'

type LockedItem = {
  sale_item_id: string
  invoice_number: string
  order_date: string | null
  product_name: string | null
  product_sku: string | null
  product_serial_number: string | null
  carat_value: number | null
  carat_display: string | null
  weight_grams_available: number
}

function asLockedList(data: unknown): LockedItem[] {
  if (Array.isArray(data)) return data as LockedItem[]
  return []
}

export default function SellGoldPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [selected, setSelected] = useState<Record<string, string>>({}) // sale_item_id -> weight_grams string
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [notes, setNotes] = useState('')

  const { data: lockedData } = useQuery({
    queryKey: ['myLockedGold'],
    queryFn: () => ordersApi.getMyLockedGold(),
    enabled: isAuthenticated,
  })
  const locked = useMemo(() => asLockedList(lockedData), [lockedData])

  const validItems = useMemo(
    () =>
      Object.entries(selected)
        .map(([sale_item_id, w]) => ({ sale_item_id, weight_grams: parseFloat(w) }))
        .filter((i) => i.sale_item_id && Number.isFinite(i.weight_grams) && i.weight_grams > 0),
    [selected]
  )
  const canQuote = validItems.length > 0
  const canSubmit = canQuote

  const quoteMutation = useMutation({
    mutationFn: () => tradingApi.getSellQuote({ items: validItems }),
    onSuccess: (data: unknown) => {
      const d = data as { total_amount?: number; total_weight?: number; currency?: string }
      toast.success(
        `Quote: ${Number(d?.total_amount ?? 0).toFixed(3)} ${d?.currency ?? 'KWD'} for ${Number(d?.total_weight ?? 0).toFixed(3)} g`
      )
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail ?? 'Failed to get quote')
    },
  })

  const placeSellMutation = useMutation({
    mutationFn: () =>
      tradingApi.placeSellOrder({
        items: validItems,
        payment_method: paymentMethod,
        notes: notes || undefined,
      }),
    onSuccess: (data: unknown) => {
      const d = data as { buyback_number?: string; total_amount?: number }
      toast.success(`Sell order placed: ${d?.buyback_number ?? ''}. Visit branch to complete.`)
      setSelected({})
      setNotes('')
      navigate('/dashboard')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail ?? 'Failed to place sell order')
    },
  })

  const setWeight = (saleItemId: string, value: string) => {
    const item = locked.find((l) => l.sale_item_id === saleItemId)
    if (!item) return
    const num = parseFloat(value)
    if (Number.isFinite(num) && num <= item.weight_grams_available) {
      setSelected((prev) => ({ ...prev, [saleItemId]: value }))
    } else if (value === '' || value === '.') {
      setSelected((prev) => ({ ...prev, [saleItemId]: value }))
    } else if (Number.isFinite(num) && num > item.weight_grams_available) {
      setSelected((prev) => ({ ...prev, [saleItemId]: String(item.weight_grams_available) }))
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen py-10 bg-siteBg flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-10 bg-siteBg">
        <div className="max-w-lg mx-auto px-4 py-16 text-center gold-card p-8">
          <Scale className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gold-100 mb-2">Sell your gold</h2>
          <p className="text-gold-100/70 mb-6">
            You can only sell gold that you bought from this site and chose to lock in the vault. Log in to see your locked gold and place a sell order.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 bg-gold-500 text-black font-semibold px-6 py-2 rounded-lg hover:bg-gold-400"
          >
            Log in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-10 bg-siteBg">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gold-gradient-text-on-light mb-2">Sell gold</h1>
          <p className="text-stone-600">
            Sell only gold you bought here and locked in the vault. Select how many grams to sell from each position and place the order. Visit the branch to complete and receive payment.
          </p>
        </div>

        {locked.length === 0 ? (
          <div className="gold-card p-8 text-center">
            <Scale className="w-12 h-12 text-gold-400 mx-auto mb-4" />
            <p className="text-gold-100 mb-2">You have no locked gold.</p>
            <p className="text-sm text-gold-100/60 mb-6">
              At checkout, choose “Lock in vault” to keep gold in your account. Once the order is paid, it appears here and you can sell it back.
            </p>
            <Link to="/products" className="text-gold-400 hover:text-gold-300 font-medium">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="gold-card p-6 space-y-6">
            <div>
              <label className="text-gold-100 font-medium block mb-3">Select locked gold to sell</label>
              <div className="space-y-4">
                {locked.map((item) => (
                  <div
                    key={item.sale_item_id}
                    className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-gold-500/20 bg-charcoal-800/50"
                  >
                    <div className="flex-1 min-w-[140px]">
                      <p className="font-medium text-gold-100">{item.product_name ?? item.product_sku ?? 'Gold'}</p>
                      <p className="text-xs text-gold-100/60">
                        {item.invoice_number}
                        {item.carat_display && ` · ${item.carat_display}`}
                        {item.product_serial_number && ` · ${item.product_serial_number}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gold-100/60">Sell (g):</span>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        max={item.weight_grams_available}
                        placeholder="0"
                        value={selected[item.sale_item_id] ?? ''}
                        onChange={(e) => setWeight(item.sale_item_id, e.target.value)}
                        className="w-24 px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100"
                      />
                      <span className="text-xs text-gold-100/60">/ {item.weight_grams_available.toFixed(3)} g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="text-gold-100/80 text-sm block mb-1">Payment method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100"
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="knet">KNET</option>
                <option value="check">Check</option>
              </select>
            </div>

            <div>
              <label className="text-gold-100/80 text-sm block mb-1">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100"
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                disabled={!canQuote || quoteMutation.isPending}
                onClick={() => quoteMutation.mutate()}
                className="px-4 py-2 rounded-lg border border-gold-500 text-gold-400 hover:bg-gold-500/10 disabled:opacity-50"
              >
                {quoteMutation.isPending ? 'Getting quote…' : 'Get quote'}
              </button>
              <button
                type="button"
                disabled={!canSubmit || placeSellMutation.isPending}
                onClick={() => placeSellMutation.mutate()}
                className="px-4 py-2 rounded-lg bg-gold-500 text-black font-semibold hover:bg-gold-400 disabled:opacity-50"
              >
                {placeSellMutation.isPending ? 'Placing…' : 'Place sell order'}
              </button>
            </div>
          </div>
        )}

        <p className="mt-4 text-sm text-stone-500 text-center">
          After placing the order, visit the branch with your ID to complete the transaction and receive payment.
        </p>
      </div>
    </div>
  )
}
