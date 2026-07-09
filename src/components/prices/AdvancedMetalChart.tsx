import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
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
}

const INK = '#0B0F19'
const GRID = 'rgba(255,255,255,0.06)'
const TEXT = 'rgba(236,252,203,0.72)'
const CROSS = 'rgba(133,227,7,0.55)'
const LIME = '#85E307'
const LIME_DIM = 'rgba(133,227,7,0.18)'
const ROSE = '#F43F5E'
const ROSE_DIM = 'rgba(244,63,94,0.16)'

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
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Line'> | ISeriesApi<'Area'> | null>(
    null,
  )
  const [chartReady, setChartReady] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const isRtl = locale.startsWith('ar')
    const options: DeepPartial<ChartOptions> = {
      layout: {
        background: { type: ColorType.Solid, color: INK },
        textColor: TEXT,
        fontFamily: isRtl
          ? "'Tajawal', 'Montserrat', sans-serif"
          : "'Montserrat', 'Tajawal', sans-serif",
        fontSize: 12,
      },
      grid: {
        vertLines: { color: GRID, style: LineStyle.Dotted },
        horzLines: { color: GRID, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: CROSS,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1F2937',
        },
        horzLine: {
          color: CROSS,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: '#1F2937',
        },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.12, bottom: 0.08 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 4,
        barSpacing: 8,
        minBarSpacing: 3,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: false,
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
      localization: {
        locale,
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
  }, [locale, height])

  useEffect(() => {
    const chart = chartRef.current
    if (!chart || !chartReady) return

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
        bottomColor: 'rgba(11,15,25,0)',
        lineWidth: 2,
        crosshairMarkerVisible: true,
        crosshairMarkerRadius: 5,
        crosshairMarkerBorderColor: INK,
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
        crosshairMarkerBorderColor: INK,
        crosshairMarkerBackgroundColor: positive ? LIME : ROSE,
        lastValueVisible: true,
        priceLineVisible: true,
        priceLineColor: positive ? 'rgba(133,227,7,0.45)' : 'rgba(244,63,94,0.45)',
        priceLineWidth: 1,
        priceLineStyle: LineStyle.Dashed,
      })
      seriesRef.current = s
      if (line.length) s.setData(toLineData(line))
    }
    chart.timeScale().fitContent()
  }, [chartReady, mode])

  // Live data updates without recreating the series.
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
        priceLineColor: positive ? 'rgba(133,227,7,0.45)' : 'rgba(244,63,94,0.45)',
      })
    }
  }, [mode, line, candles, positive, chartReady])

  useEffect(() => {
    if (!fitToken) return
    chartRef.current?.timeScale().fitContent()
  }, [fitToken])

  return (
    <div
      ref={containerRef}
      className="metal-chart-canvas w-full overflow-hidden rounded-xl"
      style={{ height }}
      role="img"
      aria-label="Metal price chart"
    />
  )
}
