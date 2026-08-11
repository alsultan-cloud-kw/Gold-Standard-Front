export type CheckoutPreviewData = {
  subtotal: string
  discount_amount: string
  shipping_amount: string
  tax_amount: string
  total_amount: string
  offer_title: string | null
  offer_id: string | null
  line_prices: unknown
  quote_token: string
  expires_at: string
  ttl_seconds?: number
}

/** Milliseconds the quote (and the total rendered from it) may still be trusted. */
export function checkoutQuoteRemainingMs(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 0
  const expiry = new Date(expiresAt).getTime()
  if (!Number.isFinite(expiry)) return 0
  return Math.max(0, expiry - Date.now())
}

const STORAGE_PREFIX = 'gs_checkout_quote_v1:'

export function checkoutQuoteStorageKey(
  itemsKey: string,
  deliveryType: string,
  discountCode: string,
): string {
  return `${STORAGE_PREFIX}${itemsKey}|${deliveryType}|${discountCode || ''}`
}

export function readCheckoutQuoteSession(storageKey: string): CheckoutPreviewData | undefined {
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
    sessionStorage.setItem(storageKey, JSON.stringify(data))
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
