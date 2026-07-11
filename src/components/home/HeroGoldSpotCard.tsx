import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { DaralsabaekPublicRatesResponse } from '@/services/api'
import { METAL_SYMBOL_BY_KEY, pricingApi } from '@/services/pricingApi'
import { AdvancedMetalChart } from '@/components/prices/AdvancedMetalChart'
import { ChartCurrencyToggle } from '@/components/prices/ChartCurrencyToggle'
import {
  buildLineSeries,
  convertLineToOunceCurrency,
  formatPctChange,
  formatPrice,
  ounceUnit,
  seriesChange,
  type OunceCurrency,
} from '@/utils/metalChartSeries'
import { formatLatinFixed } from '@/utils/formatLatinNumber'

type Props = {
  rates: DaralsabaekPublicRatesResponse | undefined
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null
  if (typeof v === 'number' && Number.isFinite(v)) return v
  if (typeof v === 'string') {
    const n = Number(v.trim())
    return Number.isFinite(n) ? n : null
  }
  return null
}

function formatSpotPrice(value: number | null, currency: OunceCurrency): string {
  if (value == null || !Number.isFinite(value)) return '—'
  if (currency === 'USD') return `$${formatPrice(value, 'USD/oz')}`
  return `${formatPrice(value, 'KWD/oz')} KWD`
}

export function HeroGoldSpotCard({ rates }: Props) {
  const { t } = useTranslation()
  const [ounceCurrency, setOunceCurrency] = useState<OunceCurrency>('USD')

  const { data: pricingHistory } = useQuery({
    queryKey: ['pricingHistory', 'gold', '1h', 'hero'],
    queryFn: () => pricingApi.getHistory({ metal: METAL_SYMBOL_BY_KEY.gold, range: '1h' }),
    enabled: rates?.succeeded === true,
    staleTime: 25_000,
    refetchInterval: 30_000,
    retry: 1,
  })

  const { data: currentSnap } = useQuery({
    queryKey: ['pricingCurrent', 'gold', 'hero'],
    queryFn: () => pricingApi.getCurrent('gold'),
    enabled: rates?.succeeded === true,
    staleTime: 25_000,
    retry: 1,
  })

  const goldOunceUsd = numOrNull(rates?.goldOuncePrice)
  const usdToKwdRate = numOrNull(currentSnap?.usd_to_kwd_rate)
  const carats = rates?.carats ?? []
  const gold24 = carats.find((c) => c.key === '24K')
  const buyKwd = numOrNull(gold24?.buyTotal)
  const sellKwd = numOrNull(gold24?.sellTotal)

  const rawPoints = pricingHistory?.points ?? []
  const rawLine = useMemo(
    () => buildLineSeries(rawPoints, 'gold', '1h', goldOunceUsd, true),
    [rawPoints, goldOunceUsd],
  )

  const line = useMemo(
    () => convertLineToOunceCurrency(rawLine, ounceCurrency, usdToKwdRate),
    [rawLine, ounceCurrency, usdToKwdRate],
  )

  const change = useMemo(() => seriesChange(line), [line])
  const positive = change == null ? true : change.abs >= 0
  const spot = line.length ? line[line.length - 1].value : (
    goldOunceUsd != null
      ? ounceCurrency === 'KWD' && usdToKwdRate != null
        ? goldOunceUsd * usdToKwdRate
        : goldOunceUsd
      : null
  )

  const spreadPct = useMemo(() => {
    if (buyKwd == null || sellKwd == null || sellKwd === 0) return null
    return ((buyKwd - sellKwd) / sellKwd) * 100
  }, [buyKwd, sellKwd])

  if (!rates?.succeeded) return null

  return (
    <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
      <div className="border-b border-black/5 px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-[#3F6F00] sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3F6F00] animate-pulse" />
            {t('home.heroSpot.badge')}
          </span>
          <div className="flex items-center gap-2">
            <ChartCurrencyToggle value={ounceCurrency} onChange={setOunceCurrency} />
            <Link
              to="/prices"
              className="text-[11px] font-medium text-[#64748B] transition-colors hover:text-[#3F6F00] sm:text-xs"
            >
              {t('home.heroSpot.viewFull')}
            </Link>
          </div>
        </div>
      </div>

      <Link
        to="/prices"
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#85E307]/50"
        aria-label={t('home.heroSpot.ariaLabel')}
      >
        <div className="px-4 pt-4 sm:px-5 sm:pt-5">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <p className="text-3xl font-bold tabular-nums tracking-tight text-[#0B0F19] sm:text-4xl">
              {formatSpotPrice(spot, ounceCurrency)}
            </p>
            {change ? (
              <span
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-semibold tabular-nums ${
                  positive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                }`}
              >
                {positive ? (
                  <TrendingUp className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" aria-hidden />
                )}
                {formatPctChange(change.pct, 2)} {t('home.heroSpot.changeWindow')}
              </span>
            ) : null}
          </div>

          <p className="mt-1.5 text-xs text-[#64748B] sm:text-sm">
            {ounceCurrency === 'USD'
              ? t('home.heroSpot.unitLine', {
                  kwd: buyKwd != null ? formatLatinFixed(buyKwd, 3) : '—',
                })
              : t('home.heroSpot.unitLineKwdOz', { unit: ounceUnit('KWD') })}
          </p>
        </div>

        <div className="mt-3 px-1 sm:px-2">
          {line.length >= 2 ? (
            <AdvancedMetalChart
              mode="area"
              line={line}
              candles={[]}
              locale="en-US"
              height={148}
              positive={positive}
              compact
            />
          ) : (
            <div className="mx-3 flex h-[148px] items-center justify-center rounded-xl bg-[#F9F9FA] text-sm text-[#64748B]">
              {t('home.heroSpot.chartLoading')}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-px border-y border-black/5 bg-black/5 mx-0 mt-2">
          <div className="bg-[#F9F9FA] px-3 py-3 sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748B] sm:text-[11px]">
              {t('common.buy')}
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#0B0F19] sm:text-base">
              {buyKwd != null ? `${formatLatinFixed(buyKwd, 3)}` : '—'}
              <span className="ms-0.5 text-[10px] font-medium text-[#64748B]">{t('common.kwdPerGramShort')}</span>
            </p>
          </div>
          <div className="bg-[#F9F9FA] px-3 py-3 sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748B] sm:text-[11px]">
              {t('common.sell')}
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#0B0F19] sm:text-base">
              {sellKwd != null ? `${formatLatinFixed(sellKwd, 3)}` : '—'}
              <span className="ms-0.5 text-[10px] font-medium text-[#64748B]">{t('common.kwdPerGramShort')}</span>
            </p>
          </div>
          <div className="bg-[#F9F9FA] px-3 py-3 sm:px-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#64748B] sm:text-[11px]">
              {t('home.heroSpot.spread')}
            </p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-[#3F6F00] sm:text-base">
              {spreadPct != null ? `${spreadPct.toFixed(1)}%` : '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-4 py-3 text-[11px] text-[#64748B] sm:px-5 sm:text-xs">
          <span>{t('home.heroSpot.marketStatus')}</span>
          <span className="font-medium tabular-nums">
            {buyKwd != null ? `${formatLatinFixed(buyKwd, 3)} ${t('common.kwdPerGramShort')}` : '—'}
          </span>
        </div>
      </Link>
    </div>
  )
}
