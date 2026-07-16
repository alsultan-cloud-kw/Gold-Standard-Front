import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Coins,
  Gauge,
  Layers,
  Lock,
  Minus,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
  Vault,
  Zap,
} from 'lucide-react'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
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

const MIN_GRAMS = 5
const MAX_GRAMS = 1000
const GRAM_PRESETS = [5, 10, 25, 50, 100, 250, 500, 1000] as const
const TARGET_OFFSETS = [-0.5, -0.25, -0.1, -0.05, -0.01, 0.01, 0.05, 0.1] as const
const TARGET_FINE_STEP = 0.001

type BuyMode = 'instant' | 'target'

function formatKwd(value: number | null, locale: string): string {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat(locale.startsWith('ar') ? 'ar-KW' : 'en-KW', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value)
}

function formatGrams(value: number, locale: string): string {
  return new Intl.NumberFormat(locale.startsWith('ar') ? 'ar' : 'en', {
    maximumFractionDigits: 1,
  }).format(value)
}

function parseGramsText(text: string): number | null {
  const cleaned = text.replace(/[^\d.]/g, '')
  if (!cleaned) return null
  const n = Number(cleaned)
  return Number.isFinite(n) ? n : null
}

export default function HoldingsPage() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const { data: rates, isLoading: ratesLoading } = useEnrichedPublicRates(20_000)

  const [grams, setGrams] = useState(25)
  const [gramsText, setGramsText] = useState('25')
  const [targetPrice, setTargetPrice] = useState('')
  const [buyMode, setBuyMode] = useState<BuyMode>('instant')
  const [comingSoonModal, setComingSoonModal] = useState<BuyMode | null>(null)

  const carat24 = useMemo(() => getDefaultPreviewCarat(rates), [rates])
  const buyPerGram = numOrNull(carat24?.buyTotal)
  const sellPerGram = numOrNull(carat24?.sellTotal)

  const parsedGrams = parseGramsText(gramsText)
  const gramsTooLow = parsedGrams != null && parsedGrams < MIN_GRAMS
  const gramsTooHigh = parsedGrams != null && parsedGrams > MAX_GRAMS
  const gramsValid =
    parsedGrams != null && parsedGrams >= MIN_GRAMS && parsedGrams <= MAX_GRAMS
  const effectiveGrams = gramsValid ? parsedGrams : grams

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
    setGramsValue(Math.min(MAX_GRAMS, Math.max(MIN_GRAMS, n)))
  }

  const formatTargetInput = (value: number) =>
    Math.max(0, value).toFixed(3)

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

  const sliderPct = ((effectiveGrams - MIN_GRAMS) / (MAX_GRAMS - MIN_GRAMS)) * 100
  const gramsInputInvalid = gramsText !== '' && !gramsValid
  const instantActive = buyMode === 'instant'
  const targetActive = buyMode === 'target'

  return (
    <div className="min-h-screen bg-[var(--site-bg)]" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="relative overflow-hidden border-b border-black/5 bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_100%_0%,rgba(133,227,7,0.12),transparent_55%)]" />
        <div className="relative page-shell page-section--roomy">
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
              </div>

              <div className="p-5 sm:p-6">
                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-black/8 bg-[#F9F9FA] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                      {t('holdingsPage.liveBuy')}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#0B0F19]">
                      {ratesLoading ? '…' : formatKwd(buyPerGram, i18n.language)}
                      <span className="ms-1 text-sm font-semibold text-[#64748B]">
                        {t('holdingsPage.perGram')}
                      </span>
                    </p>
                    <p className="mt-1 text-[11px] text-[#94A3B8]">24K · {t('holdingsPage.liveNote')}</p>
                  </div>
                  <div className="rounded-xl border border-black/8 bg-[#F9F9FA] p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#94A3B8]">
                      {t('holdingsPage.estimatedTotal')}
                    </p>
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#3F6F00]">
                      {ratesLoading ? '…' : formatKwd(totals.buyTotal, i18n.language)}
                      <span className="ms-1 text-sm font-semibold text-[#64748B]">KWD</span>
                    </p>
                    <p className="mt-1 text-[11px] text-[#94A3B8]">
                      {formatGrams(effectiveGrams, i18n.language)} {t('holdingsPage.gramsUnit')}
                    </p>
                  </div>
                </div>

                <label className="mb-2 block text-sm font-semibold text-[#0B0F19]">
                  {t('holdingsPage.gramsLabel')}
                </label>

                <div className="mb-3 flex items-center gap-3">
                  <input
                    type="range"
                    min={MIN_GRAMS}
                    max={MAX_GRAMS}
                    step={1}
                    value={effectiveGrams}
                    onChange={(e) => setGramsValue(Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-[#E8EBE3] accent-[#85E307]"
                    style={{
                      background: `linear-gradient(to right, #85E307 0%, #85E307 ${sliderPct}%, #E8EBE3 ${sliderPct}%, #E8EBE3 100%)`,
                    }}
                    aria-valuemin={MIN_GRAMS}
                    aria-valuemax={MAX_GRAMS}
                    aria-valuenow={effectiveGrams}
                  />
                  <div className="relative w-28 shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={gramsText}
                      onChange={(e) => onGramInput(e.target.value)}
                      onBlur={onGramBlur}
                      aria-invalid={gramsInputInvalid}
                      className={cn(
                        'w-full rounded-xl border bg-white px-3 py-2 text-end font-mono text-sm font-bold outline-none',
                        gramsInputInvalid
                          ? 'border-red-400 text-red-700 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                          : 'border-black/10 text-[#0B0F19] focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25',
                      )}
                      aria-label={t('holdingsPage.gramsLabel')}
                    />
                    <span className="pointer-events-none absolute start-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#94A3B8]">
                      g
                    </span>
                  </div>
                </div>

                {gramsTooLow ? (
                  <p className="mb-3 text-xs font-semibold text-red-600">
                    {t('holdingsPage.gramsTooLow', { min: MIN_GRAMS })}
                  </p>
                ) : gramsTooHigh ? (
                  <p className="mb-3 text-xs font-semibold text-red-600">
                    {t('holdingsPage.gramsTooHigh', { max: MAX_GRAMS })}
                  </p>
                ) : (
                  <p className="mb-3 text-xs text-[#94A3B8]">
                    {t('holdingsPage.gramsRange', { min: MIN_GRAMS, max: MAX_GRAMS })}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {GRAM_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGramsValue(preset)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                        effectiveGrams === preset && gramsValid
                          ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
                          : 'border-black/10 text-[#64748B] hover:border-black/20',
                      )}
                    >
                      {formatGrams(preset, i18n.language)}g
                    </button>
                  ))}
                </div>

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
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        instantActive ? 'bg-[#0B0F19]/10' : 'bg-[#F9F9FA] border border-black/8',
                      )}
                    >
                      <Zap
                        className={cn(
                          'h-4 w-4',
                          instantActive ? 'text-[#0B0F19]' : 'text-[#64748B]',
                        )}
                      />
                    </span>
                    <span className="text-base font-bold text-[#0B0F19]">
                      {t('holdingsPage.instantBuy')}
                    </span>
                    <span
                      className={cn(
                        'text-xs leading-relaxed',
                        instantActive ? 'text-[#0B0F19]/70' : 'text-[#64748B]',
                      )}
                    >
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
                    <span
                      className={cn(
                        'flex h-9 w-9 items-center justify-center rounded-lg',
                        targetActive ? 'bg-[#0B0F19]/10' : 'bg-[#0B0F19] text-[#85E307]',
                      )}
                    >
                      <Target
                        className={cn(
                          'h-4 w-4',
                          targetActive ? 'text-[#0B0F19]' : 'text-[#85E307]',
                        )}
                      />
                    </span>
                    <span className="text-base font-bold text-[#0B0F19]">
                      {t('holdingsPage.targetBuy')}
                    </span>
                    <span
                      className={cn(
                        'text-xs leading-relaxed',
                        targetActive ? 'text-[#0B0F19]/70' : 'text-[#64748B]',
                      )}
                    >
                      {t('holdingsPage.targetBuyHint')}
                    </span>
                  </button>
                </div>

                {instantActive ? (
                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-[#85E307]/30 bg-[#ECFCCB]/25 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-[#0B0F19]/80">{t('holdingsPage.instantPanelHint')}</p>
                    <button
                      type="button"
                      disabled={!gramsValid}
                      onClick={() => openComingSoonModal('instant')}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-5 py-3 text-sm font-bold text-[#85E307] transition enabled:hover:bg-[#1a2233] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {t('holdingsPage.instantCta')}
                      <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                    </button>
                  </div>
                ) : null}

                {targetActive ? (
                  <div className="mt-4 rounded-xl border border-[#85E307]/30 bg-[#ECFCCB]/25 p-4">
                    <label className="mb-1.5 block text-sm font-semibold text-[#0B0F19]">
                      {t('holdingsPage.targetPriceLabel')}
                    </label>

                    {buyPerGram != null ? (
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setTargetFromLive(0)}
                          className="rounded-lg border border-[#85E307]/40 bg-white px-3 py-1.5 text-xs font-bold text-[#3F6F00] transition hover:bg-[#ECFCCB]"
                        >
                          {t('holdingsPage.useLivePrice')}
                        </button>
                        <span className="text-[11px] text-[#64748B]">
                          {t('holdingsPage.livePriceRef', {
                            price: formatKwd(buyPerGram, i18n.language),
                          })}
                        </span>
                      </div>
                    ) : null}

                    <p className="mb-2 text-[11px] font-semibold text-[#64748B]">
                      {t('holdingsPage.adjustFromLive')}
                    </p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {TARGET_OFFSETS.map((offset) => (
                        <button
                          key={offset}
                          type="button"
                          disabled={buyPerGram == null}
                          onClick={() => setTargetFromLive(offset)}
                          className={cn(
                            'rounded-lg border px-2.5 py-1.5 font-mono text-xs font-bold tabular-nums transition disabled:cursor-not-allowed disabled:opacity-40',
                            offset < 0
                              ? 'border-[#3F6F00]/25 bg-white text-[#3F6F00] hover:bg-[#ECFCCB]'
                              : 'border-amber-300/60 bg-white text-amber-800 hover:bg-amber-50',
                          )}
                        >
                          {offset > 0 ? '+' : ''}
                          {offset.toFixed(offset % 0.01 === 0 ? 2 : 3)}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="relative flex-1">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-[#64748B]">
                            {t('holdingsPage.targetInputLabel')}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => nudgeTarget(-TARGET_FINE_STEP)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-[#0B0F19] transition hover:border-black/20"
                              aria-label={t('holdingsPage.decreasePrice')}
                            >
                              <Minus className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => nudgeTarget(TARGET_FINE_STEP)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-black/10 bg-white text-[#0B0F19] transition hover:border-black/20"
                              aria-label={t('holdingsPage.increasePrice')}
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value.replace(/[^\d.]/g, ''))}
                            placeholder={
                              buyPerGram != null
                                ? formatTargetInput(buyPerGram - 0.05)
                                : '0.000'
                            }
                            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-sm text-[#0B0F19] outline-none focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25"
                          />
                          <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#94A3B8]">
                            KWD/g
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={!targetValid}
                        onClick={() => openComingSoonModal('target')}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-5 py-3 text-sm font-bold text-[#85E307] transition enabled:hover:bg-[#1a2233] disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t('holdingsPage.setTargetCta')}
                        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                      </button>
                    </div>
                    {buyPerGram != null && targetNum != null && targetNum >= buyPerGram ? (
                      <p className="mt-2 text-xs text-amber-700">{t('holdingsPage.targetTooHigh')}</p>
                    ) : (
                      <p className="mt-2 text-xs text-[#64748B]">{t('holdingsPage.targetExplain')}</p>
                    )}
                  </div>
                ) : null}
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
                <div
                  key={id}
                  className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                >
                  <Icon className="mb-2 h-5 w-5 text-[#3F6F00]" strokeWidth={1.75} />
                  <p className="text-sm font-semibold text-[#0B0F19]">
                    {t(`holdingsPage.pillars.${id}.title`)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-[#64748B]">
                    {t(`holdingsPage.pillars.${id}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-[calc(var(--nav-offset,5rem)+1rem)]">
            <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#0B0F19] text-white shadow-lg">
              <div className="border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-[#85E307]" />
                  <h3 className="text-sm font-bold">{t('holdingsPage.walletTitle')}</h3>
                </div>
                <p className="mt-1 text-xs text-white/55">{t('holdingsPage.walletSubtitle')}</p>
              </div>
              <div className="px-5 py-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                  {t('holdingsPage.currentHoldings')}
                </p>
                <p className="mt-2 font-mono text-4xl font-bold tabular-nums tracking-tight">
                  0<span className="text-lg text-white/50"> g</span>
                </p>
                <p className="mt-1 text-xs text-white/50">24K · {t('holdingsPage.pureGold')}</p>

                <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-white/5 p-4">
                  <p className="text-xs font-semibold text-[#85E307]">
                    {t('holdingsPage.previewLabel')}
                  </p>
                  <p className="mt-2 font-mono text-xl font-bold tabular-nums">
                    +{formatGrams(effectiveGrams, i18n.language)} g
                  </p>
                  <p className="mt-1 text-[11px] text-white/45">{t('holdingsPage.previewHint')}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-amber-200/60 bg-amber-50/80 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-900/80">
                {t('holdingsPage.devTitle')}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-amber-950/75">
                {t('holdingsPage.devBody')}
              </p>
              <Link
                to="/contact"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-amber-900 hover:underline"
              >
                {t('holdingsPage.devCta')}
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </Link>
            </div>

            {sellPerGram != null ? (
              <p className="text-center text-[11px] text-[#94A3B8]">
                {t('holdingsPage.sellReference', {
                  price: formatKwd(sellPerGram, i18n.language),
                })}
              </p>
            ) : null}
          </aside>
        </div>
      </div>

      <Dialog
        open={comingSoonModal != null}
        onOpenChange={(open) => {
          if (!open) setComingSoonModal(null)
        }}
      >
        <DialogContent
          className="border-black/10 bg-white text-[#0B0F19] sm:max-w-md"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <DialogHeader className={cn(isRtl ? 'text-right sm:text-right' : 'text-left')}>
            <DialogTitle className="text-base font-bold leading-snug text-[#0B0F19]">
              {comingSoonModal != null ? t(`holdingsPage.toasts.${comingSoonModal}`) : ''}
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed text-[#64748B]">
              {t('holdingsPage.toasts.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className={cn(isRtl ? 'sm:justify-start' : 'sm:justify-end')}>
            <button
              type="button"
              onClick={() => setComingSoonModal(null)}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#0B0F19] px-5 py-3 text-sm font-bold text-[#85E307] transition hover:bg-[#1a2233] sm:w-auto"
            >
              {t('holdingsPage.comingSoonModal.confirm')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
