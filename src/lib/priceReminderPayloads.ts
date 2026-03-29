import type { DaralsabaekPublicRatesResponse } from '../services/api'

export type PriceReminderDirection = 'increase' | 'decrease' | 'both'

export type PriceReminderBuildErrorCode =
  | 'liveRatesUnavailable'
  | 'selectCarat'
  | 'selectBuyOrSell'
  | 'invalidDelta'
  | 'noValidRates'

export function buildGoldPriceAlertPayloads(params: {
  res: DaralsabaekPublicRatesResponse | undefined
  reminderSelectedCarats: number[]
  watchBuy: boolean
  watchSell: boolean
  direction: PriceReminderDirection
  delta: number
  deltaValid: boolean
}): { ok: true; payloads: unknown[] } | { ok: false; errorCode: PriceReminderBuildErrorCode } {
  const {
    res,
    reminderSelectedCarats,
    watchBuy,
    watchSell,
    direction,
    delta,
    deltaValid,
  } = params

  if (!res?.succeeded || !Array.isArray(res.carats)) {
    return { ok: false, errorCode: 'liveRatesUnavailable' }
  }
  if (reminderSelectedCarats.length === 0) {
    return { ok: false, errorCode: 'selectCarat' }
  }
  if (!watchBuy && !watchSell) {
    return { ok: false, errorCode: 'selectBuyOrSell' }
  }
  if (!deltaValid) {
    return { ok: false, errorCode: 'invalidDelta' }
  }

  const caratRatesByKey = new Map<string, { buyTotal: number | null; sellTotal: number | null }>()
  for (const c of res.carats) {
    caratRatesByKey.set(String(c.key), { buyTotal: c.buyTotal ?? null, sellTotal: c.sellTotal ?? null })
  }

  const payloads: unknown[] = []
  for (const cv of reminderSelectedCarats) {
    const key = `${cv}K`
    const rates = caratRatesByKey.get(key)
    if (!rates) continue

    if (watchBuy && rates.buyTotal != null) {
      const current = rates.buyTotal
      if (direction === 'both') {
        const targetUp = current + delta
        if (targetUp > 0) {
          payloads.push({
            alert_type: 'gold_price',
            gold_carats: cv,
            price_side: 'buy',
            target_price: targetUp.toFixed(3),
            condition: 'above',
            notification_method: 'whatsapp',
          })
        }
        const targetDown = current - delta
        if (targetDown > 0) {
          payloads.push({
            alert_type: 'gold_price',
            gold_carats: cv,
            price_side: 'buy',
            target_price: targetDown.toFixed(3),
            condition: 'below',
            notification_method: 'whatsapp',
          })
        }
      } else {
        const target = direction === 'increase' ? current + delta : current - delta
        if (target > 0) {
          payloads.push({
            alert_type: 'gold_price',
            gold_carats: cv,
            price_side: 'buy',
            target_price: target.toFixed(3),
            condition: direction === 'increase' ? 'above' : 'below',
            notification_method: 'whatsapp',
          })
        }
      }
    }

    if (watchSell && rates.sellTotal != null) {
      const current = rates.sellTotal
      if (direction === 'both') {
        const targetUp = current + delta
        if (targetUp > 0) {
          payloads.push({
            alert_type: 'gold_price',
            gold_carats: cv,
            price_side: 'sell',
            target_price: targetUp.toFixed(3),
            condition: 'above',
            notification_method: 'whatsapp',
          })
        }
        const targetDown = current - delta
        if (targetDown > 0) {
          payloads.push({
            alert_type: 'gold_price',
            gold_carats: cv,
            price_side: 'sell',
            target_price: targetDown.toFixed(3),
            condition: 'below',
            notification_method: 'whatsapp',
          })
        }
      } else {
        const target = direction === 'increase' ? current + delta : current - delta
        if (target > 0) {
          payloads.push({
            alert_type: 'gold_price',
            gold_carats: cv,
            price_side: 'sell',
            target_price: target.toFixed(3),
            condition: direction === 'increase' ? 'above' : 'below',
            notification_method: 'whatsapp',
          })
        }
      }
    }
  }

  if (payloads.length === 0) {
    return { ok: false, errorCode: 'noValidRates' }
  }
  return { ok: true, payloads }
}
