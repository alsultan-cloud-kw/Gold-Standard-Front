import { apiService } from './api'

export type CompanyOrderKind = 'bar' | 'coin'
export type CompanyOrderStatus =
  | 'pending_review'
  | 'awaiting_payment'
  | 'paid'
  | 'rejected'
  | 'cancelled'
  | 'payment_failed'

export type CompanyPaymentStatus = 'none' | 'unpaid' | 'paid' | 'failed' | string

export type CompanyOrderWeightOption = {
  id: string
  weight_grams: string | number
  min_quantity?: number
  max_quantity?: number | null
  indicative_unit_amount_kwd?: string | number | null
  indicative_amount_kwd?: string | number | null
}

export type CompanyOrderCatalogProduct = {
  id: string
  kind: CompanyOrderKind
  name_ar: string
  name_en: string
  description_ar?: string
  description_en?: string
  purity?: string | number | null
  image_url?: string | null
  image?: string | null
  weight_options: CompanyOrderWeightOption[]
}

export type CompanyOrderCatalogSettings = {
  is_enabled: boolean
  min_order_grams: string | number
  notes_ar?: string
  notes_en?: string
}

export type CompanyOrderCatalog = {
  settings: CompanyOrderCatalogSettings
  products: CompanyOrderCatalogProduct[]
  /** Legacy flattened fields (defensive). Prefer `settings`. */
  is_enabled?: boolean
  min_order_grams?: string | number
  notes_ar?: string
  notes_en?: string
}

export type CompanyOrderLine = {
  id?: string
  product?: string
  product_id?: string
  product_kind_snapshot?: CompanyOrderKind
  product_name_ar_snapshot?: string
  product_name_en_snapshot?: string
  product_name_ar?: string
  product_name_en?: string
  name_ar?: string
  name_en?: string
  kind?: CompanyOrderKind
  weight_grams: string | number
  quantity: number
  line_grams?: string | number
  indicative_unit_price_kwd?: string | number | null
  indicative_line_amount_kwd?: string | number | null
  indicative_amount_kwd?: string | number | null
  image_snapshot?: string | null
  image_url?: string | null
}

export type CompanyOrder = {
  id: string
  reference: string
  status: CompanyOrderStatus
  payment_status: CompanyPaymentStatus
  created_at: string
  updated_at?: string
  total_grams: string | number
  indicative_amount_kwd?: string | number | null
  final_amount_kwd?: string | number | null
  delivery_governorate: string
  delivery_city: string
  delivery_address: string
  delivery_postal?: string
  company_note?: string
  admin_notes?: string
  lines?: CompanyOrderLine[]
}

export type CreateCompanyOrderPayload = {
  lines: Array<{
    product_id: string
    weight_option_id: string
    quantity: number
  }>
  delivery_governorate: string
  delivery_city: string
  delivery_address: string
  delivery_postal?: string
  company_note?: string
}

type Page<T> = { results?: T[] }

function unwrapResults<T>(data: Page<T> | T[]): T[] {
  return Array.isArray(data) ? data : data.results ?? []
}

export const companyOrdersApi = {
  getCatalog: () =>
    apiService.get<CompanyOrderCatalog>('/accounts/company-orders/catalog/'),

  create: (payload: CreateCompanyOrderPayload) =>
    apiService.post<CompanyOrder>('/accounts/company-orders/', payload),

  listMine: () =>
    apiService
      .get<Page<CompanyOrder> | CompanyOrder[]>('/accounts/company-orders/mine/', {
        params: { page_size: 100 },
      })
      .then(unwrapResults),

  getMine: (id: string) =>
    apiService.get<CompanyOrder>(
      `/accounts/company-orders/mine/${encodeURIComponent(id)}/`,
    ),

  pay: (id: string) =>
    apiService.post<{ payment_url: string; track_id?: string }>(
      `/accounts/company-orders/mine/${encodeURIComponent(id)}/pay/`,
    ),

  verify: (id: string) =>
    apiService.post<CompanyOrder>(
      `/accounts/company-orders/mine/${encodeURIComponent(id)}/verify/`,
    ),
}

export function companyOrderLineTitle(
  line: CompanyOrderLine,
  locale: 'ar' | 'en' | string,
): string {
  if (locale === 'ar') {
    return (
      line.product_name_ar_snapshot ||
      line.product_name_ar ||
      line.name_ar ||
      line.product_name_en_snapshot ||
      line.product_name_en ||
      line.name_en ||
      ''
    )
  }
  return (
    line.product_name_en_snapshot ||
    line.product_name_en ||
    line.name_en ||
    line.product_name_ar_snapshot ||
    line.product_name_ar ||
    line.name_ar ||
    ''
  )
}

export function companyCatalogSettings(catalog?: CompanyOrderCatalog | null): {
  is_enabled: boolean
  min_order_grams: string | number
  notes_ar?: string
  notes_en?: string
} {
  return {
    is_enabled: catalog?.settings?.is_enabled ?? catalog?.is_enabled ?? true,
    min_order_grams: catalog?.settings?.min_order_grams ?? catalog?.min_order_grams ?? 0,
    notes_ar: catalog?.settings?.notes_ar ?? catalog?.notes_ar,
    notes_en: catalog?.settings?.notes_en ?? catalog?.notes_en,
  }
}
