import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Coins,
  Gauge,
  Layers,
  Lock,
  Sparkles,
  Target,
  TrendingUp,
  Vault,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
import {
  caratGramTotals,
  getDefaultPreviewCarat,
  numOrNull,
} from '@/utils/publicStorefrontRates'
import { cn } from '@/lib/utils'

const MIN_GRAMS = 5
const MAX_GRAMS = 1000
const GRAM_PRESETS = [5, 10, 25, 50, 100, 250, 500, 1000] as const

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

export default function HoldingsPage() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const { data: rates, isLoading: ratesLoading } = useEnrichedPublicRates(20_000)

  const [grams, setGrams] = useState(25)
  const [targetPrice, setTargetPrice] = useState('')
  const [showTargetPanel, setShowTargetPanel] = useState(false)

  const carat24 = useMemo(() => getDefaultPreviewCarat(rates), [rates])
  const buyPerGram = numOrNull(carat24?.buyTotal)
  const sellPerGram = numOrNull(carat24?.sellTotal)

  const clampedGrams = Math.min(MAX_GRAMS, Math.max(MIN_GRAMS, grams))
  const totals = useMemo(
    () => caratGramTotals(carat24, clampedGrams),
    [carat24, clampedGrams],
  )

  const targetNum = numOrNull(targetPrice)
  const targetValid =
    targetNum != null && buyPerGram != null && targetNum > 0 && targetNum < buyPerGram

  const notifyComingSoon = (mode: 'instant' | 'target') => {
    toast.info(t(`holdingsPage.toasts.${mode}`), {
      description: t('holdingsPage.toasts.description'),
      duration: 5000,
    })
  }

  const onGramInput = (raw: string) => {
    const n = Number(raw.replace(/[^\d.]/g, ''))
    if (!Number.isFinite(n)) return
    setGrams(Math.min(MAX_GRAMS, Math.max(MIN_GRAMS, n)))
  }

  const sliderPct = ((clampedGrams - MIN_GRAMS) / (MAX_GRAMS - MIN_GRAMS)) * 100

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
                      {formatGrams(clampedGrams, i18n.language)} {t('holdingsPage.gramsUnit')}
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
                    value={clampedGrams}
                    onChange={(e) => setGrams(Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-[#E8EBE3] accent-[#85E307]"
                    style={{
                      background: `linear-gradient(to right, #85E307 0%, #85E307 ${sliderPct}%, #E8EBE3 ${sliderPct}%, #E8EBE3 100%)`,
                    }}
                    aria-valuemin={MIN_GRAMS}
                    aria-valuemax={MAX_GRAMS}
                    aria-valuenow={clampedGrams}
                  />
                  <div className="relative w-28 shrink-0">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={clampedGrams}
                      onChange={(e) => onGramInput(e.target.value)}
                      className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-end font-mono text-sm font-bold text-[#0B0F19] outline-none focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25"
                      aria-label={t('holdingsPage.gramsLabel')}
                    />
                    <span className="pointer-events-none absolute start-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-[#94A3B8]">
                      g
                    </span>
                  </div>
                </div>

                <p className="mb-3 text-xs text-[#94A3B8]">
                  {t('holdingsPage.gramsRange', { min: MIN_GRAMS, max: MAX_GRAMS })}
                </p>

                <div className="flex flex-wrap gap-2">
                  {GRAM_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setGrams(preset)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                        clampedGrams === preset
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
                    onClick={() => notifyComingSoon('instant')}
                    className="group flex flex-col items-start gap-2 rounded-2xl bg-[#85E307] p-5 text-start transition hover:bg-[#9AF01A]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B0F19]/10">
                      <Zap className="h-4 w-4 text-[#0B0F19]" />
                    </span>
                    <span className="text-base font-bold text-[#0B0F19]">
                      {t('holdingsPage.instantBuy')}
                    </span>
                    <span className="text-xs leading-relaxed text-[#0B0F19]/70">
                      {t('holdingsPage.instantBuyHint')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTargetPanel((v) => !v)}
                    className={cn(
                      'group flex flex-col items-start gap-2 rounded-2xl border p-5 text-start transition',
                      showTargetPanel
                        ? 'border-[#85E307] bg-[#ECFCCB]/40'
                        : 'border-black/10 bg-white hover:border-black/20',
                    )}
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0B0F19] text-[#85E307]">
                      <Target className="h-4 w-4" />
                    </span>
                    <span className="text-base font-bold text-[#0B0F19]">
                      {t('holdingsPage.targetBuy')}
                    </span>
                    <span className="text-xs leading-relaxed text-[#64748B]">
                      {t('holdingsPage.targetBuyHint')}
                    </span>
                  </button>
                </div>

                {showTargetPanel ? (
                  <div className="mt-4 rounded-xl border border-[#85E307]/30 bg-[#ECFCCB]/25 p-4">
                    <label className="mb-1.5 block text-sm font-semibold text-[#0B0F19]">
                      {t('holdingsPage.targetPriceLabel')}
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={targetPrice}
                          onChange={(e) => setTargetPrice(e.target.value.replace(/[^\d.]/g, ''))}
                          placeholder={
                            buyPerGram != null
                              ? String((buyPerGram * 0.98).toFixed(3))
                              : '0.000'
                          }
                          className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-sm text-[#0B0F19] outline-none focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25"
                        />
                        <span className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#94A3B8]">
                          KWD/g
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={!targetValid}
                        onClick={() => notifyComingSoon('target')}
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
                    +{formatGrams(clampedGrams, i18n.language)} g
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
    </div>
  )
}
