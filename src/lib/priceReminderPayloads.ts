import type { DaralsabaekPublicRatesResponse } from '../services/api'

export type PriceReminderBuildErrorCode = 'liveRatesUnavailable' | 'invalidDelta' | 'noValidRates'

export type NotificationMethod =
  | 'push'
  | 'whatsapp'
  | 'email'
  | 'both'
  | 'all'
  | 'push_email'
  | 'whatsapp_email'

export function resolveNotificationMethod(opts: {
  push: boolean
  whatsapp: boolean
  email: boolean
}): NotificationMethod | null {
  const { push, whatsapp, email } = opts
  if (push && whatsapp && email) return 'all'
  if (push && whatsapp) return 'both'
  if (push && email) return 'push_email'
  if (whatsapp && email) return 'whatsapp_email'
  if (push) return 'push'
  if (whatsapp) return 'whatsapp'
  if (email) return 'email'
  return null
}

type SpotMetal = 'gold'

/** Remind-me watches Kuwait KWD/g for these karats only. */
const REMINDER_GOLD_CARATS = new Set([24, 22])

/**
 * Build one delta-criteria payload for 24K and 22K Kuwait gold rates.
 */
export function buildSpotPriceAlertPayloads(params: {
  res: DaralsabaekPublicRatesResponse | undefined
  delta: number
  deltaValid: boolean
  notificationMethod?: NotificationMethod
}): { ok: true; payloads: unknown[] } | { ok: false; errorCode: PriceReminderBuildErrorCode } {
  const { res, delta, deltaValid, notificationMethod = 'both' } = params

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
    if (!Number.isFinite(cv) || !REMINDER_GOLD_CARATS.has(cv)) continue
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
        notification_method: notificationMethod,
      },
    ],
  }
}
