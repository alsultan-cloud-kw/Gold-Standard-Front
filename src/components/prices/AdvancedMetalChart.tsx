import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type CandlestickData,
  type LineData,
  type Time,
  type DeepPartial,
  type ChartOptions,
} from 'lightweight-charts'
import type { CandlePoint, LinePoint } from '@/utils/metalChartSeries'
import { cn } from '@/lib/utils'

export type ChartDisplayMode = 'candles' | 'line' | 'area'

type Props = {
  mode: ChartDisplayMode
  line: LinePoint[]
  candles: CandlePoint[]
  locale: string
  /** Used as fixed height, or as min-height when `fillContainer` is true. */
  height?: number
  /**
   * Fill the parent box (expanded overlay). Chart uses lightweight-charts
   * `autoSize` so it tracks container width/height without stale canvases.
   */
  fillContainer?: boolean
  className?: string
  /** When true, chart is bullish (lime); else bearish (rose). */
  positive?: boolean
  /** Increment to force fitContent(). */
  fitToken?: number
  /** Horizontal reference line (e.g. previous close). */
  referencePrice?: number | null
  referenceLabel?: string
  /** Hero embed: hide axes, disable zoom/pan. */
  compact?: boolean
  /**
   * Pinch / drag / wheel zoom-pan. Keep false on inline mobile charts so the
   * page can scroll; enable only in the maximized/expanded overlay.
   */
  gesturesEnabled?: boolean
}

/** Light storefront chart palette — matches site canvas (#F9F9FA / white). */
const PAPER = '#FFFFFF'
const INK = '#0B0F19'
const GRID = 'rgba(15, 23, 42, 0.08)'
const TEXT = '#64748B'
const CROSS = 'rgba(63, 111, 0, 0.45)'
const LIME = '#3F6F00'
const LIME_DIM = 'rgba(133, 227, 7, 0.28)'
const ROSE = '#DC2626'
const ROSE_DIM = 'rgba(220, 38, 38, 0.18)'

/** lightweight-charts requires strictly ascending unique times. */
function sanitizeLine(points: LinePoint[]): LineData[] {
  const sorted = [...points]
    .filter((p) => Number.isFinite(p.time) && Number.isFinite(p.value))
    .sort((a, b) => a.time - b.time)
  const out: LineData[] = []
  for (const p of sorted) {
    const time = p.time as Time
    const last = out[out.length - 1]
    if (last && last.time === time) {
      last.value = p.value
    } else {
      out.push({ time, value: p.value })
    }
  }
  return out
}

function sanitizeCandles(points: CandlePoint[]): CandlestickData[] {
  const sorted = [...points]
    .filter(
      (p) =>
        Number.isFinite(p.time) &&
        Number.isFinite(p.open) &&
        Number.isFinite(p.high) &&
        Number.isFinite(p.low) &&
        Number.isFinite(p.close),
    )
    .sort((a, b) => a.time - b.time)
  const out: CandlestickData[] = []
  for (const p of sorted) {
    const time = p.time as Time
    const row: CandlestickData = {
      time,
      open: p.open,
      high: p.high,
      low: p.low,
      close: p.close,
    }
    const last = out[out.length - 1]
    if (last && last.time === time) {
      out[out.length - 1] = row
    } else {
      out.push(row)
    }
  }
  return out
}

function containerReady(el: HTMLElement): boolean {
  return el.clientWidth >= 2 && el.clientHeight >= 2
}

