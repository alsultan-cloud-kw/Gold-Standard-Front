import type { CartItem, Product } from '../types'

/**
 * Standard (non-member) list unit for comparison — matches CartContext.regularUnitPrice.
 * Never use `item.unit_price` here: for members that is already the club price, so savings would always be 0.
 */
export function standardListUnitPrice(product: Product): number {
  if (product.live_total_price != null && Number.isFinite(Number(product.live_total_price))) {
    return Number(product.live_total_price)
  }
  if (product.current_price != null && Number.isFinite(Number(product.current_price))) {
    return Number(product.current_price)
  }
  return 0
}

export function cartLineStandardTotal(item: CartItem): number {
  return standardListUnitPrice(item.product) * item.quantity
}

export function cartLineClubMemberSavings(item: CartItem): number {
  const list = cartLineStandardTotal(item)
  const charged = Number(item.total_price) || 0
  const d = list - charged
  return d > 1e-9 ? d : 0
}

export function cartClubPricingBreakdown(items: CartItem[]): {
  standardSubtotal: number
  clubMemberSavings: number
  chargedSubtotal: number
} {
  let standard = 0
  let charged = 0
  for (const item of items) {
    standard += cartLineStandardTotal(item)
    charged += Number(item.total_price) || 0
  }
  return {
    standardSubtotal: standard,
    clubMemberSavings: Math.max(0, standard - charged),
    chargedSubtotal: charged,
  }
}
