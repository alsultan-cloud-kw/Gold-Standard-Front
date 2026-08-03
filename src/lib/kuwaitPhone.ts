/**
 * Kuwait mobile — store as E.164 +965XXXXXXXX.
 *
 * CITRA NNP: 8 local digits — `41xxxxxx` (Virgin / Friendi), or start with
 * 5 (STC), 6 (Ooredoo), 9 (Zain). Landlines use 2.
 * Accepts +965, 00965, 965, spaces/dashes, or bare local digits.
 */

const KW_PREFIX = '+965'

/** Strip country / trunk prefixes; return up to 8 local digits. */
export function kuwaitLocalDigits(raw: string): string {
  let s = String(raw || '').replace(/\D/g, '')
  if (!s) return ''
  if (s.startsWith('00')) s = s.slice(2)
  if (s.startsWith('965')) s = s.slice(3)
  if (s.length === 9 && s.startsWith('0')) s = s.slice(1)
  if (s.length > 8) s = s.slice(-8)
  return s.slice(0, 8)
}

/** Display in form: local part only (no +965 prefix). */
export function formatKuwaitLocalDisplay(raw: string): string {
  return kuwaitLocalDigits(raw)
}

/** CITRA: 41… or [569]… */
export function isValidKuwaitMobileLocal(local: string): boolean {
  if (local.length !== 8 || !/^\d{8}$/.test(local)) return false
  if (local.startsWith('41')) return true
  return local[0] === '5' || local[0] === '6' || local[0] === '9'
}

/** E.164 for API: +965XXXXXXXX — null if invalid Kuwait mobile. */
export function normalizeKuwaitPhone(raw: string): string | null {
  const local = kuwaitLocalDigits(raw)
  if (!isValidKuwaitMobileLocal(local)) return null
  return `${KW_PREFIX}${local}`
}

export const KUWAIT_DIAL_CODE = KW_PREFIX

export function isValidKuwaitLocal(raw: string): boolean {
  return normalizeKuwaitPhone(raw) !== null
}

/** True if the string looks like a phone (not an email) for sign-in routing. */
export function looksLikePhoneIdentifier(raw: string): boolean {
  const t = raw.trim()
  if (!t || t.includes('@')) return false
  const digits = t.replace(/\D/g, '')
  return digits.length >= 7
}
