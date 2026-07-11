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
  type AreaData,
  type Time,
  type DeepPartial,
  type ChartOptions,
} from 'lightweight-charts'
import type { CandlePoint, LinePoint } from '@/utils/metalChartSeries'

export type ChartDisplayMode = 'candles' | 'line' | 'area'

type Props = {
  mode: ChartDisplayMode
  line: LinePoint[]
  candles: CandlePoint[]
  locale: string
  height?: number
  /** When true, chart is bullish (lime); else bearish (rose). */
  positive?: boolean
  /** Increment to force fitContent(). */
  fitToken?: number
  /** Horizontal reference line (e.g. previous close). */
  referencePrice?: number | null
  referenceLabel?: string
  /** Hero embed: hide axes, disable zoom/pan. */
  compact?: boolean
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

function toLineData(points: LinePoint[]): LineData[] {
  return points.map((p) => ({ time: p.time as Time, value: p.value }))
}

function toCandleData(points: CandlePoint[]): CandlestickData[] {
  return points.map((p) => ({
    time: p.time as Time,
    open: p.open,
    high: p.high,
    low: p.low,
    close: p.close,
  }))
}

function toAreaData(points: LinePoint[]): AreaData[] {
  return points.map((p) => ({ time: p.time as Time, value: p.value }))
}

export function AdvancedMetalChart({
  mode,
  line,
  candles,
  locale,
  height = 340,
  positive = true,
  fitToken = 0,
  referencePrice = null,
  referenceLabel = '',
  compact = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | null>(
    null,
  )
  const priceLineRef = useRef<IPriceLine | null>(null)
  const [chartReady, setChartReady] = useState(0)

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

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const options: DeepPartial<ChartOptions> = {
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
      handleScroll: compact
        ? {
            mouseWheel: false,
            pressedMouseMove: false,
            horzTouchDrag: false,
            vertTouchDrag: false,
          }
        : {
            mouseWheel: true,
            pressedMouseMove: true,
            horzTouchDrag: true,
            vertTouchDrag: false,
          },
      handleScale: compact
        ? {
            axisPressedMouseMove: false,
            mouseWheel: false,
            pinch: false,
          }
        : {
            axisPressedMouseMove: true,
            mouseWheel: true,
            pinch: true,
          },
      localization: {
        locale: 'en-US',
      },
    }

    const chart = createChart(el, {
      ...options,
      width: el.clientWidth,
      height,
    })
    chartRef.current = chart
    seriesRef.current = null
    setChartReady((n) => n + 1)

    const ro = new ResizeObserver(() => {
      if (!containerRef.current || !chartRef.current) return
      chartRef.current.applyOptions({
        width: containerRef.current.clientWidth,
        height,
      })
    })
    ro.observe(el)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [locale, height, compact])

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
      if (candles.length) s.setData(toCandleData(candles))
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
      if (line.length) s.setData(toAreaData(line))
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
      if (line.length) s.setData(toLineData(line))
    }
    applyReferenceLine()
    chart.timeScale().fitContent()
  }, [chartReady, mode])

  useEffect(() => {
    const series = seriesRef.current
    if (!series) return

    if (mode === 'candles') {
      if (candles.length) (series as ISeriesApi<'Candlestick'>).setData(toCandleData(candles))
    } else if (mode === 'area') {
      if (line.length) (series as ISeriesApi<'Area'>).setData(toAreaData(line))
      ;(series as ISeriesApi<'Area'>).applyOptions({
        lineColor: positive ? LIME : ROSE,
        topColor: positive ? LIME_DIM : ROSE_DIM,
        crosshairMarkerBackgroundColor: positive ? LIME : ROSE,
      })
    } else {
      if (line.length) (series as ISeriesApi<'Line'>).setData(toLineData(line))
      ;(series as ISeriesApi<'Line'>).applyOptions({
        color: positive ? LIME : ROSE,
        crosshairMarkerBackgroundColor: positive ? LIME : ROSE,
        priceLineColor: positive ? 'rgba(63,111,0,0.35)' : 'rgba(220,38,38,0.35)',
      })
    }
    applyReferenceLine()
  }, [mode, line, candles, positive, chartReady, referencePrice, referenceLabel])

  useEffect(() => {
    if (!fitToken) return
    chartRef.current?.timeScale().fitContent()
  }, [fitToken])

  return (
    <div
      ref={containerRef}
      className={`metal-chart-canvas w-full overflow-hidden bg-white ${compact ? '' : 'rounded-xl'}`}
      style={{ height }}
      role="img"
      aria-label="Metal price chart"
    />
  )
}
