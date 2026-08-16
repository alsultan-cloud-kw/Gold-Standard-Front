export type CheckoutPreviewData = {
  subtotal: string
  discount_amount: string
  shipping_amount: string
  tax_amount: string
  total_amount: string
  offer_title: string | null
  offer_id: string | null
  discount_source?: string | null
  line_prices: unknown
  quote_token: string
  expires_at: string
  ttl_seconds?: number
  /** Client write time — used to decide whether a session quote may seed checkout. */
  saved_at?: number
}

/** Prefer a brand-new lock when entering checkout; only reuse within this window. */
export const CHECKOUT_QUOTE_REUSE_MAX_AGE_MS = 15_000

/** Allow 2 fils of float/rounding drift between live cart total and quote total. */
export const CHECKOUT_QUOTE_TOTAL_TOLERANCE_KWD = 0.002

/** Milliseconds the quote (and the total rendered from it) may still be trusted. */
export function checkoutQuoteRemainingMs(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 0
  const expiry = new Date(expiresAt).getTime()
  if (!Number.isFinite(expiry)) return 0
  return Math.max(0, expiry - Date.now())
}

export function checkoutQuoteTotalsAlign(
  quoteTotal: number,
  cartTotal: number,
  tolerance = CHECKOUT_QUOTE_TOTAL_TOLERANCE_KWD,
): boolean {
  if (!Number.isFinite(quoteTotal) || !Number.isFinite(cartTotal)) return false
  return Math.abs(quoteTotal - cartTotal) <= tolerance
}

/**
 * Session / cache quotes may seed the UI only when still valid AND either very recent
 * or still matching the current live cart total. Older mismatched locks cause cart vs
 * checkout price mismatch.
 */
export function isReusableCheckoutQuote(
  data: CheckoutPreviewData,
  opts?: { cartTotal?: number; maxAgeMs?: number },
): boolean {
  if (!data?.quote_token || checkoutQuoteRemainingMs(data.expires_at) <= 0) return false
  const savedAt = typeof data.saved_at === 'number' ? data.saved_at : 0
  const maxAge = opts?.maxAgeMs ?? CHECKOUT_QUOTE_REUSE_MAX_AGE_MS
  if (savedAt > 0 && Date.now() - savedAt <= maxAge) return true
  if (opts?.cartTotal != null) {
    const quoted = Number(data.total_amount)
    if (checkoutQuoteTotalsAlign(quoted, opts.cartTotal)) return true
  }
  return false
}

const STORAGE_PREFIX = 'gs_checkout_quote_v1:'

export function checkoutQuoteStorageKey(
  itemsKey: string,
  deliveryType: string,
  discountCode: string,
): string {
  return `${STORAGE_PREFIX}${itemsKey}|${deliveryType}|${discountCode || ''}`
}

export function readCheckoutQuoteSession(
  storageKey: string,
  opts?: { cartTotal?: number; maxAgeMs?: number },
): CheckoutPreviewData | undefined {
  if (typeof window === 'undefined') return undefined
  try {
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) return undefined
    const data = JSON.parse(raw) as CheckoutPreviewData
    if (!data?.quote_token || !data.expires_at) {
      sessionStorage.removeItem(storageKey)
      return undefined
    }
    if (checkoutQuoteRemainingMs(data.expires_at) <= 0) {
      sessionStorage.removeItem(storageKey)
      return undefined
    }
    // Keep storage row for hard-refresh within TTL, but do not seed UI when stale vs cart.
    if (!isReusableCheckoutQuote(data, opts)) return undefined
    return data
  } catch {
    return undefined
  }
}

export function writeCheckoutQuoteSession(storageKey: string, data: CheckoutPreviewData) {
  if (typeof window === 'undefined') return
  try {
    if (!data?.quote_token || checkoutQuoteRemainingMs(data.expires_at) <= 0) {
      sessionStorage.removeItem(storageKey)
      return
    }
    const payload: CheckoutPreviewData = {
      ...data,
      saved_at: Date.now(),
    }
    sessionStorage.setItem(storageKey, JSON.stringify(payload))
  } catch {
    /* private mode / quota */
  }
}

export function clearCheckoutQuoteSession(storageKey: string) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(storageKey)
  } catch {
    /* ignore */
  }
}
