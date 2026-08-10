import type { KnetReceiptDetails } from '@/types'

/** Normalize KNET/CBK result strings for comparison (spaces, +, underscores, parens). */
export function normalizeKnetResult(value?: string | null) {
  return (value || '')
    .replace(/\+/g, ' ')
    .replace(/[_-]+/g, ' ')
    .replace(/[()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase()
}

function compactKnetResult(value?: string | null) {
  return normalizeKnetResult(value).replace(/\s+/g, '')
}

/** Success results per CBK/KNET inquiry (Authorized & Captured). */
const KNET_SUCCESS_RESULTS = new Set(['CAPTURED', 'SUCCESS', 'PROCESSED', 'APPROVED'])

/**
 * Terminal declines / cancels — includes CBK-style wrappers like FAILURE(NOT CAPTURED).
 * Never treat plain CAPTURED as fail (NOT CAPTURED must win via dedicated check).
 */
export function isKnetTerminalFailResult(value?: string | null): boolean {
  const normalized = normalizeKnetResult(value)
  if (!normalized) return false
  if (KNET_SUCCESS_RESULTS.has(normalized)) return false

  const compact = compactKnetResult(value)
  // FAILURE(NOT CAPTURED), NOT_CAPTURED, NOT CAPTURED
  if (compact.includes('NOTCAPTURED')) return true

  const exactFails = new Set([
    'NOT CAPTURED',
    'CANCELED',
    'CANCELLED',
    'DECLINED',
    'DENIED',
    'FAILED',
    'FAILURE',
    'REJECTED',
    'ERROR',
    'VOIDED',
    'TIMEOUT',
    'TIMED OUT',
    'TIMEDOUT',
    'EXPIRED',
  ])
  if (exactFails.has(normalized)) return true

  if (compact === 'FAILED' || compact === 'FAILURE' || compact.startsWith('FAILURE')) {
    // FAILURE… without a bare CAPTURED success token
    if (!compact.includes('CAPTURED') || compact.includes('NOTCAPTURED')) return true
  }
  return false
}

export function isKnetSuccessResult(value?: string | null): boolean {
  const normalized = normalizeKnetResult(value)
  if (!normalized) return false
  if (isKnetTerminalFailResult(value)) return false
  return KNET_SUCCESS_RESULTS.has(normalized)
}

/** Checkout / deep-link: explicit success from URL or result string. */
export function isExplicitKnetSuccess(
  knetStatus: string | null | undefined,
  result: string,
): boolean {
  if ((knetStatus || '').toLowerCase() === 'success') return true
  return isKnetSuccessResult(result)
}

/**
 * Checkout / deep-link: definitive decline/cancel.
 * Callback-parse gaps (missing_trandata / decrypt_failed) are NOT declines — Inquiry may still CAPTURE.
 */
export function isExplicitKnetFailure(
  knetStatus: string | null | undefined,
  result: string,
  reason: string | null | undefined,
): boolean {
  if (isKnetTerminalFailResult(result)) return true
  const r = (reason || '').toLowerCase()
  if (r === 'missing_trandata' || r === 'decrypt_failed') return false
  if (r.includes('cancel') || r === 'callback_error') return true
  if (
    (knetStatus || '').toLowerCase() === 'failed'
    && !isExplicitKnetSuccess(knetStatus, result)
  ) {
    return true
  }
  return false
}

export function needsKnetVerification(
  knetStatus: string | null | undefined,
  result: string,
  reason: string | null | undefined,
): boolean {
  if ((knetStatus || '').toLowerCase() === 'pending') return true
  if (isExplicitKnetSuccess(knetStatus, result) || isExplicitKnetFailure(knetStatus, result, reason)) {
    return false
  }
  const r = (reason || '').toLowerCase()
  return r === 'missing_trandata' || r === 'decrypt_failed' || Boolean(knetStatus || result)
}

export function isKnetReceiptCaptured(receipt: KnetReceiptDetails | null) {
  if (!receipt) return false
  if (receipt.payment_status === 'paid') return true
  return isKnetSuccessResult(receipt.result)
}

/** True when the gateway has a definitive decline/cancel (not a pending callback parse). */
export function isKnetReceiptDefinitelyFailed(receipt: KnetReceiptDetails | null) {
  if (!receipt || isKnetReceiptCaptured(receipt)) return false
  const result = normalizeKnetResult(receipt.result)
  if (['MISSING TRANDATA', 'MISSING_TRANDATA', 'DECRYPT FAILED', 'DECRYPT_FAILED', 'PENDING', 'INITIATED', ''].includes(result)) {
    // Compact forms of parse placeholders
    const compact = compactKnetResult(receipt.result)
    if (['MISSINGTRANDATA', 'DECRYPTFAILED', 'PENDING', 'INITIATED', ''].includes(compact)) {
      return false
    }
  }
  if (isKnetTerminalFailResult(receipt.result)) return true
  // Sale already failed/cancelled with a non-placeholder result string
  if (receipt.payment_status === 'failed' || receipt.payment_status === 'cancelled') {
    return result.length > 0 && !['PENDING', 'INITIATED'].includes(result)
  }
  return false
}

/** Soft customer-facing decline category — never invent bank-specific causes. */
export function knetDeclineReasonKind(
  result?: string | null,
): 'cancelled' | 'expired' | 'declined' {
  const compact = compactKnetResult(result)
  if (compact.includes('CANCEL')) return 'cancelled'
  if (compact.includes('EXPIRED') || compact.includes('TIMEOUT') || compact.includes('TIMEDOUT')) {
    return 'expired'
  }
  return 'declined'
}

/** Best customer-facing payment reference for support / copy. */
export function knetPaymentRef(receipt: KnetReceiptDetails | null): string | null {
  if (!receipt) return null
  const candidates = [
    receipt.payment_id,
    receipt.transaction_id,
    receipt.track_id,
    receipt.reference_id,
    receipt.invoice_number,
  ]
  for (const c of candidates) {
    const v = (c || '').trim()
    if (v) return v
  }
  return null
}

export function formatReceiptAmount(amount: string | undefined, currency: string | undefined) {
  const n = Number(amount)
  const code = (currency || 'KWD').trim() || 'KWD'
  if (!Number.isFinite(n)) return amount ? `${amount} ${code}` : '—'
  return `${n.toFixed(3)} ${code}`
}

export type KnetReceiptField = { label: string; value: string }

export function buildKnetReceiptFields(
  receipt: KnetReceiptDetails,
  t: (key: string, opts?: Record<string, unknown>) => string,
): KnetReceiptField[] {
  const unavailable = t('knetReceipt.unavailable')
  const fields: KnetReceiptField[] = [
    { label: t('knetReceipt.merchant'), value: receipt.merchant_name || unavailable },
    { label: t('knetReceipt.orderNumber'), value: receipt.invoice_number || unavailable },
    { label: t('knetReceipt.paymentId'), value: receipt.payment_id?.trim() || unavailable },
    { label: t('knetReceipt.transactionId'), value: receipt.transaction_id?.trim() || unavailable },
    { label: t('knetReceipt.trackId'), value: receipt.track_id?.trim() || unavailable },
    { label: t('knetReceipt.referenceId'), value: receipt.reference_id?.trim() || unavailable },
  ]

  if (receipt.auth_code?.trim()) {
    fields.push({ label: t('knetReceipt.authCode'), value: receipt.auth_code.trim() })
  }

  fields.push(
    {
      label: t('knetReceipt.delivery'),
      value: receipt.is_vault_held
        ? t('knetReceipt.deliveryVault')
        : (receipt.delivery_type_display?.trim() || t('knetReceipt.deliveryPhysical')),
    },
    { label: t('knetReceipt.amount'), value: formatReceiptAmount(receipt.amount, receipt.currency) },
    {
      label: t('knetReceipt.dateTime'),
      value: receipt.transaction_datetime
        ? `${receipt.transaction_datetime}${receipt.transaction_timezone ? ` (${receipt.transaction_timezone})` : ''}`
        : unavailable,
    },
    {
      label: t('knetReceipt.status'),
      value: receipt.result?.trim() || receipt.payment_status || unavailable,
    },
    {
      label: t('knetReceipt.orderStatus'),
      value: receipt.order_status?.trim() || unavailable,
    },
  )

  return fields
}
