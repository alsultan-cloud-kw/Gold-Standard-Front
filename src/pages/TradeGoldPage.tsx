import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import AutoTradeRulesSection from '../components/trade/AutoTradeRulesSection'
import { goldTradingApi, walletApi } from '../services/api'
import { toast } from 'sonner'

type Position = {
  id: string
  carat_value: number
  carat_display: string
  grams_available: number
  avg_buy_price_per_gram: number
  unrealized_pl_kwd?: number | null
}

type Trade = {
  id: string
  side: 'buy' | 'sell'
  side_display?: string
  carat_value: number
  grams: number
  price_per_gram: number
  total_kwd: number
  fee_kwd?: number
  realized_pl_kwd?: number | null
  created_at: string
}

type Quote = {
  side: 'buy' | 'sell'
  carat_value: number
  carat_display: string
  price_per_gram: number
  grams: number
  kwd_amount: number
  base_kwd_amount?: number
  fee_kwd?: number
  fee_percent?: number
  wallet_balance?: number
  max_grams_by_wallet?: number
  grams_available?: number
  currency?: string
}

type TradeSide = 'buy' | 'sell'
type TradePayload = { carat_value: number; grams?: number; kwd_amount?: number }

const CARATS = [18, 21, 22, 24]

export default function TradeGoldPage() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const dateLocale = i18n.language?.startsWith('ar') ? 'ar-KW' : undefined
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [caratValue, setCaratValue] = useState<number>(21)
  const [inputMode, setInputMode] = useState<'grams' | 'kwd'>('grams')
  const [gramsInput, setGramsInput] = useState('')
  const [kwdInput, setKwdInput] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmQuote, setConfirmQuote] = useState<Quote | null>(null)
  const [confirmSide, setConfirmSide] = useState<TradeSide>('buy')
  const [confirmPayload, setConfirmPayload] = useState<TradePayload | null>(null)

  const grams = parseFloat(gramsInput)
  const kwdAmount = parseFloat(kwdInput)
  const payload = useMemo(() => {
    if (inputMode === 'grams') return { carat_value: caratValue, grams }
    return { carat_value: caratValue, kwd_amount: kwdAmount }
  }, [inputMode, caratValue, grams, kwdAmount])

  const { data: walletData } = useQuery({
    queryKey: ['wallet', 'trade-gold'],
    queryFn: () => walletApi.getMyWallet(),
    enabled: isAuthenticated,
  })
  const walletBalance = Number((walletData as { wallet?: { balance?: number } } | undefined)?.wallet?.balance ?? 0)

  const { data: positionsData } = useQuery({
    queryKey: ['goldPositions'],
    queryFn: () => goldTradingApi.getPositions(),
    enabled: isAuthenticated,
  })
  const positions = (Array.isArray(positionsData) ? positionsData : []) as Position[]
  const currentPosition = positions.find((p) => p.carat_value === caratValue)

  const { data: tradesData } = useQuery({
    queryKey: ['goldTrades'],
    queryFn: () => goldTradingApi.getTrades(),
    enabled: isAuthenticated,
  })
  const trades = (Array.isArray(tradesData) ? tradesData : []) as Trade[]

  const quoteMutation = useMutation({
    mutationFn: () => (side === 'buy' ? goldTradingApi.quoteBuy(payload) : goldTradingApi.quoteSell(payload)),
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail ?? t('tradeGold.quoteFailed'))
    },
  })
  const quote = (quoteMutation.data ?? null) as Quote | null

  const executeMutation = useMutation({
    mutationFn: (vars: { side: TradeSide; payload: TradePayload }) =>
      vars.side === 'buy' ? goldTradingApi.buy(vars.payload) : goldTradingApi.sell(vars.payload),
    onSuccess: (_data, vars) => {
      toast.success(
        vars.side === 'buy' ? t('tradeGold.buyExecuted') : t('tradeGold.sellExecuted')
      )
      setGramsInput('')
      setKwdInput('')
      setConfirmOpen(false)
      setConfirmQuote(null)
      setConfirmPayload(null)
      queryClient.invalidateQueries({ queryKey: ['wallet', 'trade-gold'] })
      queryClient.invalidateQueries({ queryKey: ['goldPositions'] })
      queryClient.invalidateQueries({ queryKey: ['goldTrades'] })
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail ?? t('tradeGold.executeFailed'))
    },
  })

  const canQuote =
    inputMode === 'grams' ? Number.isFinite(grams) && grams > 0 : Number.isFinite(kwdAmount) && kwdAmount > 0

  const openConfirmModal = () => {
    if (!quote) return
    setConfirmQuote(quote)
    setConfirmSide(side)
    setConfirmPayload(payload)
    setConfirmOpen(true)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-10 bg-siteBg">
        <div className="max-w-lg mx-auto px-4 py-16 text-center gold-card p-8">
          <h2 className="text-xl font-bold text-gold-100 mb-2">{t('tradeGold.guestTitle')}</h2>
          <p className="text-gold-100/70 mb-6">{t('tradeGold.guestDesc')}</p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-gold-500 text-black font-semibold px-6 py-2 rounded-lg hover:bg-gold-400">
            {t('nav.login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-10 bg-siteBg">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold gold-gradient-text-on-light mb-2">{t('tradeGold.pageTitle')}</h1>
          <p className="text-stone-600">{t('tradeGold.pageSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="gold-card p-6 lg:col-span-2 space-y-5">
            <div className="flex flex-wrap gap-2">
              {(['buy', 'sell'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={`px-4 py-2 rounded-lg border text-sm font-semibold ${side === s ? 'bg-gold-500 text-black border-gold-500' : 'border-gold-500/40 text-gold-200 hover:bg-gold-500/10'}`}
                >
                  {s === 'buy' ? t('tradeGold.buyGold') : t('tradeGold.sellGold')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-gold-100/70 block mb-1">{t('tradeGold.carat')}</label>
                <select
                  value={caratValue}
                  onChange={(e) => setCaratValue(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100"
                >
                  {CARATS.map((cv) => (
                    <option key={cv} value={cv}>
                      {cv}K
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm text-gold-100/70 block mb-1">{t('tradeGold.inputMode')}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('grams')}
                    className={`px-4 py-2 rounded-lg border text-sm ${inputMode === 'grams' ? 'bg-gold-500 text-black border-gold-500' : 'border-gold-500/40 text-gold-200 hover:bg-gold-500/10'}`}
                  >
                    {t('tradeGold.byGrams')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('kwd')}
                    className={`px-4 py-2 rounded-lg border text-sm ${inputMode === 'kwd' ? 'bg-gold-500 text-black border-gold-500' : 'border-gold-500/40 text-gold-200 hover:bg-gold-500/10'}`}
                  >
                    {t('tradeGold.byKwd')}
                  </button>
                </div>
              </div>
            </div>

            {inputMode === 'grams' ? (
              <div>
                <label className="text-sm text-gold-100/70 block mb-1">{t('tradeGold.grams')}</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={gramsInput}
                  onChange={(e) => setGramsInput(e.target.value)}
                  placeholder={t('tradeGold.gramsPlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm text-gold-100/70 block mb-1">
                  {side === 'buy' ? t('tradeGold.kwdLabelBuy') : t('tradeGold.kwdLabelSell')}
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={kwdInput}
                  onChange={(e) => setKwdInput(e.target.value)}
                  placeholder={t('tradeGold.kwdPlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!canQuote || quoteMutation.isPending}
                onClick={() => quoteMutation.mutate()}
                className="px-4 py-2 rounded-lg border border-gold-500 text-gold-300 hover:bg-gold-500/10 disabled:opacity-50"
              >
                {quoteMutation.isPending ? t('tradeGold.quoting') : t('tradeGold.getQuote')}
              </button>
              <button
                type="button"
                disabled={!quote || executeMutation.isPending}
                onClick={openConfirmModal}
                className="px-4 py-2 rounded-lg bg-gold-500 text-black font-semibold hover:bg-gold-400 disabled:opacity-50"
              >
                {executeMutation.isPending
                  ? t('tradeGold.processing')
                  : side === 'buy'
                    ? t('tradeGold.buyNow')
                    : t('tradeGold.sellNow')}
              </button>
            </div>

            {quote && (
              <div className="rounded-xl border border-gold-500/30 bg-charcoal-800/70 p-4 text-sm">
                <div className="flex justify-between py-1"><span className="text-gold-100/70">{t('tradeGold.rate')}</span><span className="text-gold-100">{quote.price_per_gram.toFixed(3)} KWD/g</span></div>
                <div className="flex justify-between py-1"><span className="text-gold-100/70">{t('tradeGold.grams')}</span><span className="text-gold-100">{quote.grams.toFixed(3)} g</span></div>
                {quote.base_kwd_amount != null && (
                  <div className="flex justify-between py-1"><span className="text-gold-100/70">{side === 'buy' ? t('tradeGold.baseBuy') : t('tradeGold.baseSell')}</span><span className="text-gold-100">{quote.base_kwd_amount.toFixed(3)} KWD</span></div>
                )}
                {quote.fee_kwd != null && (
                  <div className="flex justify-between py-1"><span className="text-gold-100/70">{t('tradeGold.fee')}</span><span className="text-gold-100">{quote.fee_kwd.toFixed(3)} KWD</span></div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-gold-100/70">{side === 'buy' ? t('tradeGold.total') : t('tradeGold.net')}</span>
                  <span className="text-gold-100">{quote.kwd_amount.toFixed(3)} KWD</span>
                </div>
                {quote.max_grams_by_wallet != null && side === 'buy' && (
                  <div className="flex justify-between py-1"><span className="text-gold-100/70">{t('tradeGold.maxBuyByWallet')}</span><span className="text-gold-100">{quote.max_grams_by_wallet.toFixed(3)} g</span></div>
                )}
                {quote.grams_available != null && side === 'sell' && (
                  <div className="flex justify-between py-1"><span className="text-gold-100/70">{t('tradeGold.availableToSell')}</span><span className="text-gold-100">{quote.grams_available.toFixed(3)} g</span></div>
                )}
              </div>
            )}
          </div>

          <div className="gold-card p-6 space-y-4">
            <h3 className="text-lg font-semibold text-gold-100">{t('tradeGold.walletPosition')}</h3>
            <div className="rounded-lg bg-charcoal-800/60 border border-gold-500/20 p-3">
              <p className="text-xs text-gold-100/60">{t('tradeGold.walletBalance')}</p>
              <p className="text-xl font-bold text-gold-200">{walletBalance.toFixed(3)} KWD</p>
            </div>
            <div className="rounded-lg bg-charcoal-800/60 border border-gold-500/20 p-3">
              <p className="text-xs text-gold-100/60">{t('tradeGold.caratAvailable', { carat: caratValue })}</p>
              <p className="text-xl font-bold text-gold-200">{Number(currentPosition?.grams_available ?? 0).toFixed(3)} g</p>
              <p className="text-xs text-gold-100/60 mt-1">
                {t('tradeGold.avgBuy', {
                  price: Number(currentPosition?.avg_buy_price_per_gram ?? 0).toFixed(3),
                })}
              </p>
              {currentPosition?.unrealized_pl_kwd != null && Number.isFinite(currentPosition.unrealized_pl_kwd) && (
                <p
                  className={`text-sm mt-2 font-semibold ${
                    (currentPosition.unrealized_pl_kwd ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {t('tradeGold.unrealizedPL', { amount: currentPosition.unrealized_pl_kwd.toFixed(3) })}
                </p>
              )}
            </div>
          </div>
        </div>

        <AutoTradeRulesSection
          quotePreview={
            quote && quote.carat_value === caratValue
              ? {
                  carat_value: caratValue,
                  buy_rate: side === 'buy' ? quote.price_per_gram : undefined,
                  sell_rate: side === 'sell' ? quote.price_per_gram : undefined,
                }
              : null
          }
        />

        <div className="gold-card p-6">
          <h3 className="text-lg font-semibold text-gold-100 mb-4">{t('tradeGold.recentTrades')}</h3>
          {trades.length === 0 ? (
            <p className="text-gold-100/60 text-sm">{t('tradeGold.noTrades')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-gold-100/60 border-b border-gold-500/20">
                    <th className="py-2 pe-3">{t('tradeGold.date')}</th>
                    <th className="py-2 pe-3">{t('tradeGold.side')}</th>
                    <th className="py-2 pe-3">{t('tradeGold.carat')}</th>
                    <th className="py-2 pe-3">{t('tradeGold.grams')}</th>
                    <th className="py-2 pe-3">{t('tradeGold.rate')}</th>
                    <th className="py-2 pe-3">{t('tradeGold.fee')}</th>
                    <th className="py-2">{t('tradeGold.total')}</th>
                    <th className="py-2">{t('tradeGold.pl')}</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.slice(0, 10).map((trade) => (
                    <tr key={trade.id} className="border-b border-gold-500/10">
                      <td className="py-2 pe-3 text-gold-100">
                        {new Date(trade.created_at).toLocaleString(dateLocale)}
                      </td>
                      <td className="py-2 pe-3 text-gold-100">
                        {trade.side === 'buy'
                          ? t('tradeGold.sideBuy')
                          : trade.side === 'sell'
                            ? t('tradeGold.sideSell')
                            : (trade.side_display ?? trade.side)}
                      </td>
                      <td className="py-2 pe-3 text-gold-100">{trade.carat_value}K</td>
                      <td className="py-2 pe-3 text-gold-100">{Number(trade.grams).toFixed(3)} g</td>
                      <td className="py-2 pe-3 text-gold-100">{Number(trade.price_per_gram).toFixed(3)} KWD/g</td>
                      <td className="py-2 pe-3 text-gold-100">
                        {trade.fee_kwd != null ? Number(trade.fee_kwd).toFixed(3) : '—'}
                      </td>
                      <td className="py-2 text-gold-100">{Number(trade.total_kwd).toFixed(3)} KWD</td>
                      <td
                        className={`py-2 ${
                          trade.side === 'sell' && trade.realized_pl_kwd != null
                            ? (Number(trade.realized_pl_kwd) >= 0 ? 'text-emerald-400' : 'text-red-400')
                            : 'text-gold-100/40'
                        }`}
                      >
                        {trade.side === 'sell' && trade.realized_pl_kwd != null
                          ? `${Number(trade.realized_pl_kwd).toFixed(3)} KWD`
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {confirmOpen && confirmQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gold-500/30 bg-charcoal-900 p-5 shadow-2xl">
            <h3 className="text-lg font-semibold text-gold-100">
              {confirmSide === 'buy' ? t('tradeGold.confirmBuy') : t('tradeGold.confirmSell')}
            </h3>
            <p className="mt-1 text-sm text-gold-100/70">{t('tradeGold.confirmReview')}</p>

            <div className="mt-4 space-y-2 rounded-xl border border-gold-500/20 bg-charcoal-800/70 p-4 text-sm">
              <div className="flex justify-between"><span className="text-gold-100/70">{t('tradeGold.carat')}</span><span className="text-gold-100">{confirmQuote.carat_display}</span></div>
              <div className="flex justify-between"><span className="text-gold-100/70">{t('tradeGold.rate')}</span><span className="text-gold-100">{confirmQuote.price_per_gram.toFixed(3)} KWD/g</span></div>
              <div className="flex justify-between"><span className="text-gold-100/70">{t('tradeGold.grams')}</span><span className="text-gold-100">{confirmQuote.grams.toFixed(3)} g</span></div>
              {confirmQuote.base_kwd_amount != null && (
                <div className="flex justify-between"><span className="text-gold-100/70">{confirmSide === 'buy' ? t('tradeGold.baseBuy') : t('tradeGold.baseSell')}</span><span className="text-gold-100">{confirmQuote.base_kwd_amount.toFixed(3)} KWD</span></div>
              )}
              {confirmQuote.fee_kwd != null && (
                <div className="flex justify-between"><span className="text-gold-100/70">{t('tradeGold.fee')}</span><span className="text-gold-100">{confirmQuote.fee_kwd.toFixed(3)} KWD</span></div>
              )}
              <div className="flex justify-between font-semibold">
                <span className="text-gold-100">{confirmSide === 'buy' ? t('tradeGold.totalDebit') : t('tradeGold.netCredit')}</span>
                <span className="text-gold-200">{confirmQuote.kwd_amount.toFixed(3)} KWD</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={executeMutation.isPending}
                className="px-4 py-2 rounded-lg border border-gold-500/40 text-gold-100 hover:bg-gold-500/10 disabled:opacity-50"
              >
                {t('tradeGold.cancel')}
              </button>
              <button
                type="button"
                disabled={executeMutation.isPending || !confirmPayload}
                onClick={() => {
                  if (!confirmPayload) return
                  executeMutation.mutate({ side: confirmSide, payload: confirmPayload })
                }}
                className="px-4 py-2 rounded-lg bg-gold-500 text-black font-semibold hover:bg-gold-400 disabled:opacity-50"
              >
                {executeMutation.isPending
                  ? t('tradeGold.processing')
                  : confirmSide === 'buy'
                    ? t('tradeGold.confirmBuyBtn')
                    : t('tradeGold.confirmSellBtn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

