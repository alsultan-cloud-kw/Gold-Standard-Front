import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  AreaChart as AreaIcon,
  CandlestickChart,
  Check,
  Crosshair,
  LineChart as LineIcon,
  Maximize2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { adminApi, type DaralsabaekPublicRatesResponse } from '@/services/api'
import { METAL_SYMBOL_BY_KEY, pricingApi, type MetalChartPoint } from '@/services/pricingApi'
import { AdvancedMetalChart, type ChartDisplayMode } from '@/components/prices/AdvancedMetalChart'
import {
  buildCandleSeries,
  buildLineSeries,
  formatPrice,
  seriesChange,
  type ChartRange,
  type MetalTab,
} from '@/utils/metalChartSeries'

type Props = {
  rates: DaralsabaekPublicRatesResponse | undefined
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const t = v.trim()
    if (t === '') return null
    const n = Number(t)
    return Number.isFinite(n) ? n : null
  }
  return null
}

const RANGE_KEYS: ChartRange[] = ['live', '1h', '1d', '1w']

export function PricesHistoryChart({ rates }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('ar') ? 'ar-KW' : i18n.language || 'en'
  const [metal, setMetal] = useState<MetalTab>('gold')
  const [chartRange, setChartRange] = useState<ChartRange>('1h')
  const [mode, setMode] = useState<ChartDisplayMode>('candles')
  const [countdown, setCountdown] = useState(60)
  const [fitToken, setFitToken] = useState(0)
  const [chartHeight, setChartHeight] = useState(340)

  useEffect(() => {
    const sync = () => {
      const w = window.innerWidth
      if (w < 640) setChartHeight(280)
      else if (w >= 1536) setChartHeight(420)
      else if (w >= 1024) setChartHeight(380)
      else setChartHeight(340)
    }
    sync()
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  const updateEverySec =
    typeof rates?.updateIntervalInSeconds === 'number'
      ? Math.max(1, Math.round(rates.updateIntervalInSeconds))
      : 60

  useEffect(() => {
    setCountdown(updateEverySec)
    const id = window.setInterval(() => {
      setCountdown((c) => (c <= 1 ? updateEverySec : c - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [updateEverySec, metal, chartRange])

  const { data: pricingHistory, isFetching: pricingHistoryFetching } = useQuery({
    queryKey: ['pricingHistory', metal, chartRange],
    queryFn: () =>
      pricingApi.getHistory({ metal: METAL_SYMBOL_BY_KEY[metal], range: chartRange }),
    enabled: rates?.succeeded === true,
    staleTime: 25_000,
    retry: 1,
    refetchInterval: 30_000,
  })
  const newHistoryAvailable = (pricingHistory?.points?.length ?? 0) > 0

  const { data: legacyHistoryData, isFetching: legacyHistoryFetching } = useQuery({
    queryKey: ['metalPriceHistoryLegacy', metal, chartRange],
    queryFn: () => adminApi.getMetalPriceHistory({ metal, range: chartRange }),
    enabled: rates?.succeeded === true && !newHistoryAvailable && metal !== 'palladium',
    staleTime: 25_000,
  })
  const historyFetching = pricingHistoryFetching || legacyHistoryFetching

  const preferOz = metal === 'gold' && (chartRange === 'live' || chartRange === '1h')

  const rawPoints: MetalChartPoint[] = useMemo(() => {
    if (newHistoryAvailable && pricingHistory) {
      return pricingHistory.points
    }
    const legacy = legacyHistoryData?.points ?? []
    return legacy.map((p) => ({
      t: p.t,
      price: p.v,
      ask: null,
      bid: null,
      open: null,
      high: null,
      low: null,
      price_gram_24k: p.v,
    }))
  }, [newHistoryAvailable, pricingHistory, legacyHistoryData])

  const carats = rates?.carats ?? []
  const byKey = useMemo(() => new Map(carats.map((c) => [c.key, c])), [carats])
  const goldOuncePrice = numOrNull(rates?.goldOuncePrice)

  const chartUnit = useMemo(() => {
    if (pricingHistory?.unit && newHistoryAvailable) return pricingHistory.unit
    if (legacyHistoryData?.unit) return legacyHistoryData.unit
    if (metal !== 'gold') return 'KWD/g'
    return preferOz || goldOuncePrice != null ? 'USD/oz' : 'KWD/g'
  }, [pricingHistory?.unit, newHistoryAvailable, legacyHistoryData?.unit, metal, preferOz, goldOuncePrice])

  const liveChartV = useMemo(() => {
    if (!rates?.succeeded) return null
    if (metal === 'gold') {
      if (chartUnit === 'USD/oz') return goldOuncePrice
      return numOrNull(byKey.get('24K')?.buyTotal)
    }
    if (metal === 'silver') return numOrNull(rates.silver?.buyTotal)
    if (metal === 'platinum') return numOrNull(rates.platinum?.buyTotal)
    return numOrNull(rates.palladium?.buyTotal)
  }, [metal, chartUnit, rates, byKey, goldOuncePrice])

  const line = useMemo(
    () => buildLineSeries(rawPoints, metal, chartRange, liveChartV, preferOz || chartUnit === 'USD/oz'),
    [rawPoints, metal, chartRange, liveChartV, preferOz, chartUnit],
  )

  const candles = useMemo(
    () =>
      buildCandleSeries(line, chartRange, rawPoints, metal, preferOz || chartUnit === 'USD/oz'),
    [line, chartRange, rawPoints, metal, preferOz, chartUnit],
  )

  const change = useMemo(() => seriesChange(line), [line])
  const positive = change == null ? true : change.abs >= 0
  const lastPrice = line.length ? line[line.length - 1].value : liveChartV

  const metalTabs: { id: MetalTab; labelKey: string }[] = [
    { id: 'gold', labelKey: 'home.chart.metalGold' },
    { id: 'silver', labelKey: 'home.chart.metalSilver' },
    { id: 'platinum', labelKey: 'home.chart.metalPlatinum' },
    { id: 'palladium', labelKey: 'home.chart.metalPalladium' },
  ]

  const modeButtons: { id: ChartDisplayMode; icon: typeof CandlestickChart; labelKey: string }[] = [
    { id: 'candles', icon: CandlestickChart, labelKey: 'home.chart.modeCandles' },
    { id: 'line', icon: LineIcon, labelKey: 'home.chart.modeLine' },
    { id: 'area', icon: AreaIcon, labelKey: 'home.chart.modeArea' },
  ]

  if (!rates?.succeeded) return null

  return (
    <div className="metal-chart-panel relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 10% 0%, rgba(133,227,7,0.08), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(133,227,7,0.04), transparent 50%)',
        }}
      />

      <div className="relative p-4 sm:p-6 lg:p-8">
        {/* Metal tabs */}
        <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label={t('home.chart.metalsAria')}>
          {metalTabs.map(({ id, labelKey }) => {
            const on = metal === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setMetal(id)}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/60 ${
                  on
                    ? 'bg-[#85E307] text-[#0B0F19] shadow-sm'
                    : 'border border-black/10 bg-[#F4F4F5] text-[#64748B] hover:border-[#85E307]/35 hover:bg-[#ECFCCB]/50 hover:text-[#0B0F19]'
                }`}
              >
                {t(labelKey)}
              </button>
            )
          })}
        </div>

        {/* Price hero + controls */}
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#85E307]/30 bg-[#ECFCCB]/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#3F6F00]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3F6F00]" />
                {t('home.chart.liveBadge')}
              </span>
              <span className="text-xs font-medium text-[#64748B]">
                {t('home.chart.unitLabel', { unit: chartUnit })}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <p className="text-3xl font-bold tabular-nums tracking-tight text-[#0B0F19] sm:text-4xl lg:text-5xl">
                {lastPrice != null ? formatPrice(lastPrice, chartUnit, locale) : '—'}
              </p>
              {change ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ${
                    positive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {positive ? (
                    <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {positive ? '+' : ''}
                  {change.pct.toFixed(2)}%
                  <span className="text-[#94A3B8]">·</span>
                  {positive ? '+' : ''}
                  {formatPrice(change.abs, chartUnit, locale)}
                </span>
              ) : null}
            </div>

            <p className="mt-2 flex items-center gap-2 text-xs text-[#64748B]">
              <Activity className="h-3.5 w-3.5 text-[#3F6F00]" aria-hidden />
              {t('home.chart.updateCountdown', {
                seconds: String(countdown).padStart(2, '0'),
              })}
              {historyFetching ? (
                <span className="text-[#3F6F00]">{t('home.chart.refreshing')}</span>
              ) : null}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-lg border border-black/10 bg-[#F4F4F5] p-0.5"
              role="group"
              aria-label={t('home.chart.modeAria')}
            >
              {modeButtons.map(({ id, icon: Icon, labelKey }) => {
                const on = mode === id
                return (
                  <button
                    key={id}
                    type="button"
                    title={t(labelKey)}
                    aria-pressed={on}
                    onClick={() => setMode(id)}
                    className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/50 ${
                      on
                        ? 'bg-[#85E307] text-[#0B0F19]'
                        : 'text-[#64748B] hover:bg-white hover:text-[#0B0F19]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    <span className="hidden sm:inline">{t(labelKey)}</span>
                  </button>
                )
              })}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-2 text-sm font-semibold text-[#0B0F19] outline-none transition-colors hover:border-[#85E307]/40 hover:bg-[#ECFCCB]/40 focus-visible:ring-2 focus-visible:ring-[#85E307]/50"
                type="button"
              >
                {t(`home.chart.range.${chartRange}`)}
                <span className="text-[#94A3B8]" aria-hidden>
                  ▼
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[11rem] border border-black/10 bg-white text-[#0B0F19] shadow-lg"
              >
                {RANGE_KEYS.map((key) => (
                  <DropdownMenuItem
                    key={key}
                    className="cursor-pointer focus:bg-[#ECFCCB]/60 focus:text-[#0B0F19]"
                    onClick={() => setChartRange(key)}
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      {t(`home.chart.range.${key}`)}
                      {chartRange === key ? (
                        <Check className="h-4 w-4 text-[#3F6F00]" aria-hidden />
                      ) : null}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <button
              type="button"
              onClick={() => setFitToken((n) => n + 1)}
              title={t('home.chart.fitView')}
              className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-black/10 bg-white text-[#64748B] transition-colors hover:border-[#85E307]/40 hover:bg-[#ECFCCB]/40 hover:text-[#0B0F19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/50"
            >
              <Maximize2 className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-[#64748B] sm:text-sm">
          {t('home.chart.hint')}
        </p>

        <div className="relative overflow-hidden rounded-xl border border-black/10 bg-[#F9F9FA]">
          {line.length < 2 && candles.length < 2 ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-2 px-4 text-center sm:h-[340px] lg:h-[380px]">
              <Crosshair className="h-8 w-8 text-[#CBD5E1]" aria-hidden />
              <p className="text-sm font-medium text-[#64748B]">{t('home.chart.emptyTitle')}</p>
              <p className="max-w-sm text-xs text-[#94A3B8]">{t('home.chart.emptyBody')}</p>
            </div>
          ) : (
            <AdvancedMetalChart
              mode={mode}
              line={line}
              candles={candles}
              locale={locale}
              height={chartHeight}
              positive={positive}
              fitToken={fitToken}
            />
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-medium uppercase tracking-wide text-[#94A3B8]">
          <span>{t('home.chart.featureZoom')}</span>
          <span className="text-[#CBD5E1]">·</span>
          <span>{t('home.chart.featurePan')}</span>
          <span className="text-[#CBD5E1]">·</span>
          <span>{t('home.chart.featureCrosshair')}</span>
          <span className="text-[#CBD5E1]">·</span>
          <span>{t('home.chart.featureModes')}</span>
        </div>
      </div>
    </div>
  )
}
