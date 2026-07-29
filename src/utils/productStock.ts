import type { Product } from '@/types'

export type ProductStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

const UNAVAILABLE_STATUSES = new Set(['out_of_stock', 'discontinued', 'inactive'])

export function productAvailableQuantity(product: Product): number {
  if (UNAVAILABLE_STATUSES.has(product.status)) return 0
  if (typeof product.available_quantity === 'number' && Number.isFinite(product.available_quantity)) {
    return Math.max(0, product.available_quantity)
  }
  if (product.in_stock === false) return 0
  // Missing stock fields → treat as unavailable (never invent sellable qty).
  return 0
}

/**
 * Derive display status from sellable qty first so API `stock_status` cannot
 * disagree with `available_quantity` / catalog `status` (e.g. OOS label with qty > 0).
 */
export function productStockStatus(product: Product): ProductStockStatus {
  if (UNAVAILABLE_STATUSES.has(product.status)) return 'out_of_stock'
  const qty = productAvailableQuantity(product)
  if (qty <= 0) return 'out_of_stock'
  if (product.stock_status === 'low_stock') return 'low_stock'
  return 'in_stock'
}

export function isProductOutOfStock(product: Product): boolean {
  return productAvailableQuantity(product) <= 0
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
