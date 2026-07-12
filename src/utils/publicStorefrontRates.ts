import type {
  DaralsabaekPublicCarat,
  DaralsabaekPublicRatesResponse,
  KuwaitMarketConfigResponse,
} from '@/services/api'

/** Django public-rates: per-gram buyTotal/sellTotal = URL base + configured additions. */

export function numOrNull(v: unknown): number | null {
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

export function normalizeCaratKey(key: string): string {
  return String(key).toUpperCase().replace(/\s/g, '')
}

export function resolveUsdToKwdRate(
  rates?: DaralsabaekPublicRatesResponse | null,
  kuwaitConfig?: KuwaitMarketConfigResponse | null,
): number | null {
  const fromConfig = numOrNull(kuwaitConfig?.usd_to_kwd_rate)
  if (fromConfig != null && fromConfig > 0) return fromConfig
  const fromRates = numOrNull(rates?.usd_to_kwd_rate)
  if (fromRates != null && fromRates > 0) return fromRates
  return null
}

/** Upstream global spot in USD/oz (normalizes when feed sends KWD/oz). */
export function resolveUsdOunceSpot(
  rates?: DaralsabaekPublicRatesResponse | null,
  usdToKwdRate?: number | null,
): number | null {
  const raw = numOrNull(rates?.goldOuncePrice)
  if (raw == null) return null
  if (raw >= 1500) return raw
  const rate = usdToKwdRate ?? numOrNull(rates?.usd_to_kwd_rate)
  if (rate != null && rate > 0) return raw / rate
  return null
}

export type GoldOunceKwdTotals = {
  buy: number | null
  sell: number | null
  buyAdd: number
  sellAdd: number
}

/** Configured KWD/oz from Django — never derive from USD spot without additions. */
export function getGoldOunceKwdTotals(
  rates?: DaralsabaekPublicRatesResponse | null,
): GoldOunceKwdTotals {
  const row = rates?.goldOunce
  return {
    buy: numOrNull(row?.buyTotal) ?? numOrNull(row?.buy),
    sell: numOrNull(row?.sellTotal) ?? numOrNull(row?.sell),
    buyAdd: numOrNull(row?.buyAdd) ?? 0,
    sellAdd: numOrNull(row?.sellAdd) ?? 0,
  }
}

/**
 * Authoritative USD/oz for charts — GoldAPI current snap first, then implied from
 * configured KWD/oz sell (inverse of sellTotal = usd×rate + sellAdd).
 */
export function resolveAuthoritativeUsdOunceSpot(
  rates?: DaralsabaekPublicRatesResponse | null,
  currentSnap?: { price?: string | number | null } | null,
  kuwaitConfig?: KuwaitMarketConfigResponse | null,
): number | null {
  const rate = resolveUsdToKwdRate(rates, kuwaitConfig)
  const fromSnap = numOrNull(currentSnap?.price)
  if (fromSnap != null && fromSnap > 0) return fromSnap

  const { sell, sellAdd } = getGoldOunceKwdTotals(rates)
  if (sell != null && rate != null && rate > 0) {
    return (sell - sellAdd) / rate
  }

  return resolveUsdOunceSpot(rates, rate)
}

/** Storefront KWD/oz sell — prefer API sellTotal, else derive from USD spot + additions. */
export function resolveConfiguredKwdOunceSell(
  rates?: DaralsabaekPublicRatesResponse | null,
  usdOunceSpot?: number | null,
  usdToKwdRate?: number | null,
): number | null {
  const { sell, sellAdd } = getGoldOunceKwdTotals(rates)
  if (sell != null) return sell
  const rate = usdToKwdRate ?? resolveUsdToKwdRate(rates)
  if (usdOunceSpot != null && rate != null && rate > 0) {
    return kwdOunceSellFromUsd(usdOunceSpot, rate, sellAdd)
  }
  return null
}

export function kwdOunceSellFromUsd(
  usdOz: number,
  usdToKwdRate: number,
  sellAdd = 0,
): number {
  return usdOz * usdToKwdRate + sellAdd
}

export function kwdOunceBuyFromUsd(
  usdOz: number,
  usdToKwdRate: number,
  buyAdd = 0,
): number {
  return usdOz * usdToKwdRate + buyAdd
}

export function findPublicCarat(
  rates: DaralsabaekPublicRatesResponse | undefined | null,
  key: string,
): DaralsabaekPublicCarat | undefined {
  const norm = normalizeCaratKey(key)
  return rates?.carats?.find((c) => normalizeCaratKey(c.key) === norm)
}

export function getDefaultPreviewCarat(
  rates?: DaralsabaekPublicRatesResponse | null,
): DaralsabaekPublicCarat | undefined {
  return findPublicCarat(rates ?? undefined, '24K') ?? rates?.carats?.[0]
}

export function caratGramTotals(
  carat:
    | DaralsabaekPublicCarat
    | { buyTotal?: number | null; sellTotal?: number | null }
    | null
    | undefined,
  grams: number,
): { buyTotal: number | null; sellTotal: number | null } {
  if (!Number.isFinite(grams) || grams <= 0) {
    return { buyTotal: null, sellTotal: null }
  }
  const buyPerG = numOrNull(carat?.buyTotal)
  const sellPerG = numOrNull(carat?.sellTotal)
  return {
    buyTotal: buyPerG != null ? buyPerG * grams : null,
    sellTotal: sellPerG != null ? sellPerG * grams : null,
  }
}

export type PublicRatesPricing = {
  usdToKwdRate: number | null
  usdOunceSpot: number | null
  goldOunceKwd: GoldOunceKwdTotals
}

export function buildPublicRatesPricing(
  rates?: DaralsabaekPublicRatesResponse | null,
  kuwaitConfig?: KuwaitMarketConfigResponse | null,
  currentSnap?: { price?: string | number | null } | null,
): PublicRatesPricing {
  const usdToKwdRate = resolveUsdToKwdRate(rates, kuwaitConfig)
  return {
    usdToKwdRate,
    usdOunceSpot: resolveAuthoritativeUsdOunceSpot(rates, currentSnap, kuwaitConfig),
    goldOunceKwd: getGoldOunceKwdTotals(rates),
  }
}