export function AdvancedMetalChart({
  mode,
  line,
  candles,
  locale,
  height = 340,
  fillContainer = false,
  className,
  positive = true,
  fitToken = 0,
  referencePrice = null,
  referenceLabel = '',
  compact = false,
  gesturesEnabled = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | null>(
    null,
  )
  const priceLineRef = useRef<IPriceLine | null>(null)
  const [chartReady, setChartReady] = useState(0)

  const interactive = !compact && gesturesEnabled

  const clearPriceLine = () => {
    const series = seriesRef.current
    if (series && priceLineRef.current) {
      try {
        series.removePriceLine(priceLineRef.current)
      } catch {
        /* already removed */
      }
    }
    priceLineRef.current = null
  }

  const applyReferenceLine = () => {
    clearPriceLine()
    const series = seriesRef.current
    if (!series || referencePrice == null || !Number.isFinite(referencePrice)) return
    priceLineRef.current = series.createPriceLine({
      price: referencePrice,
      color: 'rgba(100, 116, 139, 0.65)',
      lineWidth: 1,
      lineStyle: LineStyle.Dotted,
      axisLabelVisible: true,
      title: referenceLabel,
      axisLabelColor: '#64748B',
      axisLabelTextColor: '#FFFFFF',
    })
  }

  const interactionOptions = (): DeepPartial<ChartOptions> => ({
    handleScroll: interactive
      ? {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: false,
        }
      : {
          mouseWheel: false,
          pressedMouseMove: false,
          horzTouchDrag: false,
          vertTouchDrag: false,
        },
    handleScale: interactive
      ? {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        }
      : {
          axisPressedMouseMove: false,
          mouseWheel: false,
          pinch: false,
        },
  })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let cancelled = false
    let ro: ResizeObserver | null = null
    let chart: IChartApi | null = null
    let raf = 0

    const options: DeepPartial<ChartOptions> = {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: PAPER },
        textColor: TEXT,
        fontFamily: 'var(--font-ui)',
        fontSize: 12,
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: compact ? 'transparent' : GRID, style: LineStyle.Dotted },
        horzLines: { color: compact ? 'transparent' : GRID, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: compact ? CrosshairMode.Hidden : CrosshairMode.Normal,
        vertLine: {
          color: CROSS,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: INK,
        },
        horzLine: {
          color: CROSS,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: INK,
        },
      },
      leftPriceScale: {
        visible: !compact,
        borderVisible: false,
        scaleMargins: { top: compact ? 0.08 : 0.12, bottom: compact ? 0.05 : 0.08 },
      },
      rightPriceScale: {
        visible: false,
      },
      timeScale: {
        borderVisible: false,
        visible: !compact,
        timeVisible: !compact,
        secondsVisible: false,
        rightOffset: compact ? 0 : 4,
        barSpacing: compact ? 4 : 8,
        minBarSpacing: compact ? 2 : 3,
      },
      ...interactionOptions(),
      localization: {
        locale: 'en-US',
      },
    }

    const mount = () => {
      if (cancelled || chartRef.current || !containerRef.current) return
      if (!containerReady(containerRef.current)) return
      chart = createChart(containerRef.current, options)
      chartRef.current = chart
      seriesRef.current = null
      setChartReady((n) => n + 1)
      requestAnimationFrame(() => {
        if (cancelled) return
        chart?.timeScale().fitContent()
      })
    }

    // Portal / fixed overlays often paint at 0×0 for a frame — wait for real box size.
    const scheduleMount = () => {
      if (cancelled) return
      if (containerReady(el)) {
        mount()
        return
      }
      raf = requestAnimationFrame(scheduleMount)
    }

    scheduleMount()

    ro = new ResizeObserver(() => {
      if (cancelled || !containerRef.current) return
      // Only used to mount once the portal/fixed overlay has a real box size.
      // autoSize keeps width/height in sync after that — do not fitContent on every resize.
      if (!chartRef.current) mount()
    })
    ro.observe(el)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ro?.disconnect()
      chart?.remove()
      chartRef.current = null
      seriesRef.current = null
      priceLineRef.current = null
    }
    // Mount once per compact/locale — size via autoSize + CSS; gestures in a separate effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale, compact, fillContainer])

  useEffect(() => {
    chartRef.current?.applyOptions(interactionOptions())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interactive, chartReady])

  /**
   * Rebuild series whenever mode changes; always push current data in the same pass.
   * Previous split effects left an empty/corrupt series until the user clicked a mode.
   */
  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !chartReady) return

    clearPriceLine()
    if (seriesRef.current) {
      try {
        chart.removeSeries(seriesRef.current)
      } catch {
        /* already removed */
      }
      seriesRef.current = null
    }

    const lineData = sanitizeLine(line)
    const candleData = sanitizeCandles(candles)

    if (mode === 'candles') {
      const s = chart.addCandlestickSeries({
        upColor: LIME,
        downColor: ROSE,
        borderUpColor: LIME,
        borderDownColor: ROSE,
        wickUpColor: LIME,
        wickDownColor: ROSE,
      })
      seriesRef.current = s
      if (candleData.length) s.setData(candleData)
    } else if (mode === 'area') {
      const s = chart.addAreaSeries({
        lineColor: positive ? LIME : ROSE,
        topColor: positive ? LIME_DIM : ROSE_DIM,
        bottomColor: 'rgba(255,255,255,0)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: PAPER,
        crosshairMarkerBackgroundColor: positive ? LIME : ROSE,
      })
      seriesRef.current = s
      if (lineData.length) s.setData(lineData)
    } else {
      const s = chart.addLineSeries({
        color: positive ? LIME : ROSE,
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: PAPER,
        crosshairMarkerBackgroundColor: positive ? LIME : ROSE,
        lastValueVisible: true,
        priceLineVisible: true,
        priceLineColor: positive ? 'rgba(63,111,0,0.35)' : 'rgba(220,38,38,0.35)',
        priceLineWidth: 1,
        priceLineStyle: LineStyle.Dashed,
      })
      seriesRef.current = s
      if (lineData.length) s.setData(lineData)
    }

    applyReferenceLine()
    requestAnimationFrame(() => {
      chart.timeScale().fitContent()
    })
  }, [chartReady, mode, line, candles, positive, referencePrice, referenceLabel])

  useEffect(() => {
    if (!fitToken) return
    let outer = 0
    let inner = 0
    outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        chartRef.current?.timeScale().fitContent()
      })
    })
    const tmr = window.setTimeout(() => {
      chartRef.current?.timeScale().fitContent()
    }, 120)
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
      window.clearTimeout(tmr)
    }
  }, [fitToken])

  return (
    <div
      ref={containerRef}
      className={cn(
        'metal-chart-canvas w-full overflow-hidden bg-white',
        compact ? '' : 'rounded-xl',
        interactive ? 'metal-chart-canvas--gestures' : 'metal-chart-canvas--scroll-friendly',
        fillContainer && 'h-full min-h-0',
        className,
      )}
      style={fillContainer ? { minHeight: height } : { height }}
      role="img"
      aria-label="Metal price chart"
    />
  )
}
