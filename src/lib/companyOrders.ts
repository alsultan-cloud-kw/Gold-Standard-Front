import type { CompanyOrder } from '@/services/companyOrdersApi'

export function newestCompanyOrdersFirst(orders: CompanyOrder[]): CompanyOrder[] {
  return [...orders].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}
