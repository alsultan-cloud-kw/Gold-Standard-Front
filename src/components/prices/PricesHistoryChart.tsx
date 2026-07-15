import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  AreaChart as AreaIcon,
  CandlestickChart,
  Crosshair,
  LineChart as LineIcon,
  Loader2,
  Maximize2,
  Minimize2,
  X,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { adminApi, type DaralsabaekPublicRatesResponse } from '@/services/api'
import { METAL_SYMBOL_BY_KEY, pricingApi, type MetalChartPoint } from '@/services/pricingApi'
import { AdvancedMetalChart, type ChartDisplayMode } from '@/components/prices/AdvancedMetalChart'
import { ChartCurrencyToggle } from '@/components/prices/ChartCurrencyToggle'
import {
  apiRangeForChartRange,
  buildCandleSeries,
  buildLineSeries,
  computeYtdChangePct,
  convertLineToOunceCurrency,
  formatChartAsOf,
  formatChartTimeRange,
  formatPctChange,
  formatPrice,
  kwdOunceSellFromUsd,
  ounceUnit,
  prevCloseFromSnapshot,
  seriesChange,
  seriesOhlcStats,
  snapshotOhlcForUnit,
  type CandlePoint,
  type ChartRange,
  type GoldOunceMarkup,
  type LinePoint,
  type MetalTab,
  type OunceCurrency,
} from '@/utils/metalChartSeries'
import {
  resolveAuthoritativeUsdOunceSpot,
  resolveConfiguredKwdOunceSell,
} from '@/utils/publicStorefrontRates'
import { PRICE_NUMBER_LOCALE } from '@/utils/formatLatinNumber'
import { cn } from '@/lib/utils'
import { PreciousMetalMark } from '@/components/prices/PreciousMetalMark'

type Props = {
  rates: DaralsabaekPublicRatesResponse | undefined
  /** Hide kicker/title when the parent page already introduces live prices (e.g. /prices). */
  showSectionHeader?: boolean
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

const SHORT_RANGE_KEYS: ChartRange[] = ['live', '1h', '1d', '1w']
const LONG_RANGE_KEYS: ChartRange[] = ['1m', '6m', '1y', '5y', 'all']
const INTRADAY_RANGE_KEYS = new Set<ChartRange>(['live', '1h', '1d'])

function resolvePrevClose(
  snapStats: ReturnType<typeof snapshotOhlcForUnit>,
  currentSnap: Awaited<ReturnType<typeof pricingApi.getCurrent>> | undefined,
  chartUnit: string,
  line: LinePoint[],
  candles: CandlePoint[],
  ounceMarkup?: GoldOunceMarkup,
): number | null {
  const fromSnap = snapStats?.prevClose ?? prevCloseFromSnapshot(currentSnap, chartUnit, ounceMarkup)
  if (fromSnap != null && Number.isFinite(fromSnap)) return fromSnap
  if (candles.length >= 2) return candles[candles.length - 2].close
  if (line.length >= 2) return line[line.length - 2].value
  return null
}

function StatCell({
  label,
  value,
  positive,
}: {
  label: string
  value: string
  positive?: boolean | null
}) {
  const valueClass =
    positive == null
      ? 'text-[#0B0F19]'
      : positive
        ? 'text-[#3F6F00]'
        : 'text-rose-700'

  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-bold uppercase tracking-wide text-[#64748B] sm:text-xs">{label}</dt>
      <dd className={`mt-0.5 text-sm font-semibold tabular-nums sm:text-base ${valueClass}`}>{value}</dd>
    </div>
  )
}

function formatDisplayPrice(value: number | null | undefined, unit: string): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const formatted = formatPrice(value, unit)
  if (unit === 'USD/oz') return `$${formatted}`
  if (unit === 'KWD/oz') return `${formatted} KWD`
  return formatted
}

