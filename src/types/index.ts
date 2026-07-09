// User Types
export interface User {
  id: string
  email: string | null
  phone_number: string | null
  full_name: string
  role:
    | 'customer'
    | 'trader'
    | 'long_term_customer'
    | 'cashier'
    | 'branch_manager'
    | 'general_manager'
    | 'admin'
  is_active: boolean
  is_verified: boolean
  date_joined: string
  date_of_birth?: string
  nationality?: string
  civil_id?: string
  terms_accepted_at?: string | null
  privacy_policy_accepted_at?: string | null
  terms_policy_version?: string | null
  privacy_policy_version?: string | null
}

export interface CustomerProfile {
  id: string
  user: User
  address_line1?: string
  address_line2?: string
  city?: string
  governorate?: string
  postal_code?: string
  country: string
  loyalty_points: number
  loyalty_tier: string
  total_purchases: number
  preferred_language: string
}

export interface KnetReceiptDetails {
  merchant_name: string
  sale_id: string
  invoice_number: string
  payment_status: string
  order_status: string
  payment_method: string
  result: string
  amount: string
  currency: string
  transaction_datetime: string
  transaction_timezone: string
  track_id?: string | null
  payment_id?: string | null
  transaction_id?: string | null
  reference_id?: string | null
  auth_code?: string | null
}

// Product Types
export interface MetalType {
  id: string
  name: string
  display_name_ar: string
  display_name_en: string
  description?: string
  icon?: string
  is_active: boolean
}

export interface Carat {
  id: string
  metal_type: MetalType
  carat_value: number
  purity_percentage: number
  display_name_ar: string
  display_name_en: string
  is_active: boolean
}

export interface GoldPrice {
  id: string
  carat: Carat
  buy_price_per_gram: number
  sell_price_per_gram: number
  date: string
  spread: number
  is_active: boolean
}

export interface Category {
  id: string
  name_ar: string
  name_en: string
  slug: string
  description_ar?: string
  description_en?: string
  /** Relative media path or absolute URL depending on API */
  image?: string
  /** Absolute URL when API provides it (admin_tree / detail) */
  image_url?: string
  /** Parent category UUID, or null for root */
  parent?: string | null
  parent_name?: string
  /** When category is a subcategory, parent's slug for linking */
  parent_slug?: string | null
  subcategories?: Category[] | Array<Record<string, unknown>>
  display_order: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ProductImage {
  id: string
  image: string
  /** Absolute URL when API includes it (list/detail serializers). */
  image_url?: string
  is_primary: boolean
  alt_text_ar?: string
  alt_text_en?: string
  display_order: number
}

export interface ProductReview {
  id: string
  customer: User
  rating: number
  title?: string
  review_text: string
  sentiment_score?: number
  sentiment_label?: string
  is_approved: boolean
  created_at: string
}

export interface Product {
  id: string
  sku: string
  /** Auto-generated unique serial (e.g. PRD-2025-00001). */
  serial_number?: string | null
  name_ar: string
  name_en: string
  slug: string
  category: Category
  metal_type: MetalType
  carat: Carat
  weight_grams: number
  making_charge_type: 'fixed' | 'per_gram' | 'percentage'
  making_charge_amount: number
  description_ar?: string
  description_en?: string
  current_price: number
  metal_value: number
  making_charge_value: number
  /** Live: sell rate (URL+markup) × weight + making charge — matches /prices */
  live_total_price?: number | null
  live_metal_value?: number | null
  live_making_charge?: number | null
  live_buy_price_per_gram?: number | null
  /** Live pricing if club member rates apply (URL + general + club add) */
  live_total_price_club?: number | null
  live_metal_value_club?: number | null
  live_making_charge_club?: number | null
  live_buy_price_per_gram_club?: number | null
  /** vs ~24h snapshot (PriceHistory) when available; else live vs stored current_price */
  price_trend?: 'up' | 'down' | 'same' | null
  price_trend_percent?: number | null
  status: 'active' | 'inactive' | 'out_of_stock' | 'discontinued'
  /** Checkout-branch available units (storefront API). */
  available_quantity?: number
  stock_status?: 'in_stock' | 'low_stock' | 'out_of_stock'
  in_stock?: boolean
  is_featured: boolean
  /** Present on list API; use with image_url for thumbnails. */
  primary_image?: ProductImage | null
  images?: ProductImage[]
  reviews?: ProductReview[]
  view_count: number
  purchase_count: number
  created_at: string
  updated_at: string
}

// Inventory Types
export interface Branch {
  id: string
  code: string
  name_ar: string
  name_en: string
  branch_type: 'main' | 'showroom' | 'warehouse' | 'kiosk'
  address: string
  city: string
  governorate: string
  phone: string
  email?: string
  latitude?: number
  longitude?: number
  opening_time: string
  closing_time: string
  is_open_friday: boolean
  friday_opening_time?: string
  friday_closing_time?: string
  is_active: boolean
  is_main_branch: boolean
}

export interface Inventory {
  id: string
  product: Product
  branch: Branch
  quantity: number
  reserved_quantity: number
  available_quantity: number
  low_stock_threshold: number
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock'
  is_low_stock: boolean
}

// Cart Types
export interface CartItem {
  id: string
  product: Product
  quantity: number
  unit_price: number
  total_price: number
}

export interface Cart {
  items: CartItem[]
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  item_count: number
}

// Order Types
export interface SaleItem {
  id: string
  product: Product
  quantity: number
  unit_price: number
  metal_price_per_gram: number
  making_charge: number
  total_price: number
}

export interface Sale {
  id: string
  invoice_number: string
  customer: User
  customer_name: string
  customer_phone: string
  branch: Branch
  sale_date: string
  payment_method: 'cash' | 'knet' | 'credit_card' | 'bank_transfer' | 'myfatoorah' | 'installment'
  status: 'pending' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  items: SaleItem[]
  loyalty_points_earned: number
  created_at: string
  /** Whether order was priced using live gold rate or stored rate. */
  pricing_source?: 'live' | 'fallback'
  /** Buy price per gram by carat at order time, e.g. { "21": "12.345", "22": "12.567" }. */
  gold_rate_snapshot?: Record<string, string>
}

// Analytics Types
export interface DashboardKPI {
  date: string
  total_sales: number
  total_sales_count: number
  average_order_value: number
  total_purchases: number
  gross_profit: number
  net_profit: number
  profit_margin: number
  new_customers: number
  active_customers: number
  low_stock_alerts: number
  out_of_stock_products: number
}

export interface PriceForecast {
  id: string
  carat: Carat
  forecast_for_date: string
  predicted_buy_price: number
  predicted_sell_price: number
  buy_price_lower: number
  buy_price_upper: number
  sell_price_lower: number
  sell_price_upper: number
  confidence_score: number
}

// API Response Types
export interface ApiResponse<T> {
  data: T
  message?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Filter Types
export interface ProductFilters {
  category?: string
  metal_type?: string
  carat?: string
  min_price?: number
  max_price?: number
  status?: string
  is_featured?: boolean
  search?: string
  ordering?: string
}
