// @vitest-environment node
/// <reference types="vitest/globals" />

import { applyLiveProductsToCartItems } from './cartRevalidate'
import { cartHasUnavailableItems, isCartLineOverStock } from './productStock'
import type { CartItem, Product } from '@/types'

function fakeProduct(overrides: Partial<Product> & { id: string }): Product {
  return {
    sku: 'SKU-1',
    serial_number: null,
    name_ar: 'سبيكة',
    name_en: 'Bar',
    slug: 'bar-1',
    category: {} as Product['category'],
    metal_type: {} as Product['metal_type'],
    carat: {} as Product['carat'],
    weight_grams: 10,
    making_charge_type: 'fixed',
    making_charge_amount: 1,
    current_price: 100,
    metal_value: 90,
    making_charge_value: 10,
    status: 'active',
    available_quantity: 1,
    in_stock: true,
    stock_status: 'in_stock',
    is_featured: false,
    view_count: 0,
    purchase_count: 0,
    created_at: '',
    updated_at: '',
    ...overrides,
  }
}

function unitPrice(product: Product): number {
  return Number(product.live_total_price ?? product.current_price ?? 0)
}

describe('unique last-unit cart safety', () => {
  it('flags cart when two unique lines exceed one available unit', () => {
    const product = fakeProduct({ id: 'p1', available_quantity: 1 })
    const items = [
      { id: 'l1', product, quantity: 1 },
      { id: 'l2', product, quantity: 1 },
    ]
    expect(cartHasUnavailableItems(items)).toBe(true)
    expect(isCartLineOverStock(items, 'l2')).toBe(true)
    expect(isCartLineOverStock(items, 'l1')).toBe(false)
  })

  it('trims excess unique lines when live stock shrinks to zero remaining for extras', () => {
    const product = fakeProduct({ id: 'p1', available_quantity: 2, live_total_price: 120 })
    const items: CartItem[] = [
      { id: 'l1', product, quantity: 1, unit_price: 120, total_price: 120 },
      { id: 'l2', product, quantity: 1, unit_price: 120, total_price: 120 },
    ]
    const latest = fakeProduct({
      id: 'p1',
      available_quantity: 1,
      live_total_price: 125,
      in_stock: true,
      stock_status: 'low_stock',
    })
    const byItemId = new Map([
      ['l1', latest],
      ['l2', latest],
    ])
    const { items: next, changed } = applyLiveProductsToCartItems(
      items,
      byItemId,
      unitPrice,
      false,
    )
    expect(changed).toBe(true)
    expect(next).toHaveLength(1)
    expect(next[0]?.id).toBe('l1')
    expect(cartHasUnavailableItems(next)).toBe(false)
  })

  it('keeps OOS unique lines so checkout can show the sold message', () => {
    const product = fakeProduct({ id: 'p1', available_quantity: 1, live_total_price: 100 })
    const items: CartItem[] = [
      { id: 'l1', product, quantity: 1, unit_price: 100, total_price: 100 },
    ]
    const soldOut = fakeProduct({
      id: 'p1',
      available_quantity: 0,
      in_stock: false,
      stock_status: 'out_of_stock',
      live_total_price: 100,
    })
    const { items: next } = applyLiveProductsToCartItems(
      items,
      new Map([['l1', soldOut]]),
      unitPrice,
      false,
    )
    expect(next).toHaveLength(1)
    expect(cartHasUnavailableItems(next)).toBe(true)
  })
})
