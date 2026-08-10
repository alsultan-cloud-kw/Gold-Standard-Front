import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ordersApi } from '@/services/api'
import {
  paymentActionLabelKey,
  unwrapPaymentActions,
  type PaymentActionKind,
} from '@/lib/paymentActions'
import { cn } from '@/lib/utils'

type Props = {
  saleId: string
  className?: string
  /** Compact list under an order row */
  dense?: boolean
}

const pillClass: Record<PaymentActionKind, string> = {
  open: 'bg-amber-50 text-amber-800 border-amber-200',
  void: 'bg-red-50 text-red-800 border-red-200',
  paid: 'bg-emerald-50 text-emerald-800 border-emerald-200',
}

export function PaymentActionTimeline({ saleId, className, dense }: Props) {
  const { t } = useTranslation()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['payment-actions', saleId],
    queryFn: () => ordersApi.getPaymentActions(saleId),
    enabled: Boolean(saleId),
    staleTime: 30_000,
    retry: false,
  })

  if (isLoading) {
    return (
      <p className={cn('text-xs text-[#64748B]', className)}>
        {t('userDashboard.orders.paymentActionsLoading')}
      </p>
    )
  }

  const events = unwrapPaymentActions(data)

  if (isError || events.length === 0) {
    return null
  }

  return (
    <div className={cn(dense ? 'mt-2' : 'mt-3', className)}>
      <p className="text-xs font-medium text-[#0B0F19] mb-1.5">
        {t('userDashboard.orders.paymentActionsTitle')}
      </p>
      <ol className="space-y-1.5">
        {events.map((ev) => {
          const kind = (ev.action || '') as PaymentActionKind
          const labelKey = paymentActionLabelKey(ev.action)
          return (
            <li key={ev.id} className="flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
              <span
                className={cn(
                  'inline-flex rounded border px-1.5 py-0.5 font-medium',
                  pillClass[kind] ?? 'bg-stone-50 text-stone-700 border-stone-200',
                )}
              >
                {labelKey ? t(labelKey) : ev.action}
              </span>
              <span>
                {ev.created_at
                  ? new Date(ev.created_at).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : '—'}
              </span>
              {ev.reason ? <span className="text-[#94A3B8]">· {ev.reason}</span> : null}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
