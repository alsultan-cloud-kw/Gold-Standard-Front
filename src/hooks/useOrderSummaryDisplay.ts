import { useMemo } from 'react'
import type { Cart } from '../types'
import { parseCheckoutMoney } from '../utils/checkoutPreview'
import { useCheckoutOfferPreview } from './useCheckoutOfferPreview'
import { PRICE_NUMBER_LOCALE } from '@/utils/formatLatinNumber'

/** Format KWD amounts for order summaries (matches dashboard-style precision). */
export function formatOrderKwd(n: number): string {
  return n.toLocaleString(PRICE_NUMBER_LOCALE, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

/**
 * Merges cart line totals with server checkout preview when the user is logged in.
 * Preview uses the same pricing + best customer offer as place_order.
 */
export function useOrderSummaryDisplay(
  cart: Cart,
  deliveryType: 'physical' | 'locked' = 'locked',
) {
  const items = useMemo(
    () => cart.items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
    [cart.items],
  )

  const previewQuery = useCheckoutOfferPreview(items, deliveryType)
  const { data: preview, isFetching, isError, isSuccess } = previewQuery

  const useServer = isSuccess && !!preview && items.length > 0 && !isError

  const subtotal = useMemo(() => {
    if (!useServer || !preview) return cart.subtotal
    return parseCheckoutMoney(preview.subtotal) ?? cart.subtotal
  }, [useServer, preview, cart.subtotal])

  const discountAmount = useMemo(() => {
    if (!useServer || !preview) return 0
    return parseCheckoutMoney(preview.discount_amount) ?? 0
  }, [useServer, preview])

  const totalAmount = useMemo(() => {
    if (!useServer || !preview) return cart.total_amount
    return parseCheckoutMoney(preview.total_amount) ?? cart.total_amount
  }, [useServer, preview, cart.total_amount])

  const shippingAmount = useMemo(() => {
    if (!useServer || !preview) return 0
    return parseCheckoutMoney(preview.shipping_amount) ?? 0
  }, [useServer, preview])

  const taxAmount = useMemo(() => {
    if (!useServer || !preview) return 0
    return parseCheckoutMoney(preview.tax_amount) ?? 0
  }, [useServer, preview])

  const offerTitle = useServer && preview?.offer_title ? preview.offer_title : null

  return {
    subtotal,
    discountAmount,
    totalAmount,
    shippingAmount,
    taxAmount,
    offerTitle,
    linePrices: useServer ? preview?.line_prices : null,
    quoteToken: useServer && preview?.quote_token ? preview.quote_token : null,
    expiresAt: useServer && preview?.expires_at ? preview.expires_at : null,
    refetchPreview: previewQuery.refetch,
    /** True while fetching preview for a non-empty cart (logged-in only). */
    previewLoading: isFetching && items.length > 0,
    /** Server preview applied (may still be discount 0). */
    useServerPreview: useServer,
  }
}
