import { toFiniteNumber } from '@/services/pricingApi'
import type { DaralsabaekPublicCarat } from '@/services/api'

/**
 * When Django has not yet attached changeToday, derive abs + % from GoldAPI chp
 * applied to the customer buy quote (sellTotal).
 */
export function dayChangeFromPercent(
  row: Pick<DaralsabaekPublicCarat, 'buyTotal' | 'sellTotal' | 'changeToday' | 'changeTodayPercent'>,
  chp: number | null | undefined,
): { changeToday: number | null; changeTodayPercent: number | null } {
  if (row.changeToday != null && row.changeTodayPercent != null) {
    return {
      changeToday: Number(row.changeToday),
      changeTodayPercent: Number(row.changeTodayPercent),
    }
  }

  const pct = toFiniteNumber(chp)
  const current = toFiniteNumber(row.sellTotal) ?? toFiniteNumber(row.buyTotal)
  if (pct == null || current == null) {
    return {
      changeToday: row.changeToday ?? null,
      changeTodayPercent: row.changeTodayPercent ?? null,
    }
  }

  const denom = 1 + pct / 100
  if (Math.abs(denom) < 1e-12) {
    return { changeToday: null, changeTodayPercent: null }
  }
  const open = current / denom
  const change = current - open
  return {
    changeToday: Math.round(change * 1000) / 1000,
    changeTodayPercent: Math.round(pct * 100) / 100,
  }
}
