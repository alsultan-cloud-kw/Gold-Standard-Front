import type { KnetReceiptDetails } from '@/types'

export function normalizeKnetResult(value?: string | null) {
  return (value || '').replace(/\+/g, ' ').trim().toUpperCase()
}

export function isKnetReceiptCaptured(receipt: KnetReceiptDetails | null) {
  const result = normalizeKnetResult(receipt?.result)
  return (
    receipt?.payment_status === 'paid' ||
    ['CAPTURED', 'SUCCESS', 'PROCESSED', 'APPROVED'].includes(result)
  )
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
