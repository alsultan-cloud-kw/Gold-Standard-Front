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
  if (Array.isArray(data)) return data as PaymentActionEvent[]
  const wrapped = data as { results?: PaymentActionEvent[]; actions?: PaymentActionEvent[] }
  return wrapped.results ?? wrapped.actions ?? []
}

export function paymentActionLabel(action: string): string {
  if (action === 'open') return 'Open'
  if (action === 'void') return 'Void'
  if (action === 'paid') return 'Paid'
  return action
}
