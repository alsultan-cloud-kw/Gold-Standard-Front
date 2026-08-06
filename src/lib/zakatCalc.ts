/** Client-side Zakat math (mirrors backend `zakat.services` / kw-awqaf-v1). */

export const NISAB_PURE_GOLD_G = 85
export const ZAKAT_RATE = 0.025
export const METHODOLOGY_VERSION = 'kw-awqaf-v1'

export const GOLD_PURITY: Record<string, number> = {
  '24': 1,
  '22': 22 / 24,
  '21': 21 / 24,
  '18': 18 / 24,
}

export const SILVER_PURITY: Record<string, number> = {
  '999': 1,
  '925': 925 / 999,
  '900': 900 / 999,
  '800': 800 / 999,
  '600': 600 / 999,
}

export type GoldLine = { carat: string; weight_grams: number }
export type SilverLine = { fineness: string; weight_grams: number }

export type ZakatEvalInput = {
  gold_lines?: GoldLine[]
  silver_lines?: SilverLine[]
  cash_kwd?: number
  business_kwd?: number
  debts_kwd?: number
  include_jewelry?: boolean
  jewelry_value_kwd?: number
  gold_price_24k_buy_kwd: number
  silver_price_999_buy_kwd?: number | null
}

export type ZakatEvalResult = {
  methodology_version: string
  gold_price_24k_buy_kwd: number
  silver_price_999_buy_kwd: number | null
  nisab_kwd: number
  pure_gold_equivalent_g: number
  pure_silver_equivalent_g: number
  total_assets_kwd: number
  debts_kwd: number
  zakatable_kwd: number
  above_nisab: boolean
  zakat_due_kwd: number
  breakdown: {
    gold_lines: Array<{
      carat: string
      weight_grams: number
      pure_g: number
      value_kwd: number
    }>
    silver_lines: Array<{
      fineness: string
      weight_grams: number
      pure_g: number
      value_kwd: number
    }>
    cash_kwd: number
    business_kwd: number
    jewelry_value_kwd: number
    debts_kwd: number
    gold_value_kwd: number
    silver_value_kwd: number
  }
}

function round3(n: number) {
  return Math.round((n + Number.EPSILON) * 1000) / 1000
}

function round4(n: number) {
  return Math.round((n + Number.EPSILON) * 10000) / 10000
}

export function evaluateZakatLocal(input: ZakatEvalInput): ZakatEvalResult {
  const goldPrice = input.gold_price_24k_buy_kwd || 0
  const silverPrice = input.silver_price_999_buy_kwd || 0

  const goldBreakdown = (input.gold_lines || [])
    .filter((g) => g.weight_grams > 0)
    .map((g) => {
      const frac = GOLD_PURITY[String(g.carat).replace('K', '')] ?? 0
      const pure = round4(g.weight_grams * frac)
      return {
        carat: String(g.carat),
        weight_grams: g.weight_grams,
        pure_g: pure,
        value_kwd: round3(pure * goldPrice),
      }
    })

  const silverBreakdown = (input.silver_lines || [])
    .filter((s) => s.weight_grams > 0)
    .map((s) => {
      const frac = SILVER_PURITY[String(s.fineness)] ?? 0
      const pure = round4(s.weight_grams * frac)
      return {
        fineness: String(s.fineness),
        weight_grams: s.weight_grams,
        pure_g: pure,
        value_kwd: round3(pure * silverPrice),
      }
    })

  const pureGold = round4(goldBreakdown.reduce((a, x) => a + x.pure_g, 0))
  const pureSilver = round4(silverBreakdown.reduce((a, x) => a + x.pure_g, 0))
  const goldValue = round3(goldBreakdown.reduce((a, x) => a + x.value_kwd, 0))
  const silverValue = round3(silverBreakdown.reduce((a, x) => a + x.value_kwd, 0))
  const cash = round3(input.cash_kwd || 0)
  const business = round3(input.business_kwd || 0)
  const debts = round3(input.debts_kwd || 0)
  const jewelry = input.include_jewelry ? round3(input.jewelry_value_kwd || 0) : 0

  const assets = round3(goldValue + silverValue + cash + business + jewelry)
  const zakatable = round3(Math.max(assets - debts, 0))
  const nisab = round3(NISAB_PURE_GOLD_G * goldPrice)
  const above = zakatable >= nisab && goldPrice > 0
  const due = above ? round3(zakatable * ZAKAT_RATE) : 0

  return {
    methodology_version: METHODOLOGY_VERSION,
    gold_price_24k_buy_kwd: round3(goldPrice),
    silver_price_999_buy_kwd: silverPrice ? round3(silverPrice) : null,
    nisab_kwd: nisab,
    pure_gold_equivalent_g: pureGold,
    pure_silver_equivalent_g: pureSilver,
    total_assets_kwd: assets,
    debts_kwd: debts,
    zakatable_kwd: zakatable,
    above_nisab: above,
    zakat_due_kwd: due,
    breakdown: {
      gold_lines: goldBreakdown,
      silver_lines: silverBreakdown,
      cash_kwd: cash,
      business_kwd: business,
      jewelry_value_kwd: jewelry,
      debts_kwd: debts,
      gold_value_kwd: goldValue,
      silver_value_kwd: silverValue,
    },
  }
}

export function formatHijriLabel(date = new Date(), locale = 'en') {
  try {
    return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-SA-u-ca-islamic' : 'en-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  } catch {
    return ''
  }
}

export function hijriYearNow(date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic', { year: 'numeric' }).formatToParts(date)
    const y = parts.find((p) => p.type === 'year')?.value
    const n = Number(String(y).replace(/\D/g, ''))
    return Number.isFinite(n) && n > 0 ? n : 1447
  } catch {
    return 1447
  }
}
