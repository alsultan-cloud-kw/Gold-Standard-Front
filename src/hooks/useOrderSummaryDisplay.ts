import { useEffect, useMemo, useState } from 'react'
import type { Cart } from '../types'
import { parseCheckoutMoney } from '../utils/checkoutPreview'
import {
  checkoutQuoteTotalsAlign,
  isReusableCheckoutQuote,
} from '@/lib/checkoutQuoteSession'
import { checkoutQuoteRemainingMs, useCheckoutOfferPreview } from './useCheckoutOfferPreview'
import { PRICE_NUMBER_LOCALE } from '@/utils/formatLatinNumber'

/** Format KWD amounts for order summaries (matches dashboard-style precision). */
export function formatOrderKwd(n: number): string {
  return n.toLocaleString(PRICE_NUMBER_LOCALE, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

type OrderSummaryOpts = {
  discountCode?: string
  /**
   * `quote` (checkout): never fall back to live cart money — show loading / — until the
   * signed lock from this checkout enter is ready (no stale cart-prefetch flash).
   * `cart` (cart page): allow cart totals while preview warms the physical quote cache.
   */
  pricingSource?: 'cart' | 'quote'
  /** Wait for checkout entry reprice before locking (cart↔checkout match). */
  priceReady?: boolean
}

/**
 * Merges cart line totals with server checkout preview when the user is logged in.
 * Preview uses the same pricing + best customer offer as place_order.
 */
export function useOrderSummaryDisplay(
  cart: Cart,
  deliveryType: 'physical' | 'locked' = 'physical',
  opts?: OrderSummaryOpts,
) {
  const pricingSource = opts?.pricingSource ?? 'cart'
  const requireQuote = pricingSource === 'quote'
  const priceReady = opts?.priceReady !== false

  const items = useMemo(
    () => cart.items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
    [cart.items],
  )

  const previewQuery = useCheckoutOfferPreview(items, deliveryType, {
    discountCode: opts?.discountCode,
    // Compare merchandise subtotal (quote shipping is separate).
    cartSubtotal: cart.subtotal,
    lockOnMount: requireQuote,
    enabled: priceReady,
  })
  const {
    data: preview,
    isFetching,
    isError,
    isSuccess,
    isFetchedAfterMount,
    isPending,
  } = previewQuery

  const previewAlignsWithCart = useMemo(() => {
    if (!preview) return false
    const quoted = parseCheckoutMoney(preview.subtotal)
    if (quoted == null) return false
    return checkoutQuoteTotalsAlign(quoted, cart.subtotal)
  }, [preview, cart.subtotal])

  /**
   * Checkout: only trust a quote after a mount-time fetch, or when a seeded session/cache
   * quote still matches the live cart (very recent warm). Never show an older lock.
   */
  const useServer = useMemo(() => {
    if (!isSuccess || !preview || items.length === 0 || isError) return false
    if (!requireQuote) return true
    if (isFetchedAfterMount) return true
    return isReusableCheckoutQuote(preview, { cartTotal: cart.subtotal }) || previewAlignsWithCart
  }, [
    isSuccess,
    preview,
    items.length,
    isError,
    requireQuote,
    isFetchedAfterMount,
    cart.subtotal,
    previewAlignsWithCart,
  ])

  const quotePending =
    requireQuote &&
    items.length > 0 &&
    !useServer &&
    (!priceReady || isPending || isFetching || !isFetchedAfterMount)

  const subtotal = useMemo(() => {
    if (!useServer || !preview) return requireQuote ? 0 : cart.subtotal
    return parseCheckoutMoney(preview.subtotal) ?? (requireQuote ? 0 : cart.subtotal)
  }, [useServer, preview, cart.subtotal, requireQuote])

  const discountAmount = useMemo(() => {
    if (!useServer || !preview) return 0
    return parseCheckoutMoney(preview.discount_amount) ?? 0
  }, [useServer, preview])

  const totalAmount = useMemo(() => {
    if (!useServer || !preview) return requireQuote ? 0 : cart.total_amount
    return parseCheckoutMoney(preview.total_amount) ?? (requireQuote ? 0 : cart.total_amount)
  }, [useServer, preview, cart.total_amount, requireQuote])

  const shippingAmount = useMemo(() => {
    if (!useServer || !preview) return 0
    return parseCheckoutMoney(preview.shipping_amount) ?? 0
  }, [useServer, preview])

  const taxAmount = useMemo(() => {
    if (!useServer || !preview) return 0
    return parseCheckoutMoney(preview.tax_amount) ?? 0
  }, [useServer, preview])

  const offerTitle = useServer && preview?.offer_title ? preview.offer_title : null
  const expiresAt = useServer && preview?.expires_at ? preview.expires_at : null

  // Re-render once a second so the review step can count the locked price down; the value
  // itself is derived at render time and so is never stale.
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!expiresAt) return
    const timer = setInterval(() => setTick((n) => n + 1), 1_000)
    return () => clearInterval(timer)
  }, [expiresAt])
  const quoteRemainingMs = checkoutQuoteRemainingMs(expiresAt)

  return {
    subtotal,
    discountAmount,
    totalAmount,
    shippingAmount,
    taxAmount,
    offerTitle,
    discountSource: useServer ? preview?.discount_source ?? null : null,
    linePrices: useServer ? preview?.line_prices : null,
    quoteToken: useServer && preview?.quote_token ? preview.quote_token : null,
    expiresAt,
    /** Milliseconds the displayed total is still guaranteed to equal the KNET charge. */
    quoteRemainingMs,
    /** Locked price lapsed — the customer must re-price before we may charge them. */
    quoteExpired: !!expiresAt && quoteRemainingMs <= 0,
    refetchPreview: previewQuery.refetch,
    /** True while fetching preview for a non-empty cart (logged-in only), or checkout waiting on lock. */
    previewLoading: (isFetching && items.length > 0) || quotePending,
    /** Server preview applied (may still be discount 0). */
    useServerPreview: useServer,
  }
}
