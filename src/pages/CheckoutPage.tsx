import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  CreditCard,
  Truck,
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
import TurnstileWidget, { type TurnstileWidgetHandle } from '@/components/auth/TurnstileWidget'
import { isTurnstileConfigured } from '@/lib/turnstile'
import { CheckoutTrustBadges } from '@/components/checkout/CheckoutTrustBadges'
import { CheckoutStepIndicator } from '@/components/checkout/CheckoutStepIndicator'
import knetBadge from '@/assets/trust/knet-badge.png'
import { cn } from '@/lib/utils'
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

const checkoutFieldClass =
  'w-full rounded-xl border border-[#85E307]/35 bg-white px-4 py-3 text-sm text-[#0B0F19] placeholder:text-[#94A3B8] outline-none transition focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/20'
const checkoutPanelClass =
  'rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6'
const checkoutPrimaryBtnClass =
  'inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl bg-[#85E307] px-6 py-3 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9AEF2A] disabled:cursor-not-allowed disabled:opacity-50'
const checkoutSecondaryBtnClass =
  'inline-flex min-h-[3rem] flex-1 items-center justify-center rounded-xl border border-black/10 bg-[#F4F4F5] px-6 py-3 text-sm font-bold text-[#0B0F19] transition hover:bg-[#ECFCCB]/40 disabled:opacity-50'

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
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const clearTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])
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

    if (isTurnstileConfigured && !turnstileToken) {
      toast.error(t('auth.captchaRequired'))
      return
    }

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
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
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
      clearTurnstile()
      const err = e as { response?: { data?: unknown } }
      const data = err?.response?.data
      if (data && typeof data === 'object') {
        const d = data as PlaceOrderErrorPayload & { error?: unknown }
        if (d.error === 'captcha_failed') {
          toast.error(t('auth.captchaFailed'))
          return
        }
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
      <div className="flex min-h-screen items-center justify-center bg-white px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#ECFCCB]">
            <Loader2 className="h-8 w-8 animate-spin text-[#3F6F00]" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-[#0B0F19]">{t('checkoutPage.knetVerifyingTitle')}</h1>
          <p className="text-sm leading-relaxed text-[#64748B]">{t('checkoutPage.knetVerifyingBody')}</p>
        </div>
      </div>
    )
  }

  if (knetReturnPhase === 'failed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F9FA] px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-red-200/70 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(220,38,38,0.1)]">
            <CreditCard className="h-8 w-8 text-[#DC2626]" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-[#0B0F19]">{t('checkoutPage.knetFailedTitle')}</h1>
          <p className="mb-6 text-sm text-[#64748B]">{t('checkoutPage.knetFailedBody')}</p>
          {knetReturnReason && (
            <p className="mb-6 font-mono text-xs text-[#94A3B8]">{knetReturnReason}</p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setKnetReturnPhase('idle')} className={checkoutPrimaryBtnClass}>
              {t('checkoutPage.knetTryAgain')}
            </button>
            <Link
              to="/cart"
              className="inline-flex min-h-[3rem] items-center justify-center rounded-xl border border-black/10 px-6 py-3 text-sm font-semibold text-[#64748B] transition hover:bg-[#F9F9FA]"
            >
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
      <div className="min-h-screen bg-[#F9F9FA] px-4 py-12">
        <div className="mx-auto max-w-lg">
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <div className="border-b border-[#059669]/20 bg-[rgba(5,150,105,0.1)] px-8 py-10 text-center">
              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-[rgba(5,150,105,0.15)] ring-4 ring-[rgba(5,150,105,0.08)]">
                <Check className="h-10 w-10 text-[#059669]" strokeWidth={2.5} />
              </div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#64748B]">
                {t('checkoutPage.paymentSuccessBadge')}
              </p>
              <h1 className="text-2xl font-bold text-[#0B0F19]">{t('checkoutPage.orderConfirmed')}</h1>
              <p className="mt-2 text-sm text-[#64748B]">{t('checkoutPage.knetSuccessSubtitle')}</p>
            </div>
            <div className="divide-y divide-black/5 bg-[#F9F9FA] text-sm">
              {order?.invoice_number && (
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <span className="text-[#64748B]">{t('checkoutPage.confirmInvoice')}</span>
                  <span className="font-mono font-semibold text-[#0B0F19]">{order.invoice_number}</span>
                </div>
              )}
              {order?.total_amount != null && (
                <div className="flex justify-between gap-4 px-5 py-3.5">
                  <span className="text-[#64748B]">{t('checkoutPage.confirmAmount')}</span>
                  <span className="font-bold tabular-nums text-[#0B0F19]">{formatKwd(order.total_amount)} {t('common.kwd')}</span>
                </div>
              )}
              <div className="flex justify-between gap-4 px-5 py-3.5">
                <span className="text-[#64748B]">{t('checkoutPage.confirmPayment')}</span>
                <span className="inline-flex items-center gap-2 font-semibold text-[#0B0F19]">
                  <img src={knetBadge} alt="" className="h-6 w-auto rounded object-contain" />
                  {t('checkoutPage.payKnet')}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 px-6 py-6 sm:flex-row sm:px-8">
              <button
                type="button"
                onClick={handleDownloadInvoice}
                disabled={downloadingInvoice || !order?.id}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#3F6F00] bg-[#ECFCCB]/40 px-5 py-3 text-sm font-semibold text-[#0B0F19] transition hover:bg-[#ECFCCB]/70 disabled:opacity-50"
              >
                {downloadingInvoice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {t('checkoutPage.downloadInvoice')}
              </button>
              <Link to="/dashboard" className={cn(checkoutPrimaryBtnClass, 'flex-1')}>
                {t('checkoutPage.viewMyOrders')}
              </Link>
              <Link
                to="/products"
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-black/10 px-5 py-3 text-sm font-semibold text-[#64748B] transition hover:bg-[#F9F9FA]"
              >
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
      <div className="flex min-h-screen items-center justify-center bg-[#F9F9FA] px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold text-[#0B0F19]">{t('cartPage.emptyTitle')}</h1>
          <Link to="/products" className={checkoutPrimaryBtnClass}>
            {t('checkoutPage.browseProducts')}
          </Link>
        </div>
      </div>
    )
  }

  const stepLabels = [
    t('checkoutPage.stepShipping'),
    t('checkoutPage.stepPayment'),
    t('checkoutPage.stepReview'),
  ] as const

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-[#0B0F19] sm:text-3xl">
          {t('checkoutPage.title')}
        </h1>
        <p className="mb-6 text-sm text-[#64748B]">{t('checkoutPage.trustNote')}</p>

        <CheckoutStepIndicator labels={stepLabels} step={step} />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {step === 1 && (
              <div className={checkoutPanelClass}>
                <h2 className="mb-5 text-lg font-bold text-[#0B0F19]">{t('checkoutPage.shippingInfo')}</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <input
                    placeholder={t('checkoutPage.firstNamePh')}
                    className={checkoutFieldClass}
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                  <input
                    placeholder={t('checkoutPage.lastNamePh')}
                    className={checkoutFieldClass}
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                  <input
                    placeholder={t('checkoutPage.emailPh')}
                    type="email"
                    className={cn(checkoutFieldClass, 'md:col-span-2')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    placeholder={t('checkoutPage.phonePh')}
                    className={cn(checkoutFieldClass, 'md:col-span-2')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    placeholder={t('checkoutPage.addressPh')}
                    className={cn(checkoutFieldClass, 'md:col-span-2')}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <KuwaitLocationFields
                    governorate={governorate}
                    city={city}
                    onGovernorateChange={setGovernorate}
                    onCityChange={setCity}
                    inputClassName={checkoutFieldClass}
                  />
                  <input
                    placeholder={t('checkoutPage.postalPh')}
                    className={cn(checkoutFieldClass, 'md:col-span-2')}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
                <button type="button" onClick={() => setStep(2)} className={cn(checkoutPrimaryBtnClass, 'mt-6')}>
                  {t('checkoutPage.continuePayment')}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div className={checkoutPanelClass}>
                  <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECFCCB] text-[#3F6F00]">
                      <Truck className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-[#0B0F19]">{t('checkoutPage.delivery')}</h2>
                      <p className="mt-1 text-sm text-[#64748B]">{t('checkoutPage.deliveryPhysical')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition',
                        deliveryType === 'physical'
                          ? 'border-[#3F6F00] bg-[rgba(133,227,7,0.14)]'
                          : 'border-black/10 bg-[#F9F9FA]',
                      )}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryType === 'physical'}
                        onChange={() => setDeliveryType('physical')}
                        className="accent-[#85E307]"
                      />
                      <Truck className="h-5 w-5 text-[#3F6F00]" />
                      <span className="text-sm font-semibold text-[#0B0F19]">{t('checkoutPage.deliveryPhysical')}</span>
                    </label>
                    {TRADING_AND_VIRTUAL_WALLET_ENABLED ? (
                      <label
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition',
                          deliveryType === 'locked'
                            ? 'border-[#3F6F00] bg-[rgba(133,227,7,0.14)]'
                            : 'border-black/10 bg-[#F9F9FA]',
                        )}
                      >
                        <input
                          type="radio"
                          name="delivery"
                          checked={deliveryType === 'locked'}
                          onChange={() => setDeliveryType('locked')}
                          className="accent-[#85E307]"
                        />
                        <Lock className="h-5 w-5 text-[#3F6F00]" />
                        <span className="text-sm font-semibold text-[#0B0F19]">{t('checkoutPage.deliveryVault')}</span>
                      </label>
                    ) : null}
                  </div>
                </div>

                <div className={checkoutPanelClass}>
                  <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECFCCB]">
                      <img src={knetBadge} alt="" className="h-6 w-auto object-contain" />
                    </span>
                    <div>
                      <h2 className="text-lg font-bold text-[#0B0F19]">{t('checkoutPage.paymentMethod')}</h2>
                      <p className="mt-1 text-sm text-[#64748B]">{t('checkoutPage.trustNote')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {paymentMethodOptions.map((method) => (
                      <label
                        key={method.id}
                        className={cn(
                          'flex items-center gap-4 rounded-xl border p-4 transition',
                          method.disabled
                            ? 'cursor-not-allowed border-black/10 bg-[#F9F9FA] opacity-55'
                            : 'cursor-pointer',
                          !method.disabled &&
                            paymentMethod === method.id &&
                            'border-[#3F6F00] bg-[rgba(133,227,7,0.14)]',
                          !method.disabled &&
                            paymentMethod !== method.id &&
                            'border-black/10 bg-[#F9F9FA] hover:border-[#85E307]/40',
                        )}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          disabled={method.disabled}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="accent-[#85E307] disabled:opacity-40"
                        />
                        {method.id === 'knet' ? (
                          <img src={knetBadge} alt="" className="h-8 w-auto rounded object-contain" />
                        ) : (
                          <method.icon className="h-6 w-6 text-[#3F6F00]" />
                        )}
                        <span className="text-sm font-semibold text-[#0B0F19]">
                          {method.nameKey != null
                            ? t(method.nameKey)
                            : t('checkoutPage.payWallet', { balance: walletBalance.toFixed(3) })}
                          {method.id === 'wallet' && method.disabled && (
                            <span className="mt-1 block text-xs font-normal text-[#64748B]">
                              {t('checkoutPage.walletInsufficient', {
                                total: formatOrderKwd(checkoutTotalDue),
                              })}
                            </span>
                          )}
                        </span>
                      </label>
                    ))}
                  </div>
                  <CheckoutTrustBadges variant="compact" className="mt-5" />
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => setStep(1)} className={checkoutSecondaryBtnClass}>
                    {t('checkoutPage.back')}
                  </button>
                  <button type="button" onClick={() => setStep(3)} className={cn(checkoutPrimaryBtnClass, 'flex-1')}>
                    {t('checkoutPage.reviewOrder')}
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className={checkoutPanelClass}>
                <h2 className="mb-5 text-lg font-bold text-[#0B0F19]">{t('checkoutPage.reviewOrder')}</h2>
                <div className="mb-5 space-y-3">
                  {cart.items.map((item) => {
                    const lineList = cartLineStandardTotal(item)
                    const lineSave = cartLineClubMemberSavings(item)
                    const productName =
                      isAr && item.product.name_ar ? item.product.name_ar : item.product.name_en
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 rounded-xl border border-black/10 bg-[#F9F9FA] p-4"
                      >
                        <div className="h-14 w-14 shrink-0 rounded-lg bg-[#E5E7EB]" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#0B0F19]">{productName}</p>
                          <p className="text-sm text-[#64748B]">
                            {t('checkoutPage.qty', { count: item.quantity })}
                          </p>
                        </div>
                        <div className="text-end">
                          {lineSave > 0 ? (
                            <>
                              <p className="text-xs text-[#94A3B8] line-through tabular-nums">
                                {formatOrderKwd(lineList)} {t('common.kwd')}
                              </p>
                              <p className="font-bold tabular-nums text-[#0B0F19]">
                                {formatOrderKwd(item.total_price)} {t('common.kwd')}
                              </p>
                            </>
                          ) : (
                            <p className="font-bold tabular-nums text-[#0B0F19]">
                              {formatOrderKwd(item.total_price)} {t('common.kwd')}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mb-5 rounded-xl border border-[#85E307]/25 bg-[#ECFCCB]/35 p-4 space-y-2 text-sm">
                  <p className="mb-2 font-bold text-[#0B0F19]">{t('checkoutPage.orderTotals')}</p>
                  {clubSavings > 0 ? (
                    <>
                      <div className="flex justify-between text-[#64748B]">
                        <span>{t('checkoutPage.standardListTotal')}</span>
                        <span className="tabular-nums">{formatOrderKwd(displaySubtotal)} {t('common.kwd')}</span>
                      </div>
                      <div className="flex justify-between text-[#059669]">
                        <span className="inline-flex items-center gap-1.5">
                          <Crown className="h-3.5 w-3.5" />
                          {t('cartPage.clubMemberSavings')}
                        </span>
                        <span className="tabular-nums">−{formatOrderKwd(clubSavings)} {t('common.kwd')}</span>
                      </div>
                      <div className="flex justify-between border-t border-black/5 pt-2 font-medium text-[#0B0F19]">
                        <span>{t('checkoutPage.yourPriceMember')}</span>
                        <span className="tabular-nums">{formatOrderKwd(displayTotalAfterClub)} {t('common.kwd')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-[#64748B]">
                      <span>{t('checkoutPage.subtotal')}</span>
                      <span className="tabular-nums">{formatOrderKwd(displayTotalAfterClub)} {t('common.kwd')}</span>
                    </div>
                  )}
                  {summary.discountAmount > 0 && (
                    <div className="flex justify-between text-[#059669]">
                      <span className="inline-flex items-center gap-1.5">
                        <Tag className="h-3.5 w-3.5" />
                        {summary.offerTitle ?? t('cartPage.promotionalOffer')}
                      </span>
                      <span className="tabular-nums">−{formatOrderKwd(summary.discountAmount)} {t('common.kwd')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#64748B]">
                    <span>{t('checkoutPage.shipping')}</span>
                    <span>
                      {checkoutShippingCharge > 0
                        ? `${formatOrderKwd(checkoutShippingCharge)} ${t('common.kwd')}`
                        : t('checkoutPage.shippingFree')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>{t('cartPage.tax')}</span>
                    <span className="tabular-nums">{formatOrderKwd(summary.taxAmount)} {t('common.kwd')}</span>
                  </div>
                  <div className="flex justify-between border-t border-black/10 pt-3 text-base font-bold text-[#0B0F19]">
                    <span>{t('checkoutPage.totalDue')}</span>
                    <span className="tabular-nums">{formatOrderKwd(checkoutTotalDue)} {t('common.kwd')}</span>
                  </div>
                </div>

                {walletTooLow && (
                  <p className="mb-4 text-sm text-amber-700">{t('checkoutPage.walletTooLow')}</p>
                )}

                {isTurnstileConfigured && (
                  <div className="mb-4">
                    <TurnstileWidget
                      ref={turnstileRef}
                      theme="light"
                      onToken={setTurnstileToken}
                      onExpire={clearTurnstile}
                      onError={clearTurnstile}
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    disabled={submitting}
                    className={checkoutSecondaryBtnClass}
                  >
                    {t('checkoutPage.back')}
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePlaceOrder()}
                    disabled={submitting || walletTooLow || (isTurnstileConfigured && !turnstileToken)}
                    className={cn(checkoutPrimaryBtnClass, 'flex-1')}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
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

          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-black/10 bg-[#F5F5F5] p-5 shadow-sm">
                <h2 className="mb-4 font-serif text-lg font-bold text-[#0B0F19]">{t('cartPage.orderSummary')}</h2>
                <div className="space-y-2.5 text-sm">
                  {clubSavings > 0 ? (
                    <>
                      <div className="flex justify-between gap-2 text-[#64748B]">
                        <span>{t('checkoutPage.standardListTotal')}</span>
                        <span className="tabular-nums text-[#0B0F19]">{formatOrderKwd(displaySubtotal)} {t('common.kwd')}</span>
                      </div>
                      <div className="flex justify-between gap-2 text-[#059669]">
                        <span>{t('checkoutPage.memberRateSavings')}</span>
                        <span className="tabular-nums">−{formatOrderKwd(clubSavings)} {t('common.kwd')}</span>
                      </div>
                      <div className="flex justify-between gap-2 border-t border-black/5 pt-2 font-medium text-[#0B0F19]">
                        <span>{t('checkoutPage.yourPrice')}</span>
                        <span className="tabular-nums">{formatOrderKwd(displayTotalAfterClub)} {t('common.kwd')}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between gap-2 text-[#64748B]">
                      <span>{t('checkoutPage.subtotal')}</span>
                      <span className="tabular-nums text-[#0B0F19]">{formatOrderKwd(displayTotalAfterClub)} {t('common.kwd')}</span>
                    </div>
                  )}
                  {summary.discountAmount > 0 && (
                    <div className="flex justify-between gap-2 text-[#059669]">
                      <span>{summary.offerTitle ?? t('cartPage.promotionalOffer')}</span>
                      <span className="tabular-nums">−{formatOrderKwd(summary.discountAmount)} {t('common.kwd')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[#64748B]">
                    <span>{t('checkoutPage.shipping')}</span>
                    <span>
                      {checkoutShippingCharge > 0
                        ? `${formatOrderKwd(checkoutShippingCharge)} ${t('common.kwd')}`
                        : t('checkoutPage.shippingFree')}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#64748B]">
                    <span>{t('cartPage.tax')}</span>
                    <span className="tabular-nums">{formatOrderKwd(summary.taxAmount)} {t('common.kwd')}</span>
                  </div>
                </div>
                <div className="mt-4 border-t border-black/10 pt-4">
                  <div className="flex justify-between gap-2">
                    <span className="font-serif text-lg font-bold text-[#0B0F19]">{t('cartPage.total')}</span>
                    <span className="font-serif text-2xl font-bold tabular-nums text-[#0B0F19]">
                      {formatOrderKwd(checkoutTotalDue)} {t('common.kwd')}
                    </span>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-xs text-[#64748B]">
                  <Lock className="h-4 w-4 shrink-0 text-[#3F6F00]" />
                  {t('checkoutPage.secureCheckout')}
                </div>
              </div>
              <CheckoutTrustBadges />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
