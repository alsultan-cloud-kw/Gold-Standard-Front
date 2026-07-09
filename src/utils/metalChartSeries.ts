import type { MetalChartPoint } from '@/services/pricingApi'

export type ChartRange = 'live' | '1h' | '1d' | '1w'
export type MetalTab = 'gold' | 'silver' | 'platinum' | 'palladium'

export type LinePoint = { time: number; value: number }
export type CandlePoint = {
  time: number
  open: number
  high: number
  low: number
  close: number
}

export function rangeBackMs(r: ChartRange): number {
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

export function bucketMsForRange(range: ChartRange): number {
  switch (range) {
    case 'live':
    case '1h':
      return 60_000
    case '1d':
      return 15 * 60_000
    case '1w':
      return 60 * 60_000
    default:
      return 60_000
  }
}

function toUnixSec(iso: string): number | null {
  const ms = new Date(iso).getTime()
  if (!Number.isFinite(ms)) return null
  return Math.floor(ms / 1000)
}

function pickClose(p: MetalChartPoint, metal: MetalTab, preferOz: boolean): number | null {
  if (metal === 'gold' && preferOz) {
    const v = p.price ?? p.price_gram_24k
    return v != null && Number.isFinite(Number(v)) ? Number(v) : null
  }
  const v = p.price_gram_24k ?? p.price
  return v != null && Number.isFinite(Number(v)) ? Number(v) : null
}

function pickOhlc(
  p: MetalChartPoint,
  metal: MetalTab,
  preferOz: boolean,
): { open: number; high: number; low: number; close: number } | null {
  const close = pickClose(p, metal, preferOz)
  if (close == null) return null
  const openRaw = p.open != null && Number.isFinite(Number(p.open)) ? Number(p.open) : close
  const highRaw = p.high != null && Number.isFinite(Number(p.high)) ? Number(p.high) : Math.max(openRaw, close)
  const lowRaw = p.low != null && Number.isFinite(Number(p.low)) ? Number(p.low) : Math.min(openRaw, close)
  return {
    open: openRaw,
    high: Math.max(highRaw, openRaw, close),
    low: Math.min(lowRaw, openRaw, close),
    close,
  }
}

/** Build a continuous line series (unix seconds), optionally appending live value. */
export function buildLineSeries(
  points: MetalChartPoint[],
  metal: MetalTab,
  range: ChartRange,
  liveV: number | null,
  preferOz: boolean,
): LinePoint[] {
  const rows: LinePoint[] = []
  for (const p of points) {
    const t = toUnixSec(p.t)
    const v = pickClose(p, metal, preferOz)
    if (t == null || v == null) continue
    rows.push({ time: t, value: v })
  }
  rows.sort((a, b) => a.time - b.time)

  // Dedupe same-second timestamps (keep last).
  const deduped: LinePoint[] = []
  for (const r of rows) {
    if (deduped.length && deduped[deduped.length - 1].time === r.time) {
      deduped[deduped.length - 1] = r
    } else {
      deduped.push(r)
    }
  }

  const nowSec = Math.floor(Date.now() / 1000)
  if (liveV != null && Number.isFinite(liveV)) {
    if (deduped.length === 0) {
      const t0 = nowSec - Math.floor(rangeBackMs(range) / 1000)
      return [
        { time: t0, value: liveV },
        { time: nowSec, value: liveV },
      ]
    }
    const last = deduped[deduped.length - 1]
    if (last.time >= nowSec) {
      deduped[deduped.length - 1] = { time: last.time, value: liveV }
    } else {
      deduped.push({ time: nowSec, value: liveV })
    }
  }

  if (deduped.length === 1) {
    return [{ time: deduped[0].time - 60, value: deduped[0].value }, deduped[0]]
  }
  return deduped
}

/**
 * Aggregate closes into OHLC candles by range bucket.
 * Uses provider open/high/low when present inside a bucket; otherwise synthesizes from closes.
 */
export function buildCandleSeries(line: LinePoint[], range: ChartRange, raw?: MetalChartPoint[], metal?: MetalTab, preferOz?: boolean): CandlePoint[] {
  if (line.length === 0) return []

  const bucketSec = Math.max(60, Math.floor(bucketMsForRange(range) / 1000))
  const buckets = new Map<number, CandlePoint>()

  // Seed from raw OHLC when available.
  if (raw && metal != null && preferOz != null) {
    for (const p of raw) {
      const t = toUnixSec(p.t)
      const ohlc = pickOhlc(p, metal, preferOz)
      if (t == null || !ohlc) continue
      const key = Math.floor(t / bucketSec) * bucketSec
      const prev = buckets.get(key)
      if (!prev) {
        buckets.set(key, { time: key, ...ohlc })
      } else {
        buckets.set(key, {
          time: key,
          open: prev.open,
          high: Math.max(prev.high, ohlc.high),
          low: Math.min(prev.low, ohlc.low),
          close: ohlc.close,
        })
      }
    }
  }

  // Always fold line closes so live tip is included.
  for (const p of line) {
    const key = Math.floor(p.time / bucketSec) * bucketSec
    const prev = buckets.get(key)
    if (!prev) {
      buckets.set(key, {
        time: key,
        open: p.value,
        high: p.value,
        low: p.value,
        close: p.value,
      })
    } else {
      buckets.set(key, {
        time: key,
        open: prev.open,
        high: Math.max(prev.high, p.value),
        low: Math.min(prev.low, p.value),
        close: p.value,
      })
    }
  }

  return [...buckets.values()].sort((a, b) => a.time - b.time)
}

export function seriesChange(line: LinePoint[]): { abs: number; pct: number } | null {
  if (line.length < 2) return null
  const first = line[0].value
  const last = line[line.length - 1].value
  if (!Number.isFinite(first) || first === 0) return null
  const abs = last - first
  const pct = (abs / first) * 100
  return { abs, pct }
}

export type SeriesOhlc = {
  open: number
  high: number
  low: number
  close: number
}

/** OHLC for the visible chart window (from candles when available). */
export function seriesOhlcStats(line: LinePoint[], candles: CandlePoint[]): SeriesOhlc | null {
  if (candles.length >= 1) {
    return {
      open: candles[0].open,
      high: Math.max(...candles.map((c) => c.high)),
      low: Math.min(...candles.map((c) => c.low)),
      close: candles[candles.length - 1].close,
    }
  }
  if (line.length >= 1) {
    const values = line.map((p) => p.value)
    return {
      open: values[0],
      high: Math.max(...values),
      low: Math.min(...values),
      close: values[values.length - 1],
    }
  }
  return null
}

const TROY_OZ_GRAMS = 31.1034768

/** Format unix-sec range for chart caption (e.g. Google Finance style). */
export function formatChartTimeRange(
  line: LinePoint[],
  locale: string,
  timeZone = 'Asia/Kuwait',
): string | null {
  if (line.length < 2) return null
  const start = new Date(line[0].time * 1000)
  const end = new Date(line[line.length - 1].time * 1000)
  const fmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
  })
  return `${fmt.format(start)} – ${fmt.format(end)}`
}

