import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { clubsApi } from '../services/api'
import type { CheckoutPreviewPayload } from '../utils/checkoutPreview'
import {
  checkoutQuoteRemainingMs,
  checkoutQuoteStorageKey,
  readCheckoutQuoteSession,
  writeCheckoutQuoteSession,
  type CheckoutPreviewData,
} from '@/lib/checkoutQuoteSession'

export type { CheckoutPreviewData }
export { checkoutQuoteRemainingMs }

/**
 * Refresh the quote this long before the server would reject it, so a customer who
 * reaches the review step late still submits a token the backend accepts.
 */
export const CHECKOUT_QUOTE_REFRESH_MARGIN_MS = 60_000

function stableItemsKey(items: CheckoutPreviewPayload[]): string {
  const sorted = [...items].sort((a, b) => String(a.product_id).localeCompare(String(b.product_id)))
  return JSON.stringify(sorted.map((i) => [i.product_id, i.quantity]))
}

export function useCheckoutOfferPreview(
  items: CheckoutPreviewPayload[],
  deliveryType: 'physical' | 'locked' = 'physical',
  opts?: { discountCode?: string },
) {
  const key = useMemo(() => stableItemsKey(items), [items])
  const discountCode = (opts?.discountCode || '').trim().toUpperCase()
  const storageKey = useMemo(
    () => checkoutQuoteStorageKey(key, deliveryType, discountCode),
    [key, deliveryType, discountCode],
  )

  const hasToken =
    typeof window !== 'undefined' && !!localStorage.getItem('access_token')

  const sessionQuote = useMemo(
    () => (hasToken && items.length > 0 ? readCheckoutQuoteSession(storageKey) : undefined),
    // storageKey encodes cart / delivery / discount identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageKey, hasToken, items.length],
  )

  return useQuery({
    queryKey: ['checkoutOfferPreview', key, deliveryType, discountCode || ''],
    queryFn: async () => {
      const data = (await clubsApi.checkoutPreview(items, deliveryType, {
        channel: 'website',
        ...(discountCode ? { discount_code: discountCode } : {}),
      })) as CheckoutPreviewData
      writeCheckoutQuoteSession(storageKey, data)
      return data
    },
    enabled: hasToken && items.length > 0,
    // Survive hard refresh with the same signed lock until TTL / explicit refresh.
    initialData: sessionQuote,
    initialDataUpdatedAt: sessionQuote ? Date.now() : undefined,
    // The quote is a price lock, not a ticker. Hold for server validity window.
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
