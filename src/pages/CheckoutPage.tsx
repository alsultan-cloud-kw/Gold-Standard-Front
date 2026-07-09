import { useState, useEffect, useMemo, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CreditCard,
  Truck,
  ChevronRight,
  Lock,
  Check,
  Loader2,
  Download,
  Tag,
  Crown,
} from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { toast } from 'sonner'
import { ordersApi, authApi, invoicesApi, walletApi, accountsApi } from '../services/api'
import { KuwaitLocationFields } from '@/components/checkout/KuwaitLocationFields'
import { TRADING_AND_VIRTUAL_WALLET_ENABLED, CHECKOUT_CREDIT_CARD_ENABLED, CHECKOUT_COD_ENABLED } from '@/featureFlags'
import { useQuery } from '@tanstack/react-query'
import { formatOrderKwd, useOrderSummaryDisplay } from '../hooks/useOrderSummaryDisplay'
import {
  cartClubPricingBreakdown,
  cartLineClubMemberSavings,
  cartLineStandardTotal,
} from '../utils/clubCartPricing'

type CheckoutProfileAddress = {
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  governorate?: string | null
  postal_code?: string | null
  country?: string | null
}

function firstCustomerProfileForCheckout(data: unknown): CheckoutProfileAddress | null {
  if (!data) return null
  if (Array.isArray(data)) return (data[0] as CheckoutProfileAddress) ?? null
  const p = data as { results?: CheckoutProfileAddress[] }
  return p.results && p.results.length > 0 ? p.results[0] : null
}

type SaleResponse = {
  id?: string
  invoice_number?: string
  total_amount?: string
  payment_status?: string
  payment_method?: string
  payment_url?: string
}

type KnetReturnPhase = 'idle' | 'verifying' | 'success' | 'failed'

const KNET_PENDING_SALE_KEY = 'gs_knet_pending_sale'

type KnetPendingSale = {
  saleId: string
  invoice?: string
  at: number
}

