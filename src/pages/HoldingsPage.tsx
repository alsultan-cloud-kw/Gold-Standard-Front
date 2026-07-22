import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  ArrowLeft,
  ArrowRight,
  Coins,
  Gauge,
  Layers,
  Lock,
  Minus,
  Plus,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Vault,
  Zap,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
import { useHoldingsPortfolio, type HoldingsQuote } from '@/hooks/useHoldingsPortfolio'
import { goldTradingApi } from '@/services/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  caratGramTotals,
  getDefaultPreviewCarat,
  numOrNull,
} from '@/utils/publicStorefrontRates'
import { cn } from '@/lib/utils'
import { formatLatinNumber } from '@/utils/formatLatinNumber'
import { usePageEnter } from '@/motion/usePageEnter'

const MIN_GRAMS = 5
const MAX_GRAMS = 1000
const GRAM_PRESETS = [5, 10, 25, 50, 100, 250, 500, 1000] as const
const TARGET_OFFSETS = [-0.5, -0.25, -0.1, -0.05, -0.01, 0.01, 0.05, 0.1] as const
const TARGET_FINE_STEP = 0.001
const CARAT_24 = 24

type ActionMode = 'buy' | 'sell'
type BuyMode = 'instant' | 'target'

function formatKwd(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return formatLatinNumber(value, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })
}

function formatGrams(value: number): string {
  return formatLatinNumber(value, {
    maximumFractionDigits: 3,
  })
}

function parseGramsText(text: string): number | null {
  const cleaned = text.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { detail?: unknown } } }
  const d = e?.response?.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map(String).join(', ')
  return fallback
}

