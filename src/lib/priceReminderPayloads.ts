import type { DaralsabaekPublicRatesResponse } from '../services/api'

export type PriceReminderBuildErrorCode = 'liveRatesUnavailable' | 'invalidDelta' | 'noValidRates'

type SpotMetal = 'gold' | 'silver' | 'platinum'

function pushBothDirections(
  payloads: unknown[],
  spot_metal: SpotMetal,
  gold_carats: number | null,
  price_side: 'buy' | 'sell',
  current: number,
  delta: number,
) {
  const targetUp = current + delta
  if (targetUp > 0) {
    payloads.push({
      alert_type: 'gold_price',
      spot_metal,
      gold_carats,
      price_side,
      target_price: targetUp.toFixed(3),
      condition: 'above',
      notification_method: 'whatsapp',
    })
  }
  const targetDown = current - delta
  if (targetDown > 0) {
    payloads.push({
      alert_type: 'gold_price',
      spot_metal,
      gold_carats,
      price_side,
      target_price: targetDown.toFixed(3),
      condition: 'below',
      notification_method: 'whatsapp',
    })
  }
}

/**
 * Build price-alert API payloads for gold (all carats in feed), silver, and platinum:
 * buy + sell, both above and below current ± delta (same as former “Both” direction).
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

  const payloads: unknown[] = []

  for (const c of res.carats) {
    const m = String(c.key || '').match(/^(\d+)K$/i)
    const cv = m ? parseInt(m[1], 10) : NaN
    if (!Number.isFinite(cv) || cv <= 0) continue
    const buyTotal = c.buyTotal ?? null
    const sellTotal = c.sellTotal ?? null
    if (buyTotal != null) {
      pushBothDirections(payloads, 'gold', cv, 'buy', Number(buyTotal), delta)
    }
    if (sellTotal != null) {
      pushBothDirections(payloads, 'gold', cv, 'sell', Number(sellTotal), delta)
    }
  }

  const silver = res.silver
  if (silver) {
    if (silver.buyTotal != null) {
      pushBothDirections(payloads, 'silver', null, 'buy', Number(silver.buyTotal), delta)
    }
    if (silver.sellTotal != null) {
      pushBothDirections(payloads, 'silver', null, 'sell', Number(silver.sellTotal), delta)
    }
  }

  const platinum = res.platinum
  if (platinum) {
    if (platinum.buyTotal != null) {
      pushBothDirections(payloads, 'platinum', null, 'buy', Number(platinum.buyTotal), delta)
    }
    if (platinum.sellTotal != null) {
      pushBothDirections(payloads, 'platinum', null, 'sell', Number(platinum.sellTotal), delta)
    }
  }

  if (payloads.length === 0) {
    return { ok: false, errorCode: 'noValidRates' }
  }
  return { ok: true, payloads }
}