export function PricesHistoryChart({ rates, showSectionHeader = true }: Props) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language?.startsWith('ar') ? 'ar-KW' : PRICE_NUMBER_LOCALE
  const [metal, setMetal] = useState<MetalTab>('gold')
  const [chartRange, setChartRange] = useState<ChartRange>('1w')
  const [ounceCurrency, setOunceCurrency] = useState<OunceCurrency>('USD')
  const [mode, setMode] = useState<ChartDisplayMode>('line')
  const [countdown, setCountdown] = useState(60)
  const [fitToken, setFitToken] = useState(0)
  const [chartExpanded, setChartExpanded] = useState(false)
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

  useEffect(() => {
    if (!chartExpanded) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.setAttribute('data-chart-expanded', 'true')
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setChartExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    // Portal paints at 0×0 for a frame — nudge fit after layout settles.
    const t1 = window.setTimeout(() => setFitToken((n) => n + 1), 50)
    const t2 = window.setTimeout(() => setFitToken((n) => n + 1), 200)
    return () => {
      document.body.style.overflow = prevOverflow
      document.documentElement.removeAttribute('data-chart-expanded')
      window.removeEventListener('keydown', onKey)
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [chartExpanded])

  const toggleChartExpanded = () => {
    setChartExpanded((open) => !open)
  }

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

  const apiRange = apiRangeForChartRange(chartRange)

  const { data: pricingHistory, isFetching: pricingHistoryFetching } = useQuery({
    queryKey: ['pricingHistory', metal, apiRange],
    queryFn: () =>
      pricingApi.getHistory({ metal: METAL_SYMBOL_BY_KEY[metal], range: apiRange }),
    enabled: rates?.succeeded === true,
    staleTime: 25_000,
    retry: 1,
    refetchInterval: 30_000,
  })
  const newHistoryAvailable = (pricingHistory?.points?.length ?? 0) > 0

  const { data: legacyHistoryData, isFetching: legacyHistoryFetching } = useQuery({
    queryKey: ['metalPriceHistoryLegacy', metal, apiRange],
    queryFn: () => adminApi.getMetalPriceHistory({ metal, range: apiRange }),
    enabled: rates?.succeeded === true && !newHistoryAvailable && metal !== 'palladium',
    staleTime: 25_000,
  })
  const historyFetching = pricingHistoryFetching || legacyHistoryFetching

  /** In-chart spinner while a range/metal filter fetch is in flight (not silent background refetch). */
  const [filterLoadPending, setFilterLoadPending] = useState(false)

  useEffect(() => {
    setFilterLoadPending(true)
  }, [chartRange, metal, apiRange])

  useEffect(() => {
    if (!filterLoadPending) return
    if (historyFetching) return
    setFilterLoadPending(false)
    setFitToken((n) => n + 1)
  }, [filterLoadPending, historyFetching])

  const { data: currentSnap } = useQuery({
    queryKey: ['pricingCurrent', metal],
    queryFn: () => pricingApi.getCurrent(metal),
    enabled: rates?.succeeded === true,
    staleTime: 25_000,
    refetchInterval: 30_000,
    retry: 1,
  })

  const { data: ytdHistory } = useQuery({
    queryKey: ['pricingHistory', metal, '1y', 'ytd-stats'],
    queryFn: () => pricingApi.getHistory({ metal: METAL_SYMBOL_BY_KEY[metal], range: '1y' }),
    enabled: rates?.succeeded === true && metal === 'gold',
    staleTime: 120_000,
    retry: 1,
  })

  const preferOz = metal === 'gold'

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

  const usdToKwdRate =
    numOrNull(rates?.usd_to_kwd_rate) ?? numOrNull(currentSnap?.usd_to_kwd_rate)
  const ounceSellAdd = numOrNull(rates?.goldOunce?.sellAdd) ?? 0
  const usdOunceSpot = resolveAuthoritativeUsdOunceSpot(rates, currentSnap)
  const configuredKwdSell = resolveConfiguredKwdOunceSell(rates, usdOunceSpot, usdToKwdRate)

  const ounceMarkup = useMemo(
    (): GoldOunceMarkup => ({
      usdToKwdRate,
      sellAdd: ounceSellAdd,
      buyAdd: numOrNull(rates?.goldOunce?.buyAdd) ?? 0,
    }),
    [usdToKwdRate, ounceSellAdd, rates?.goldOunce?.buyAdd],
  )

  const chartUnit = useMemo(() => {
    if (metal === 'gold') return ounceUnit(ounceCurrency)
    if (pricingHistory?.unit && newHistoryAvailable) return pricingHistory.unit
    if (legacyHistoryData?.unit) return legacyHistoryData.unit
    return 'KWD/g'
  }, [metal, ounceCurrency, pricingHistory?.unit, newHistoryAvailable, legacyHistoryData?.unit])

  // Gold ounce charts: always build the series in USD/oz, then convert for KWD display.
  const liveUsdOunce = useMemo(() => {
    if (!rates?.succeeded || metal !== 'gold') return null
    if (chartUnit === 'KWD/g') return numOrNull(byKey.get('24K')?.buyTotal)
    return usdOunceSpot
  }, [rates?.succeeded, metal, chartUnit, byKey, usdOunceSpot])

  const rawLine = useMemo(
    () => buildLineSeries(rawPoints, metal, chartRange, liveUsdOunce, preferOz),
    [rawPoints, metal, chartRange, liveUsdOunce, preferOz],
  )

  const line = useMemo(() => {
    if (metal !== 'gold' || chartUnit === 'KWD/g') return rawLine
    if (ounceCurrency === 'USD') return rawLine
    const converted = convertLineToOunceCurrency(rawLine, 'KWD', usdToKwdRate, ounceSellAdd)
    if (!converted.length) return converted
    const kwdLive =
      configuredKwdSell ??
      (usdOunceSpot != null && usdToKwdRate != null
        ? kwdOunceSellFromUsd(usdOunceSpot, usdToKwdRate, ounceSellAdd)
        : null)
    if (kwdLive == null) return converted
    const last = converted[converted.length - 1]
    return [...converted.slice(0, -1), { ...last, value: kwdLive }]
  }, [
    rawLine,
    metal,
    chartUnit,
    ounceCurrency,
    usdToKwdRate,
    ounceSellAdd,
    configuredKwdSell,
    usdOunceSpot,
  ])

  const liveChartV = useMemo(() => {
    if (!rates?.succeeded) return null
    if (metal === 'gold') {
      if (chartUnit === 'KWD/oz') return configuredKwdSell
      if (chartUnit === 'USD/oz') return usdOunceSpot
      return numOrNull(byKey.get('24K')?.buyTotal)
    }
    if (metal === 'silver') return numOrNull(rates.silver?.buyTotal)
    if (metal === 'platinum') return numOrNull(rates.platinum?.buyTotal)
    return numOrNull(rates.palladium?.buyTotal)
  }, [metal, chartUnit, rates, byKey, configuredKwdSell, usdOunceSpot])

  const candles = useMemo(
    () => buildCandleSeries(line, chartRange, rawPoints, metal, preferOz),
    [line, chartRange, rawPoints, metal, preferOz],
  )

  const change = useMemo(() => seriesChange(line), [line])
  const positive = change == null ? true : change.abs >= 0
  const lastPrice = line.length ? line[line.length - 1].value : liveChartV
  const showChartLoading = filterLoadPending || (historyFetching && line.length < 2)

  const seriesStats = useMemo(() => seriesOhlcStats(line, candles), [line, candles])
  const snapStats = useMemo(
    () => snapshotOhlcForUnit(currentSnap, chartUnit, ounceMarkup),
    [currentSnap, chartUnit, ounceMarkup],
  )

  const displayStats = useMemo(() => {
    const fmt = (v: number | null | undefined) =>
      v != null && Number.isFinite(v) ? formatDisplayPrice(v, chartUnit) : '—'

    const useSessionSnap = INTRADAY_RANGE_KEYS.has(chartRange) && metal === 'gold'
    const prevCloseValue = resolvePrevClose(
      snapStats,
      currentSnap,
      chartUnit,
      line,
      candles,
      ounceMarkup,
    )

    const openValue = useSessionSnap
      ? (snapStats?.open ?? seriesStats?.open ?? null)
      : (seriesStats?.open ?? null)
    const highValue = useSessionSnap
      ? (snapStats?.high ?? seriesStats?.high ?? null)
      : (seriesStats?.high ?? null)
    const lowValue = useSessionSnap
      ? (snapStats?.low ?? seriesStats?.low ?? null)
      : (seriesStats?.low ?? null)

    return {
      useSessionSnap,
      open: fmt(openValue),
      high: fmt(highValue),
      low: fmt(lowValue),
      prevClose: fmt(prevCloseValue),
    }
  }, [snapStats, seriesStats, currentSnap, chartUnit, line, candles, chartRange, metal, ounceMarkup])

  const goldYtdPct = useMemo(() => {
    if (metal !== 'gold') return null
    const ytdUsdLine = buildLineSeries(
      ytdHistory?.points ?? [],
      'gold',
      '1y',
      usdOunceSpot,
      true,
    )
    let ytdLine =
      ounceCurrency === 'KWD'
        ? convertLineToOunceCurrency(ytdUsdLine, 'KWD', usdToKwdRate, ounceSellAdd)
        : ytdUsdLine
    if (ounceCurrency === 'KWD' && ytdLine.length && configuredKwdSell != null) {
      const last = ytdLine[ytdLine.length - 1]
      ytdLine = [...ytdLine.slice(0, -1), { ...last, value: configuredKwdSell }]
    }
    return computeYtdChangePct(ytdLine)
  }, [metal, ytdHistory, ounceCurrency, usdOunceSpot, usdToKwdRate, ounceSellAdd, configuredKwdSell])

  const referencePrice = useMemo(() => {
    const prev = resolvePrevClose(snapStats, currentSnap, chartUnit, line, candles, ounceMarkup)
    if (prev != null && Number.isFinite(prev)) return prev
    if (line.length >= 2) return line[line.length - 2].value
    return null
  }, [currentSnap, chartUnit, snapStats, line, candles])

  const timeRangeLabel = useMemo(() => formatChartTimeRange(line, locale), [line, locale])
  const asOfLabel = useMemo(() => {
    if (line.length) return formatChartAsOf(line[line.length - 1].time, locale)
    return formatChartAsOf(Math.floor(Date.now() / 1000), locale)
  }, [line, locale])

  const metalTabs: { id: MetalTab; labelKey: string }[] = [
    { id: 'gold', labelKey: 'home.chart.metalGold' },
    { id: 'silver', labelKey: 'home.chart.metalSilver' },
    { id: 'platinum', labelKey: 'home.chart.metalPlatinum' },
    { id: 'palladium', labelKey: 'home.chart.metalPalladium' },
  ]

  const modeButtons: { id: ChartDisplayMode; icon: typeof CandlestickChart; labelKey: string }[] = [
    { id: 'area', icon: AreaIcon, labelKey: 'home.chart.modeArea' },
    { id: 'line', icon: LineIcon, labelKey: 'home.chart.modeLine' },
    { id: 'candles', icon: CandlestickChart, labelKey: 'home.chart.modeCandles' },
  ]

  if (!rates?.succeeded) return null

  const chartPanel = (
    <div
      className={cn(
        'metal-chart-panel relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm',
        chartExpanded &&
          'fixed inset-0 z-[200] m-0 flex h-[100dvh] max-h-[100dvh] w-full flex-col overflow-hidden rounded-none border-0 shadow-2xl sm:inset-4 sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:w-auto sm:rounded-2xl sm:border sm:border-black/15',
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        aria-hidden
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 10% 0%, rgba(133,227,7,0.08), transparent 55%), radial-gradient(ellipse 50% 40% at 100% 100%, rgba(133,227,7,0.04), transparent 50%)',
        }}
      />

      <div
        className={cn(
          'relative',
          chartExpanded
            ? 'flex min-h-0 flex-1 flex-col overflow-hidden p-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:p-5'
            : 'p-3 sm:p-6 lg:p-8',
        )}
      >
        {chartExpanded ? (
          <div className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b border-black/10 pb-2.5 sm:mb-4 sm:pb-3">
            <p className="min-w-0 truncate text-sm font-semibold text-[#0B0F19]">
              {t('home.chart.expandedTitle')}
            </p>
            <button
              type="button"
              onClick={() => setChartExpanded(false)}
              aria-label={t('home.chart.collapseChart')}
              className="inline-flex h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#1F2937] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/60 sm:min-w-0 sm:px-4 sm:py-2"
            >
              <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
              <span className="hidden sm:inline">{t('home.chart.closeChart')}</span>
            </button>
          </div>
        ) : null}

        <div
          className={cn(
            chartExpanded &&
              'min-h-0 shrink-0 space-y-3 overflow-y-auto overscroll-contain sm:max-h-[min(38vh,320px)]',
          )}
        >

        {showSectionHeader && !chartExpanded ? (
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#3F6F00] sm:text-[11px]">
                {t('home.chart.sectionKicker')}
              </p>
              <h2 className="type-section-title text-[#0C1512] sm:text-3xl">
                {t('home.chart.sectionTitle')}
              </h2>
            </div>
            {metal === 'gold' ? (
              <ChartCurrencyToggle value={ounceCurrency} onChange={setOunceCurrency} />
            ) : null}
          </div>
        ) : metal === 'gold' ? (
          <div className={cn('flex justify-end', chartExpanded ? 'mb-2' : 'mb-4')}>
            <ChartCurrencyToggle value={ounceCurrency} onChange={setOunceCurrency} />
          </div>
        ) : null}

        {/* Metal tabs — wrap so no label is clipped on small screens */}
        <div
          className="mb-4 flex flex-wrap gap-1.5 sm:mb-5 sm:gap-2"
          role="tablist"
          aria-label={t('home.chart.metalsAria')}
        >
          {metalTabs.map(({ id, labelKey }) => {
            const on = metal === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setMetal(id)}
                className={`cursor-pointer rounded-md px-2.5 py-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/60 sm:px-3 sm:py-2 ${
                  on
                    ? 'bg-[#0B0F19] text-white'
                    : 'border border-black/10 bg-white text-[#64748B] hover:border-black/20 hover:text-[#0B0F19]'
                }`}
              >
                <PreciousMetalMark
                  metal={id}
                  label={t(labelKey)}
                  variant="tab"
                  active={on}
                />
              </button>
            )
          })}
        </div>

        {/* Price hero + controls */}
        <div className="mb-3 flex flex-col gap-3 sm:mb-4 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-[#85E307]/30 bg-[#ECFCCB]/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#3F6F00] sm:gap-1.5 sm:px-2.5 sm:text-[10px] sm:tracking-[0.16em]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#3F6F00]" />
                {t('home.chart.liveBadge')}
              </span>
              <span className="text-[10px] font-medium text-[#64748B] sm:text-xs">
                {t('home.chart.unitLabel', { unit: chartUnit })}
              </span>
            </div>

            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 sm:gap-x-3">
              <p className="text-2xl font-bold tabular-nums tracking-tight text-[#0B0F19] sm:text-4xl lg:text-5xl">
                {formatDisplayPrice(lastPrice, chartUnit)}
              </p>
              {change ? (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums sm:px-2 sm:text-sm ${
                    positive
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {positive ? (
                    <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
                  ) : (
                    <TrendingDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden />
                  )}
                  {formatPctChange(change.pct, 2)}
                  <span className="text-[#94A3B8]">·</span>
                  <span className="text-[10px] font-medium uppercase text-[#64748B] sm:text-xs">
                    {t(`home.chart.range.${chartRange}`)}
                  </span>
                </span>
              ) : null}
            </div>

            <p className="mt-1.5 hidden flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#64748B] sm:mt-2 sm:flex">
              <span>
                {t('home.chart.asOf', { time: asOfLabel })}
                <span className="mx-1.5 text-[#CBD5E1]">·</span>
                {t('home.chart.disclaimer')}
              </span>
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-[#64748B] sm:gap-2 sm:text-xs">
              <Activity className="h-3 w-3 shrink-0 text-[#3F6F00] sm:h-3.5 sm:w-3.5" aria-hidden />
              {t('home.chart.updateCountdown', {
                seconds: String(countdown).padStart(2, '0'),
              })}
              {historyFetching ? (
                <span className="inline-flex items-center gap-1 text-[#3F6F00]">
                  <Loader2 className="h-3 w-3 animate-spin sm:h-3.5 sm:w-3.5" aria-hidden />
                  {t('home.chart.refreshing')}
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-2.5">
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
                    className={`inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/50 sm:h-auto sm:w-auto sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-xs sm:font-semibold ${
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

            <button
              type="button"
              onClick={toggleChartExpanded}
              title={chartExpanded ? t('home.chart.collapseChart') : t('home.chart.expandChart')}
              aria-label={chartExpanded ? t('home.chart.collapseChart') : t('home.chart.expandChart')}
              aria-pressed={chartExpanded}
              className="inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-black/10 bg-white text-[#64748B] transition-colors hover:border-[#85E307]/40 hover:bg-[#ECFCCB]/40 hover:text-[#0B0F19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/50 sm:h-9 sm:w-9"
            >
              {chartExpanded ? (
                <Minimize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
              ) : (
                <Maximize2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
              )}
            </button>
          </div>
        </div>

        <div className="mb-3">
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-[#94A3B8] sm:mb-2 sm:text-[10px]">
            {t('home.chart.shortRangeLabel')}
          </p>
          <div
            className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:gap-1.5 sm:overflow-visible [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label={t('home.chart.rangeAria')}
          >
            {SHORT_RANGE_KEYS.map((key) => {
              const on = chartRange === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setChartRange(key)}
                  className={`shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/50 sm:px-3 sm:py-1.5 sm:text-xs md:text-sm ${
                    on
                      ? 'bg-[#E4E4E7] text-[#0B0F19] shadow-sm'
                      : 'text-[#64748B] hover:bg-[#F4F4F5] hover:text-[#0B0F19]'
                  }`}
                >
                  {t(`home.chart.range.${key}`)}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-4">
          <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-wide text-[#94A3B8] sm:mb-2 sm:text-[10px]">
            {t('home.chart.longRangeLabel')}
          </p>
          <div
            className="flex gap-1 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:gap-1.5 sm:overflow-visible [&::-webkit-scrollbar]:hidden"
            role="group"
            aria-label={t('home.chart.longRangeAria')}
          >
            {LONG_RANGE_KEYS.map((key) => {
              const on = chartRange === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setChartRange(key)}
                  className={`shrink-0 cursor-pointer rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/50 sm:px-3 sm:py-1.5 sm:text-xs md:text-sm ${
                    on
                      ? 'bg-[#E4E4E7] text-[#0B0F19] shadow-sm'
                      : 'text-[#64748B] hover:bg-[#F4F4F5] hover:text-[#0B0F19]'
                  }`}
                >
                  {t(`home.chart.range.${key}`)}
                </button>
              )
            })}
          </div>
        </div>

        {!chartExpanded ? (
          <>
            <p className="mb-3 hidden text-xs leading-relaxed text-[#64748B] sm:mb-4 sm:block sm:text-sm">
              {t('home.chart.hint')}
            </p>
            <p className="mb-3 text-xs leading-relaxed text-[#64748B] sm:hidden">
              {t('home.chart.gestureHintMobile')}
            </p>
          </>
        ) : null}
        </div>

        <div
          className={cn(
            'relative overflow-hidden rounded-xl border border-black/10 bg-[#F9F9FA]',
            chartExpanded && 'mt-3 min-h-[220px] flex-1',
          )}
          aria-busy={showChartLoading}
        >
          {line.length < 2 && candles.length < 2 ? (
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-2 px-4 text-center',
                chartExpanded ? 'absolute inset-0' : 'h-[280px] sm:h-[340px] lg:h-[380px]',
              )}
            >
              {showChartLoading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-[#3F6F00]" aria-hidden />
                  <p className="text-sm font-medium text-[#64748B]">{t('home.chart.chartLoading')}</p>
                </>
              ) : (
                <>
                  <Crosshair className="h-8 w-8 text-[#CBD5E1]" aria-hidden />
                  <p className="text-sm font-medium text-[#64748B]">{t('home.chart.emptyTitle')}</p>
                  <p className="max-w-sm text-xs text-[#94A3B8]">{t('home.chart.emptyBody')}</p>
                </>
              )}
            </div>
          ) : (
            <div className={cn(chartExpanded && 'absolute inset-0')}>
              <AdvancedMetalChart
                key={chartExpanded ? 'expanded' : 'inline'}
                mode={mode}
                line={line}
                candles={candles}
                locale={locale}
                height={chartExpanded ? 240 : chartHeight}
                fillContainer={chartExpanded}
                positive={positive}
                fitToken={fitToken}
                referencePrice={referencePrice}
                referenceLabel={t('home.chart.prevClose')}
                gesturesEnabled={chartExpanded}
              />
            </div>
          )}

          {showChartLoading && (line.length >= 2 || candles.length >= 2) ? (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2.5 bg-white/75 backdrop-blur-[2px]"
              role="status"
              aria-live="polite"
            >
              <Loader2 className="h-8 w-8 animate-spin text-[#3F6F00]" aria-hidden />
              <p className="text-sm font-semibold text-[#0B0F19]">{t('home.chart.chartLoading')}</p>
            </div>
          ) : null}
        </div>

        <div className={cn('shrink-0', chartExpanded ? 'mt-2 sm:mt-3' : 'mt-3')}>
          <div className="flex flex-col gap-3 border-t border-black/5 pt-3 sm:flex-row sm:items-center sm:justify-between">
            {timeRangeLabel ? (
              <p className="text-xs font-medium text-[#64748B] sm:text-sm">{timeRangeLabel}</p>
            ) : (
              <span />
            )}
          </div>

          {(line.length >= 2 || candles.length >= 2) && (
            <>
              <dl
                className={cn(
                  'mt-3 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-black/5 pt-3 sm:grid-cols-3 lg:grid-cols-5',
                  chartExpanded ? 'gap-y-3 sm:mt-3' : 'mt-4 gap-y-4 pt-4',
                )}
              >
                <StatCell
                  label={t(
                    displayStats.useSessionSnap ? 'home.chart.sessionOpen' : 'home.chart.periodOpen',
                  )}
                  value={displayStats.open}
                />
                <StatCell
                  label={t(
                    displayStats.useSessionSnap ? 'home.chart.sessionHigh' : 'home.chart.periodHigh',
                  )}
                  value={displayStats.high}
                />
                <StatCell
                  label={t(
                    displayStats.useSessionSnap ? 'home.chart.sessionLow' : 'home.chart.periodLow',
                  )}
                  value={displayStats.low}
                />
                <StatCell label={t('home.chart.prevClose')} value={displayStats.prevClose} />
                {metal === 'gold' ? (
                  <StatCell
                    label={t('home.chart.goldYtd')}
                    value={formatPctChange(goldYtdPct)}
                    positive={goldYtdPct == null ? null : goldYtdPct >= 0}
                  />
                ) : null}
              </dl>
              {!chartExpanded ? (
                metal === 'gold' ? (
                  <p className="mt-2 text-[11px] leading-relaxed text-[#94A3B8]">
                    {t('home.chart.statsNote')}
                  </p>
                ) : (
                  <p className="mt-2 text-[11px] leading-relaxed text-[#94A3B8]">
                    {t('home.chart.periodStatsNote')}
                  </p>
                )
              ) : null}
            </>
          )}

          {!chartExpanded ? (
            <div className="mt-3 hidden flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium uppercase tracking-wide text-[#94A3B8] sm:mt-4 sm:flex">
              <span>{t('home.chart.featureZoom')}</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>{t('home.chart.featurePan')}</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>{t('home.chart.featureCrosshair')}</span>
              <span className="text-[#CBD5E1]">·</span>
              <span>{t('home.chart.featureModes')}</span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )

  if (chartExpanded && typeof document !== 'undefined') {
    return (
      <>
        {/* Preserve in-flow height so the page does not jump when the panel portals. */}
        <div
          className="metal-chart-panel rounded-2xl border border-transparent"
          style={{ minHeight: chartHeight + 220 }}
          aria-hidden
        />
        {createPortal(
          <>
            <button
              type="button"
              aria-label={t('home.chart.collapseChart')}
              className="fixed inset-0 z-[190] cursor-default bg-[#0B0F19]/45 backdrop-blur-[2px]"
              onClick={() => setChartExpanded(false)}
            />
            {chartPanel}
          </>,
          document.body,
        )}
      </>
    )
  }

  return chartPanel
}
