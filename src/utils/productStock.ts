import type { Product } from '@/types'

export type ProductStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock'

const UNAVAILABLE_STATUSES = new Set(['out_of_stock', 'discontinued', 'inactive'])

export function productAvailableQuantity(product: Product): number {
  if (UNAVAILABLE_STATUSES.has(product.status)) return 0
  if (typeof product.available_quantity === 'number' && Number.isFinite(product.available_quantity)) {
    return Math.max(0, product.available_quantity)
  }
  if (product.in_stock === false) return 0
  return product.in_stock === true ? 1 : 1
}

export function productStockStatus(product: Product): ProductStockStatus {
  if (UNAVAILABLE_STATUSES.has(product.status)) return 'out_of_stock'
  if (typeof product.stock_status === 'string') {
    return product.stock_status
  }
  return productAvailableQuantity(product) > 0 ? 'in_stock' : 'out_of_stock'
}

export function isProductOutOfStock(product: Product): boolean {
  return productAvailableQuantity(product) <= 0
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
