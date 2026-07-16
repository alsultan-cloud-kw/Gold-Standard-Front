/** Client-side screening name validation (mirrors Django rules). */

const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/
const URLISH = /(https?:\/\/|www\.|<|>|\{|\}|\[|\]|\\|`|\||;|--|\/\*|\*\/)/i
const HTML = /<[^>]{0,200}>/
const ALLOWED = /^[\p{L}\p{M}\p{N}\s.\-'\u060C\u2018\u2019]+$/u

export const SCREENING_NAME_MIN = 2
export const SCREENING_NAME_MAX = 120

export type ScreeningNameError =
  | 'name_required'
  | 'name_too_short'
  | 'name_too_long'
  | 'name_invalid'
  | 'name_malicious'

export function sanitizeScreeningName(raw: string): {
  clean: string | null
  error: ScreeningNameError | null
} {
  let text = (raw ?? '').normalize('NFKC').replace(/\u00a0/g, ' ').trim()
  text = text.replace(/\s{2,}/g, ' ')

  if (!text) return { clean: null, error: 'name_required' }
  if (text.length < SCREENING_NAME_MIN) return { clean: null, error: 'name_too_short' }
  if (text.length > SCREENING_NAME_MAX) return { clean: null, error: 'name_too_long' }
  if (CONTROL.test(text) || HTML.test(text) || URLISH.test(text)) {
    return { clean: null, error: 'name_malicious' }
  }

  const letters = [...text].filter((ch) => /\p{L}/u.test(ch)).length
  if (letters < 2) return { clean: null, error: 'name_invalid' }
  if (!ALLOWED.test(text)) return { clean: null, error: 'name_invalid' }

  const lowered = text.toLowerCase()
  for (const bad of ['<script', 'javascript:', 'onerror=', 'onload=', 'drop table', 'union select']) {
    if (lowered.includes(bad)) return { clean: null, error: 'name_malicious' }
  }

  return { clean: text, error: null }
}
