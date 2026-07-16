/**
 * Safe user-facing API error helpers.
 * Never surface stack traces, SQL, file paths, or internal exception text.
 */

const UNSAFE_PATTERNS = [
  /traceback/i,
  /integrityerror/i,
  /operationalerror/i,
  /programmingerror/i,
  /django\./i,
  /psycopg/i,
  /sqlalchemy/i,
  /at\s+\S+\.\w+\(/i,
  /\/home\/|\/var\/|\/usr\/|C:\\/i,
  /Exception:|Error:/i,
  /stack\s*trace/i,
  /internal server/i,
  /DEBUG/i,
]

const KNOWN_ERROR_CODES: Record<string, string> = {
  captcha_failed: 'auth.captchaFailed',
  captcha_required: 'auth.captchaRequired',
  inactive: 'auth.accountInactive',
  invalid_credentials: 'auth.invalidCredentials',
  authentication_failed: 'auth.invalidCredentials',
  email_exists: 'auth.errors.emailExists',
  phone_exists: 'auth.errors.phoneExists',
  civil_id_exists: 'auth.errors.civilIdExists',
  user_exists: 'auth.errors.userExists',
  rate_limited: 'auth.errors.rateLimited',
  too_many_requests: 'auth.errors.rateLimited',
  otp_invalid: 'auth.verifyAccount.invalidCode',
  otp_expired: 'auth.verifyAccount.invalidCode',
  invalid_otp: 'auth.verifyAccount.invalidCode',
}

function looksUnsafe(text: string): boolean {
  if (!text || text.length > 280) return true
  return UNSAFE_PATTERNS.some((re) => re.test(text))
}

function isSafeUserMessage(text: string): boolean {
  const trimmed = text.trim()
  if (!trimmed || looksUnsafe(trimmed)) return false
  // Reject messages that look like machine codes / snake_case only
  if (/^[a-z][a-z0-9_]{2,40}$/.test(trimmed)) return false
  return true
}

function extractErrorCode(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const raw = d.error ?? d.code ?? d.error_code
  if (typeof raw === 'string' && raw.trim()) return raw.trim().toLowerCase()
  return null
}

type TranslateFn = (key: string, options?: Record<string, unknown>) => string

/**
 * Prefer mapped codes + status; only show API text when it is clearly user-safe.
 */
export function getSafeUserErrorMessage(
  error: unknown,
  t: TranslateFn,
  fallback: string,
): string {
  const ax = error as {
    response?: { status?: number; data?: unknown }
    message?: string
  }
  const status = ax.response?.status
  const data = ax.response?.data

  const code = extractErrorCode(data)
  if (code && KNOWN_ERROR_CODES[code]) {
    return t(KNOWN_ERROR_CODES[code])
  }

  if (status === 401 || status === 403) {
    if (code === 'inactive') return t('auth.accountInactive')
    return t('auth.invalidCredentials')
  }
  if (status === 429) return t('auth.errors.rateLimited')
  if (status === 503) return t('auth.errors.serviceUnavailable')
  if (status != null && status >= 500) return t('auth.errors.serverError')

  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>

    if (typeof d.detail === 'string' && isSafeUserMessage(d.detail)) {
      return d.detail.trim()
    }

    if (Array.isArray(d.non_field_errors) && d.non_field_errors.length > 0) {
      const joined = d.non_field_errors.map(String).join(' ')
      if (isSafeUserMessage(joined)) return joined.trim()
    }

    // Common registration field keys — show first safe message only
    const preferredKeys = [
      'email',
      'phone_number',
      'password',
      'civil_id',
      'full_name',
      'nationality',
      'country',
    ]
    for (const key of preferredKeys) {
      const val = d[key]
      if (Array.isArray(val) && val[0] != null) {
        const msg = String(val[0])
        if (isSafeUserMessage(msg)) return msg.trim()
      } else if (typeof val === 'string' && isSafeUserMessage(val)) {
        return val.trim()
      }
    }
  }

  return fallback
}

/** @deprecated Prefer getSafeUserErrorMessage with i18n for auth flows. */
export function formatApiErrorMessage(error: unknown, fallback: string): string {
  const ax = error as { response?: { data?: unknown; status?: number } }
  const data = ax.response?.data
  if (!data || typeof data !== 'object') return fallback

  const d = data as Record<string, unknown>

  if (typeof d.detail === 'string') {
    return isSafeUserMessage(d.detail) ? d.detail.trim() : fallback
  }

  if (Array.isArray(d.non_field_errors) && d.non_field_errors.length > 0) {
    const joined = d.non_field_errors.map(String).join(' ')
    return isSafeUserMessage(joined) ? joined.trim() : fallback
  }

  const fieldParts: string[] = []
  for (const [key, val] of Object.entries(d)) {
    if (key === 'detail' || key === 'error' || key === 'code') continue
    if (Array.isArray(val) && val.length > 0) {
      const msg = val.map(String).join(' ')
      if (isSafeUserMessage(msg)) fieldParts.push(msg)
    } else if (typeof val === 'string' && isSafeUserMessage(val)) {
      fieldParts.push(val)
    }
  }
  if (fieldParts.length > 0) return fieldParts.join(' ')

  return fallback
}
