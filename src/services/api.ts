import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

// Request interceptor: auth token, Accept-Language, FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    const lang = localStorage.getItem('app_lang') || document.documentElement.getAttribute('lang') || 'en'
    config.headers['Accept-Language'] = lang.startsWith('ar') ? 'ar' : 'en'
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/token/refresh/`,
            { refresh: refreshToken }
          )

          const { access } = response.data
          localStorage.setItem('access_token', access)

          originalRequest.headers.Authorization = `Bearer ${access}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        // Clear tokens and redirect to login
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

// Generic API methods
export const apiService = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    api.get<T>(url, config).then((res) => res.data),

  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.post<T>(url, data, config).then((res) => res.data),

  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.put<T>(url, data, config).then((res) => res.data),

  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    api.patch<T>(url, data, config).then((res) => res.data),

  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    api.delete<T>(url, config).then((res) => res.data),
}

// Config API (e.g. supported languages for i18n)
export const configApi = {
  getLanguages: () =>
    apiService.get<{ languages: { code: string; name: string }[]; default: string }>('/config/languages/'),
}

// Auth API
export const authApi = {
  login: (credentials: { email?: string; phone_number?: string; password: string }) =>
    apiService.post<{ user: unknown; refresh: string; access: string }>('/accounts/users/login/', credentials),

  register: (data: unknown) =>
    apiService.post<{ user: unknown; refresh: string; access: string }>('/accounts/users/register/', data),

  logout: (refreshToken: string) =>
    apiService.post('/accounts/users/logout/', { refresh: refreshToken }),

  getMe: () =>
    apiService.get('/accounts/users/me/'),

  updateMe: (data: unknown) =>
    apiService.patch('/accounts/users/me/', data),

  changePassword: (data: { old_password: string; new_password: string; confirm_password: string }) =>
    apiService.post('/accounts/users/change_password/', data),

  forgotPassword: (data: { email?: string; phone_number?: string }) =>
    apiService.post('/accounts/users/forgot_password/', data),

  verifyOTP: (data: { otp_code: string; purpose?: string }) =>
    apiService.post<{ message: string; user_id: string }>('/accounts/users/verify_otp/', data),

  /** Call after verifyOTP; requires user_id from verify response */
  resetPassword: (data: { user_id: string; new_password: string }) =>
    apiService.post<{ message: string }>('/accounts/users/reset_password/', data),
}

