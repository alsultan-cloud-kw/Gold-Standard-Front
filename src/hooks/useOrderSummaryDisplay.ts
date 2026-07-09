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
export function useOrderSummaryDisplay(cart: Cart) {
  const items = useMemo(
    () => cart.items.map((i) => ({ product_id: i.product.id, quantity: i.quantity })),
    [cart.items],
  )

  const { data: preview, isFetching, isError, isSuccess } = useCheckoutOfferPreview(items)

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
    const t = parseCheckoutMoney(preview.total_amount)
    if (t == null) return cart.total_amount
    return t + (cart.tax_amount || 0)
  }, [useServer, preview, cart.total_amount, cart.tax_amount])

  const offerTitle = useServer && preview?.offer_title ? preview.offer_title : null

  return {
    subtotal,
    discountAmount,
    totalAmount,
    taxAmount: cart.tax_amount,
    offerTitle,
    /** True while fetching preview for a non-empty cart (logged-in only). */
    previewLoading: isFetching && items.length > 0,
    /** Server preview applied (may still be discount 0). */
    useServerPreview: useServer,
  }
}