export function formatChartAsOf(unixSec: number, locale: string, timeZone = 'Asia/Kuwait'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone,
    timeZoneName: 'shortOffset',
  }).format(new Date(unixSec * 1000))
}

export function prevCloseFromSnapshot(
  snap: {
    prev_close_price?: string | number | null
    usd_to_kwd_rate?: string | number | null
    price_gram_24k_kwd?: string | number | null
  } | null | undefined,
  unit: string,
): number | null {
  if (!snap) return null
  const prevUsd =
    snap.prev_close_price != null && snap.prev_close_price !== ''
      ? Number(snap.prev_close_price)
      : null
  if (prevUsd == null || !Number.isFinite(prevUsd)) return null

  if (unit === 'USD/oz') return prevUsd

  if (unit === 'KWD/g') {
    const rate =
      snap.usd_to_kwd_rate != null && snap.usd_to_kwd_rate !== ''
        ? Number(snap.usd_to_kwd_rate)
        : null
    if (rate != null && Number.isFinite(rate) && rate > 0) {
      return (prevUsd * rate) / TROY_OZ_GRAMS
    }
    const gramKwd =
      snap.price_gram_24k_kwd != null && snap.price_gram_24k_kwd !== ''
        ? Number(snap.price_gram_24k_kwd)
        : null
    if (gramKwd != null && Number.isFinite(gramKwd)) return gramKwd
  }
  return null
}

export function snapshotOhlcForUnit(
  snap: {
    open_price?: string | number | null
    high_price?: string | number | null
    low_price?: string | number | null
    prev_close_price?: string | number | null
    price?: string | number | null
    usd_to_kwd_rate?: string | number | null
    price_gram_24k_kwd?: string | number | null
  } | null | undefined,
  unit: string,
): Partial<SeriesOhlc & { prevClose: number }> | null {
  if (!snap) return null

  const num = (v: unknown) => {
    if (v == null || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }

  if (unit === 'USD/oz') {
    return {
      open: num(snap.open_price) ?? undefined,
      high: num(snap.high_price) ?? undefined,
      low: num(snap.low_price) ?? undefined,
      prevClose: num(snap.prev_close_price) ?? undefined,
      close: num(snap.price) ?? undefined,
    }
  }

  const prev = prevCloseFromSnapshot(snap, unit)
  const rate = num(snap.usd_to_kwd_rate)
  const toGramKwd = (usdOz: number | null) =>
    usdOz != null && rate != null && rate > 0 ? (usdOz * rate) / TROY_OZ_GRAMS : null

  return {
    open: toGramKwd(num(snap.open_price)) ?? undefined,
    high: toGramKwd(num(snap.high_price)) ?? undefined,
    low: toGramKwd(num(snap.low_price)) ?? undefined,
    prevClose: prev ?? undefined,
    close: num(snap.price_gram_24k_kwd) ?? toGramKwd(num(snap.price)) ?? undefined,
  }
}

export function formatPrice(value: number, unit: string, _locale?: string): string {
  const digits = unit.includes('USD') ? 2 : 4
  try {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    })
  } catch {
    return value.toFixed(digits)
  }
}
