/**
 * Pricing API client — talks to the unified GoldAPI-backed Django endpoints
 * (`/api/prices/current/`, `/api/prices/history/`).
 *
 * The frontend never calls GoldAPI directly; the access token stays on the
 * backend. All four metals (gold, silver, platinum, palladium) are served
 * from the same trusted source.
 */
import { apiService } from './api'

export type MetalKey = 'gold' | 'silver' | 'platinum' | 'palladium'
export type MetalSymbol = 'XAU' | 'XAG' | 'XPT' | 'XPD'

export const METAL_SYMBOL_BY_KEY: Record<MetalKey, MetalSymbol> = {
  gold: 'XAU',
  silver: 'XAG',
  platinum: 'XPT',
  palladium: 'XPD',
}

export const METAL_KEY_BY_SYMBOL: Record<MetalSymbol, MetalKey> = {
  XAU: 'gold',
  XAG: 'silver',
  XPT: 'platinum',
  XPD: 'palladium',
}

export type MetalPriceSnapshot = {
  id: number
  metal: MetalSymbol
  friendly: MetalKey
  currency: string
  exchange: string | null
  symbol: string | null
  price: string | number
  ask: string | number | null
  bid: string | number | null
  open_price: string | number | null
  high_price: string | number | null
  low_price: string | number | null
  prev_close_price: string | number | null
  ch: string | number | null
  chp: string | number | null
  price_gram_24k: string | number | null
  price_gram_22k: string | number | null
  price_gram_21k: string | number | null
  price_gram_20k: string | number | null
  price_gram_18k: string | number | null
  price_gram_16k: string | number | null
  price_gram_14k: string | number | null
  price_gram_10k: string | number | null
  usd_to_kwd_rate: string | number | null
  price_kwd: string | number | null
  price_gram_24k_kwd: string | number | null
  price_gram_22k_kwd: string | number | null
  price_gram_21k_kwd: string | number | null
  price_gram_18k_kwd: string | number | null
  provider_timestamp: number
  fetched_at: string
}

export type CurrentMetalsResponse = {
  metals: Partial<Record<MetalKey, MetalPriceSnapshot>>
}

export type MetalChartPoint = {
  t: string
  price: number | null
  ask: number | null
  bid: number | null
  open: number | null
  high: number | null
  low: number | null
  price_gram_24k: number | null
}

export type MetalHistoryResponse = {
  metal: MetalSymbol
  friendly: MetalKey
  range: 'live' | '1h' | '1d' | '1w' | '1m'
  unit: string
  count: number
  points: MetalChartPoint[]
}

export const pricingApi = {
  /** Latest price for every metal (one DB row per metal). */
  getCurrentAll: () => apiService.get<CurrentMetalsResponse>('/prices/current/'),

  /** Latest price for a single metal (`gold` / `silver` / `platinum` / `palladium`). */
  getCurrent: (metal: MetalKey | MetalSymbol) =>
    apiService.get<MetalPriceSnapshot>(`/prices/current/`, {
      params: { metal },
    }),

  /** Time series for charts (down-sampled to ≤ 240 points server-side). */
  getHistory: (params: { metal: MetalKey | MetalSymbol; range: MetalHistoryResponse['range'] }) =>
    apiService.get<MetalHistoryResponse>('/prices/history/', { params }),

  /** Staff-only: trigger an immediate ingest. */
  refresh: () => apiService.post<{ succeeded: boolean; saved: string[]; errors: Record<string, string> }>(
    '/prices/refresh/',
  ),
}

export function toFiniteNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}
