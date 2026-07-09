import { useEffect, useMemo, useRef, useState } from 'react'
import type { PriceTrendDir } from '@/components/ProductPriceTrendArrow'

const RATE_SNAPSHOT_STORAGE_KEY = 'daralsabaek_rate_snapshot_v1'
const RATE_DIRECTION_STORAGE_KEY = 'daralsabaek_rate_direction_v1'

export function normalizeTrendKey(rawKey: string) {
  const m = String(rawKey || '').match(/(\d{1,2})\s*K/i)
  if (!m) return rawKey
  return m[1]
}

type RateEntry = { key: string; rate: number | null }

/**
 * Shared buy/sell direction state across Prices + Company prices + product tiles.
 * Pass a stable `entriesKey` (e.g. JSON of rates) so effect does not thrash.
 */
export function usePublicRateTrends(enabled: boolean, entries: RateEntry[], entriesKey: string) {
  const prevRatesRef = useRef<Record<string, number>>({})
  const [trendByKey, setTrendByKey] = useState<Record<string, PriceTrendDir>>({})
  const entriesRef = useRef(entries)
  entriesRef.current = entries

  useEffect(() => {
    try {
      const rawPrev = window.localStorage.getItem(RATE_SNAPSHOT_STORAGE_KEY)
      const rawDir = window.localStorage.getItem(RATE_DIRECTION_STORAGE_KEY)
      if (rawPrev) {
        const parsedPrev = JSON.parse(rawPrev) as Record<string, number | { buy?: number | null }>
        if (parsedPrev && typeof parsedPrev === 'object') {
          const normalized: Record<string, number> = {}
          for (const [k, v] of Object.entries(parsedPrev)) {
            if (typeof v === 'number' && Number.isFinite(v)) normalized[k] = v
            else if (
              v &&
              typeof v === 'object' &&
              typeof v.buy === 'number' &&
              Number.isFinite(v.buy)
            ) {
              normalized[k] = v.buy
            }
          }
          prevRatesRef.current = normalized
        }
      }
      if (rawDir) {
        const parsedDir = JSON.parse(rawDir) as Record<
          string,
          PriceTrendDir | { buy?: PriceTrendDir; sell?: PriceTrendDir }
        >
        if (parsedDir && typeof parsedDir === 'object') {
          const normalized: Record<string, PriceTrendDir> = {}
          for (const [k, v] of Object.entries(parsedDir)) {
            if (v === 'up' || v === 'down') normalized[k] = v
            else if (v && typeof v === 'object') normalized[k] = v.buy ?? v.sell ?? null
            else normalized[k] = null
          }
          setTrendByKey(normalized)
        }
      }
    } catch {
      // Ignore local storage parse/read issues.
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const current = entriesRef.current
    if (!current.length) return

    setTrendByKey((prevTrend) => {
      const nextTrend: Record<string, PriceTrendDir> = { ...prevTrend }
      for (const item of current) {
        const key = normalizeTrendKey(item.key)
        const prevRate = prevRatesRef.current[key]
        let dir: PriceTrendDir = prevTrend[key] ?? null
        if (item.rate != null && prevRate != null) {
          if (item.rate > prevRate) dir = 'up'
          else if (item.rate < prevRate) dir = 'down'
        }
        nextTrend[key] = dir
      }
      try {
        const persisted: Record<string, 'up' | 'down'> = {}
        for (const [k, v] of Object.entries(nextTrend)) {
          if (v === 'up' || v === 'down') persisted[k] = v
        }
        window.localStorage.setItem(RATE_DIRECTION_STORAGE_KEY, JSON.stringify(persisted))
      } catch {
        // Ignore local storage write issues.
      }
      return nextTrend
    })

    const nextPrev: Record<string, number> = { ...prevRatesRef.current }
    for (const item of current) {
      const key = normalizeTrendKey(item.key)
      if (item.rate != null) nextPrev[key] = item.rate
    }
    prevRatesRef.current = nextPrev

    try {
      window.localStorage.setItem(RATE_SNAPSHOT_STORAGE_KEY, JSON.stringify(nextPrev))
    } catch {
      // Ignore local storage write issues.
    }
  }, [enabled, entriesKey])

  const resolveDir = useMemo(
    () =>
      (key: string): PriceTrendDir => trendByKey[normalizeTrendKey(key)] ?? null,
    [trendByKey],
  )

  return { resolveDir }
}
