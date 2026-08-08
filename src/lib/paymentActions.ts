export type PaymentActionKind = 'open' | 'void' | 'paid'

export type PaymentActionEvent = {
  id: string
  action: PaymentActionKind
  reason?: string
  actor_type?: string
  amount?: string | number | null
  currency?: string
  track_id?: string | null
  payment_id?: string | null
  tran_id?: string | null
  ref_id?: string | null
  client_name?: string | null
  client_email?: string | null
  client_phone?: string | null
  channel?: string | null
  created_at: string
}

export function unwrapPaymentActions(data: unknown): PaymentActionEvent[] {
  if (data == null) return []
  if (Array.isArray(data)) return data as PaymentActionEvent[]
  if (typeof data !== 'object') return []
  const wrapped = data as { results?: PaymentActionEvent[]; actions?: PaymentActionEvent[] }
  if (Array.isArray(wrapped.results)) return wrapped.results
  if (Array.isArray(wrapped.actions)) return wrapped.actions
  return []
}

export function paymentActionLabelKey(action: string): string {
  if (action === 'open') return 'userDashboard.orders.paymentActionOpen'
  if (action === 'void') return 'userDashboard.orders.paymentActionVoid'
  if (action === 'paid') return 'userDashboard.orders.paymentActionPaid'
  return ''
}

/** @deprecated Prefer i18n via paymentActionLabelKey — kept for admin/non-i18n callers. */
export function paymentActionLabel(action: string): string {
  if (action === 'open') return 'Open'
  if (action === 'void') return 'Void'
  if (action === 'paid') return 'Paid'
  return action
}
