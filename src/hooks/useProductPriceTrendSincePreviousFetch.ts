import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi, type DaralsabaekPublicRatesResponse } from '../services/api'
import type { Product } from '../types'

export type ProductFetchTrend = {
  trend: 'up' | 'down' | null
  percent: number | null
}

export type ProductFetchTrendMap = Record<string, ProductFetchTrend>
const RATE_SNAPSHOT_STORAGE_KEY = 'daralsabaek_rate_snapshot_v1'
const RATE_DIRECTION_STORAGE_KEY = 'daralsabaek_rate_direction_v1'

function caratFromKey(key: string): number | null {
  const m = String(key || '').match(/(\d{1,2})\s*K/i)
  if (!m) return null
  const n = Number(m[1])
  return Number.isFinite(n) ? n : null
}

/**
 * Trend source = PricesPage live rates feed (daralsabaekPublicRates), not product total price.
 * We compare each carat buyTotal KWD/g against the previous fetched rate and map the movement
 * to all product tiles of the same carat.
 */
export function useProductPriceTrendSincePreviousFetch(products: Product[] | undefined) {
  const prevRateRef = useRef<Record<string, number>>({})
  const lastDirectionRef = useRef<Record<string, 'up' | 'down'>>({})
  const [trends, setTrends] = useState<ProductFetchTrendMap>({})

  const { data } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: 20_000,
    retry: 1,
  })

  const rateByCarat = useMemo(() => {
    const res = data as DaralsabaekPublicRatesResponse | undefined
    const out: Record<string, number> = {}
    for (const c of res?.carats ?? []) {
      const cv = caratFromKey(c.key)
      const buy = c.buyTotal
      if (cv == null || buy == null || !Number.isFinite(Number(buy))) continue
      out[String(cv)] = Number(buy)
    }
    return out
  }, [data])

  useEffect(() => {
    try {
      const rawPrev = window.localStorage.getItem(RATE_SNAPSHOT_STORAGE_KEY)
      const rawDir = window.localStorage.getItem(RATE_DIRECTION_STORAGE_KEY)
      if (rawPrev) {
        const parsedPrev = JSON.parse(rawPrev) as Record<string, number>
        if (parsedPrev && typeof parsedPrev === 'object') prevRateRef.current = parsedPrev
      }
      if (rawDir) {
        const parsedDir = JSON.parse(rawDir) as Record<string, 'up' | 'down'>
        if (parsedDir && typeof parsedDir === 'object') lastDirectionRef.current = parsedDir
      }
    } catch {
      // Ignore broken local cache and start fresh.
    }
  }, [])

  useEffect(() => {
    const list = products ?? []
    if (list.length === 0 || Object.keys(rateByCarat).length === 0) {
      return
    }

    const prev = prevRateRef.current
    const next: ProductFetchTrendMap = {}
    const caratTrends: Record<string, ProductFetchTrend> = {}

    for (const [carat, cur] of Object.entries(rateByCarat)) {
      const old = prev[carat]
      if (old != null && Number.isFinite(old) && old > 0) {
        const diff = cur - old
        if (diff > 0) {
          const pct = (diff / old) * 100
          lastDirectionRef.current[carat] = 'up'
          caratTrends[carat] = { trend: 'up', percent: Math.round(pct * 1000) / 1000 }
        } else if (diff < 0) {
          const pct = (diff / old) * 100
          lastDirectionRef.current[carat] = 'down'
          caratTrends[carat] = { trend: 'down', percent: Math.round(pct * 1000) / 1000 }
        } else {
          const last = lastDirectionRef.current[carat] ?? null
          caratTrends[carat] = last ? { trend: last, percent: 0 } : { trend: null, percent: null }
        }
      } else {
        const last = lastDirectionRef.current[carat] ?? null
        caratTrends[carat] = last ? { trend: last, percent: 0 } : { trend: null, percent: null }
      }
    }

    for (const p of list) {
      const id = p.id
      const caratValue = p.carat?.carat_value
      const byCarat = caratValue != null ? caratTrends[String(caratValue)] : null
      next[id] = byCarat ?? { trend: null, percent: null }
    }

    setTrends(next)

    prevRateRef.current = { ...prev, ...rateByCarat }
    try {
      window.localStorage.setItem(
        RATE_SNAPSHOT_STORAGE_KEY,
        JSON.stringify(prevRateRef.current)
      )
      window.localStorage.setItem(
        RATE_DIRECTION_STORAGE_KEY,
        JSON.stringify(lastDirectionRef.current)
      )
    } catch {
      // Ignore storage write errors (private mode/quota).
    }
  }, [products, rateByCarat])

  return trends
}
