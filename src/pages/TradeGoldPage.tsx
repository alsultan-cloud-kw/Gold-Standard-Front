import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { CreditCard } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import AutoTradeRulesSection from '../components/trade/AutoTradeRulesSection'
import { goldTradingApi, walletApi } from '../services/api'
import { toast } from 'sonner'

const KNET_DEPOSIT_DESCRIPTION = 'KNET wallet deposit — Gold trading'

function depositErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { detail?: unknown } } }
  const d = e?.response?.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map(String).join(', ')
  return fallback
}

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
  max_grams_by_admin?: number | null
  max_grams_for_buy?: number
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
  const [depositAmount, setDepositAmount] = useState('')

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
    mutationFn: (vars: { side: TradeSide; payload: TradePayload }) =>
      vars.side === 'buy' ? goldTradingApi.quoteBuy(vars.payload) : goldTradingApi.quoteSell(vars.payload),
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail ?? t('tradeGold.quoteFailed'))
    },
  })
  const quote = (quoteMutation.data ?? null) as Quote | null
  const latestQuoteKeyRef = useRef<string>('')

  const depositMutation = useMutation({
    mutationFn: (amountStr: string) =>
      walletApi.deposit({ amount: amountStr, description: KNET_DEPOSIT_DESCRIPTION }),
    onSuccess: () => {
      toast.success(t('tradeGold.knetDeposit.success'))
      setDepositAmount('')
      queryClient.invalidateQueries({ queryKey: ['wallet', 'trade-gold'] })
      queryClient.invalidateQueries({ queryKey: ['myWallet'] })
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] })
    },
    onError: (err: unknown) =>
      toast.error(depositErrorMessage(err, t('tradeGold.knetDeposit.failed'))),
  })

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
  const quoteKey = useMemo(() => {
    const val = inputMode === 'grams' ? gramsInput.trim() : kwdInput.trim()
    return `${side}|${caratValue}|${inputMode}|${val}`
  }, [side, caratValue, inputMode, gramsInput, kwdInput])

  useEffect(() => {
    if (!canQuote) {
      quoteMutation.reset()
      latestQuoteKeyRef.current = ''
      return
    }
    const timer = setTimeout(() => {
      latestQuoteKeyRef.current = quoteKey
      quoteMutation.mutate({ side, payload })
    }, 250)
    return () => clearTimeout(timer)
  }, [canQuote, quoteKey, side, payload])

  const hasFreshQuote = canQuote && latestQuoteKeyRef.current === quoteKey && !quoteMutation.isPending && !!quote

  const buyExceedsAdminCap = Boolean(
    side === 'buy' &&
      quote &&
      hasFreshQuote &&
      typeof quote.max_grams_for_buy === 'number' &&
      quote.grams > quote.max_grams_for_buy + 1e-6,
  )

  const openConfirmModal = () => {
    if (!quote) return
    if (side === 'buy' && buyExceedsAdminCap) {
      toast.error(t('tradeGold.buyExceedsAdminCap'))
      return
    }
    setConfirmQuote(quote)
    setConfirmSide(side)
    setConfirmPayload(payload)
    setConfirmOpen(true)
  }

  const submitKnetDeposit = () => {
    const n = parseFloat(depositAmount.replace(/,/g, '.'))
    if (!Number.isFinite(n) || n <= 0) {
      toast.error(t('tradeGold.knetDeposit.invalidAmount'))
      return
    }
    depositMutation.mutate(n.toFixed(3))
  }

  const knetPresets = [10, 25, 50, 100] as const
  const rateLabel =
    side === 'buy'
      ? t('tradeGold.customerBuyRate', { defaultValue: 'Customer buy rate (you pay)' })
      : t('tradeGold.customerSellRate', { defaultValue: 'Customer sell rate (you receive)' })
  const confirmRateLabel =
    confirmSide === 'buy'
      ? t('tradeGold.customerBuyRate', { defaultValue: 'Customer buy rate (you pay)' })
      : t('tradeGold.customerSellRate', { defaultValue: 'Customer sell rate (you receive)' })

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen py-10 bg-gradient-to-b from-lime-50/60 via-white to-white">
        <div className="max-w-lg mx-auto px-4 py-16 text-center product-card-lime p-8 border-2 border-black/10 shadow-lg">
          <h2 className="text-xl font-bold text-black mb-2">{t('tradeGold.guestTitle')}</h2>
          <p className="text-black/80 font-medium mb-6">{t('tradeGold.guestDesc')}</p>
          <Link
            to="/login"
            className="gold-button inline-flex items-center gap-2 px-6 py-2 rounded-lg border-2 border-black/10"
          >
            {t('nav.login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-10 bg-gradient-to-b from-lime-50/50 via-white to-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-black mb-2">{t('tradeGold.pageTitle')}</h1>
          <p className="text-stone-800 font-medium">{t('tradeGold.pageSubtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="gold-card p-6 lg:col-span-2 space-y-5">
            <div className="flex flex-wrap gap-2">
              {(['buy', 'sell'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSide(s)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                    side === s
                      ? 'bg-black text-yellow-300 border-black shadow-md'
                      : 'border-black/15 bg-lime-100/80 text-black hover:bg-lime-200 hover:border-black/30'
                  }`}
                >
                  {s === 'buy' ? t('tradeGold.buyGold') : t('tradeGold.sellGold')}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold text-black block mb-1">{t('tradeGold.carat')}</label>
                <select
                  value={caratValue}
                  onChange={(e) => setCaratValue(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-lg border-2 border-black/15 bg-white text-black font-medium"
                >
                  {CARATS.map((cv) => (
                    <option key={cv} value={cv}>
                      {cv}K
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-black block mb-1">{t('tradeGold.inputMode')}</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInputMode('grams')}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-bold ${
                      inputMode === 'grams'
                        ? 'bg-black text-yellow-300 border-black'
                        : 'border-black/15 bg-lime-100/80 text-black hover:bg-lime-200'
                    }`}
                  >
                    {t('tradeGold.byGrams')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('kwd')}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-bold ${
                      inputMode === 'kwd'
                        ? 'bg-black text-yellow-300 border-black'
                        : 'border-black/15 bg-lime-100/80 text-black hover:bg-lime-200'
                    }`}
                  >
                    {t('tradeGold.byKwd')}
                  </button>
                </div>
              </div>
            </div>

            {inputMode === 'grams' ? (
              <div>
                <label className="text-sm font-semibold text-black block mb-1">{t('tradeGold.grams')}</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={gramsInput}
                  onChange={(e) => setGramsInput(e.target.value)}
                  placeholder={t('tradeGold.gramsPlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border-2 border-black/15 bg-white text-black placeholder:text-stone-500"
                />
              </div>
            ) : (
              <div>
                <label className="text-sm font-semibold text-black block mb-1">
                  {side === 'buy' ? t('tradeGold.kwdLabelBuy') : t('tradeGold.kwdLabelSell')}
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={kwdInput}
                  onChange={(e) => setKwdInput(e.target.value)}
                  placeholder={t('tradeGold.kwdPlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border-2 border-black/15 bg-white text-black placeholder:text-stone-500"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!hasFreshQuote || executeMutation.isPending || buyExceedsAdminCap}
                onClick={openConfirmModal}
                className="gold-button px-4 py-2 rounded-lg font-semibold border-2 border-black/10 disabled:opacity-50"
              >
                {executeMutation.isPending
                  ? t('tradeGold.processing')
                  : side === 'buy'
                    ? t('tradeGold.buyNow')
                    : t('tradeGold.sellNow')}
              </button>
            </div>

            {quoteMutation.isPending && canQuote && (
              <div className="text-sm font-medium text-stone-700">{t('tradeGold.quoting')}</div>
            )}

            {quote && hasFreshQuote && (
              <div className="rounded-xl border-2 border-black/10 bg-lime-100/90 p-4 text-sm shadow-inner">
                <div className="flex justify-between py-1">
                  <span className="text-black/70 font-medium">{rateLabel}</span>
                  <span className="text-black font-bold">{quote.price_per_gram.toFixed(3)} KWD/g</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-black/70 font-medium">{t('tradeGold.grams')}</span>
                  <span className="text-black font-bold">{quote.grams.toFixed(3)} g</span>
                </div>
                {quote.base_kwd_amount != null && (
                  <div className="flex justify-between py-1">
                    <span className="text-black/70 font-medium">{side === 'buy' ? t('tradeGold.baseBuy') : t('tradeGold.baseSell')}</span>
                    <span className="text-black font-bold">{quote.base_kwd_amount.toFixed(3)} KWD</span>
                  </div>
                )}
                {quote.fee_kwd != null && (
                  <div className="flex justify-between py-1">
                    <span className="text-black/70 font-medium">{t('tradeGold.fee')}</span>
                    <span className="text-black font-bold">{quote.fee_kwd.toFixed(3)} KWD</span>
                  </div>
                )}
                <div className="flex justify-between py-1">
                  <span className="text-black/70 font-medium">{side === 'buy' ? t('tradeGold.total') : t('tradeGold.net')}</span>
                  <span className="text-black font-bold">{quote.kwd_amount.toFixed(3)} KWD</span>
                </div>
                {quote.max_grams_by_wallet != null && side === 'buy' && (
                  <div className="flex justify-between py-1">
                    <span className="text-black/70 font-medium">{t('tradeGold.maxBuyByWallet')}</span>
                    <span className="text-black font-bold">{quote.max_grams_by_wallet.toFixed(3)} g</span>
                  </div>
                )}
                {quote.max_grams_by_admin != null && side === 'buy' && (
                  <div className="flex justify-between py-1">
                    <span className="text-black/70 font-medium">{t('tradeGold.maxBuyByAdminPool')}</span>
                    <span className="text-black font-bold">{quote.max_grams_by_admin.toFixed(3)} g</span>
                  </div>
                )}
                {side === 'buy' && typeof quote.max_grams_for_buy === 'number' && (
                  <div className="flex justify-between py-1">
                    <span className="text-black/70 font-medium">{t('tradeGold.maxBuyAllowed')}</span>
                    <span className="text-black font-bold">{quote.max_grams_for_buy.toFixed(3)} g</span>
                  </div>
                )}
                {buyExceedsAdminCap && (
                  <p className="text-xs font-bold text-red-700 mt-2">{t('tradeGold.buyExceedsAdminCap')}</p>
                )}
                {quote.grams_available != null && side === 'sell' && (
                  <div className="flex justify-between py-1">
                    <span className="text-black/70 font-medium">{t('tradeGold.availableToSell')}</span>
                    <span className="text-black font-bold">{quote.grams_available.toFixed(3)} g</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="gold-card p-6 space-y-4">
            <h3 className="text-lg font-bold text-black">{t('tradeGold.walletPosition')}</h3>
            <div className="rounded-lg bg-lime-100/90 border-2 border-black/10 p-3">
              <p className="text-xs font-semibold text-black/70">{t('tradeGold.walletBalance')}</p>
              <p className="text-xl font-bold text-black">{walletBalance.toFixed(3)} KWD</p>
            </div>

            <div className="rounded-lg border-2 border-black/10 bg-yellow-300/90 p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white border border-black/15 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4 text-black" aria-hidden />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-black">{t('tradeGold.knetDeposit.title')}</h4>
                  <p className="text-xs text-black/80 font-medium leading-snug">{t('tradeGold.knetDeposit.subtitle')}</p>
                </div>
              </div>
              <p className="text-xs text-black/75 leading-relaxed font-medium">{t('tradeGold.knetDeposit.note')}</p>
              <div className="flex flex-wrap gap-1.5">
                {knetPresets.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setDepositAmount(String(v))}
                    className="px-2.5 py-1 rounded-md text-xs font-bold border-2 border-black/20 bg-white text-black hover:bg-lime-100 transition-colors"
                  >
                    {v} KWD
                  </button>
                ))}
              </div>
              <label className="block">
                <span className="text-xs font-semibold text-black mb-1 block">{t('tradeGold.knetDeposit.amountLabel')}</span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.001"
                  min="0"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder={t('tradeGold.knetDeposit.amountPlaceholder')}
                  className="w-full px-3 py-2 rounded-lg border-2 border-black/15 bg-white text-black text-sm placeholder:text-stone-500"
                />
              </label>
              <button
                type="button"
                onClick={submitKnetDeposit}
                disabled={depositMutation.isPending}
                className="w-full px-3 py-2.5 rounded-lg text-sm font-bold bg-black text-yellow-300 hover:bg-zinc-900 border-2 border-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {depositMutation.isPending ? t('tradeGold.processing') : t('tradeGold.knetDeposit.cta')}
              </button>
            </div>

            <div className="rounded-lg bg-lime-100/90 border-2 border-black/10 p-3">
              <p className="text-xs font-semibold text-black/70">{t('tradeGold.caratAvailable', { carat: caratValue })}</p>
              <p className="text-xl font-bold text-black">{Number(currentPosition?.grams_available ?? 0).toFixed(3)} g</p>
              <p className="text-xs text-black/70 mt-1 font-medium">
                {t('tradeGold.avgBuy', {
                  price: Number(currentPosition?.avg_buy_price_per_gram ?? 0).toFixed(3),
                })}
              </p>
              {currentPosition?.unrealized_pl_kwd != null && Number.isFinite(currentPosition.unrealized_pl_kwd) && (
                <p
                  className={`text-sm mt-2 font-bold ${
                    (currentPosition.unrealized_pl_kwd ?? 0) >= 0 ? 'text-emerald-800' : 'text-red-700'
                  }`}
                >
                  {t('tradeGold.unrealizedPL', { amount: currentPosition.unrealized_pl_kwd.toFixed(3) })}
                </p>
              )}
            </div>
          </div>
        </div>

        <AutoTradeRulesSection />

        <div className="gold-card p-6">
          <h3 className="text-lg font-bold text-black mb-4">{t('tradeGold.recentTrades')}</h3>
          {trades.length === 0 ? (
            <p className="text-stone-700 text-sm font-medium">{t('tradeGold.noTrades')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-start text-black/70 font-bold border-b-2 border-black/10">
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
                    <tr key={trade.id} className="border-b border-black/10">
                      <td className="py-2 pe-3 text-black font-medium">
                        {new Date(trade.created_at).toLocaleString(dateLocale)}
                      </td>
                      <td className="py-2 pe-3 text-black font-medium">
                        {trade.side === 'buy'
                          ? t('tradeGold.sideBuy')
                          : trade.side === 'sell'
                            ? t('tradeGold.sideSell')
                            : (trade.side_display ?? trade.side)}
                      </td>
                      <td className="py-2 pe-3 text-black font-medium">{trade.carat_value}K</td>
                      <td className="py-2 pe-3 text-black font-medium">{Number(trade.grams).toFixed(3)} g</td>
                      <td className="py-2 pe-3 text-black font-medium">{Number(trade.price_per_gram).toFixed(3)} KWD/g</td>
                      <td className="py-2 pe-3 text-black font-medium">
                        {trade.fee_kwd != null ? Number(trade.fee_kwd).toFixed(3) : '—'}
                      </td>
                      <td className="py-2 text-black font-medium">{Number(trade.total_kwd).toFixed(3)} KWD</td>
                      <td
                        className={`py-2 font-semibold ${
                          trade.side === 'sell' && trade.realized_pl_kwd != null
                            ? (Number(trade.realized_pl_kwd) >= 0 ? 'text-emerald-800' : 'text-red-700')
                            : 'text-black/40'
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl border-2 border-black/15 bg-white p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-black">
              {confirmSide === 'buy' ? t('tradeGold.confirmBuy') : t('tradeGold.confirmSell')}
            </h3>
            <p className="mt-1 text-sm text-stone-700 font-medium">{t('tradeGold.confirmReview')}</p>

            <div className="mt-4 space-y-2 rounded-xl border-2 border-black/10 bg-lime-50 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-black/70 font-medium">{t('tradeGold.carat')}</span>
                <span className="text-black font-bold">{confirmQuote.carat_display}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70 font-medium">{confirmRateLabel}</span>
                <span className="text-black font-bold">{confirmQuote.price_per_gram.toFixed(3)} KWD/g</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black/70 font-medium">{t('tradeGold.grams')}</span>
                <span className="text-black font-bold">{confirmQuote.grams.toFixed(3)} g</span>
              </div>
              {confirmQuote.base_kwd_amount != null && (
                <div className="flex justify-between">
                  <span className="text-black/70 font-medium">{confirmSide === 'buy' ? t('tradeGold.baseBuy') : t('tradeGold.baseSell')}</span>
                  <span className="text-black font-bold">{confirmQuote.base_kwd_amount.toFixed(3)} KWD</span>
                </div>
              )}
              {confirmQuote.fee_kwd != null && (
                <div className="flex justify-between">
                  <span className="text-black/70 font-medium">{t('tradeGold.fee')}</span>
                  <span className="text-black font-bold">{confirmQuote.fee_kwd.toFixed(3)} KWD</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span className="text-black">{confirmSide === 'buy' ? t('tradeGold.totalDebit') : t('tradeGold.netCredit')}</span>
                <span className="text-black">{confirmQuote.kwd_amount.toFixed(3)} KWD</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={executeMutation.isPending}
                className="px-4 py-2 rounded-lg border-2 border-black/20 text-black font-semibold hover:bg-lime-100 disabled:opacity-50"
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
                className="gold-button px-4 py-2 rounded-lg font-semibold border-2 border-black/10 disabled:opacity-50"
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

