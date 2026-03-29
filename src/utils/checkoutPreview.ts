/** API returns decimal strings */
export function parseCheckoutMoney(s: string | undefined | null): number | null {
  if (s == null || s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

export type CheckoutPreviewPayload = { product_id: string; quantity: number }
