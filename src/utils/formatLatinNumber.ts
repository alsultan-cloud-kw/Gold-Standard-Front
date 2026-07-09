/** Locale for prices, charts, and weights — always Western digits (0–9). */
export const PRICE_NUMBER_LOCALE = 'en-US'

export function formatLatinNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return value.toLocaleString(PRICE_NUMBER_LOCALE, options)
}

export function formatLatinFixed(value: number, fractionDigits: number): string {
  if (!Number.isFinite(value)) return '—'
  return value.toFixed(fractionDigits)
}
