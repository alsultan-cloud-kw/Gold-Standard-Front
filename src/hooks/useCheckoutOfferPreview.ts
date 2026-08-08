import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clubsApi } from '../services/api'
import type { CheckoutPreviewPayload } from '../utils/checkoutPreview'

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

/**
 * Refresh the quote this long before the server would reject it, so a customer who
 * reaches the review step late still submits a token the backend accepts.
 */
export const CHECKOUT_QUOTE_REFRESH_MARGIN_MS = 60_000

/** Milliseconds the quote (and the total rendered from it) may still be trusted. */
export function checkoutQuoteRemainingMs(expiresAt: string | null | undefined): number {
  if (!expiresAt) return 0
  const expiry = new Date(expiresAt).getTime()
  if (!Number.isFinite(expiry)) return 0
  return Math.max(0, expiry - Date.now())
}

function stableItemsKey(items: CheckoutPreviewPayload[]): string {
  const sorted = [...items].sort((a, b) => String(a.product_id).localeCompare(String(b.product_id)))
  return JSON.stringify(sorted.map((i) => [i.product_id, i.quantity]))
}

export function useCheckoutOfferPreview(
  items: CheckoutPreviewPayload[],
  deliveryType: 'physical' | 'locked' = 'physical',
) {
  const key = useMemo(() => stableItemsKey(items), [items])

  const hasToken =
    typeof window !== 'undefined' && !!localStorage.getItem('access_token')

  return useQuery({
    queryKey: ['checkoutOfferPreview', key, deliveryType],
    queryFn: () => clubsApi.checkoutPreview(items, deliveryType) as Promise<CheckoutPreviewData>,
    enabled: hasToken && items.length > 0,
    // The quote is a price lock, not a ticker. Gold re-prices upstream every 60s, so a
    // background refetch would silently change the total the customer is reading — the exact
    // "purchase price mismatch" KNET certification rejects. Hold it for its server validity
    // window and let the customer re-price explicitly (or on a fresh cart / expiry).
    staleTime: (query) =>
      Math.max(
        0,
        checkoutQuoteRemainingMs(query.state.data?.expires_at) - CHECKOUT_QUOTE_REFRESH_MARGIN_MS,
      ),
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
  })
}