function readKnetPendingSale(): KnetPendingSale | null {
  try {
    const raw = sessionStorage.getItem(KNET_PENDING_SALE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as KnetPendingSale
    if (!parsed?.saleId) return null
    return parsed
  } catch {
    return null
  }
}

function isExplicitKnetSuccess(knetStatus: string | null | undefined, result: string): boolean {
  const normalized = result.replace(/\+/g, ' ').trim().toUpperCase()
  return (
    knetStatus === 'success'
    || ['CAPTURED', 'SUCCESS', 'PROCESSED', 'APPROVED'].includes(normalized)
  )
}

function isExplicitKnetFailure(
  knetStatus: string | null | undefined,
  result: string,
  reason: string | null | undefined,
): boolean {
  const normalized = result.replace(/\+/g, ' ').trim().toUpperCase()
  if (['CANCELED', 'CANCELLED', 'NOT CAPTURED', 'DECLINED', 'DENIED', 'FAILED'].includes(normalized)) {
    return true
  }
  const r = (reason || '').toLowerCase()
  if (r.includes('cancel') || r === 'callback_error') return true
  // Plain failed redirect from KNET errorURL (no captured result, not a callback-parse issue).
  if (
    knetStatus === 'failed'
    && !isExplicitKnetSuccess(knetStatus, result)
    && r !== 'missing_trandata'
    && r !== 'decrypt_failed'
  ) {
    return true
  }
  return false
}

function needsKnetVerification(
  knetStatus: string | null | undefined,
  result: string,
  reason: string | null | undefined,
): boolean {
  if (isExplicitKnetSuccess(knetStatus, result) || isExplicitKnetFailure(knetStatus, result, reason)) {
    return false
  }
  const r = (reason || '').toLowerCase()
  return r === 'missing_trandata' || r === 'decrypt_failed' || Boolean(knetStatus || result)
}

type CheckoutPayRow = {
  id: 'knet' | 'card' | 'cod' | 'wallet'
  nameKey: 'checkoutPage.payKnet' | 'checkoutPage.payCard' | 'checkoutPage.payCod' | null
  icon: typeof CreditCard | typeof Truck
  disabled: boolean
}

type PlaceOrderErrorPayload = {
  detail?: unknown
  product_sku?: unknown
  available_quantity?: unknown
  requested_quantity?: unknown
}

export default function CheckoutPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const navigate = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('knet')
  const [deliveryType, setDeliveryType] = useState<'physical' | 'locked'>('physical')
  const [submitting, setSubmitting] = useState(false)
  const [lastOrder, setLastOrder] = useState<SaleResponse | null>(null)
  const [knetReturnPhase, setKnetReturnPhase] = useState<KnetReturnPhase>('idle')
  const [knetReturnReason, setKnetReturnReason] = useState<string | null>(null)
  const { cart, clearCart } = useCart()
  const summary = useOrderSummaryDisplay(cart)
  const { standardSubtotal: displaySubtotal, clubMemberSavings: clubSavings, chargedSubtotal } =
    useMemo(() => cartClubPricingBreakdown(cart.items), [cart.items])
  const displayTotalAfterClub = chargedSubtotal
  const displayFinalTotal = Math.max(0, displayTotalAfterClub - summary.discountAmount + summary.taxAmount)

  // Wallet balance (for showing and enabling wallet payment)
  const { data: payCfg } = useQuery({
    queryKey: ['checkoutPaymentMethods'],
    queryFn: () => ordersApi.getCheckoutPaymentMethods(),
    staleTime: 60_000,
  })

  const { data: walletData } = useQuery({
    queryKey: ['myWallet'],
    queryFn: () => walletApi.getMyWallet(),
    enabled: TRADING_AND_VIRTUAL_WALLET_ENABLED,
  })

  const { data: checkoutProfileData } = useQuery({
    queryKey: ['myCustomerProfile'],
    queryFn: () => accountsApi.getMyProfile() as Promise<unknown>,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('access_token'),
  })
  // Ensure numeric wallet balance (API may return string/Decimal-like)
  const walletBalanceRaw =
    (walletData?.wallet as { balance?: unknown } | undefined)?.balance
  const walletBalance =
    typeof walletBalanceRaw === 'number'
      ? walletBalanceRaw
      : Number(walletBalanceRaw ?? 0) || 0

  const checkoutShippingCharge = useMemo(() => {
    if (deliveryType !== 'physical') return 0
    const raw =
      typeof payCfg === 'object' && payCfg != null && 'shipping_charge_kwd' in payCfg
        ? (payCfg as { shipping_charge_kwd?: unknown }).shipping_charge_kwd
        : 0
    const n = Number(raw ?? 0)
    if (!Number.isFinite(n) || n < 0) return 0
    return n
  }, [payCfg, deliveryType])
  const checkoutTotalDue = Math.max(0, displayFinalTotal + checkoutShippingCharge)

  const walletTooLow = useMemo(
    () => paymentMethod === 'wallet' && walletBalance < checkoutTotalDue - 1e-9,
    [paymentMethod, walletBalance, checkoutTotalDue],
  )

  useEffect(() => {
    if (!TRADING_AND_VIRTUAL_WALLET_ENABLED && deliveryType === 'locked') {
      setDeliveryType('physical')
    }
  }, [deliveryType])

  useEffect(() => {
    if (paymentMethod === 'wallet' && walletBalance < checkoutTotalDue - 1e-9) {
      setPaymentMethod('knet')
    }
  }, [paymentMethod, walletBalance, checkoutTotalDue])

  const paymentMethodOptions = useMemo((): CheckoutPayRow[] => {
    const cfg = payCfg ?? {
      knet: true,
      wallet: TRADING_AND_VIRTUAL_WALLET_ENABLED,
      credit_card: false,
      cash: CHECKOUT_COD_ENABLED,
    }
    const rows: CheckoutPayRow[] = []
    if (cfg.knet) rows.push({ id: 'knet', nameKey: 'checkoutPage.payKnet', icon: CreditCard, disabled: false })
    if (CHECKOUT_CREDIT_CARD_ENABLED && cfg.credit_card) {
      rows.push({ id: 'card', nameKey: 'checkoutPage.payCard', icon: CreditCard, disabled: false })
    }
    if (CHECKOUT_COD_ENABLED && cfg.cash) {
      rows.push({ id: 'cod', nameKey: 'checkoutPage.payCod', icon: Truck, disabled: false })
    }
    if (TRADING_AND_VIRTUAL_WALLET_ENABLED && cfg.wallet) {
      rows.push({
        id: 'wallet',
        nameKey: null,
        icon: CreditCard,
        disabled: walletBalance < checkoutTotalDue - 1e-9,
      })
    }
    return rows
  }, [payCfg, walletBalance, checkoutTotalDue])

  useEffect(() => {
    const allowed = new Set(paymentMethodOptions.map((m) => m.id))
    if (!allowed.has(paymentMethod as CheckoutPayRow['id'])) {
      const first = paymentMethodOptions.find((m) => !m.disabled)?.id ?? 'knet'
      setPaymentMethod(first)
      return
    }
    const row = paymentMethodOptions.find((m) => m.id === paymentMethod)
    if (row?.disabled) {
      setPaymentMethod(paymentMethodOptions.find((m) => !m.disabled)?.id ?? 'knet')
    }
  }, [paymentMethodOptions, paymentMethod])

  // Shipping fields (sent to backend as customer_*)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [postalCode, setPostalCode] = useState('')

  useEffect(() => {
    const p = firstCustomerProfileForCheckout(checkoutProfileData)
    if (!p) return
    const combined = [p.address_line1, p.address_line2].filter(Boolean).join(', ')
    setAddress((a) => a || combined)
    setCity((c) => c || (p.city ?? ''))
    setGovernorate((g) => g || (p.governorate ?? ''))
    setPostalCode((pc) => pc || (p.postal_code ?? ''))
  }, [checkoutProfileData])

  // Pre-fill customer info from logged-in user so the order stores the customer's email, not the viewer's
  useEffect(() => {
    if (!localStorage.getItem('access_token')) return
    authApi.getMe()
      .then((res: unknown) => {
        const u = res as { email?: string; full_name?: string; phone_number?: string } | undefined
        if (!u) return
        if (!email && u.email) setEmail(u.email)
        if (!phone && u.phone_number) setPhone(u.phone_number)
        if (!firstName && !lastName && u.full_name) {
          const parts = u.full_name.trim().split(/\s+/)
          if (parts.length >= 2) {
            setFirstName(parts[0])
            setLastName(parts.slice(1).join(' '))
          } else if (parts.length === 1) {
            setFirstName(parts[0])
          }
        }
      })
      .catch(() => {})
  }, [])

  const knetReturnHandled = useRef(false)

  useEffect(() => {
    if (knetReturnHandled.current) return

    const params = new URLSearchParams(location.search)
    const knetStatus = params.get('knet_status')
    const urlSaleId = params.get('sale_id') || undefined
    const urlInvoice = params.get('invoice') || undefined
    const reason = params.get('reason') || undefined
    const result = (params.get('result') || '').toUpperCase()

    const pending = readKnetPendingSale()
    const saleId = urlSaleId || pending?.saleId
    const invoice = urlInvoice || pending?.invoice

    // Returned from KNET if URL has sale/knet params OR we stored a pending sale before redirect.
    const returnedFromKnet = Boolean(
      saleId && (pending || knetStatus || params.get('result') || params.get('reason')),
    )
    if (!returnedFromKnet || !saleId) return

    knetReturnHandled.current = true
    sessionStorage.removeItem(KNET_PENDING_SALE_KEY)

    const goToReceipt = () => {
      navigate(`/payment-receipt/${saleId}`, { replace: true, state: { invoice } })
    }

    if (isExplicitKnetFailure(knetStatus, result, reason)) {
      goToReceipt()
      return
    }

    if (isExplicitKnetSuccess(knetStatus, result)) {
      clearCart()
      void ordersApi.verifyKnetPayment(saleId).catch(() => {})
      goToReceipt()
      return
    }

    if (!needsKnetVerification(knetStatus, result, reason)) {
      goToReceipt()
      return
    }

    // Ambiguous return (e.g. missing_trandata) — short verify, never assume success.
    setKnetReturnPhase('verifying')

    let cancelled = false
    const finishSuccess = () => {
      if (cancelled) return
      clearCart()
      goToReceipt()
    }
    const finishFailed = (failReason?: string | null) => {
      if (cancelled) return
      setKnetReturnReason(failReason ?? reason ?? result ?? null)
      goToReceipt()
    }

    const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
      Promise.race([
        promise,
        new Promise<T>((_, reject) => {
          setTimeout(() => reject(new Error('timeout')), ms)
        }),
      ])

    const runVerify = async () => {
      const deadline = Date.now() + 10_000
      while (!cancelled && Date.now() < deadline) {
        try {
          const verify = await withTimeout(ordersApi.verifyKnetPayment(saleId), 6_000)
          if (verify.payment_status === 'paid') {
            finishSuccess()
            return
          }
          if (verify.payment_status === 'failed') {
            finishFailed(reason)
            return
          }
        } catch {
          // retry until deadline
        }
        await new Promise((r) => setTimeout(r, 1_500))
      }
      if (!cancelled) {
        const r = (reason || '').toLowerCase()
        if (r === 'missing_trandata') {
          // KNET often captures payment but never delivers trandata to our callback.
          finishSuccess()
        } else {
          finishFailed(reason ?? 'verification_timeout')
        }
      }
    }

    void runVerify()
    return () => {
      cancelled = true
    }
  }, [location.search, navigate, clearCart])

  const handlePlaceOrder = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      toast.error(t('checkoutPage.loginRequired'))
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    if (cart.items.length === 0) return

    const items = cart.items.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    }))

    const customer_name = [firstName, lastName].filter(Boolean).join(' ').trim() || undefined
    const notes =
      [address, city, governorate, postalCode].filter(Boolean).join(' | ') || undefined

    // Ensure we send the logged-in customer's email so the order is stored with their email
    let customerEmail = email?.trim() || undefined
    if (!customerEmail) {
      try {
        const me = (await authApi.getMe()) as { data?: { email?: string } }
        customerEmail = me?.data?.email || undefined
      } catch {
        // backend will fall back to request.user.email
      }
    }

    setSubmitting(true)
    try {
      const data = (await ordersApi.placeOrder({
        items,
        delivery_type: deliveryType,
        payment_method: paymentMethod,
        customer_name,
        customer_phone: phone || undefined,
        customer_email: customerEmail,
        notes,
      })) as SaleResponse

      if (paymentMethod === 'knet' && data.payment_url) {
        if (data.id) {
          sessionStorage.setItem(
            KNET_PENDING_SALE_KEY,
            JSON.stringify({
              saleId: data.id,
              invoice: data.invoice_number,
              at: Date.now(),
            } satisfies KnetPendingSale),
          )
        }
        window.location.assign(data.payment_url)
        return
      }

      setLastOrder(data)
      clearCart()
      toast.success(
        data.invoice_number
          ? t('checkoutPage.orderPlacedWithInvoice', { invoice: data.invoice_number })
          : t('checkoutPage.orderPlaced')
      )
    } catch (e: unknown) {
      const err = e as { response?: { data?: unknown } }
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        const d = data as PlaceOrderErrorPayload
        const sku = typeof d.product_sku === 'string' ? d.product_sku : null
        const availableRaw =
          typeof d.available_quantity === 'number'
            ? d.available_quantity
            : Number(d.available_quantity ?? NaN)
        const requestedRaw =
          typeof d.requested_quantity === 'number'
            ? d.requested_quantity
            : Number(d.requested_quantity ?? NaN)
        const available = Number.isFinite(availableRaw) ? Math.max(0, Math.trunc(availableRaw)) : null
        const requested = Number.isFinite(requestedRaw) ? Math.max(0, Math.trunc(requestedRaw)) : null

        if (sku && available != null) {
          toast.error(
            t('checkoutPage.stockOnlyLeftForSku', {
              available,
              sku,
            })
          )
          return
        }
        if (available != null && requested != null) {
          toast.error(
            t('checkoutPage.stockInsufficientRequested', {
              available,
              requested,
            })
          )
          return
        }
      }
      let msg: string | null = null
      if (typeof data === 'string') msg = data
      else if (data && typeof data === 'object' && 'detail' in data) {
        const d = (data as { detail: unknown }).detail
        msg = typeof d === 'string' ? d : Array.isArray(d) ? d.map(String).join(', ') : null
      }
      toast.error(msg || t('checkoutPage.placeOrderError'))
    } finally {
      setSubmitting(false)
    }
  }

  const [downloadingInvoice, setDownloadingInvoice] = useState(false)
  const handleDownloadInvoice = async () => {
    if (!lastOrder?.id) {
      toast.error(t('checkoutPage.invoiceIdMissing'))
      return
    }
    setDownloadingInvoice(true)
    try {
      // apiService.get() returns the response body directly, so result is { html: "..." }
      const res = await invoicesApi.getSaleInvoicePreview(lastOrder.id) as { html?: string }
      const html = res?.html
      if (html) {
        const w = window.open('', '_blank')
        if (w) {
          w.document.write(html)
          w.document.close()
          w.focus()
          setTimeout(() => { w.print(); w.close() }, 400)
        } else {
          toast.error(t('checkoutPage.popupsBlocked'))
        }
      } else {
        toast.error(t('checkoutPage.invoiceUnavailable'))
      }
    } catch {
      toast.error(t('checkoutPage.invoiceLoadError'))
    } finally {
      setDownloadingInvoice(false)
    }
  }

  const formatKwd = (value: string | number | undefined) => {
    const n = Number(value ?? 0)
    if (!Number.isFinite(n)) return '—'
    return formatOrderKwd(n)
  }

  if (knetReturnPhase === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center rounded-2xl border border-amber-200/60 bg-white/80 backdrop-blur-sm shadow-lg p-10">
          <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-8 h-8 text-amber-600 animate-spin" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900 mb-2">{t('checkoutPage.knetVerifyingTitle')}</h1>
          <p className="text-stone-600 text-sm leading-relaxed">{t('checkoutPage.knetVerifyingBody')}</p>
        </div>
      </div>
    )
  }

  if (knetReturnPhase === 'failed') {
    return (
      <div className="min-h-screen flex items-center justify-center py-16 px-4">
        <div className="max-w-lg w-full text-center rounded-2xl border border-red-200/70 bg-white shadow-lg p-10">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
            <CreditCard className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold text-stone-900 mb-2">{t('checkoutPage.knetFailedTitle')}</h1>
          <p className="text-stone-600 text-sm mb-6">{t('checkoutPage.knetFailedBody')}</p>
          {knetReturnReason && (
            <p className="text-xs text-stone-400 font-mono mb-6">{knetReturnReason}</p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setKnetReturnPhase('idle')} className="gold-button px-6">
              {t('checkoutPage.knetTryAgain')}
            </button>
            <Link to="/cart" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50">
              {t('checkoutPage.backToCart')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if ((cart.items.length === 0 && lastOrder) || knetReturnPhase === 'success') {
    const order = lastOrder
    return (
      <div className="min-h-screen py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="rounded-2xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50/80 to-white shadow-lg overflow-hidden">
            <div className="px-8 pt-10 pb-6 text-center">
              <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5 ring-4 ring-emerald-50">
                <Check className="w-10 h-10 text-emerald-600" strokeWidth={2.5} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700 mb-2">
                {t('checkoutPage.paymentSuccessBadge')}
              </p>
              <h1 className="text-2xl font-bold text-stone-900 mb-2">{t('checkoutPage.orderConfirmed')}</h1>
              <p className="text-stone-600 text-sm">{t('checkoutPage.knetSuccessSubtitle')}</p>
            </div>
            <div className="mx-8 mb-8 rounded-xl border border-stone-200/80 bg-white/90 divide-y divide-stone-100 text-sm">
              {order?.invoice_number && (
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <span className="text-stone-500">{t('checkoutPage.confirmInvoice')}</span>
                  <span className="font-mono font-medium text-stone-900">{order.invoice_number}</span>
                </div>
              )}
              {order?.total_amount != null && (
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <span className="text-stone-500">{t('checkoutPage.confirmAmount')}</span>
                  <span className="font-semibold text-stone-900">{formatKwd(order.total_amount)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4 px-5 py-3.5">
                <span className="text-stone-500">{t('checkoutPage.confirmPayment')}</span>
                <span className="inline-flex items-center gap-1.5 font-medium text-stone-900">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  {t('checkoutPage.payKnet')}
                </span>
              </div>
            </div>
            <div className="px-8 pb-10 flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice || !order?.id}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-amber-600 text-amber-800 hover:bg-amber-50 font-medium disabled:opacity-50"
              >
                {downloadingInvoice ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {t('checkoutPage.downloadInvoice')}
              </button>
              <Link to="/dashboard" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-white hover:bg-stone-800 font-medium">
                {t('checkoutPage.viewMyOrders')}
              </Link>
              <Link to="/products" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 font-medium">
                {t('cartPage.continueShopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-2xl font-bold text-gold-100 mb-4">{t('cartPage.emptyTitle')}</h1>
          <Link to="/products" className="gold-button inline-flex items-center gap-2">
            {t('checkoutPage.browseProducts')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold gold-gradient-text-on-light mb-8 mt-4">{t('checkoutPage.title')}</h1>

        <div className="flex items-center gap-4 mb-8">
          {(
            [
              t('checkoutPage.stepShipping'),
              t('checkoutPage.stepPayment'),
              t('checkoutPage.stepReview'),
            ] as const
          ).map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step > i + 1
                    ? 'bg-green-500 text-white'
                    : step === i + 1
                      ? 'bg-gold-500 text-charcoal-950'
                      : 'bg-charcoal-800 text-gold-100/40'
                }`}
              >
                {step > i + 1 ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              <span
                className={`text-sm ${step === i + 1 ? 'gold-gradient-text-on-light' : 'gold-gradient-text-on-light'}`}
              >
                {s}
              </span>
              {i < 2 && (
                <ChevronRight className="w-4 h-4 gold-gradient-text-on-light rtl:rotate-180 shrink-0" />
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="gold-card">
                <h2 className="text-xl font-bold text-gold-100 mb-6">{t('checkoutPage.shippingInfo')}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    placeholder={t('checkoutPage.firstNamePh')}
                    className="px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <input
                    placeholder={t('checkoutPage.lastNamePh')}
                    className="px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <input
                    placeholder={t('checkoutPage.emailPh')}
                    type="email"
                    className="md:col-span-2 px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    placeholder={t('checkoutPage.phonePh')}
                    className="md:col-span-2 px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    placeholder={t('checkoutPage.addressPh')}
                    className="md:col-span-2 px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <KuwaitLocationFields
                    governorate={governorate}
                    city={city}
                    onGovernorateChange={setGovernorate}
                    onCityChange={setCity}
                    inputClassName="px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                  />
                  <input
                    placeholder={t('checkoutPage.postalPh')}
                    className="md:col-span-2 px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
                <button onClick={() => setStep(2)} className="gold-button mt-6 w-full">
                  {t('checkoutPage.continuePayment')}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="gold-card">
                <h2 className="text-xl font-bold text-gold-100 mb-6">{t('checkoutPage.paymentMethod')}</h2>
                <div className="mb-6">
                  <p className="text-sm font-medium text-gold-100/80 mb-2">{t('checkoutPage.delivery')}</p>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryType === 'physical'}
                        onChange={() => setDeliveryType('physical')}
                        className="text-gold-500"
                      />
                      <Truck className="w-4 h-4 text-gold-400" />
                      <span className="text-gold-100">{t('checkoutPage.deliveryPhysical')}</span>
                    </label>
                    {TRADING_AND_VIRTUAL_WALLET_ENABLED ? (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryType === 'locked'}
                        onChange={() => setDeliveryType('locked')}
                        className="text-gold-500"
                      />
                      <Lock className="w-4 h-4 text-gold-400" />
                      <span className="text-gold-100">{t('checkoutPage.deliveryVault')}</span>
                    </label>
                    ) : null}
                  </div>
                  {TRADING_AND_VIRTUAL_WALLET_ENABLED && deliveryType === 'locked' && (
                    <p className="text-xs text-gold-100/60 mt-2">{t('checkoutPage.deliveryVaultHint')}</p>
                  )}
                </div>
                <div className="space-y-3 mb-6">
                  {paymentMethodOptions.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                        method.disabled
                          ? 'border-gold-500/15 bg-charcoal-800/50 cursor-not-allowed opacity-60'
                          : `cursor-pointer ${
                              paymentMethod === method.id
                                ? 'border-gold-500 bg-gold-500/10'
                                : 'border-gold-500/30 bg-charcoal-800'
                            }`
                      }`}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={method.id}
                        checked={paymentMethod === method.id}
                        disabled={method.disabled}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="text-gold-500 disabled:opacity-40"
                      />
                      <method.icon className="w-6 h-6 text-gold-400" />
                      <span className="text-gold-100">
                        {method.nameKey != null
                          ? t(method.nameKey)
                          : t('checkoutPage.payWallet', { balance: walletBalance.toFixed(3) })}
                        {method.id === 'wallet' && method.disabled && (
                          <span className="block text-xs text-gold-100/50 mt-1">
                            {t('checkoutPage.walletInsufficient', {
                              total: formatOrderKwd(checkoutTotalDue),
                            })}
                          </span>
                        )}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 border border-gold-500/50 text-gold-100 rounded-lg"
                  >
                    {t('checkoutPage.back')}
                  </button>
                  <button onClick={() => setStep(3)} className="flex-1 gold-button">
                    {t('checkoutPage.reviewOrder')}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="gold-card">
                <h2 className="text-xl font-bold text-gold-100 mb-6">{t('checkoutPage.reviewOrder')}</h2>
                <div className="space-y-4 mb-6">
                  {cart.items.map((item) => {
                    const lineList = cartLineStandardTotal(item)
                    const lineSave = cartLineClubMemberSavings(item)
                    const productName =
                      isAr && item.product.name_ar ? item.product.name_ar : item.product.name_en
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 bg-charcoal-800 rounded-lg"
                      >
                        <div className="w-16 h-16 rounded bg-charcoal-700" />
                        <div className="flex-1 min-w-0">
                          <p className="text-gold-100">{productName}</p>
                          <p className="text-sm text-gold-100/60">
                            {t('checkoutPage.qty', { count: item.quantity })}
                          </p>
                        </div>
                        <div className="text-end shrink-0 space-y-0.5">
                          {lineSave > 0 ? (
                            <>
                              <p className="text-xs text-gold-100/45 line-through tabular-nums">
                                {formatOrderKwd(lineList)} KWD
                              </p>
                              <p className="flex items-center justify-end gap-1 text-xs font-semibold text-emerald-400/90">
                                <Crown className="w-3 h-3" aria-hidden />
                                {t('checkoutPage.memberShort')}
                              </p>
                              <p className="text-gold-400 font-semibold tabular-nums">
                                {formatOrderKwd(item.total_price)} KWD
                              </p>
                              <p className="text-xs text-emerald-400/80 tabular-nums">
                                {t('checkoutPage.saveKwd', { amount: formatOrderKwd(lineSave) })}
                              </p>
                            </>
                          ) : (
                            <p className="text-gold-400 font-semibold tabular-nums">
                              {formatOrderKwd(item.total_price)} KWD
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mb-6 rounded-lg border border-gold-500/25 bg-charcoal-800/80 p-4 space-y-2">
                  <p className="text-sm font-semibold text-gold-100/90 mb-2">{t('checkoutPage.orderTotals')}</p>
                  {clubSavings > 0 ? (
                    <>
                      <div className="flex justify-between text-gold-100/70 text-sm">
                        <span className="flex items-center gap-2">
                          {t('checkoutPage.standardListTotal')}
                          {summary.previewLoading && (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-400" aria-hidden />
                          )}
                        </span>
                        <span className="tabular-nums">{formatOrderKwd(displaySubtotal)} KWD</span>
                      </div>
                      <div className="flex justify-between text-sm text-emerald-400/95">
                        <span className="flex items-center gap-1.5">
                          <Crown className="w-3.5 h-3.5 shrink-0" aria-hidden />
                          {t('cartPage.clubMemberSavings')}
                        </span>
                        <span className="tabular-nums">−{formatOrderKwd(clubSavings)} KWD</span>
                      </div>
                      <div className="flex justify-between text-gold-100 text-sm font-medium pt-1 border-t border-gold-500/15">
                        <span>{t('checkoutPage.yourPriceMember')}</span>
                        <span className="tabular-nums">{formatOrderKwd(displayTotalAfterClub)} KWD</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-gold-100/70 text-sm">
                      <span className="flex items-center gap-2">
                        {t('checkoutPage.subtotal')}
                        {summary.previewLoading && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-400" aria-hidden />
                        )}
                      </span>
                      <span className="tabular-nums">{formatOrderKwd(displayTotalAfterClub)} KWD</span>
                    </div>
                  )}
                  {summary.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-emerald-400/95">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        {summary.offerTitle ?? t('cartPage.promotionalOffer')}
                      </span>
                      <span className="tabular-nums">−{formatOrderKwd(summary.discountAmount)} KWD</span>
                    </div>
                  )}
                  {summary.discountAmount <= 0 && (
                    <div className="flex justify-between text-sm text-gold-100/60">
                      <span>{t('cartPage.promotionalOffer')}</span>
                      <span className="tabular-nums">—</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gold-100/70 text-sm">
                    <span>{t('checkoutPage.shipping')}</span>
                    <span className="tabular-nums">
                      {checkoutShippingCharge > 0
                        ? `${formatOrderKwd(checkoutShippingCharge)} KWD`
                        : t('checkoutPage.shippingFree')}
                    </span>
                  </div>
                  <div className="flex justify-between text-gold-100/70 text-sm">
                    <span>{t('cartPage.tax')}</span>
                    <span className="tabular-nums">{formatOrderKwd(summary.taxAmount)} KWD</span>
                  </div>
                  <div className="border-t border-gold-500/20 pt-2 flex justify-between font-bold text-gold-100">
                    <span>{t('checkoutPage.totalDue')}</span>
                    <span className="gold-gradient-text tabular-nums">{formatOrderKwd(checkoutTotalDue)} KWD</span>
                  </div>
                </div>

                {walletTooLow && (
                  <p className="text-amber-400/90 text-sm mb-4">{t('checkoutPage.walletTooLow')}</p>
                )}

                <div className="flex gap-4">
                  <button
                    onClick={() => setStep(2)}
                    disabled={submitting}
                    className="flex-1 px-6 py-3 border border-gold-500/50 text-gold-100 rounded-lg disabled:opacity-50"
                  >
                    {t('checkoutPage.back')}
                  </button>
                  <button
                    onClick={() => void handlePlaceOrder()}
                    disabled={submitting || walletTooLow}
                    className="flex-1 gold-button flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {t('checkoutPage.placing')}
                      </>
                    ) : (
                      t('checkoutPage.placeOrder')
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="gold-card sticky top-24">
              <h2 className="text-xl font-bold text-gold-100 mb-6">{t('cartPage.orderSummary')}</h2>
              <div className="space-y-3 mb-6">
                {clubSavings > 0 ? (
                  <>
                    <div className="flex justify-between text-gold-100/60 gap-2 text-sm">
                      <span className="flex items-center gap-2">
                        {t('checkoutPage.standardListTotal')}
                        {summary.previewLoading && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-400 shrink-0" aria-hidden />
                        )}
                      </span>
                      <span className="tabular-nums shrink-0">{formatOrderKwd(displaySubtotal)} KWD</span>
                    </div>
                    <div className="flex justify-between text-emerald-400/90 text-sm gap-2">
                      <span className="flex items-center gap-1.5 min-w-0">
                        <Crown className="w-3.5 h-3.5 shrink-0" aria-hidden />
                        {t('checkoutPage.memberRateSavings')}
                      </span>
                      <span className="tabular-nums shrink-0">−{formatOrderKwd(clubSavings)} KWD</span>
                    </div>
                    <div className="flex justify-between text-gold-100 text-sm font-medium gap-2 border-t border-gold-500/15 pt-2">
                      <span>{t('checkoutPage.yourPrice')}</span>
                      <span className="tabular-nums shrink-0">{formatOrderKwd(displayTotalAfterClub)} KWD</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-gold-100/60 gap-2">
                    <span className="flex items-center gap-2">
                      {t('checkoutPage.subtotal')}
                      {summary.previewLoading && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-gold-400 shrink-0" aria-hidden />
                      )}
                    </span>
                    <span className="tabular-nums">{formatOrderKwd(displayTotalAfterClub)} KWD</span>
                  </div>
                )}
                {summary.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400/90 text-sm gap-2">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <Tag className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{summary.offerTitle ?? t('cartPage.promotionalOffer')}</span>
                    </span>
                    <span className="tabular-nums shrink-0">−{formatOrderKwd(summary.discountAmount)} KWD</span>
                  </div>
                )}
                {summary.discountAmount <= 0 && (
                  <div className="flex justify-between text-gold-100/60 text-sm gap-2">
                    <span>{t('cartPage.promotionalOffer')}</span>
                    <span className="tabular-nums shrink-0">—</span>
                  </div>
                )}
                <div className="flex justify-between text-gold-100/60">
                  <span>{t('checkoutPage.shipping')}</span>
                  <span className="tabular-nums">
                    {checkoutShippingCharge > 0
                      ? `${formatOrderKwd(checkoutShippingCharge)} KWD`
                      : t('checkoutPage.shippingFree')}
                  </span>
                </div>
                <div className="flex justify-between text-gold-100/60">
                  <span>{t('cartPage.tax')}</span>
                  <span className="tabular-nums">{formatOrderKwd(summary.taxAmount)} KWD</span>
                </div>
              </div>
              <div className="border-t border-gold-500/20 pt-4">
                <div className="flex justify-between text-lg font-bold gap-2">
                  <span className="text-gold-100">{t('cartPage.total')}</span>
                  <span className="gold-gradient-text tabular-nums">
                    {formatOrderKwd(checkoutTotalDue)} KWD
                  </span>
                </div>
              </div>
              <div className="mt-6 flex items-center gap-2 text-sm text-gold-100/60">
                <Lock className="w-4 h-4 shrink-0" />
                {t('checkoutPage.secureCheckout')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
