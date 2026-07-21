/** Kuwait mobile — store as E.164 +965XXXXXXXX. */

const KW_PREFIX = '+965'

/** Strip country code; return up to 8 local digits. */
export function kuwaitLocalDigits(raw: string): string {
  let s = raw.replace(/\D/g, '')
  if (s.startsWith('965')) s = s.slice(3)
  if (s.startsWith('00')) s = s.slice(2)
  return s.slice(0, 8)
}

/** Display in form: local part only (no prefix). */
export function formatKuwaitLocalDisplay(raw: string): string {
  return kuwaitLocalDigits(raw)
}

/** E.164 for API: +965XXXXXXXX */
export function normalizeKuwaitPhone(raw: string): string | null {
  const local = kuwaitLocalDigits(raw)
  if (local.length < 7 || local.length > 8) return null
  return `${KW_PREFIX}${local}`
}

export const KUWAIT_DIAL_CODE = KW_PREFIX

export function isValidKuwaitLocal(raw: string): boolean {
  return normalizeKuwaitPhone(raw) !== null
}
