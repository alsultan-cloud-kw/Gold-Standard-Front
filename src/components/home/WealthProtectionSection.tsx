import { useEffect, useId, useMemo, useRef, useState, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader'
import { BullionEndDock } from '@/components/home/bullion'
import {
  WEALTH_BAR_CHART,
  WEALTH_TIMELINE_POINTS,
} from '@/constants/wealthProtection'
import { cn } from '@/lib/utils'

/** Replays enter animation every time the node scrolls into view. */
function useReplayOnView<T extends HTMLElement>(threshold = 0.35) {
  const ref = useRef<T | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setActive(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting)
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, active }
}

function buildSeriesPath(
  values: number[],
  width: number,
  height: number,
  paddingX: number,
  paddingY: number,
  max: number,
): string {
  if (values.length < 2 || max <= 0) return ''
  const innerW = width - paddingX * 2
  const innerH = height - paddingY * 2
  const step = innerW / (values.length - 1)

  return values
    .map((value, index) => {
      const x = paddingX + index * step
      const y = paddingY + innerH - (Math.min(value, max) / max) * innerH
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

function buildAreaPath(
  values: number[],
  width: number,
  height: number,
  paddingX: number,
  paddingY: number,
  max: number,
): string {
  const line = buildSeriesPath(values, width, height, paddingX, paddingY, max)
  if (!line) return ''
  const innerW = width - paddingX * 2
  const baseY = height - paddingY
  const endX = paddingX + innerW
  return `${line} L ${endX.toFixed(2)} ${baseY.toFixed(2)} L ${paddingX.toFixed(2)} ${baseY.toFixed(2)} Z`
}

type MetricProps = {
  variant: 'cash' | 'gold'
  title: string
  start: string
  end: string
  change: string
}

function MetricBlock({ variant, title, start, end, change }: MetricProps) {
  const { t } = useTranslation()
  const isCash = variant === 'cash'

  return (
    <div className="flex flex-col gap-3 px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
          {title}
        </p>
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
            isCash ? 'bg-[#FEF2F2] text-[#B91C1C]' : 'bg-[#F7FEE7] text-[#3F6F00]',
          )}
        >
          {isCash ? (
            <TrendingDown className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          ) : (
            <TrendingUp className="h-3 w-3" strokeWidth={2.5} aria-hidden />
          )}
          {change}
        </span>
      </div>

      <div>
        <p className="text-2xl font-bold tabular-nums tracking-tight text-[#0B0F19] sm:text-3xl">
          {end}
        </p>
        <p className="mt-1 text-sm text-[#94A3B8]">
          <span className="tabular-nums">{start}</span>
          <span className="mx-1.5 text-[#CBD5E1]">·</span>
          <span>{t('home.wealthProtection.baseline')}</span>
        </p>
      </div>
    </div>
  )
}

function WealthTimelineChart({ active }: { active: boolean }) {
  const { t } = useTranslation()
  const cashGradientId = useId().replace(/:/g, '')
  const goldGradientId = useId().replace(/:/g, '')

  const cashValues = useMemo(() => WEALTH_TIMELINE_POINTS.map((p) => p.cash), [])
  const goldValues = useMemo(() => WEALTH_TIMELINE_POINTS.map((p) => p.gold), [])

  const width = 560
  const chartHeight = 88
  const paddingX = 8
  const paddingY = 10

  const cashLine = buildSeriesPath(cashValues, width, chartHeight, paddingX, paddingY, 100)
  const cashArea = buildAreaPath(cashValues, width, chartHeight, paddingX, paddingY, 100)
  const goldLine = buildSeriesPath(goldValues, width, chartHeight, paddingX, paddingY, 2400)
  const goldArea = buildAreaPath(goldValues, width, chartHeight, paddingX, paddingY, 2400)

  return (
    <div className="border-t border-black/5 px-4 py-5 sm:px-6 sm:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94A3B8]">
          {t('home.wealthProtection.timelineTitle')}
        </p>
        <p className="text-[11px] text-[#94A3B8]">{t('home.wealthProtection.timelineNote')}</p>
      </div>

      <div className="space-y-5">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#3F6F00]">
              {t('home.wealthProtection.gold.title')}
            </span>
            <span className="text-[11px] tabular-nums text-[#94A3B8]">
              {t('home.wealthProtection.amounts.goldToday')}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${width} ${chartHeight}`}
            className="h-[72px] w-full sm:h-[88px]"
            role="img"
            aria-label={t('home.wealthProtection.gold.title')}
          >
            <defs>
              <linearGradient id={goldGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(133, 227, 7, 0.22)" />
                <stop offset="100%" stopColor="rgba(133, 227, 7, 0)" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                x1={paddingX}
                x2={width - paddingX}
                y1={paddingY + (chartHeight - paddingY * 2) * ratio}
                y2={paddingY + (chartHeight - paddingY * 2) * ratio}
                stroke="rgba(15, 23, 42, 0.06)"
                strokeDasharray="3 4"
              />
            ))}
            <path
              d={goldArea}
              fill={`url(#${goldGradientId})`}
              className={cn('wealth-series-fill', active && 'wealth-series-fill--gold is-active')}
            />
            <path
              d={goldLine}
              fill="none"
              stroke="#3F6F00"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn('wealth-series-line', active && 'wealth-series-line--gold is-active')}
            />
          </svg>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-[#B91C1C]">
              {t('home.wealthProtection.cash.title')}
            </span>
            <span className="text-[11px] tabular-nums text-[#94A3B8]">
              {t('home.wealthProtection.amounts.cashToday')}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${width} ${chartHeight}`}
            className="h-[72px] w-full sm:h-[88px]"
            role="img"
            aria-label={t('home.wealthProtection.cash.title')}
          >
            <defs>
              <linearGradient id={cashGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(220, 38, 38, 0.14)" />
                <stop offset="100%" stopColor="rgba(220, 38, 38, 0)" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((ratio) => (
              <line
                key={ratio}
                x1={paddingX}
                x2={width - paddingX}
                y1={paddingY + (chartHeight - paddingY * 2) * ratio}
                y2={paddingY + (chartHeight - paddingY * 2) * ratio}
                stroke="rgba(15, 23, 42, 0.06)"
                strokeDasharray="3 4"
              />
            ))}
            <path
              d={cashArea}
              fill={`url(#${cashGradientId})`}
              className={cn('wealth-series-fill', active && 'wealth-series-fill--cash is-active')}
            />
            <path
              d={cashLine}
              fill="none"
              stroke="#DC2626"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={cn('wealth-series-line', active && 'wealth-series-line--cash is-active')}
            />
          </svg>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-5 gap-1 border-t border-black/5 pt-4">
        {WEALTH_TIMELINE_POINTS.map((point) => (
          <span
            key={point.id}
            className="text-center text-[10px] font-medium text-[#94A3B8] sm:text-xs"
          >
            {t(point.labelKey)}
          </span>
        ))}
      </div>
    </div>
  )
}

function WealthValueBarChart() {
  const { t } = useTranslation()
  const { ref, active } = useReplayOnView<HTMLDivElement>(0.4)

  const width = 560
  const height = 300
  const pad = { top: 36, right: 92, bottom: 72, left: 20 }
  const plotW = width - pad.left - pad.right
  const plotH = height - pad.top - pad.bottom
  const { maxValue, startValue, goldValue, cashValue, yTicks } = WEALTH_BAR_CHART

  const yAt = (value: number) => pad.top + plotH - (value / maxValue) * plotH
  const barW = 64
  const gap = 88
  const goldX = pad.left + plotW / 2 - gap / 2 - barW
  const cashX = pad.left + plotW / 2 + gap / 2
  const floorY = pad.top + plotH
  const baselineY = yAt(startValue)
  const goldTop = yAt(goldValue)
  const cashH = Math.max(14, (cashValue / maxValue) * plotH)
  const cashTop = floorY - cashH
  const goldH = Math.max(4, floorY - goldTop)

  return (
        <div
          ref={ref}
          data-bullion-clear-zone="wealth-bar-chart"
          className={cn(
            'wealth-bar-chart relative mt-6 rounded-2xl border border-black/10 bg-white px-4 py-6 shadow-sm sm:mt-8 sm:px-8 sm:py-8',
            active && 'is-active',
          )}
        >
      <h3 className="wealth-bar-chart__title text-center text-base font-bold text-[#0B0F19] sm:text-lg">
        {t('home.wealthProtection.chart.title')}
      </h3>
      <p className="wealth-bar-chart__note mx-auto mt-1 max-w-lg text-center text-xs text-[#94A3B8] sm:text-sm">
        {t('home.wealthProtection.chart.note')}
      </p>

      <div className="mx-auto mt-6 max-w-2xl">
        <div className="mb-4 flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <span className="wealth-bar-chart__badge wealth-bar-chart__badge--gold inline-flex items-center rounded-full bg-[#F7FEE7] px-3 py-1 text-[11px] font-semibold text-[#3F6F00]">
            {t('home.wealthProtection.chart.goldGain')}
          </span>
          <span className="wealth-bar-chart__badge wealth-bar-chart__badge--cash inline-flex items-center rounded-full bg-[#FEF2F2] px-3 py-1 text-[11px] font-semibold text-[#B91C1C]">
            {t('home.wealthProtection.chart.cashLoss')}
          </span>
        </div>

        <div dir="ltr">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-auto w-full"
            role="img"
            aria-label={t('home.wealthProtection.chart.title')}
          >
            {yTicks
              .filter((tick) => tick.value !== startValue)
              .map((tick) => {
                const y = yAt(tick.value)
                return (
                  <g key={tick.value}>
                    <line
                      x1={pad.left}
                      x2={width - pad.right}
                      y1={y}
                      y2={y}
                      stroke="rgba(15, 23, 42, 0.07)"
                      strokeDasharray="3 5"
                    />
                    <text
                      x={width - pad.right + 10}
                      y={y + 3.5}
                      className="wealth-bar-chart__axis fill-[#94A3B8] text-[10px] font-medium"
                      style={{ fontFamily: 'inherit' }}
                    >
                      {t(tick.labelKey)}
                    </text>
                  </g>
                )
              })}

            <line
              x1={pad.left}
              x2={width - pad.right}
              y1={baselineY}
              y2={baselineY}
              stroke="rgba(100, 116, 139, 0.5)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
            <rect
              x={pad.left}
              y={baselineY - 22}
              width={118}
              height={18}
              rx="4"
              fill="#FFFFFF"
              stroke="rgba(15, 23, 42, 0.08)"
              className="wealth-bar-chart__baseline"
            />
            <text
              x={pad.left + 8}
              y={baselineY - 9}
              className="wealth-bar-chart__baseline fill-[#64748B] text-[10px] font-semibold"
              style={{ fontFamily: 'inherit' }}
            >
              {t('home.wealthProtection.chart.startLine')}
            </text>
            <text
              x={width - pad.right + 10}
              y={baselineY + 3.5}
              className="wealth-bar-chart__axis fill-[#64748B] text-[10px] font-semibold"
              style={{ fontFamily: 'inherit' }}
            >
              {t('home.wealthProtection.chart.axis100k')}
            </text>

            <rect
              x={goldX}
              y={goldTop}
              width={barW}
              height={goldH}
              rx="4"
              className={cn('wealth-bar-chart__bar wealth-bar-chart__bar--gold', active && 'is-active')}
              fill="#3F6F00"
            />
            <rect
              x={cashX}
              y={cashTop}
              width={barW}
              height={cashH}
              rx="3"
              className={cn('wealth-bar-chart__bar wealth-bar-chart__bar--cash', active && 'is-active')}
              fill="#DC2626"
            />

            <text
              x={goldX + barW / 2}
              y={goldTop - 10}
              textAnchor="middle"
              className="wealth-bar-chart__label wealth-bar-chart__label--gold fill-[#3F6F00] text-[12px] font-bold"
              style={{ fontFamily: 'inherit' }}
            >
              {t(WEALTH_BAR_CHART.goldLabelKey)}
            </text>

            <line
              x1={cashX + barW}
              x2={cashX + barW + 14}
              y1={cashTop + cashH / 2}
              y2={cashTop + cashH / 2}
              stroke="#DC2626"
              strokeWidth="1.25"
              className="wealth-bar-chart__label wealth-bar-chart__label--cash"
            />
            <rect
              x={cashX + barW + 14}
              y={cashTop + cashH / 2 - 12}
              width={92}
              height={24}
              rx="6"
              fill="#FEF2F2"
              className="wealth-bar-chart__label wealth-bar-chart__label--cash"
            />
            <text
              x={cashX + barW + 60}
              y={cashTop + cashH / 2 + 4}
              textAnchor="middle"
              className="wealth-bar-chart__label wealth-bar-chart__label--cash fill-[#B91C1C] text-[11px] font-bold"
              style={{ fontFamily: 'inherit' }}
            >
              {t(WEALTH_BAR_CHART.cashLabelKey)}
            </text>

            <text
              x={goldX + barW / 2}
              y={height - 28}
              textAnchor="middle"
              className="wealth-bar-chart__caption fill-[#0B0F19] text-[11px] font-semibold"
              style={{ fontFamily: 'inherit' }}
            >
              {t('home.wealthProtection.gold.title')}
            </text>
            <text
              x={cashX + barW / 2}
              y={height - 28}
              textAnchor="middle"
              className="wealth-bar-chart__caption fill-[#0B0F19] text-[11px] font-semibold"
              style={{ fontFamily: 'inherit' }}
            >
              {t('home.wealthProtection.cash.title')}
            </text>
            <text
              x={goldX + barW / 2}
              y={height - 12}
              textAnchor="middle"
              className="wealth-bar-chart__caption fill-[#94A3B8] text-[10px] font-medium"
              style={{ fontFamily: 'inherit' }}
            >
              {t('home.wealthProtection.chart.today')}
            </text>
            <text
              x={cashX + barW / 2}
              y={height - 12}
              textAnchor="middle"
              className="wealth-bar-chart__caption fill-[#94A3B8] text-[10px] font-medium"
              style={{ fontFamily: 'inherit' }}
            >
              {t('home.wealthProtection.chart.today')}
            </text>
          </svg>
        </div>

        <p className="wealth-bar-chart__footnote mx-auto mt-4 max-w-lg text-center text-xs leading-relaxed text-[#64748B] sm:text-[13px]">
          {t('home.wealthProtection.chart.footnote')}
        </p>
      </div>
    </div>
  )
}

export function WealthProtectionSection({
  bullionDockRef,
}: {
  bullionDockRef?: RefObject<HTMLDivElement | null>
}) {
  const { t } = useTranslation()
  const { ref, active } = useReplayOnView<HTMLDivElement>(0.22)

  return (
    <section className="home-section home-section--compact home-section--flush-top" id="wealth-protection">
      <div className="home-section-inner">
        {bullionDockRef ? (
          <BullionEndDock
            slotRef={bullionDockRef}
            size="default"
            className="mb-5 sm:mb-6"
          />
        ) : null}

        <HomeSectionHeader
          kicker={t('home.wealthProtection.kicker')}
          title={t('home.wealthProtection.title')}
          subtitle={t('home.wealthProtection.subtitle')}
          align="center"
        />

        <div
          ref={ref}
          data-bullion-clear-zone="wealth-timeline"
          className={cn(
            'relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm',
            active && 'is-active',
          )}
        >
          <div className="grid divide-y border-b border-black/5 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
            <MetricBlock
              variant="cash"
              title={t('home.wealthProtection.cash.title')}
              start={t('home.wealthProtection.amounts.start')}
              end={t('home.wealthProtection.amounts.cashToday')}
              change={t('home.wealthProtection.cash.metric')}
            />
            <MetricBlock
              variant="gold"
              title={t('home.wealthProtection.gold.title')}
              start={t('home.wealthProtection.amounts.start')}
              end={t('home.wealthProtection.amounts.goldToday')}
              change={t('home.wealthProtection.gold.metric')}
            />
          </div>

          <WealthTimelineChart active={active} />
        </div>

        <WealthValueBarChart />

        <div className="mt-6 text-center sm:mt-8">
          <Link
            to="/products"
            className="group inline-flex w-full max-w-md items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-8 py-4 text-base font-bold text-[#85E307] shadow-[0_8px_24px_rgba(11,15,25,0.18)] transition-all hover:bg-[#1F2937] sm:w-auto sm:min-w-[320px]"
          >
            {t('home.wealthProtection.cta')}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </Link>
          <p className="mt-3 text-xs text-[#94A3B8]">{t('home.wealthProtection.ctaNote')}</p>
        </div>
      </div>
    </section>
  )
}
