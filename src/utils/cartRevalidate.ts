import type { CartItem, Product } from '@/types'
import {
  clampCartLineQuantity,
  isProductSerialized,
  productAvailableQuantity,
  productStockFieldsChanged,
} from '@/utils/productStock'

function pricesDiffer(a: number, b: number): boolean {
  return Math.abs((Number(a) || 0) - (Number(b) || 0)) > 1e-9
}

function productPriceMetaChanged(prev: Product, next: Product): boolean {
  return (
    (prev.live_total_price ?? null) !== (next.live_total_price ?? null) ||
    (prev.live_total_price_club ?? null) !== (next.live_total_price_club ?? null)
  )
}

/**
 * Apply fresh Django product snapshots to cart lines:
 * - update price/stock fields
 * - clamp non-serialized qty
 * - drop excess unique/serialized unit lines when stock shrank
 *   (last piece sold on web / mobile / POS while still in another cart)
 */
export function applyLiveProductsToCartItems(
  items: CartItem[],
  latestByItemId: Map<string, Product>,
  unitPriceForMembership: (product: Product, clubPricingEnabled: boolean) => number,
  clubPricingEnabled: boolean,
): { items: CartItem[]; changed: boolean } {
  if (!items.length || !latestByItemId.size) {
    return { items, changed: false }
  }

  let changed = false
  const withLatest: CartItem[] = items.map((item) => {
    const latest = latestByItemId.get(item.id)
    if (!latest) return item
    if (
      !productStockFieldsChanged(item.product, latest) &&
      !productPriceMetaChanged(item.product, latest) &&
      item.product === latest
    ) {
      return item
    }
    changed = true
    return { ...item, product: latest }
  })

  // Trim excess unique unit lines when available_quantity dropped.
  const keptSerialized = new Map<string, number>()
  const trimmed: CartItem[] = []
  for (const item of withLatest) {
    if (!isProductSerialized(item.product)) {
      trimmed.push(item)
      continue
    }
    const available = productAvailableQuantity(item.product)
    if (available <= 0) {
      // Keep line(s) so cart/checkout can show out-of-stock and block checkout.
      trimmed.push(item)
      continue
    }
    const kept = keptSerialized.get(item.product.id) ?? 0
    if (kept >= available) {
      changed = true
      continue
    }
    keptSerialized.set(item.product.id, kept + 1)
    trimmed.push(item)
  }

  const next = trimmed.map((item) => {
    const qty = isProductSerialized(item.product)
      ? 1
      : clampCartLineQuantity(item.product, item.quantity)
    const unit = unitPriceForMembership(item.product, clubPricingEnabled)
    const resolvedUnit = unit > 0 ? unit : Number(item.unit_price) > 0 ? Number(item.unit_price) : 0
    if (qty !== item.quantity || pricesDiffer(item.unit_price, resolvedUnit)) {
      changed = true
      return {
        ...item,
        quantity: qty,
        unit_price: resolvedUnit,
        total_price: qty * resolvedUnit,
      }
    }
    return item
  })

  return { items: next, changed }
}
