/** Session key for an unpaid website KNET sale that still holds inventory. */
export const KNET_PENDING_SALE_KEY = 'gs_knet_pending_sale'

export type KnetPendingSale = {
  saleId: string
  invoice?: string
  at: number
}

/** After this age, Front may auto-abandon (inquire-first) so stock returns. */
export const KNET_PENDING_AUTO_ABANDON_MS = 15 * 60 * 1000

export function readKnetPendingSale(): KnetPendingSale | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(KNET_PENDING_SALE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as KnetPendingSale
    if (!parsed?.saleId) return null
    return parsed
  } catch {
    return null
  }
}

export function writeKnetPendingSale(pending: KnetPendingSale) {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(
      KNET_PENDING_SALE_KEY,
      JSON.stringify({ ...pending, at: pending.at || Date.now() }),
    )
  } catch {
    /* ignore */
  }
}

export function clearKnetPendingSale() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(KNET_PENDING_SALE_KEY)
  } catch {
    /* ignore */
  }
}

export function knetPendingAgeMs(pending: KnetPendingSale | null): number {
  if (!pending?.at) return Number.POSITIVE_INFINITY
  return Math.max(0, Date.now() - pending.at)
}
