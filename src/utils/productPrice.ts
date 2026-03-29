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
}

/**
 * Trend for product tiles: prefer API (24h history / server logic), else compare
 * displayed unit price (live/club) to stored `current_price` so arrows show when
 * live feed differs from the DB snapshot.
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

  const eps = Math.max(0.01, snap * 0.0005)
  const diff = live - snap
  if (Math.abs(diff) <= eps) {
    return { trend: null, percent: null }
  }

  const pct = (diff / snap) * 100
  return {
    trend: diff > 0 ? 'up' : 'down',
    percent: Math.round(pct * 1000) / 1000,
  }
}
