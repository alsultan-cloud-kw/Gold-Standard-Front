import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import {
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { adminApi, type DaralsabaekPublicRatesResponse } from '@/services/api'
import { METAL_SYMBOL_BY_KEY, pricingApi } from '@/services/pricingApi'

type MetalTab = 'gold' | 'silver' | 'platinum' | 'palladium'
type ChartRange = 'live' | '1h' | '1d' | '1w'

type ChartPoint = { t: string; v: number }

const RANGE_OPTIONS: { key: ChartRange; menuLabel: string }[] = [
  { key: 'live', menuLabel: '10 Mins' },
  { key: '1h', menuLabel: '1 Hour' },
  { key: '1d', menuLabel: '1 Day' },
  { key: '1w', menuLabel: '1 Week' },
]

function rangeMenuLabel(key: ChartRange): string {
  return RANGE_OPTIONS.find((o) => o.key === key)?.menuLabel ?? '1 Hour'
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

function rangeBackMs(r: ChartRange): number {
  switch (r) {
    case 'live':
      return 10 * 60 * 1000
    case '1h':
      return 60 * 60 * 1000
    case '1d':
      return 24 * 60 * 60 * 1000
    case '1w':
      return 7 * 24 * 60 * 60 * 1000
    default:
      return 24 * 60 * 60 * 1000
  }
}

function formatChartTick(d: Date, range: ChartRange) {
  if (range === '1w') {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  if (range === '1d') {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
}

function bucketMsForRange(range: ChartRange): number {
  switch (range) {
    // Short ranges: keep minute-by-minute movement.
    case 'live':
    case '1h':
      return 60_000
    // Longer ranges: aggregate for readability.
    case '1d':
      return 15 * 60_000
    case '1w':
      return 60 * 60_000
    default:
      return 60_000
  }
}

function aggregatePointsByBucket(points: ChartPoint[], range: ChartRange): ChartPoint[] {
  if (points.length <= 2) return points
  const bucketMs = bucketMsForRange(range)
  const grouped = new Map<number, ChartPoint>()
  for (const p of points) {
    const ts = new Date(p.t).getTime()
    if (!Number.isFinite(ts)) continue
    const bucketStart = Math.floor(ts / bucketMs) * bucketMs
    // Keep the latest point inside each bucket so chart reflects the most recent value in that interval.
    const prev = grouped.get(bucketStart)
    if (!prev || new Date(prev.t).getTime() <= ts) {
      grouped.set(bucketStart, p)
    }
  }
  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, p]) => p)
}

function normalizeShortRangeToOneMinute(points: ChartPoint[], range: ChartRange): ChartPoint[] {
  if ((range !== 'live' && range !== '1h') || points.length === 0) return points

  const sorted = [...points]
    .map((p) => ({ ...p, ms: new Date(p.t).getTime() }))
    .filter((p) => Number.isFinite(p.ms))
    .sort((a, b) => a.ms - b.ms)

  if (sorted.length === 0) return points

  const minuteMs = 60_000
  const startMs = Math.floor(sorted[0].ms / minuteMs) * minuteMs
  const endMs = Math.floor(sorted[sorted.length - 1].ms / minuteMs) * minuteMs

  let idx = 0
  let currentV = sorted[0].v
  const minuteSeries: ChartPoint[] = []

  for (let ts = startMs; ts <= endMs; ts += minuteMs) {
    while (idx < sorted.length && sorted[idx].ms <= ts) {
      currentV = sorted[idx].v
      idx += 1
    }
    minuteSeries.push({ t: new Date(ts).toISOString(), v: currentV })
  }

  return minuteSeries.length > 0 ? minuteSeries : points
}

function buildChartPoints(
  historyPoints: ChartPoint[],
  liveV: number | null,
  chartRange: ChartRange,
): ChartPoint[] {
  let pts = historyPoints.map((p) => ({ ...p, v: p.v }))
  const nowIso = new Date().toISOString()

  if (liveV != null) {
    if (pts.length === 0) {
      const t0 = new Date(Date.now() - rangeBackMs(chartRange)).toISOString()
      return [
        { t: t0, v: liveV },
        { t: nowIso, v: liveV },
      ]
    }
    const last = pts[pts.length - 1]
    if (Math.abs(last.v - liveV) > 1e-9 || pts.length === 1) {
      pts = [...pts, { t: nowIso, v: liveV }]
    } else {
      pts = [...pts.slice(0, -1), { t: nowIso, v: liveV }]
    }
  }

  if (pts.length === 1) {
    const t0 = new Date(new Date(pts[0].t).getTime() - 60_000).toISOString()
    pts = [{ t: t0, v: pts[0].v }, pts[0]]
  }

  return pts
}

type Props = {
  rates: DaralsabaekPublicRatesResponse | undefined
}

export function PricesHistoryChart({ rates }: Props) {
  const [metal, setMetal] = useState<MetalTab>('gold')
  const [chartRange, setChartRange] = useState<ChartRange>('1h')

  // Prefer the unified `/api/prices/history/` endpoint (GoldAPI-backed snapshots).
  // Fall back to the legacy `/scraping/daralsabaek/price-history/` for gold/silver/platinum if
  // the new endpoint has no rows yet (Celery beat populates it on the server).
  const { data: pricingHistory, isFetching: pricingHistoryFetching } = useQuery({
    queryKey: ['pricingHistory', metal, chartRange],
    queryFn: () =>
      pricingApi.getHistory({ metal: METAL_SYMBOL_BY_KEY[metal], range: chartRange }),
    enabled: rates?.succeeded === true,
    staleTime: 25_000,
    retry: 1,
  })
  const newHistoryAvailable = (pricingHistory?.points?.length ?? 0) > 0

  const { data: legacyHistoryData, isFetching: legacyHistoryFetching } = useQuery({
    queryKey: ['metalPriceHistoryLegacy', metal, chartRange],
    queryFn: () => adminApi.getMetalPriceHistory({ metal, range: chartRange }),
    enabled: rates?.succeeded === true && !newHistoryAvailable && metal !== 'palladium',
    staleTime: 25_000,
  })
  const historyFetching = pricingHistoryFetching || legacyHistoryFetching

  // Normalize both responses into ChartPoint[] for the existing renderer.
  const historyData = useMemo(() => {
    if (newHistoryAvailable && pricingHistory) {
      const usePriceField = chartRange === 'live' || chartRange === '1h' || metal !== 'gold'
      const points: ChartPoint[] = pricingHistory.points
        .map((p) => ({
          t: p.t,
          v:
            // Gold short-range chart prefers troy-ounce price (USD/oz); other ranges use 24K KWD/g.
            metal === 'gold'
              ? Number(p.price ?? p.price_gram_24k ?? 0)
              : Number(p.price_gram_24k ?? p.price ?? 0),
        }))
        .filter((p) => Number.isFinite(p.v))
      return {
        metal,
        range: chartRange,
        unit:
          metal === 'gold'
            ? usePriceField
              ? 'USD/oz'
              : 'KWD/g'
            : 'KWD/g',
        points,
      }
    }
    return legacyHistoryData
  }, [newHistoryAvailable, pricingHistory, legacyHistoryData, metal, chartRange])

  const carats = rates?.carats ?? []
  const byKey = useMemo(() => new Map(carats.map((c) => [c.key, c])), [carats])

  const goldOuncePrice = numOrNull(rates?.goldOuncePrice)
  const updateEverySec =
    typeof rates?.updateIntervalInSeconds === 'number' ? Math.max(1, Math.round(rates.updateIntervalInSeconds)) : 3

  const chartUnit = useMemo(() => {
    if (historyData?.unit) return historyData.unit
    if (metal !== 'gold') return 'KWD/g'
    return goldOuncePrice != null ? 'USD/oz' : 'KWD/g'
  }, [historyData?.unit, metal, goldOuncePrice])

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

  const chartPoints = useMemo(() => {
    const hp = (historyData?.points ?? []) as ChartPoint[]
    const withLive = buildChartPoints(hp, liveChartV, chartRange)
    const grouped = aggregatePointsByBucket(withLive, chartRange)
    return normalizeShortRangeToOneMinute(grouped, chartRange)
  }, [historyData?.points, liveChartV, chartRange])

  const chartRows = useMemo(
    () =>
      chartPoints.map((p) => ({
        t: p.t,
        v: p.v,
        label: formatChartTick(new Date(p.t), chartRange),
      })),
    [chartPoints, chartRange],
  )

  const shortRangeUsdTicks = useMemo(() => {
    const shouldUseOneDollarStep =
      (chartRange === 'live' || chartRange === '1h') && chartUnit === 'USD/oz'
    if (!shouldUseOneDollarStep || chartRows.length === 0) return null

    const values = chartRows.map((r) => r.v).filter((v) => Number.isFinite(v))
    if (values.length === 0) return null

    const minV = Math.min(...values)
    const maxV = Math.max(...values)
    const pad = minV === maxV ? 1 : 0
    const start = Math.floor(minV - pad)
    const end = Math.ceil(maxV + pad)

    const ticks: number[] = []
    for (let v = start; v <= end; v += 1) ticks.push(v)
    return ticks.length > 0 ? ticks : null
  }, [chartRange, chartUnit, chartRows])

  // GoldAPI.io feed always includes these four metals — show all tabs (not only when API field exists).
  const METAL_TABS: { id: MetalTab; label: string }[] = [
    { id: 'gold', label: 'Gold' },
    { id: 'silver', label: 'Silver' },
    { id: 'platinum', label: 'Platinum' },
    { id: 'palladium', label: 'Palladium' },
  ]

  if (!rates?.succeeded) return null

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 sm:p-8 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 mb-5">
        {METAL_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMetal(id)}
            className={`px-5 py-2.5 rounded-lg text-base font-semibold transition-colors ${
              metal === id
                ? 'bg-lime-500 text-black shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <p className="text-sm text-stone-500 flex-1">
          Prices will be updated in {String(updateEverySec).padStart(2, '0')} sec
          {historyFetching ? ' · …' : ''}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="text-base font-semibold text-stone-800 outline-none focus-visible:ring-2 focus-visible:ring-lime-500/50 rounded px-1 py-0.5 shrink-0 data-[state=open]:opacity-90"
            type="button"
          >
            {rangeMenuLabel(chartRange)} ▼
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="min-w-[10rem] bg-white border border-stone-200 text-stone-900 shadow-lg"
          >
            {RANGE_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.key}
                className="cursor-pointer focus:bg-lime-100 focus:text-black flex items-center justify-between gap-2"
                onClick={() => setChartRange(opt.key)}
              >
                <span>{opt.menuLabel}</span>
                {chartRange === opt.key ? <Check className="w-4 h-4 text-lime-700 shrink-0" aria-hidden /> : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="text-base font-semibold text-stone-900 mb-1">Chart ({chartUnit})</h3>
      <p className="text-xs sm:text-sm text-stone-500 leading-relaxed mb-5">
        10 mins and 1 hour show minute-by-minute changes. 1 day and 1 week are grouped into larger intervals for readability.
      </p>

      <div className="w-full h-[260px] sm:h-[280px] -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(82, 82, 91, 0.9)', fontSize: 12 }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={{ stroke: 'rgba(0,0,0,0.08)' }}
            />
            <YAxis
              tick={{ fill: 'rgba(82, 82, 91, 0.9)', fontSize: 12 }}
              width={56}
              tickLine={false}
              axisLine={{ stroke: 'rgba(0,0,0,0.08)' }}
              domain={shortRangeUsdTicks ? [shortRangeUsdTicks[0], shortRangeUsdTicks[shortRangeUsdTicks.length - 1]] : ['auto', 'auto']}
              ticks={shortRangeUsdTicks ?? undefined}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 8,
                fontSize: 14,
                color: '#0a0a0a',
              }}
              labelStyle={{ color: '#52525b' }}
              formatter={(value: number) => [Number(value).toFixed(4), chartUnit]}
            />
            <Line
              type="monotone"
              dataKey="v"
              stroke="#65a30d"
              strokeWidth={2}
              dot={{ r: 3.5, fill: '#84cc16', stroke: 'rgba(0,0,0,0.12)', strokeWidth: 2 }}
              activeDot={{ r: 5 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
