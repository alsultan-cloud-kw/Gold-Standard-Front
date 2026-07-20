import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ordersApi } from '@/services/api'

const FALLBACK_EN = 'Ships in 1–2 days'
const FALLBACK_AR = 'الشحن خلال يومين'

/** Product-card shipping ETA from Django CheckoutPaymentConfig (editable in admin). */
export function useShippingEtaLabel(): string {
  const { i18n, t } = useTranslation()
  const { data } = useQuery({
    queryKey: ['checkout-payment-methods', 'shipping-eta'],
    queryFn: () => ordersApi.getCheckoutPaymentMethods(),
    staleTime: 5 * 60 * 1000,
  })

  const lang = (i18n.language || 'en').toLowerCase()
  if (lang.startsWith('ar')) {
    const ar = (data?.shipping_eta_ar || '').trim()
    return ar || t('home.shipsIn', { defaultValue: FALLBACK_AR })
  }
  const en = (data?.shipping_eta_en || '').trim()
  return en || t('home.shipsIn', { defaultValue: FALLBACK_EN })
}
