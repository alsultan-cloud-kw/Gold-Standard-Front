/**
 * Prefer live_total_price (URL + markup buy rate × weight + making charge)
 * when API provides it; otherwise fall back to current_price snapshot.
 */
export function productUnitPrice(product: {
  live_total_price?: number | null
  live_total_price_club?: number | null
  current_price?: number | null
}): number {
  const n =
    product.live_total_price_club != null && !Number.isNaN(Number(product.live_total_price_club))
      ? Number(product.live_total_price_club)
      : product.live_total_price != null && !Number.isNaN(Number(product.live_total_price))
        ? Number(product.live_total_price)
        : product.current_price != null
          ? Number(product.current_price)
          : 0
  return Number.isFinite(n) ? n : 0
}

export function formatKwd(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return '—'
  return Number(n).toLocaleString(undefined, { maximumFractionDigits: 3 })
}

/**
 * Difference between regular live price and club member live price per unit.
 * Returns 0 when values are missing/invalid or club price is not lower.
 */
export function clubSavingsPerUnit(product: {
  live_total_price?: number | null
  live_total_price_club?: number | null
}): number {
  if (product.live_total_price == null || product.live_total_price_club == null) return 0
  const regular = Number(product.live_total_price)
  const club = Number(product.live_total_price_club)
  if (!Number.isFinite(regular) || !Number.isFinite(club)) return 0
  const diff = regular - club
  return diff > 0 ? diff : 0
}

type TrendProduct = {
  price_trend?: 'up' | 'down' | 'same' | null
  price_trend_percent?: number | null
  live_total_price?: number | null
  live_total_price_club?: number | null
  current_price?: number | null
  /** DB snapshot metal value (latest GoldPrice × weight) — list/detail serializers */
  metal_value?: number | null
  weight_grams?: number | null
  live_buy_price_per_gram?: number | null
}

function tryBuyPerGramTrend(product: TrendProduct): { trend: 'up' | 'down'; percent: number } | null {
  const liveBuy = product.live_buy_price_per_gram
  const mv = product.metal_value
  const w = product.weight_grams
  if (liveBuy == null || mv == null || w == null) return null
  const weight = Number(w)
  const metal = Number(mv)
  const lb = Number(liveBuy)
  if (!Number.isFinite(weight) || weight <= 0 || !Number.isFinite(metal) || !Number.isFinite(lb)) return null
  const snapBuy = metal / weight
  if (!Number.isFinite(snapBuy) || snapBuy <= 0) return null
  // Compare rounded values to avoid missing real moves due to floating precision / rounding differences.
  const lbR = Math.round(lb * 1000) / 1000
  const snapR = Math.round(snapBuy * 1000) / 1000
  if (lbR === snapR) return null
  const diff = lb - snapBuy
  const pct = (diff / snapBuy) * 100
  return {
    trend: diff > 0 ? 'up' : 'down',
    percent: Math.round(pct * 1000) / 1000,
  }
}

/**
 * Trend for product tiles: API (previous PriceHistory snapshot vs live total), then optional
 * client override, then live buy rate vs DB implied buy rate, then live total vs `current_price`.
 */
export function resolveProductPriceTrend(product: TrendProduct): {
  trend: 'up' | 'down' | null
  percent: number | null
} {
  const apiTrend = product.price_trend
  if (apiTrend === 'up' || apiTrend === 'down') {
    const p = product.price_trend_percent
    return {
      trend: apiTrend,
      percent: p != null && Number.isFinite(Number(p)) ? Number(p) : null,
    }
  }

  const fromBuy = tryBuyPerGramTrend(product)
  if (fromBuy) {
    return { trend: fromBuy.trend, percent: fromBuy.percent }
  }

  const hasLive =
    (product.live_total_price != null && Number.isFinite(Number(product.live_total_price))) ||
    (product.live_total_price_club != null && Number.isFinite(Number(product.live_total_price_club)))
  if (!hasLive) {
    return { trend: null, percent: null }
  }

  const live = productUnitPrice(product)
  const snap = Number(product.current_price)
  if (!Number.isFinite(live) || !Number.isFinite(snap) || snap <= 0) {
    return { trend: null, percent: null }
  }

  // Same idea as tryBuyPerGramTrend: use rounded compare so UI doesn't "disappear" arrows.
  const liveR = Math.round(live * 1000) / 1000
  const snapR = Math.round(snap * 1000) / 1000
  if (liveR === snapR) {
    return { trend: null, percent: null }
  }

  const diff = live - snap
  const pct = (diff / snap) * 100
  return {
    trend: diff > 0 ? 'up' : 'down',
    percent: Math.round(pct * 1000) / 1000,
  }
}