// Products API
export const productsApi = {
  getProducts: (params?: unknown) =>
    apiService.get('/products/products/', { params }),

  getProduct: (slug: string) =>
    apiService.get(`/products/products/${slug}/`),

  getFeaturedProducts: () =>
    apiService.get('/products/products/featured/'),

  getNewArrivals: () =>
    apiService.get('/products/products/new_arrivals/'),

  getBestSellers: () =>
    apiService.get('/products/products/best_sellers/'),

  getCategories: (params?: Record<string, string | number | undefined>) =>
    apiService.get('/products/categories/', { params }),

  /** Staff/admin only — requires Bearer token or 403. */
  getCategoriesAdminTree: () => {
    const token = localStorage.getItem('access_token')
    return apiService.get<unknown[]>('/products/categories/admin_tree/', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  },

  getCategory: (slug: string) =>
    apiService.get(`/products/categories/${slug}/`),

  /**
   * Create category; pass image File to upload (multipart). Subcategories use same model — parent UUID makes it a subcategory.
   */
  createCategory: (data: {
    name_ar: string
    name_en: string
    slug?: string
    parent?: string | null
    display_order?: number
    is_active?: boolean
    description_ar?: string
    description_en?: string
    image?: File | null
  }) => {
    const token = localStorage.getItem('access_token')
    if (data.image) {
      const fd = new FormData()
      fd.append('name_ar', data.name_ar)
      fd.append('name_en', data.name_en)
      if (data.slug && data.slug.trim()) fd.append('slug', data.slug.trim())
      if (data.parent) fd.append('parent', data.parent)
      fd.append('display_order', String(data.display_order ?? 0))
      fd.append('is_active', data.is_active === false ? 'false' : 'true')
      if (data.description_ar) fd.append('description_ar', data.description_ar)
      if (data.description_en) fd.append('description_en', data.description_en)
      fd.append('image', data.image)
      return api.post<unknown>('/products/categories/', fd, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }).then((r) => r.data)
    }
    const { image: _, slug, ...rest } = data
    const json = { ...rest } as Record<string, unknown>
    if (slug && String(slug).trim()) json.slug = String(slug).trim()
    return apiService.post<unknown>('/products/categories/', json, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  },

  /**
   * Update category by slug; include image File to replace image (multipart).
   */
  updateCategory: (
    slug: string,
    data: Partial<{
      name_ar: string
      name_en: string
      slug: string
      parent: string | null
      display_order: number
      is_active: boolean
      description_ar: string
      description_en: string
      image: File | null
    }>
  ) => {
    const token = localStorage.getItem('access_token')
    const url = `/products/categories/${encodeURIComponent(slug)}/`
    if (data.image) {
      const fd = new FormData()
      if (data.name_ar != null) fd.append('name_ar', data.name_ar)
      if (data.name_en != null) fd.append('name_en', data.name_en)
      if (data.parent !== undefined) {
        if (data.parent) fd.append('parent', data.parent)
        else fd.append('parent', '')
      }
      if (data.display_order != null) fd.append('display_order', String(data.display_order))
      if (data.is_active != null) fd.append('is_active', data.is_active ? 'true' : 'false')
      fd.append('image', data.image)
      return api.patch<unknown>(url, fd, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      }).then((r) => r.data)
    }
    const { image: _, ...json } = data
    return apiService.patch<unknown>(url, json, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  },

  deleteCategory: (slug: string) => {
    const token = localStorage.getItem('access_token')
    return apiService.delete(`/products/categories/${encodeURIComponent(slug)}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  },

  getGoldPrices: () =>
    apiService.get('/products/gold-prices/latest/'),

  getGoldPriceHistory: (caratId: string, days?: number) =>
    apiService.get('/products/gold-prices/history/', { params: { carat_id: caratId, days } }),

  calculatePrice: (slug: string, weight: number) =>
    apiService.post(`/products/products/${slug}/calculate_price/`, { weight }),

  /** Admin: list all products (incl. inactive). Pass page_size for full list. */
  getProductsAdmin: (params?: { page?: number; page_size?: number; search?: string }) => {
    const token = localStorage.getItem('access_token')
    return apiService.get('/products/products/', {
      params: { page_size: 100, ...params },
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  },

  createProduct: (data: {
    sku: string
    name_ar: string
    name_en: string
    slug?: string
    category_id: string
    metal_type_id: string
    carat_id: string
    weight_grams: number
    making_charge_type?: string
    making_charge_amount?: number
    description_ar?: string
    description_en?: string
    status?: string
    is_featured?: boolean
  }) => {
    const token = localStorage.getItem('access_token')
    return apiService.post<unknown>('/products/products/', data, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  },

  updateProduct: (
    slug: string,
    data: Partial<{
      sku: string
      name_ar: string
      name_en: string
      slug: string
      category_id: string
      metal_type_id: string
      carat_id: string
      weight_grams: number
      making_charge_type: string
      making_charge_amount: number
      description_ar: string
      description_en: string
      status: string
      is_featured: boolean
    }>
  ) => {
    const token = localStorage.getItem('access_token')
    return apiService.patch<unknown>(
      `/products/products/${encodeURIComponent(slug)}/`,
      data,
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    )
  },

  deleteProduct: (slug: string) => {
    const token = localStorage.getItem('access_token')
    return apiService.delete(`/products/products/${encodeURIComponent(slug)}/`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  },

  /** Upload product image after product exists. Multipart: product_id, image, is_primary. */
  createProductImage: (productId: string, image: File, isPrimary = true) => {
    const token = localStorage.getItem('access_token')
    const fd = new FormData()
    fd.append('product_id', productId)
    fd.append('image', image)
    fd.append('is_primary', isPrimary ? 'true' : 'false')
    fd.append('display_order', '0')
    return api.post<unknown>('/products/images/', fd, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).then((r) => r.data)
  },

  getMetalTypes: () => apiService.get<unknown>('/products/metal-types/'),

  getCarats: (params?: { metal_type?: string }) =>
    apiService.get<unknown>('/products/carats/', { params }),
}

// Inventory API
export const inventoryApi = {
  getBranches: () =>
    apiService.get('/inventory/branches/'),

  getBranch: (code: string) =>
    apiService.get(`/inventory/branches/${code}/`),

  getInventory: (params?: unknown) =>
    apiService.get('/inventory/stock/', { params }),

  getLowStock: () =>
    apiService.get('/inventory/stock/low_stock/'),
}

// Cart API (local storage based for now)
export const cartApi = {
  getCart: () => {
    const cart = localStorage.getItem('cart')
    return cart ? JSON.parse(cart) : { items: [], subtotal: 0, total_amount: 0 }
  },

  saveCart: (cart: unknown) => {
    localStorage.setItem('cart', JSON.stringify(cart))
  },

  clearCart: () => {
    localStorage.removeItem('cart')
  },
}

// Orders API (Sales)
export const ordersApi = {
  getOrders: (params?: Record<string, string>) =>
    apiService.get('/accounting/sales/', { params }),

  getOrder: (id: string) =>
    apiService.get(`/accounting/sales/${id}/`),

  createOrder: (data: unknown) =>
    apiService.post('/accounting/sales/', data),

  getTodaySales: () =>
    apiService.get('/accounting/sales/today_sales/'),

  /** Admin: KPI block for date range or all=1 (all-time through today). Requires staff. */
  getDashboardStats: (params: { start_date: string; end_date: string } | { all: '1' }) =>
    apiService.get('/accounting/sales/dashboard-stats/', { params }),

  getSalesSummary: (params: { start_date: string; end_date: string } | { all: '1' }) =>
    apiService.get('/accounting/sales/sales_summary/', { params }),

  updateSale: (id: string, data: { status?: string }) =>
    apiService.patch<unknown>(`/accounting/sales/${id}/`, data),

  cancelSale: (id: string) =>
    apiService.post(`/accounting/sales/${id}/cancel/`),

  refundSale: (id: string) =>
    apiService.post(`/accounting/sales/${id}/refund/`),

  /** Customer checkout: creates Sale + SaleItems (status pending). Requires JWT. */
  placeOrder: (data: {
    items: { product_id: string; quantity: number }[]
    delivery_type?: 'physical' | 'locked'
    payment_method?: string
    customer_name?: string
    customer_phone?: string
    customer_email?: string
    notes?: string
  }) =>
    apiService.post<unknown>('/accounting/sales/place-order/', data),

  /** List current user's locked gold (from orders with lock; only these can be sold back). */
  getMyLockedGold: () =>
    apiService.get<unknown[]>('/accounting/sales/my-locked-gold/'),
}

// Trading: customer sell gold (buyback) — store pays at sell rate
export const tradingApi = {
  /** List buybacks (customer: own only; admin: all). */
  getBuybacks: (params?: Record<string, string>) =>
    apiService.get<unknown>('/accounting/gold-buybacks/', { params }),

  getBuyback: (id: string) =>
    apiService.get<unknown>(`/accounting/gold-buybacks/${id}/`),

  /** Get quote for selling locked gold (no order created). Items must be from getMyLockedGold. */
  getSellQuote: (data: { items: { sale_item_id: string; weight_grams?: number }[] }) =>
    apiService.post<unknown>('/accounting/gold-buybacks/sell-quote/', data),

  /** Place sell order (customer sells locked gold to store). Only gold bought here and locked.
   *  NOTE: Backend now always uses the full remaining locked weight; weight_grams is optional.
   */
  placeSellOrder: (data: {
    items: { sale_item_id: string; weight_grams?: number }[]
    payment_method?: string
    customer_name?: string
    customer_phone?: string
    customer_email?: string
    notes?: string
  }) =>
    apiService.post<unknown>('/accounting/gold-buybacks/place-sell-order/', data),

  /** Admin: update buyback status. */
  updateBuyback: (id: string, data: { status?: string }) =>
    apiService.patch<unknown>(`/accounting/gold-buybacks/${id}/`, data),
}

// Virtual gold grams trading (buy/sell by grams or KWD amount)
export const goldTradingApi = {
  getPositions: () => apiService.get<unknown[]>('/accounting/gold-trading/positions/'),
  getTrades: () => apiService.get<unknown[]>('/accounting/gold-trading/trades/'),
  getAdminSummary: () => apiService.get<unknown>('/accounting/gold-trading/admin-summary/'),
  quoteBuy: (data: { carat_value: number; grams?: number; kwd_amount?: number }) =>
    apiService.post<unknown>('/accounting/gold-trading/quote-buy/', data),
  quoteSell: (data: { carat_value: number; grams?: number; kwd_amount?: number }) =>
    apiService.post<unknown>('/accounting/gold-trading/quote-sell/', data),
  buy: (data: { carat_value: number; grams?: number; kwd_amount?: number }) =>
    apiService.post<unknown>('/accounting/gold-trading/buy/', data),
  sell: (data: { carat_value: number; grams?: number; kwd_amount?: number }) =>
    apiService.post<unknown>('/accounting/gold-trading/sell/', data),
}

/** Auto-execute virtual gold trades when adjusted rates cross thresholds (server Celery task). */
export type GoldAutoTradeRule = {
  id: string
  carat: string
  carat_value: number
  carat_display: string
  is_enabled: boolean
  max_sell_rate_kwd_per_gram: string | number | null
  min_buy_rate_kwd_per_gram: string | number | null
  auto_buy_grams: string | number
  sell_all_on_trigger: boolean
  auto_sell_grams: string | number | null
  cooldown_seconds: number
  last_executed_at: string | null
  last_action: string
  last_error: string
  created_at: string
  updated_at: string
}

export type GoldAutoTradeRuleWrite = {
  carat: string
  is_enabled?: boolean
  max_sell_rate_kwd_per_gram?: number | null
  min_buy_rate_kwd_per_gram?: number | null
  auto_buy_grams?: number | string
  sell_all_on_trigger?: boolean
  auto_sell_grams?: number | null
  cooldown_seconds?: number
}

function unwrapPaginated<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const r = data as { results?: T[] }
  return r?.results ?? []
}

export const goldAutoTradeRulesApi = {
  list: () =>
    apiService
      .get<unknown>('/accounting/gold-auto-trade-rules/')
      .then((d) => unwrapPaginated<GoldAutoTradeRule>(d)),

  create: (data: GoldAutoTradeRuleWrite) =>
    apiService.post<GoldAutoTradeRule>('/accounting/gold-auto-trade-rules/', data),

  update: (id: string, data: Partial<GoldAutoTradeRuleWrite>) =>
    apiService.patch<GoldAutoTradeRule>(`/accounting/gold-auto-trade-rules/${id}/`, data),

  delete: (id: string) => apiService.delete(`/accounting/gold-auto-trade-rules/${id}/`),
}

/** Customer clubs (one active membership per user) + offers applied at checkout */
export const clubsApi = {
  createClub: (data: { name: string }) => apiService.post<unknown>('/clubs/', data),
  getMyMembership: () => apiService.get<unknown>('/clubs/my-membership/'),
  getMyOffers: () => apiService.get<unknown[]>('/clubs/my-offers/'),
  join: (token: string) => apiService.post<unknown>('/clubs/join/', { token }),
  leave: () => apiService.post<unknown>('/clubs/leave/', {}),
  createInvite: (clubId: string, body?: { max_uses?: number }) =>
    apiService.post<{ token: string; expires_at: string; max_uses: number }>(
      `/clubs/${clubId}/invite/`,
      body ?? {},
    ),
  dissolveClub: (clubId: string) => apiService.post<unknown>(`/clubs/${clubId}/dissolve/`, {}),
  /** Admin */
  listClubs: () => apiService.get<unknown>('/clubs/'),
  getFormationConfig: () => apiService.get<{ min_completed_orders: number }>('/clubs/formation-config/'),
  updateFormationConfig: (data: { min_completed_orders: number }) =>
    apiService.put('/clubs/formation-config/', data),
  grantOffer: (data: {
    user_id: string
    title: string
    discount_percent?: string | number | null
    discount_amount_kwd?: string | number | null
    valid_until?: string | null
    max_redemptions?: number | null
  }) => apiService.post<unknown>('/clubs/admin/offers/grant/', data),
  listOffersForUser: (userId: string) =>
    apiService.get<unknown[]>(`/clubs/admin/offers/list-for-user/`, { params: { user_id: userId } }),

  /** Logged-in: preview server subtotal + best club/customer offer (matches place_order). */
  checkoutPreview: (items: { product_id: string; quantity: number }[]) =>
    apiService.post<{
      subtotal: string
      discount_amount: string
      total_amount: string
      offer_title: string | null
      offer_id: string | null
    }>('/clubs/checkout-preview/', { items }),
}

// Wallet API (customer wallet balance & movements)
export const walletApi = {
  /** Get current customer's wallet (balance) and recent transactions. */
  getMyWallet: () =>
    apiService.get<{ wallet: { id: string; balance: number; currency: string }; recent_transactions: unknown[] }>(
      '/accounting/wallet/me/',
    ),

  /** Full wallet transaction history for current customer. */
  getTransactions: () =>
    apiService.get<unknown[]>('/accounting/wallet/transactions/'),

  /** Logical deposit into wallet. In production, tie this to a confirmed payment. */
  deposit: (data: { amount: string; description?: string }) =>
    apiService.post('/accounting/wallet/deposit/', data),

  /** Logical withdrawal from wallet; admin must process the actual payout. */
  withdraw: (data: { amount: string; description?: string }) =>
    apiService.post('/accounting/wallet/withdraw/', data),

  /** Admin-only: summary of all wallets and total liability. */
  getAdminSummary: () =>
    apiService.get<{
      currency: string
      total_wallet_liability: number
      wallets: { id: string; user_id: string | null; user_name: string | null; user_email: string | null; balance: number; currency: string }[]
    }>('/accounting/wallet/admin-summary/'),
}

// Accounting API (admin)
export const accountingApi = {
  // Account types
  getAccountTypes: () =>
    apiService.get('/accounting/account-types/'),
  createAccountType: (data: unknown) =>
    apiService.post('/accounting/account-types/', data),
  updateAccountType: (id: string, data: unknown) =>
    apiService.patch(`/accounting/account-types/${id}/`, data),
  deleteAccountType: (id: string) =>
    apiService.delete(`/accounting/account-types/${id}/`),

  // Accounts
  getAccounts: (params?: Record<string, string>) =>
    apiService.get('/accounting/accounts/', { params }),
  getAccount: (id: string) =>
    apiService.get(`/accounting/accounts/${id}/`),
  getChartOfAccounts: () =>
    apiService.get('/accounting/accounts/chart_of_accounts/'),
  getTrialBalance: () =>
    apiService.get('/accounting/accounts/trial_balance/'),
  getGoldSummary: (startDate: string, endDate: string) =>
    apiService.get('/accounting/accounts/gold_summary/', { params: { start_date: startDate, end_date: endDate } }),
  createAccount: (data: unknown) =>
    apiService.post('/accounting/accounts/', data),
  updateAccount: (id: string, data: unknown) =>
    apiService.patch(`/accounting/accounts/${id}/`, data),
  deleteAccount: (id: string) =>
    apiService.delete(`/accounting/accounts/${id}/`),

  // Journal entries
  getJournalEntries: (params?: Record<string, string>) =>
    apiService.get('/accounting/journal-entries/', { params }),
  getJournalEntry: (id: string) =>
    apiService.get(`/accounting/journal-entries/${id}/`),
  createJournalEntry: (data: unknown) =>
    apiService.post('/accounting/journal-entries/', data),
  updateJournalEntry: (id: string, data: unknown) =>
    apiService.patch(`/accounting/journal-entries/${id}/`, data),
  postJournalEntry: (id: string) =>
    apiService.post(`/accounting/journal-entries/${id}/post_entry/`),

  // Purchases
  getPurchases: (params?: Record<string, string>) =>
    apiService.get('/accounting/purchases/', { params }),
  getPurchase: (id: string) =>
    apiService.get(`/accounting/purchases/${id}/`),
  getTodayPurchases: () =>
    apiService.get('/accounting/purchases/today_purchases/'),
  createPurchase: (data: unknown) =>
    apiService.post('/accounting/purchases/', data),

  // Expenses
  getExpenses: (params?: Record<string, string>) =>
    apiService.get('/accounting/expenses/', { params }),
  getExpense: (id: string) =>
    apiService.get(`/accounting/expenses/${id}/`),
  getExpenseSummary: (startDate: string, endDate: string) =>
    apiService.get('/accounting/expenses/expense_summary/', { params: { start_date: startDate, end_date: endDate } }),
  createExpense: (data: unknown) =>
    apiService.post('/accounting/expenses/', data),

  // Financial reports
  getProfitLoss: (startDate: string, endDate: string) =>
    apiService.get('/accounting/reports/profit_loss/', { params: { start_date: startDate, end_date: endDate } }),
  getBalanceSheet: (asOfDate?: string) =>
    apiService.get('/accounting/reports/balance_sheet/', { params: asOfDate ? { as_of_date: asOfDate } : {} }),
}

// Accounts API (current user / customer profile)
export const accountsApi = {
  /** For customers: returns their profile(s); for customers this will typically be a single entry. */
  getMyProfile: () =>
    apiService.get('/accounts/profiles/'),

  /** Update customer profile by id. Supports FormData for file uploads. */
  updateProfile: (id: string, data: FormData | unknown) =>
    apiService.patch(`/accounts/profiles/${id}/`, data),
}

// Price Alerts API (gold price reminders)
export const priceAlertsApi = {
  /** List all alerts for current user (active + triggered + cancelled). */
  getMyPriceAlerts: () => apiService.get('/accounts/price-alerts/'),

  /** Create a new price alert. */
  createPriceAlert: (data: unknown) => apiService.post('/accounts/price-alerts/', data),

  /** Update an existing alert (status is read-only in the serializer). */
  updatePriceAlert: (id: string, data: unknown) => apiService.patch(`/accounts/price-alerts/${id}/`, data),

  /** Cancel/remove an alert. */
  deletePriceAlert: (id: string) => apiService.delete(`/accounts/price-alerts/${id}/`),
}

// Invoices API
export const invoicesApi = {
  getInvoices: (params?: Record<string, string>) =>
    apiService.get('/invoices/invoices/', { params }),
  getInvoice: (id: string) =>
    apiService.get(`/invoices/invoices/${id}/`),
  getPendingDelivery: () =>
    apiService.get('/invoices/invoices/pending_delivery/'),
  generatePdf: (id: string) =>
    apiService.post(`/invoices/invoices/${id}/generate_pdf/`),
  sendEmail: (id: string) =>
    apiService.post(`/invoices/invoices/${id}/send_email/`),
  sendWhatsApp: (id: string) =>
    apiService.post(`/invoices/invoices/${id}/send_whatsapp/`),

  /** HTML invoice for a sale (order). Optional template_id for template selection. */
  getSaleInvoicePreview: (saleId: string, templateId?: string) =>
    apiService.get<{ html: string }>(
      `/invoices/sale_preview/${saleId}/`,
      templateId ? { params: { template_id: templateId } } : {}
    ),

  getTemplates: () =>
    apiService.get('/invoices/templates/'),
  getTemplate: (id: string) =>
    apiService.get(`/invoices/templates/${id}/`),
  /** Create the default "Gold Jewelry Invoice" template if missing. Idempotent. */
  createDefaultSaleTemplate: () =>
    apiService.post<unknown>('/invoices/templates/create_default_sale/'),
  createTemplate: (data: unknown) =>
    apiService.post('/invoices/templates/', data),
  updateTemplate: (id: string, data: unknown) =>
    apiService.patch(`/invoices/templates/${id}/`, data),

  getDeliveryLogs: (params?: Record<string, string>) =>
    apiService.get('/invoices/delivery-logs/', { params }),
}

// Admin API
export const adminApi = {
  getDashboardKPIs: () =>
    apiService.get('/analytics/kpis/today/'),

  getKPIDashboard: () =>
    apiService.get('/analytics/kpis/today/'),

  getKPITrend: (days?: number) =>
    apiService.get('/analytics/kpis/trend/', { params: { days } }),

  getPriceForecasts: () =>
    apiService.get('/analytics/price-forecasts/next_7_days/'),

  getCustomers: (params?: { page_size?: number }) =>
    apiService.get('/accounts/users/', { params: params?.page_size ? { page_size: params.page_size } : {} }),

  /** Admin: get a single user by id. Requires staff. */
  getUser: (userId: string) =>
    apiService.get(`/accounts/users/${userId}/`),

  /** Admin: update a user (e.g. is_active). Requires staff. */
  updateUser: (userId: string, data: { is_active?: boolean }) =>
    apiService.patch(`/accounts/users/${userId}/`, data),

  updateGoldPrice: (data: unknown) =>
    apiService.post('/products/gold-prices/', data),

  /**
   * Dar Al Sabaek live metal buy/sell (proxied). Same shape as
   * https://api.daralsabaek.com/api/goldAndFundBalance/getMetalSellAndBuyPrices
   */
  getDaralsabaekMetalPrices: () =>
    apiService.get<DaralsabaekMetalPricesResponse>('/scraping/daralsabaek/metal-prices/'),

  /** Public: URL rates + admin additional amounts (no auth). */
  getDaralsabaekPublicRates: () =>
    apiService.get<DaralsabaekPublicRatesResponse>('/scraping/daralsabaek/public-rates/'),

  /** Admin: persist additional amounts so public page can show URL + add. Optional clubBuyAdd/clubSellAdd for members. */
  putDaralsabaekMarkup: (
    data: Record<string, { buyAdd: string; sellAdd: string; clubBuyAdd?: string; clubSellAdd?: string }>
  ) => {
    const token = localStorage.getItem('access_token')
    return apiService.put<{ data: unknown }>(
      '/scraping/daralsabaek/markup/',
      { data },
      { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
    )
  },

  /** Latest scraped prices from external sources (scraping app). Requires JWT. */
  getScrapedPricesLatest: () => {
    const token = localStorage.getItem('access_token')
    return apiService.get<ScrapedPriceRow[]>('/scraping/prices/latest/', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    })
  },
}

/** Response from Dar Al Sabaek getMetalSellAndBuyPrices (via our proxy). */
export type DaralsabaekMetalPricesResult = {
  purchaseGoldPrice: number
  purchase22GoldPrice: number
  purchase21GoldPrice: number
  purchase18GoldPrice: number
  sellGoldPrice: number
  sell22GoldPrice: number
  sell21GoldPrice: number
  sell18GoldPrice: number
  purchaseSilverPrice: number
  sellSilverPrice: number
  purchasePlatinumPrice: number
  sellPlatinumPrice: number
  updateIntervalInSeconds: number
  goldOuncePrice: number
  silverKiloPrice: number
  goldPriceStatus: number
  silverPriceStatus: number
}

/** Public endpoint: carats with buyTotal/sellTotal = URL + stored markup */
export type DaralsabaekPublicCarat = {
  key: string
  /** URL base rate per gram (buy side) */
  buy: number
  sell: number
  buyAdd: number
  sellAdd: number
  /** Extra KWD/g for club members (on top of general total) */
  clubBuyAdd?: number
  clubSellAdd?: number
  buyTotal: number | null
  sellTotal: number | null
  buyTotalClub?: number | null
  sellTotalClub?: number | null
}

export type DaralsabaekPublicRatesResponse = {
  succeeded: boolean
  message?: string
  goldOuncePrice?: number
  updateIntervalInSeconds?: number
  carats: DaralsabaekPublicCarat[]
}

export type DaralsabaekMetalPricesResponse = {
  succeeded: boolean
  message: string
  result: DaralsabaekMetalPricesResult | null
  errors: unknown[]
}

/** Row from GET /scraping/prices/latest/ */
export type ScrapedPriceRow = {
  id: string
  source: string
  source_name: string
  carat_value: number
  buy_price: string | null
  sell_price: string | null
  currency: string
  source_timestamp: string | null
  scraped_at: string
}

export default api