export default function HoldingsPage() {
  const { t, i18n } = useTranslation()
  const { isAuthenticated } = useAuth()
  const queryClient = useQueryClient()
  const rootRef = usePageEnter()
  const isRtl = i18n.dir() === 'rtl'

  const { data: rates, isLoading: ratesLoading } = useEnrichedPublicRates(20_000)
  const portfolio = useHoldingsPortfolio(isAuthenticated)

  const [grams, setGrams] = useState(25)
  const [gramsText, setGramsText] = useState('25')
  const [targetPrice, setTargetPrice] = useState('')
  const [actionMode, setActionMode] = useState<ActionMode>('buy')
  const [buyMode, setBuyMode] = useState<BuyMode>('instant')
  const [comingSoonModal, setComingSoonModal] = useState<BuyMode | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmQuote, setConfirmQuote] = useState<HoldingsQuote | null>(null)

  const carat24 = useMemo(() => getDefaultPreviewCarat(rates), [rates])
  const buyPerGram = numOrNull(carat24?.buyTotal)
  const sellPerGram = numOrNull(carat24?.sellTotal)

  const parsedGrams = parseGramsText(gramsText)
  const gramsTooLow = parsedGrams != null && parsedGrams < MIN_GRAMS
  const gramsTooHigh = parsedGrams != null && parsedGrams > MAX_GRAMS
  const gramsValid =
    parsedGrams != null && parsedGrams >= MIN_GRAMS && parsedGrams <= MAX_GRAMS
  const effectiveGrams = gramsValid ? parsedGrams : grams

  const availableToSell = portfolio.stats.gramsHeld
  const sellGramsTooHigh = actionMode === 'sell' && gramsValid && effectiveGrams > availableToSell + 1e-9
  const sellBlocked = actionMode === 'sell' && availableToSell <= 0
  const canSellAmount = actionMode === 'sell' && gramsValid && !sellGramsTooHigh && availableToSell > 0

  const totals = useMemo(
    () => caratGramTotals(carat24, effectiveGrams),
    [carat24, effectiveGrams],
  )

  const targetNum = numOrNull(targetPrice)
  const targetValid =
    gramsValid &&
    targetNum != null &&
    buyPerGram != null &&
    targetNum > 0 &&
    targetNum < buyPerGram

  const quoteMutation = useMutation({
    mutationFn: async (mode: ActionMode) => {
      const payload = { carat_value: CARAT_24, grams: effectiveGrams }
      return mode === 'buy'
        ? (goldTradingApi.quoteBuy(payload) as Promise<HoldingsQuote>)
        : (goldTradingApi.quoteSell(payload) as Promise<HoldingsQuote>)
    },
    onSuccess: (quote) => {
      setConfirmQuote(quote)
      setConfirmOpen(true)
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, t('holdingsPage.errors.quoteFailed')))
    },
  })

  const executeMutation = useMutation({
    mutationFn: async (mode: ActionMode) => {
      const payload = { carat_value: CARAT_24, grams: effectiveGrams }
      return mode === 'buy'
        ? goldTradingApi.buy(payload)
        : goldTradingApi.sell(payload)
    },
    onSuccess: (_data, mode) => {
      toast.success(
        mode === 'buy' ? t('holdingsPage.toasts.buySuccess') : t('holdingsPage.toasts.sellSuccess'),
      )
      setConfirmOpen(false)
      setConfirmQuote(null)
      void queryClient.invalidateQueries({ queryKey: ['holdings'] })
      void queryClient.invalidateQueries({ queryKey: ['myWallet'] })
      void queryClient.invalidateQueries({ queryKey: ['goldPositions'] })
      void queryClient.invalidateQueries({ queryKey: ['goldTrades'] })
      portfolio.refetch()
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, t('holdingsPage.errors.executeFailed')))
    },
  })

  const setGramsValue = (value: number) => {
    setGrams(value)
    setGramsText(String(value))
  }

  const openComingSoonModal = (mode: BuyMode) => {
    setComingSoonModal(mode)
  }

  const onGramInput = (raw: string) => {
    const cleaned = raw.replace(/[^\d.]/g, '')
    setGramsText(cleaned)
    const n = parseGramsText(cleaned)
    if (n != null && n >= MIN_GRAMS && n <= MAX_GRAMS) {
      setGrams(n)
    }
  }

  const onGramBlur = () => {
    const n = parseGramsText(gramsText)
    if (n == null) {
      setGramsValue(grams)
      return
    }
    const cap =
      actionMode === 'sell' && availableToSell > 0
        ? Math.min(MAX_GRAMS, availableToSell)
        : MAX_GRAMS
    setGramsValue(Math.min(cap, Math.max(MIN_GRAMS, n)))
  }

  const formatTargetInput = (value: number) => Math.max(0, value).toFixed(3)

  const setTargetFromLive = (offset = 0) => {
    if (buyPerGram == null) return
    setTargetPrice(formatTargetInput(buyPerGram + offset))
  }

  const nudgeTarget = (delta: number) => {
    const base = targetNum ?? buyPerGram ?? 0
    setTargetPrice(formatTargetInput(base + delta))
  }

  const selectTargetMode = () => {
    setBuyMode('target')
    if (!targetPrice && buyPerGram != null) {
      setTargetPrice(formatTargetInput(buyPerGram - 0.05))
    }
  }

  const switchActionMode = (mode: ActionMode) => {
    setActionMode(mode)
    if (mode === 'sell' && availableToSell > 0) {
      const capped = Math.min(Math.max(MIN_GRAMS, effectiveGrams), availableToSell)
      setGramsValue(capped)
    }
  }

  const requestQuote = () => {
    if (!isAuthenticated) {
      toast.error(t('holdingsPage.errors.loginRequired'))
      return
    }
    if (actionMode === 'buy' && buyMode === 'target') {
      openComingSoonModal('target')
      return
    }
    if (!gramsValid) {
      toast.error(t('holdingsPage.errors.invalidGrams'))
      return
    }
    if (actionMode === 'sell' && !canSellAmount) {
      toast.error(
        sellBlocked
          ? t('holdingsPage.errors.noHoldingsToSell')
          : t('holdingsPage.errors.exceedsAvailable'),
      )
      return
    }
    quoteMutation.mutate(actionMode)
  }

  const sliderMax =
    actionMode === 'sell' && availableToSell > 0
      ? Math.max(MIN_GRAMS, Math.min(MAX_GRAMS, availableToSell))
      : MAX_GRAMS
  const sliderPct =
    ((Math.min(effectiveGrams, sliderMax) - MIN_GRAMS) / (sliderMax - MIN_GRAMS)) * 100
  const gramsInputInvalid = gramsText !== '' && (!gramsValid || sellGramsTooHigh)
  const instantActive = buyMode === 'instant'
  const targetActive = buyMode === 'target'

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--site-bg)] py-16" ref={rootRef}>
        <div className="page-shell max-w-lg py-16 text-center">
          <h1 className="store-display-title text-[#0B0F19]">{t('holdingsPage.title')}</h1>
          <p className="mt-3 text-sm text-[#64748B]">{t('holdingsPage.errors.loginRequired')}</p>
          <Link to="/login" className="mt-6 inline-flex rounded-xl bg-[#85E307] px-6 py-3 text-sm font-bold text-[#0B0F19]">
            {t('nav.login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--site-bg)]" dir={isRtl ? 'rtl' : 'ltr'} ref={rootRef}>
      <section className="relative overflow-hidden border-b border-black/5 bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(133,227,7,0.12),transparent_55%)]" />
        <div className="relative page-shell page-section--roomy">
          <Link
            to="/dashboard?tab=holdings"
            className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-[#64748B] hover:text-[#0B0F19]"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('holdingsPage.backToDashboard')}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/80 bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-800">
              <Sparkles className="h-3 w-3" aria-hidden />
              {t('holdingsPage.badge')}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#3F6F00]/15 bg-[#ECFCCB]/80 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#3F6F00]">
              <Vault className="h-3 w-3" aria-hidden />
              {t('holdingsPage.badgeVault')}
            </span>
          </div>

          <h1 className="store-display-title mt-5 max-w-3xl text-[#0B0F19]">
            {t('holdingsPage.title')}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#64748B] sm:text-lg">
            {t('holdingsPage.subtitle')}
          </p>
        </div>
      </section>

      <div className="page-shell py-8 sm:py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
              <div className="border-b border-black/5 bg-[#F9F9FA] px-5 py-4 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307]">
                      <Coins className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-[#0B0F19]">
                        {t('holdingsPage.plannerTitle')}
                      </h2>
                      <p className="text-xs text-[#64748B]">{t('holdingsPage.plannerHint')}</p>
                    </div>
                  </div>
                  <div className="dashboard-segment">
                    {(['buy', 'sell'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => switchActionMode(mode)}
                        disabled={mode === 'sell' && sellBlocked}
                        className={cn(
                          'dashboard-segment__btn',
                          actionMode === mode && 'dashboard-segment__btn--active',
                        )}
                      >
                        {mode === 'buy'
                          ? t('holdingsPage.actionBuy')
                          : t('holdingsPage.actionSell')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-black/8 bg-[#F9F9FA] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                      {actionMode === 'buy'
                        ? t('holdingsPage.liveBuy')
                        : t('holdingsPage.liveSell')}
                    </p>
                    <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#0B0F19]">
                      {ratesLoading
                        ? '…'
                        : formatKwd(actionMode === 'buy' ? buyPerGram : sellPerGram)}
                      <span className="ms-1 text-sm font-medium text-[#64748B]">
                        {t('holdingsPage.perGram')}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-[#94A3B8]">24K · {t('holdingsPage.liveNote')}</p>
                  </div>
                  <div className="rounded-xl border border-black/8 bg-[#F9F9FA] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                      {actionMode === 'buy'
                        ? t('holdingsPage.estimatedTotal')
                        : t('holdingsPage.estimatedProceeds')}
                    </p>
                    <p className="mt-2 font-mono text-2xl font-bold tabular-nums text-[#0B0F19]">
                      {formatKwd(
                        actionMode === 'buy' ? totals?.buyTotal ?? null : totals?.sellTotal ?? null,
                      )}
                      <span className="ms-1 text-sm font-medium text-[#64748B]">KWD</span>
                    </p>
                    <p className="mt-1 text-[11px] text-[#94A3B8]">
                      {formatGrams(effectiveGrams)} {t('holdingsPage.gramsUnit')}
                    </p>
                  </div>
                </div>

                <label className="mb-2 block text-sm font-semibold text-[#0B0F19]">
                  {actionMode === 'buy'
                    ? t('holdingsPage.gramsLabel')
                    : t('holdingsPage.sellGramsLabel')}
                </label>

                {actionMode === 'sell' ? (
                  <p className="mb-3 text-xs text-[#64748B]">
                    {t('holdingsPage.availableToSell', {
                      grams: formatGrams(availableToSell),
                    })}
                  </p>
                ) : null}

                <div className="mb-4 flex items-center gap-3">
                  <button
                    type="button"
                    aria-label={t('holdingsPage.decreaseGrams')}
                    onClick={() => setGramsValue(Math.max(MIN_GRAMS, effectiveGrams - 1))}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-[#0B0F19] transition hover:bg-[#F9F9FA]"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={gramsText}
                    onChange={(e) => onGramInput(e.target.value)}
                    onBlur={onGramBlur}
                    aria-invalid={gramsInputInvalid}
                    className={cn(
                      'h-11 flex-1 rounded-xl border bg-white px-4 text-center font-mono text-lg font-bold tabular-nums outline-none transition',
                      gramsInputInvalid
                        ? 'border-red-300 focus:border-red-400'
                        : 'border-black/10 focus:border-[#85E307]',
                    )}
                  />
                  <button
                    type="button"
                    aria-label={t('holdingsPage.increaseGrams')}
                    onClick={() =>
                      setGramsValue(Math.min(sliderMax, effectiveGrams + 1))
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white text-[#0B0F19] transition hover:bg-[#F9F9FA]"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                <input
                  type="range"
                  min={MIN_GRAMS}
                  max={sliderMax}
                  step={1}
                  value={Math.min(effectiveGrams, sliderMax)}
                  onChange={(e) => setGramsValue(Number(e.target.value))}
                  className="mb-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E2E8F0] accent-[#85E307]"
                  style={{
                    background: `linear-gradient(to right, #85E307 0%, #85E307 ${sliderPct}%, #E2E8F0 ${sliderPct}%, #E2E8F0 100%)`,
                  }}
                />

                {gramsTooLow ? (
                  <p className="text-xs text-red-600">{t('holdingsPage.gramsTooLow', { min: MIN_GRAMS })}</p>
                ) : gramsTooHigh ? (
                  <p className="text-xs text-red-600">{t('holdingsPage.gramsTooHigh', { max: MAX_GRAMS })}</p>
                ) : sellGramsTooHigh ? (
                  <p className="text-xs text-red-600">{t('holdingsPage.errors.exceedsAvailable')}</p>
                ) : (
                  <p className="text-xs text-[#64748B]">
                    {t('holdingsPage.gramsRange', { min: MIN_GRAMS, max: sliderMax })}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {GRAM_PRESETS.filter((p) => p <= sliderMax).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGramsValue(preset)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                        effectiveGrams === preset && gramsValid && !sellGramsTooHigh
                          ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
                          : 'border-black/10 text-[#64748B] hover:border-black/20',
                      )}
                    >
                      {formatGrams(preset)}g
                    </button>
                  ))}
                  {actionMode === 'sell' && availableToSell >= MIN_GRAMS ? (
                    <button
                      type="button"
                      onClick={() => setGramsValue(availableToSell)}
                      className="rounded-lg border border-[#85E307]/40 bg-[#ECFCCB]/60 px-3 py-1.5 text-xs font-bold text-[#3F6F00]"
                    >
                      {t('holdingsPage.sellAll')}
                    </button>
                  ) : null}
                </div>

                {actionMode === 'buy' ? (
                  <>
                    <div className="mt-8 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setBuyMode('instant')}
                        className={cn(
                          'group flex flex-col items-start gap-2 rounded-2xl p-5 text-start transition',
                          instantActive
                            ? 'bg-[#85E307] shadow-sm hover:bg-[#9AF01A]'
                            : 'border border-black/10 bg-white hover:border-black/20',
                        )}
                      >
                        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', instantActive ? 'bg-[#0B0F19]/10' : 'bg-[#F9F9FA] border border-black/8')}>
                          <Zap className={cn('h-4 w-4', instantActive ? 'text-[#0B0F19]' : 'text-[#64748B]')} />
                        </span>
                        <span className="text-base font-bold text-[#0B0F19]">{t('holdingsPage.instantBuy')}</span>
                        <span className={cn('text-xs leading-relaxed', instantActive ? 'text-[#0B0F19]/70' : 'text-[#64748B]')}>
                          {t('holdingsPage.instantBuyHint')}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={selectTargetMode}
                        className={cn(
                          'group flex flex-col items-start gap-2 rounded-2xl p-5 text-start transition',
                          targetActive
                            ? 'bg-[#85E307] shadow-sm hover:bg-[#9AF01A]'
                            : 'border border-black/10 bg-white hover:border-black/20',
                        )}
                      >
                        <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', targetActive ? 'bg-[#0B0F19]/10' : 'bg-[#0B0F19] text-[#85E307]')}>
                          <Target className={cn('h-4 w-4', targetActive ? 'text-[#0B0F19]' : 'text-[#85E307]')} />
                        </span>
                        <span className="text-base font-bold text-[#0B0F19]">{t('holdingsPage.targetBuy')}</span>
                        <span className={cn('text-xs leading-relaxed', targetActive ? 'text-[#0B0F19]/70' : 'text-[#64748B]')}>
                          {t('holdingsPage.targetBuyHint')}
                        </span>
                      </button>
                    </div>

                    {targetActive ? (
                      <div className="mt-4 rounded-xl border border-[#85E307]/30 bg-[#ECFCCB]/25 p-4">
                        <label className="mb-1.5 block text-sm font-semibold text-[#0B0F19]">
                          {t('holdingsPage.targetPriceLabel')}
                        </label>
                        {buyPerGram != null ? (
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <button type="button" onClick={() => setTargetFromLive(0)} className="rounded-lg border border-[#85E307]/40 bg-white px-3 py-1.5 text-xs font-bold text-[#3F6F00]">
                              {t('holdingsPage.useLivePrice')}
                            </button>
                            <span className="text-[11px] text-[#64748B]">
                              {t('holdingsPage.livePriceRef', { price: formatKwd(buyPerGram) })}
                            </span>
                          </div>
                        ) : null}
                        <div className="flex flex-wrap gap-2">
                          {TARGET_OFFSETS.map((offset) => (
                            <button key={offset} type="button" onClick={() => setTargetFromLive(offset)} className="rounded-lg border border-black/10 px-2.5 py-1 text-[11px] font-semibold text-[#64748B] hover:border-black/20">
                              {offset > 0 ? '+' : ''}{offset.toFixed(2)}
                            </button>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                          <button type="button" onClick={() => nudgeTarget(-TARGET_FINE_STEP)} aria-label={t('holdingsPage.decreasePrice')} className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/10">
                            <Minus className="h-4 w-4" />
                          </button>
                          <input value={targetPrice} onChange={(e) => setTargetPrice(e.target.value.replace(/[^\d.]/g, ''))} className="h-10 flex-1 rounded-lg border border-black/10 px-3 font-mono text-sm font-bold" aria-label={t('holdingsPage.targetInputLabel')} />
                          <button type="button" onClick={() => nudgeTarget(TARGET_FINE_STEP)} aria-label={t('holdingsPage.increasePrice')} className="flex h-10 w-10 items-center justify-center rounded-lg border border-black/10">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        {!targetValid && targetPrice ? (
                          <p className="mt-2 text-xs text-amber-700">{t('holdingsPage.targetTooHigh')}</p>
                        ) : (
                          <p className="mt-2 text-xs text-[#64748B]">{t('holdingsPage.targetExplain')}</p>
                        )}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="mt-6 rounded-xl border border-black/8 bg-[#F9F9FA] p-4">
                    <p className="text-sm text-[#0B0F19]/80">{t('holdingsPage.sellPanelHint')}</p>
                    {portfolio.stats.unrealizedPl !== 0 ? (
                      <p className={cn('mt-2 text-sm font-semibold tabular-nums', portfolio.stats.unrealizedPl >= 0 ? 'text-emerald-700' : 'text-red-700')}>
                        {t('holdingsPage.unrealizedPl')}: {formatKwd(portfolio.stats.unrealizedPl)} KWD
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#85E307]/30 bg-[#ECFCCB]/25 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-[#0B0F19]/80">
                    {actionMode === 'buy'
                      ? buyMode === 'instant'
                        ? t('holdingsPage.instantPanelHint')
                        : t('holdingsPage.targetExplain')
                      : t('holdingsPage.sellConfirmHint')}
                  </p>
                  <button
                    type="button"
                    disabled={
                      !gramsValid ||
                      sellGramsTooHigh ||
                      (actionMode === 'sell' && sellBlocked) ||
                      quoteMutation.isPending
                    }
                    onClick={requestQuote}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-5 py-3 text-sm font-bold text-[#85E307] transition enabled:hover:bg-[#1a2233] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {quoteMutation.isPending
                      ? t('holdingsPage.preparingQuote')
                      : actionMode === 'buy'
                        ? buyMode === 'instant'
                          ? t('holdingsPage.instantCta')
                          : t('holdingsPage.setTargetCta')
                        : t('holdingsPage.sellCta')}
                    <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {(
                [
                  { id: 'secure', icon: Lock },
                  { id: 'live', icon: TrendingUp },
                  { id: 'clear', icon: Gauge },
                ] as const
              ).map(({ id, icon: Icon }) => (
                <div key={id} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
                  <Icon className="mb-2 h-5 w-5 text-[#3F6F00]" strokeWidth={1.75} />
                  <p className="text-sm font-semibold text-[#0B0F19]">{t(`holdingsPage.pillars.${id}.title`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#64748B]">{t(`holdingsPage.pillars.${id}.body`)}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-[calc(var(--nav-offset,5rem)+1rem)]">
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#0B0F19] text-white shadow-lg">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#85E307]/15 text-[#85E307]">
                    <Layers className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#85E307]/90">
                      {t('holdingsPage.walletKicker')}
                    </p>
                    <h3 className="text-base font-bold tracking-tight text-white">
                      {t('holdingsPage.walletTitle')}
                    </h3>
                  </div>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-white/65">
                  {t('holdingsPage.walletSubtitleLive')}
                </p>
              </div>
              <div className="px-5 py-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {t('holdingsPage.currentHoldings')}
                </p>
                <p className="mt-2 font-mono text-4xl font-bold tabular-nums tracking-tight">
                  {portfolio.isLoading ? '…' : formatGrams(portfolio.stats.gramsHeld)}
                  <span className="text-lg text-white/50"> g</span>
                </p>
                <p className="mt-1 text-xs text-white/50">24K · {t('holdingsPage.pureGold')}</p>

                <div className="mt-6 space-y-3 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-white/60">{t('holdingsPage.walletBalanceLabel')}</span>
                    <span className="font-mono font-bold tabular-nums">{formatKwd(portfolio.walletBalance)} KWD</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-white/60">{t('holdingsPage.costBasis')}</span>
                    <span className="font-mono font-bold tabular-nums">{formatKwd(portfolio.stats.costBasis)} KWD</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 text-white/60">
                      {portfolio.stats.unrealizedPl >= 0 ? (
                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                      )}
                      {t('holdingsPage.unrealizedPl')}
                    </span>
                    <span className={cn('font-mono font-bold tabular-nums', portfolio.stats.unrealizedPl >= 0 ? 'text-emerald-300' : 'text-red-300')}>
                      {formatKwd(portfolio.stats.unrealizedPl)} KWD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {sellPerGram != null ? (
              <p className="text-center text-[11px] text-[#94A3B8]">
                {t('holdingsPage.sellReference', { price: formatKwd(sellPerGram) })}
              </p>
            ) : null}
          </aside>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmQuote?.side === 'sell'
                ? t('holdingsPage.confirmSellTitle')
                : t('holdingsPage.confirmBuyTitle')}
            </DialogTitle>
            <DialogDescription>{t('holdingsPage.confirmHint')}</DialogDescription>
          </DialogHeader>
          {confirmQuote ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-[#64748B]">{t('holdingsPage.confirmGrams')}</span>
                <span className="font-mono font-semibold">{formatGrams(confirmQuote.grams)} g</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#64748B]">{t('holdingsPage.confirmRate')}</span>
                <span className="font-mono font-semibold">{formatKwd(confirmQuote.price_per_gram)} KWD/g</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#64748B]">{t('holdingsPage.confirmTotal')}</span>
                <span className="font-mono font-bold">{formatKwd(confirmQuote.kwd_amount)} KWD</span>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-0">
            <button type="button" className="dashboard-secondary-btn" onClick={() => setConfirmOpen(false)}>
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="dashboard-primary-btn"
              disabled={executeMutation.isPending}
              onClick={() => executeMutation.mutate(actionMode)}
            >
              {executeMutation.isPending ? t('holdingsPage.executing') : t('holdingsPage.confirmAction')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={comingSoonModal != null} onOpenChange={() => setComingSoonModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {comingSoonModal != null ? t(`holdingsPage.toasts.${comingSoonModal}`) : ''}
            </DialogTitle>
            <DialogDescription>{t('holdingsPage.toasts.description')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" className="dashboard-primary-btn" onClick={() => setComingSoonModal(null)}>
              {t('holdingsPage.comingSoonModal.confirm')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
