/** API returns decimal strings */
export function parseCheckoutMoney(s: string | undefined | null): number | null {
  if (s == null || s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export type CheckoutPreviewPayload = { product_id: string; quantity: number }

/** Accepts list or product-id keyed line price shapes while the API remains decimal-string based. */
export function checkoutPreviewLineTotal(
  linePrices: unknown,
  productId: string,
): number | null {
  let row: unknown
  if (Array.isArray(linePrices)) {
    row = linePrices.find((candidate) => {
      if (!candidate || typeof candidate !== 'object') return false
      return String((candidate as Record<string, unknown>).product_id ?? '') === String(productId)
    })
  } else if (linePrices && typeof linePrices === 'object') {
    row = (linePrices as Record<string, unknown>)[String(productId)]
  }
  if (typeof row === 'string' || typeof row === 'number') {
    return parseCheckoutMoney(String(row))
  }
  if (!row || typeof row !== 'object') return null
  const data = row as Record<string, unknown>
  const raw = data.line_total ?? data.total_price ?? data.total_amount
  return raw == null ? null : parseCheckoutMoney(String(raw))
}
