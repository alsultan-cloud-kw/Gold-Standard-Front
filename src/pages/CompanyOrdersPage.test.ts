/// <reference types="vitest/globals" />

import { newestCompanyOrdersFirst } from '@/lib/companyOrders'
import type { CompanyOrder } from '@/services/companyOrdersApi'

function order(id: string, createdAt: string): CompanyOrder {
  return {
    id,
    reference: `CGO-${id}`,
    status: 'pending_review',
    payment_status: 'none',
    created_at: createdAt,
    total_grams: 100,
    delivery_governorate: 'Capital',
    delivery_city: 'Kuwait City',
    delivery_address: 'Central Gold Market',
  }
}

describe('newestCompanyOrdersFirst', () => {
  it('orders company history newest first without mutating the API result', () => {
    const original = [
      order('old', '2026-01-01T10:00:00Z'),
      order('new', '2026-08-16T10:00:00Z'),
      order('middle', '2026-04-10T10:00:00Z'),
    ]

    const sorted = newestCompanyOrdersFirst(original)

    expect(sorted.map((item) => item.id)).toEqual(['new', 'middle', 'old'])
    expect(original.map((item) => item.id)).toEqual(['old', 'new', 'middle'])
  })
})
