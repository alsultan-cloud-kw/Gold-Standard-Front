import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Wallet } from 'lucide-react'
import AdminNav from '../../components/admin/AdminNav'
import { CHECKOUT_CREDIT_CARD_ENABLED, CHECKOUT_COD_ENABLED } from '@/featureFlags'
import { ordersApi } from '../../services/api'
import { toast } from 'sonner'

type CheckoutPaymentSettings = {
  enable_credit_card: boolean
  enable_cash_on_delivery: boolean
  shipping_charge_kwd: number
  updated_at?: string
}

export default function AdminCheckoutPayment() {
  const { t } = useTranslation()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'checkout', 'payment-settings'],
    queryFn: () => ordersApi.getCheckoutPaymentSettings() as Promise<CheckoutPaymentSettings>,
  })

  const saveMutation = useMutation({
    mutationFn: (body: {
      enable_credit_card: boolean
      enable_cash_on_delivery: boolean
      shipping_charge_kwd: number
    }) =>
      ordersApi.updateCheckoutPaymentSettings(body),
    onSuccess: () => {
      toast.success(t('admin.checkoutPayment.saved'))
      void qc.invalidateQueries({ queryKey: ['admin', 'checkout', 'payment-settings'] })
      void qc.invalidateQueries({ queryKey: ['checkoutPaymentMethods'] })
    },
    onError: () => toast.error(t('admin.checkoutPayment.saveFailed')),
  })

  return (
    <div className="min-h-screen py-8 bg-[var(--site-bg)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />

        <div className="mb-6 flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-amber-800" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-bold gold-gradient-text-on-light">{t('admin.checkoutPayment.title')}</h1>
            <p className="text-stone-600 mt-1 text-sm">{t('admin.checkoutPayment.intro')}</p>
          </div>
        </div>

        <div className="gold-card p-6 space-y-6">
          {isLoading || !data ? (
            <p className="text-stone-600 text-sm">{t('admin.checkoutPayment.loading')}</p>
          ) : (
            <form
              key={`${data.enable_credit_card}-${data.enable_cash_on_delivery}-${data.shipping_charge_kwd}-${data.updated_at ?? ''}`}
              className="space-y-5"
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const fd = new FormData(form)
                const shippingRaw = Number(fd.get('shipping_charge_kwd') ?? 0)
                saveMutation.mutate({
                  enable_credit_card: CHECKOUT_CREDIT_CARD_ENABLED && fd.get('enable_credit_card') === 'on',
                  enable_cash_on_delivery:
                    CHECKOUT_COD_ENABLED || fd.get('enable_cash_on_delivery') === 'on',
                  shipping_charge_kwd:
                    Number.isFinite(shippingRaw) && shippingRaw >= 0
                      ? Math.round(shippingRaw * 1000) / 1000
                      : 0,
                })
              }}
            >
              <p className="text-sm text-black/75">
                {CHECKOUT_CREDIT_CARD_ENABLED
                  ? t('admin.checkoutPayment.alwaysOnHint')
                  : t('admin.checkoutPayment.knetCodOnlyHint')}
              </p>

              {CHECKOUT_CREDIT_CARD_ENABLED ? (
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  name="enable_credit_card"
                  defaultChecked={data.enable_credit_card}
                  className="mt-1 rounded border-lime-300/50 text-amber-600 focus:ring-amber-500"
                />
                <span>
                  <span className="font-medium text-black block">{t('admin.checkoutPayment.creditCard')}</span>
                  <span className="text-xs text-stone-600">{t('admin.checkoutPayment.creditCardHint')}</span>
                </span>
              </label>
              ) : null}

              <label className={`flex items-start gap-3 ${CHECKOUT_COD_ENABLED ? 'opacity-70' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  name="enable_cash_on_delivery"
                  defaultChecked={CHECKOUT_COD_ENABLED || data.enable_cash_on_delivery}
                  disabled={CHECKOUT_COD_ENABLED}
                  className="mt-1 rounded border-lime-300/50 text-amber-600 focus:ring-amber-500"
                />
                <span>
                  <span className="font-medium text-black block">{t('admin.checkoutPayment.cod')}</span>
                  <span className="text-xs text-stone-600">
                    {CHECKOUT_COD_ENABLED
                      ? t('admin.checkoutPayment.codAlwaysOnHint')
                      : t('admin.checkoutPayment.codHint')}
                  </span>
                </span>
              </label>

              <div>
                <label className="font-medium text-black block">{t('admin.checkoutPayment.shippingCharge')}</label>
                <p className="text-xs text-stone-600 mb-2">{t('admin.checkoutPayment.shippingChargeHint')}</p>
                <div className="relative max-w-xs">
                  <input
                    type="number"
                    step="0.001"
                    min={0}
                    name="shipping_charge_kwd"
                    defaultValue={Number(data.shipping_charge_kwd ?? 0)}
                    className="w-full rounded-lg border border-stone-300 px-3 py-2 pr-14 text-sm text-black focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-xs text-stone-500">KWD</span>
                </div>
              </div>

              {data.updated_at && (
                <p className="text-xs text-stone-500">
                  {t('admin.checkoutPayment.lastUpdated', {
                    date: new Date(data.updated_at).toLocaleString(),
                  })}
                </p>
              )}

              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="px-5 py-2.5 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-500 disabled:opacity-50"
              >
                {saveMutation.isPending ? t('admin.checkoutPayment.saving') : t('admin.checkoutPayment.save')}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
