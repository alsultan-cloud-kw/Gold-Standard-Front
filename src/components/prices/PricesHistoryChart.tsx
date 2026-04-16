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

type MetalTab = 'gold' | 'silver' | 'platinum'
type ChartRange = 'live' | '1h' | '1d' | '1w'

type ChartPoint = { t: string; v: number }

const RANGE_OPTIONS: { key: ChartRange; menuLabel: string }[] = [
  { key: 'live', menuLabel: '10 Mins' },
  { key: '1h', menuLabel: '1 Hour' },
  { key: '1d', menuLabel: '1 Day' },
  { key: '1w', menuLabel: '1 Week' },
]

function rangeMenuLabel(key: ChartRange): string {
  return RANGE_OPTIONS.find((o) => o.key === key)?.menuLabel ?? '1 Day'
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
      return 45 * 60 * 1000
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
  if (range === '1w' || range === '1d') {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
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
  const [chartRange, setChartRange] = useState<ChartRange>('1d')

  const { data: historyData, isFetching: historyFetching } = useQuery({
    queryKey: ['metalPriceHistory', metal, chartRange],
    queryFn: () => adminApi.getMetalPriceHistory({ metal, range: chartRange }),
    enabled: rates?.succeeded === true,
    staleTime: 25_000,
  })

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
    return numOrNull(rates.platinum?.buyTotal)
  }, [metal, chartUnit, rates, byKey, goldOuncePrice])

  const chartPoints = useMemo(() => {
    const hp = (historyData?.points ?? []) as ChartPoint[]
    return buildChartPoints(hp, liveChartV, chartRange)
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

  const showSilverTab =
    rates?.silver?.buyTotal != null ||
    rates?.silver?.sellTotal != null
  const showPlatinumTab =
    rates?.platinum?.buyTotal != null ||
    rates?.platinum?.sellTotal != null

  if (!rates?.succeeded) return null

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMetal('gold')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            metal === 'gold'
              ? 'bg-lime-500 text-black shadow-sm'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          Gold
        </button>
        {showSilverTab ? (
          <button
            type="button"
            onClick={() => setMetal('silver')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              metal === 'silver'
                ? 'bg-lime-500 text-black shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Silver
          </button>
        ) : null}
        {showPlatinumTab ? (
          <button
            type="button"
            onClick={() => setMetal('platinum')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              metal === 'platinum'
                ? 'bg-lime-500 text-black shadow-sm'
                : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
            }`}
          >
            Platinum
          </button>
        ) : null}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
        <p className="text-xs text-stone-500 flex-1">
          Prices will be updated in {String(updateEverySec).padStart(2, '0')} sec
          {historyFetching ? ' · …' : ''}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="text-sm font-semibold text-stone-800 outline-none focus-visible:ring-2 focus-visible:ring-lime-500/50 rounded px-1 py-0.5 shrink-0 data-[state=open]:opacity-90"
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

      <h3 className="text-sm font-semibold text-stone-900 mb-1">Chart ({chartUnit})</h3>
      <p className="text-[10px] text-stone-500 leading-relaxed mb-4">
        Saved server-side (~7 days). Points are recorded about every 50s when the feed is up.
      </p>

      <div className="w-full h-[220px] -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsLineChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(82, 82, 91, 0.9)', fontSize: 10 }}
              interval="preserveStartEnd"
              tickLine={false}
              axisLine={{ stroke: 'rgba(0,0,0,0.08)' }}
            />
            <YAxis
              tick={{ fill: 'rgba(82, 82, 91, 0.9)', fontSize: 10 }}
              width={48}
              tickLine={false}
              axisLine={{ stroke: 'rgba(0,0,0,0.08)' }}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                border: '1px solid rgba(0, 0, 0, 0.1)',
                borderRadius: 8,
                fontSize: 12,
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
