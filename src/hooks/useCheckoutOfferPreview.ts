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

type CheckoutOfferPreviewOpts = {
  discountCode?: string
  /** Live cart subtotal — used to reject stale session quotes that no longer match. */
  cartSubtotal?: number
  /**
   * Checkout enter: always fetch a fresh lock (do not keep a cart-prefetch quote).
   * Cart warm: reuse cache / session when still valid.
   */
  lockOnMount?: boolean
  /** When false, do not fetch yet (wait for checkout entry reprice). */
  enabled?: boolean
}

export function useCheckoutOfferPreview(
  items: CheckoutPreviewPayload[],
  deliveryType: 'physical' | 'locked' = 'physical',
  opts?: CheckoutOfferPreviewOpts,
) {
  const key = useMemo(() => stableItemsKey(items), [items])
  const discountCode = (opts?.discountCode || '').trim().toUpperCase()
  const lockOnMount = opts?.lockOnMount ?? false
  const cartSubtotal = opts?.cartSubtotal
  const optsEnabled = opts?.enabled !== false
  const storageKey = useMemo(
    () => checkoutQuoteStorageKey(key, deliveryType, discountCode),
    [key, deliveryType, discountCode],
  )

  const hasToken =
    typeof window !== 'undefined' && !!localStorage.getItem('access_token')

  const sessionQuote = useMemo(
    () =>
      hasToken && items.length > 0
        ? readCheckoutQuoteSession(storageKey, { cartTotal: cartSubtotal })
        : undefined,
    // storageKey encodes cart / delivery / discount identity; cartSubtotal gates reuse
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageKey, hasToken, items.length, cartSubtotal],
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
    enabled: hasToken && items.length > 0 && optsEnabled,
    // Only seed from session when recent or still aligned with live cart — never an old lock.
    initialData: sessionQuote,
    initialDataUpdatedAt: sessionQuote?.saved_at,
    // Checkout must lock at enter-time rates; cart prefetch must not freeze an older total.
    refetchOnMount: lockOnMount ? 'always' : true,
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
