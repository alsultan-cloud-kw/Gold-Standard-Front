import type { DaralsabaekPublicRatesResponse } from '../services/api'

export type PriceReminderBuildErrorCode = 'liveRatesUnavailable' | 'invalidDelta' | 'noValidRates'

type SpotMetal = 'gold'

/**
 * Build one delta-criteria payload for all spot rates currently visible to customers.
 * Backend stores one active criterion per user and triggers when any watched rate moves by delta.
 */
export function buildSpotPriceAlertPayloads(params: {
  res: DaralsabaekPublicRatesResponse | undefined
  delta: number
  deltaValid: boolean
}): { ok: true; payloads: unknown[] } | { ok: false; errorCode: PriceReminderBuildErrorCode } {
  const { res, delta, deltaValid } = params

  if (!res?.succeeded || !Array.isArray(res.carats)) {
    return { ok: false, errorCode: 'liveRatesUnavailable' }
  }
  if (!deltaValid) {
    return { ok: false, errorCode: 'invalidDelta' }
  }

  const baselineRates: Record<string, string> = {}

  const pushBaseline = (
    spot_metal: SpotMetal,
    gold_carats: number | null,
    price_side: 'buy' | 'sell',
    value: number | null | undefined,
  ) => {
    if (value == null || !Number.isFinite(Number(value))) return
    const key = `${spot_metal}:${gold_carats ?? 'na'}:${price_side}`
    baselineRates[key] = Number(value).toFixed(3)
  }

  for (const c of res.carats) {
    const m = String(c.key || '').match(/^(\d+)K$/i)
    const cv = m ? parseInt(m[1], 10) : NaN
    if (!Number.isFinite(cv) || cv <= 0) continue
    pushBaseline('gold', cv, 'buy', c.buyTotal ?? null)
    pushBaseline('gold', cv, 'sell', c.sellTotal ?? null)
  }

  if (Object.keys(baselineRates).length === 0) {
    return { ok: false, errorCode: 'noValidRates' }
  }
  return {
    ok: true,
    payloads: [
      {
        alert_type: 'gold_price',
        reminder_mode: 'delta',
        delta_value: delta.toFixed(3),
        baseline_rates: baselineRates,
        notification_method: 'whatsapp',
      },
    ],
  }
}
