import type { Product } from '@/types'

export type ProductStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

const UNAVAILABLE_STATUSES = new Set(['out_of_stock', 'discontinued', 'inactive'])

/**
 * True when the product payload includes enough stock fields to decide sellability.
 * Server cart stubs / hydrate rows often omit these — treat as unresolved, not OOS.
 */
export function hasResolvedStockFields(product: Product): boolean {
  if (product.status && UNAVAILABLE_STATUSES.has(product.status)) return true
  if (typeof product.available_quantity === 'number' && Number.isFinite(product.available_quantity)) {
    return true
  }
  if (typeof product.in_stock === 'boolean') return true
  if (
    product.stock_status === 'in_stock' ||
    product.stock_status === 'low_stock' ||
    product.stock_status === 'out_of_stock'
  ) {
    return true
  }
  return false
}

export function productAvailableQuantity(product: Product): number {
  if (UNAVAILABLE_STATUSES.has(product.status)) return 0
  if (typeof product.available_quantity === 'number' && Number.isFinite(product.available_quantity)) {
    return Math.max(0, product.available_quantity)
  }
  if (product.in_stock === false) return 0
  // Missing stock fields → unknown qty (never invent sellable qty for clamp math).
  return 0
}

/**
 * Derive display status from sellable qty first so API `stock_status` cannot
 * disagree with `available_quantity` / catalog `status` (e.g. OOS label with qty > 0).
 */
export function productStockStatus(product: Product): ProductStockStatus {
  if (!hasResolvedStockFields(product)) return 'in_stock'
  if (UNAVAILABLE_STATUSES.has(product.status)) return 'out_of_stock'
  const qty = productAvailableQuantity(product)
  if (qty <= 0) return 'out_of_stock'
  if (product.stock_status === 'low_stock') return 'low_stock'
  return 'in_stock'
}

export function isProductOutOfStock(product: Product): boolean {
  // Incomplete hydrate stubs must not flash as "unavailable".
  if (!hasResolvedStockFields(product)) return false
  return productAvailableQuantity(product) <= 0
}

/**
 * True when the shopper cannot add more of this product:
 * catalog OOS, or cart already holds every available unit (last piece in cart).
 */
export function cannotAddMoreToCart(
  product: Product,
  cartItems: Array<{ product: Product; quantity: number }>,
): boolean {
  if (!hasResolvedStockFields(product)) return false
  if (isProductOutOfStock(product)) return true
  const inCart = cartUnitsForProductId(cartItems, product.id)
  return maxPurchasableQuantity(product, inCart) <= 0
}

/** Cart/checkout gate: only block when stock is known and insufficient. */
export function isCartLineUnavailable(product: Product, quantity: number): boolean {
  if (!hasResolvedStockFields(product)) return false
  if (isProductOutOfStock(product)) return true
  return quantity > productAvailableQuantity(product)
}

/** Server-cart stub / pre-reprice row — missing commerce fields used by cart UI. */
export function isCartProductIncomplete(product: Product): boolean {
  if (!hasResolvedStockFields(product)) return true
  const hasLive =
    (product.live_total_price != null && Number.isFinite(Number(product.live_total_price))) ||
    (product.live_total_price_club != null && Number.isFinite(Number(product.live_total_price_club)))
  const hasStored =
    product.current_price != null &&
    Number.isFinite(Number(product.current_price)) &&
    Number(product.current_price) > 0
  return !hasLive && !hasStored
}

/**
 * Metal fineness (e.g. 999.9 for 24K, 916 for 22K) derived from carat purity.
 * Returns null when purity is missing/invalid so callers can fall back to the carat label.
 */
export function productFineness(product: Product): number | null {
  const purity = Number(product.carat?.purity_percentage)
  if (!Number.isFinite(purity) || purity <= 0) return null
  return Math.round(purity * 100) / 10
}

export function isProductLowStock(product: Product): boolean {
  return productStockStatus(product) === 'low_stock' && productAvailableQuantity(product) > 0
}

export function maxPurchasableQuantity(product: Product, currentInCart = 0): number {
  const available = productAvailableQuantity(product)
  return Math.max(0, available - currentInCart)
}

export function clampPurchaseQuantity(product: Product, requested: number, currentInCart = 0): number {
  const max = maxPurchasableQuantity(product, currentInCart)
  if (max <= 0) return 0
  return Math.min(Math.max(1, requested), max)
}

/** True when live product payload changed stock eligibility fields. */
export function productStockFieldsChanged(prev: Product, next: Product): boolean {
  return (
    (prev.available_quantity ?? null) !== (next.available_quantity ?? null) ||
    (prev.stock_status ?? null) !== (next.stock_status ?? null) ||
    (prev.in_stock ?? null) !== (next.in_stock ?? null) ||
    prev.status !== next.status
  )
}

/**
 * Clamp a cart line qty to live available stock.
 * When OOS (available 0), keep the previous qty so cart/checkout can show unavailable.
 */
export function clampCartLineQuantity(product: Product, quantity: number): number {
  const available = productAvailableQuantity(product)
  if (available <= 0) return Math.max(1, quantity)
  return Math.min(Math.max(1, quantity), available)
}

/**
 * Serialized bullion / unique barcode units — cart must be one line per piece.
 * Storefront available_quantity is received-unit count for these products.
 */
export function isProductSerialized(product: Product): boolean {
  const units = Number((product as { barcode_units_count?: number }).barcode_units_count)
  if (Number.isFinite(units) && units > 0) return true
  // Gold storefront stock is unit-backed when available_quantity is present.
  if (typeof product.available_quantity === 'number' && Number.isFinite(product.available_quantity)) {
    return true
  }
  return false
}

/** Count of cart lines / units already held for this product id. */
export function cartUnitsForProductId(
  items: Array<{ product: Product; quantity: number }>,
  productId: string,
): number {
  return items
    .filter((item) => item.product.id === productId)
    .reduce((sum, item) => sum + Math.max(1, Number(item.quantity) || 1), 0)
}

/**
 * True when any line is OOS or when total units for a product exceed live stock.
 * Serialized unique items are checked by product id (sum of unit lines), not per line alone.
 */
export function cartHasUnavailableItems(
  items: Array<{ product: Product; quantity: number }>,
): boolean {
  const byProduct = new Map<string, { product: Product; qty: number }>()
  for (const item of items) {
    const qty = Math.max(0, Number(item.quantity) || 0)
    const cur = byProduct.get(item.product.id)
    if (!cur) {
      byProduct.set(item.product.id, { product: item.product, qty })
    } else {
      cur.qty += qty
    }
  }
  for (const { product, qty } of byProduct.values()) {
    if (isCartLineUnavailable(product, qty)) return true
  }
  return false
}

/**
 * Whether this cart line exceeds live stock given earlier lines for the same product
 * (unique/serialized unit lines beyond available_quantity).
 */
export function isCartLineOverStock(
  items: Array<{ id: string; product: Product; quantity: number }>,
  itemId: string,
): boolean {
  const target = items.find((i) => i.id === itemId)
  if (!target) return false
  if (isProductOutOfStock(target.product)) return true

  const available = productAvailableQuantity(target.product)
  if (!hasResolvedStockFields(target.product)) return false
  if (available <= 0) return true

  let running = 0
  for (const item of items) {
    if (item.product.id !== target.product.id) continue
    running += Math.max(1, Number(item.quantity) || 1)
    if (item.id === itemId) {
      return running > available
    }
  }
  return false
}
