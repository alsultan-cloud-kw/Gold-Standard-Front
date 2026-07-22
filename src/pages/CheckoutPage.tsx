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
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import knetBadge from '@/assets/trust/knet-badge.png'
import { cn } from '@/lib/utils'
import { TRADING_AND_VIRTUAL_WALLET_ENABLED, CHECKOUT_VAULT_DELIVERY_ENABLED, CHECKOUT_CREDIT_CARD_ENABLED, CHECKOUT_COD_ENABLED } from '@/featureFlags'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { usePurchaseAuth } from '@/hooks/usePurchaseAuth'
import { formatOrderKwd, useOrderSummaryDisplay } from '../hooks/useOrderSummaryDisplay'
import {
  cartClubPricingBreakdown,
  cartLineClubMemberSavings,
  cartLineStandardTotal,
} from '../utils/clubCartPricing'
import { productImageSrc } from '../utils/productImage'
import { ProductStockBadge } from '@/components/products/ProductStockBadge'
import {
  isProductOutOfStock,
  productAvailableQuantity,
} from '@/utils/productStock'
import {
  asSingleCustomerProfile,
  formatProfileShippingAddress,
  profileHasSavedAddress,
  shippingDiffersFromProfile,
} from '@/utils/customerProfile'

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
const CHECKOUT_SHIPPING_KEY = 'gs_checkout_shipping_draft'

type CheckoutShippingDraft = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  governorate: string
  postalCode: string
}

function readCheckoutShippingDraft(): CheckoutShippingDraft | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_SHIPPING_KEY)
    if (!raw) return null
    return JSON.parse(raw) as CheckoutShippingDraft
  } catch {
    return null
  }
}

function writeCheckoutShippingDraft(draft: CheckoutShippingDraft) {
  try {
    sessionStorage.setItem(CHECKOUT_SHIPPING_KEY, JSON.stringify(draft))
  } catch {
    // ignore quota / private mode
  }
}

function clearCheckoutShippingDraft() {
  try {
    sessionStorage.removeItem(CHECKOUT_SHIPPING_KEY)
  } catch {
    // ignore
  }
}

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

const checkoutFieldClass = 'checkout-field'
const checkoutPanelClass = 'checkout-panel'
const checkoutPrimaryBtnClass = 'checkout-primary-btn'
const checkoutSecondaryBtnClass = 'checkout-secondary-btn'

export default function CheckoutPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const navigate = useNavigate()
  const { ensureCanPurchase } = usePurchaseAuth()
  // Account OTP + KYC enforced by KycRequiredRoute.
  const location = useLocation()
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [paymentMethod, setPaymentMethod] = useState('knet')
  const [deliveryType, setDeliveryType] = useState<'physical' | 'locked'>('physical')
  const [submitting, setSubmitting] = useState(false)
  const [lastOrder, setLastOrder] = useState<SaleResponse | null>(null)
  const [knetReturnPhase, setKnetReturnPhase] = useState<KnetReturnPhase>('idle')
  const [knetReturnReason, setKnetReturnReason] = useState<string | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileMountReady, setTurnstileMountReady] = useState(false)
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
  const hasUnavailableItems = useMemo(
    () =>
      cart.items.some(
        (item) =>
          isProductOutOfStock(item.product) || item.quantity > productAvailableQuantity(item.product),
      ),
    [cart.items],
  )

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
  const checkoutProfile = useMemo(
    () => asSingleCustomerProfile(checkoutProfileData),
    [checkoutProfileData],
  )
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
    if (!CHECKOUT_VAULT_DELIVERY_ENABLED && !TRADING_AND_VIRTUAL_WALLET_ENABLED && deliveryType === 'locked') {
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
  const savedShipping = useMemo(() => readCheckoutShippingDraft(), [])
  const [firstName, setFirstName] = useState(savedShipping?.firstName ?? '')
  const [lastName, setLastName] = useState(savedShipping?.lastName ?? '')
  const [email, setEmail] = useState(savedShipping?.email ?? '')
  const [phone, setPhone] = useState(savedShipping?.phone ?? '')
  const [address, setAddress] = useState(savedShipping?.address ?? '')
  const [city, setCity] = useState(savedShipping?.city ?? '')
  const [governorate, setGovernorate] = useState(savedShipping?.governorate ?? '')
  const [postalCode, setPostalCode] = useState(savedShipping?.postalCode ?? '')
  const [saveAddressToProfile, setSaveAddressToProfile] = useState(false)
  const saveAddressPromptInitialized = useRef(false)
  const profileHydrated = useRef(false)

  const showSaveAddressPrompt = useMemo(() => {
    if (!localStorage.getItem('access_token')) return false
    if (!checkoutProfile?.id) return false
    const hasShipping = Boolean(
      address.trim() || (city.trim() && governorate.trim()),
    )
    if (!hasShipping) return false
    if (!profileHasSavedAddress(checkoutProfile)) return true
    return shippingDiffersFromProfile(checkoutProfile, { address, city, governorate, postalCode })
  }, [checkoutProfile, address, city, governorate, postalCode])

  useEffect(() => {
    if (!showSaveAddressPrompt || saveAddressPromptInitialized.current) return
    saveAddressPromptInitialized.current = true
    if (checkoutProfile && !profileHasSavedAddress(checkoutProfile)) {
      setSaveAddressToProfile(true)
    }
  }, [showSaveAddressPrompt, checkoutProfile])

  useEffect(() => {
    writeCheckoutShippingDraft({
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      governorate,
      postalCode,
    })
  }, [firstName, lastName, email, phone, address, city, governorate, postalCode])

  useEffect(() => {
    if (step !== 3) {
      setTurnstileMountReady(false)
      setTurnstileToken('')
      return
    }
    const id = window.setTimeout(() => setTurnstileMountReady(true), 120)
    return () => window.clearTimeout(id)
  }, [step])

  useEffect(() => {
    if (profileHydrated.current) return
    const p = asSingleCustomerProfile(checkoutProfileData)
    if (!p) return
    if (profileHasSavedAddress(p)) {
      const fromProfile = formatProfileShippingAddress(p)
      setAddress(fromProfile.address)
      setCity(fromProfile.city)
      setGovernorate(fromProfile.governorate)
      setPostalCode(fromProfile.postalCode)
    } else if (!savedShipping) {
      const fromProfile = formatProfileShippingAddress(p)
      setAddress((a) => a || fromProfile.address)
      setCity((c) => c || fromProfile.city)
      setGovernorate((g) => g || fromProfile.governorate)
      setPostalCode((pc) => pc || fromProfile.postalCode)
    }
    profileHydrated.current = true
  }, [checkoutProfileData, savedShipping])

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
    if (!ensureCanPurchase('/checkout')) return
    if (cart.items.length === 0) return
    if (hasUnavailableItems) {
      toast.error(t('stock.cartBlocked'))
      return
    }

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

      if (saveAddressToProfile) {
        try {
          let profileId = checkoutProfile?.id
          if (!profileId) {
            const fresh = await accountsApi.getMyProfile()
            profileId = asSingleCustomerProfile(fresh)?.id
          }
          if (!profileId) {
            toast.error(t('checkoutPage.addressSaveFailed'))
          } else {
            await accountsApi.updateProfile(profileId, {
              address_line1: address.trim() || null,
              address_line2: null,
              city: city.trim() || null,
              governorate: governorate.trim() || null,
              postal_code: postalCode.trim() || null,
              country: 'Kuwait',
            })
            await queryClient.invalidateQueries({ queryKey: ['myCustomerProfile'] })
            clearCheckoutShippingDraft()
            toast.success(t('checkoutPage.addressSavedToProfile'))
          }
        } catch {
          toast.error(t('checkoutPage.addressSaveFailed'))
        }
      }

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
      clearCheckoutShippingDraft()
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
        const d = data as PlaceOrderErrorPayload & { error?: unknown; detail?: unknown }
        if (d.error === 'profile_incomplete') {
          toast.error(
            typeof d.detail === 'string' && d.detail.trim()
              ? d.detail
              : t('auth.kyc.requiredToBuyDesc'),
          )
          navigate('/dashboard?tab=profile&complete=profile')
          return
        }
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
      <AppLoadingScreen
        variant="fullscreen"
        message={t('checkoutPage.knetVerifyingTitle')}
      />
    )
  }

  if (knetReturnPhase === 'failed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F9FA] px-4 py-16">
        <div className="w-full max-w-lg rounded-2xl border border-red-200/70 bg-white p-10 text-center">
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
          <div className="overflow-hidden rounded-2xl border border-black/8 bg-white">
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

  const placeOrderDisabled =
    submitting ||
    walletTooLow ||
    hasUnavailableItems ||
    (isTurnstileConfigured && !turnstileToken)

  return (
    <div className="checkout-page checkout-page-with-mobile-actions">
      <div className="page-shell page-section">
        <h1 className="store-display-title mb-2 text-[#0B0F19]">
          {t('checkoutPage.title')}
        </h1>
        <p className="mb-2 text-sm text-[#64748B] sm:mb-4 sm:text-base">{t('checkoutPage.trustNote')}</p>

        <CheckoutStepIndicator labels={stepLabels} step={step} />

        <div className="commerce-layout mt-8">
          <div className="min-w-0 space-y-6">
            {step === 1 && (
              <div className={checkoutPanelClass}>
                <h2 className="checkout-panel__title">{t('checkoutPage.shippingInfo')}</h2>
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
                    variant="light"
                  />
                  <input
                    placeholder={t('checkoutPage.postalPh')}
                    className={cn(checkoutFieldClass, 'md:col-span-2')}
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>

                {showSaveAddressPrompt ? (
                  <div className="mt-5 space-y-2">
                    <label
                      className={cn(
                        'checkout-option',
                        saveAddressToProfile && 'checkout-option--selected',
                      )}
                    >
                      <span className="checkout-option__rail" aria-hidden />
                      <input
                        type="checkbox"
                        checked={saveAddressToProfile}
                        onChange={(e) => setSaveAddressToProfile(e.target.checked)}
                        className="sr-only"
                      />
                      <span className="checkout-option__body">
                        <span className="checkout-option__title">
                          {t('checkoutPage.saveAddressTitle')}
                        </span>
                        <span className="checkout-option__hint">
                          {t('checkoutPage.saveAddressHint')}
                        </span>
                      </span>
                      <span className="checkout-option__check" aria-hidden>
                        {saveAddressToProfile ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                      </span>
                    </label>
                    <p className="text-xs text-[#64748B]">
                      {t('checkoutPage.manageAddressLater')}{' '}
                      <Link to="/dashboard?tab=addresses" className="font-semibold text-[#3F6F00] hover:underline">
                        {t('userDashboard.tabs.addresses')}
                      </Link>
                    </p>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={cn(checkoutPrimaryBtnClass, 'checkout-actions-inline mt-6 hidden lg:inline-flex')}
                >
                  {t('checkoutPage.continuePayment')}
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className={checkoutPanelClass}>
                  <div className="checkout-panel__header">
                    <span className="checkout-panel__icon">
                      <Truck className="h-5 w-5" />
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-[#0B0F19] sm:text-lg">{t('checkoutPage.delivery')}</h2>
                      <p className="mt-1 text-sm text-[#64748B]">{t('checkoutPage.deliveryChooseHint')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label
                      className={cn(
                        'checkout-option',
                        deliveryType === 'physical' && 'checkout-option--selected',
                      )}
                    >
                      <span className="checkout-option__rail" aria-hidden />
                      <input
                        type="radio"
                        name="delivery"
                        checked={deliveryType === 'physical'}
                        onChange={() => setDeliveryType('physical')}
                        className="sr-only"
                      />
                      <span className="checkout-option__icon">
                        <Truck className="h-5 w-5" />
                      </span>
                      <span className="checkout-option__body">
                        <span className="checkout-option__title">{t('checkoutPage.deliveryPhysical')}</span>
                        <span className="checkout-option__hint">{t('checkoutPage.deliveryPhysicalHint')}</span>
                      </span>
                      <span className="checkout-option__check" aria-hidden>
                        {deliveryType === 'physical' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                      </span>
                    </label>
                    {(CHECKOUT_VAULT_DELIVERY_ENABLED || TRADING_AND_VIRTUAL_WALLET_ENABLED) ? (
                      <label
                        className={cn(
                          'checkout-option',
                          deliveryType === 'locked' && 'checkout-option--selected',
                        )}
                      >
                        <span className="checkout-option__rail" aria-hidden />
                        <input
                          type="radio"
                          name="delivery"
                          checked={deliveryType === 'locked'}
                          onChange={() => setDeliveryType('locked')}
                          className="sr-only"
                        />
                        <span className="checkout-option__icon">
                          <Lock className="h-5 w-5" />
                        </span>
                        <span className="checkout-option__body">
                          <span className="checkout-option__title">{t('checkoutPage.deliveryVault')}</span>
                          <span className="checkout-option__hint">{t('checkoutPage.deliveryVaultHint')}</span>
                        </span>
                        <span className="checkout-option__check" aria-hidden>
                          {deliveryType === 'locked' ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
                        </span>
                      </label>
                    ) : null}
                  </div>
                </div>

                <div className={checkoutPanelClass}>
                  <div className="checkout-panel__header">
                    <span className="checkout-panel__icon bg-white">
                      <img src={knetBadge} alt="" className="h-6 w-auto object-contain" />
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-[#0B0F19] sm:text-lg">{t('checkoutPage.paymentMethod')}</h2>
                      <p className="mt-1 text-sm text-[#64748B]">{t('checkoutPage.trustNote')}</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {paymentMethodOptions.map((method) => (
                      <label
                        key={method.id}
                        className={cn(
                          'checkout-option',
                          method.disabled && 'checkout-option--disabled',
                          !method.disabled &&
                            paymentMethod === method.id &&
                            'checkout-option--selected',
                        )}
                      >
                        <span className="checkout-option__rail" aria-hidden />
                        <input
                          type="radio"
                          name="payment"
                          value={method.id}
                          checked={paymentMethod === method.id}
                          disabled={method.disabled}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="sr-only"
                        />
                        <span className="checkout-option__icon bg-white">
                          {method.id === 'knet' ? (
                            <img src={knetBadge} alt="" className="h-7 w-auto rounded object-contain" />
                          ) : (
                            <method.icon className="h-5 w-5" />
                          )}
                        </span>
                        <span className="checkout-option__body">
                          <span className="checkout-option__title">
                            {method.nameKey != null
                              ? t(method.nameKey)
                              : t('checkoutPage.payWallet', { balance: walletBalance.toFixed(3) })}
                          </span>
                          {method.id === 'wallet' && method.disabled ? (
                            <span className="checkout-option__hint">
                              {t('checkoutPage.walletInsufficient', {
                                total: formatOrderKwd(checkoutTotalDue),
                              })}
                            </span>
                          ) : null}
                          {method.id === 'knet' ? (
                            <span className="checkout-option__hint">{t('checkoutPage.payKnetHint')}</span>
                          ) : null}
                          {method.id === 'cod' ? (
                            <span className="checkout-option__hint">{t('checkoutPage.payCodHint')}</span>
                          ) : null}
                        </span>
                        <span className="checkout-option__check" aria-hidden>
                          {!method.disabled && paymentMethod === method.id ? (
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          ) : null}
                        </span>
                      </label>
                    ))}
                  </div>
                  <CheckoutTrustBadges variant="compact" className="mt-4" />
                </div>

                <div className="checkout-actions-inline hidden gap-3 lg:flex">
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
                <h2 className="checkout-panel__title">{t('checkoutPage.reviewOrder')}</h2>
                {hasUnavailableItems && (
                  <div className="mb-4 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#B91C1C]">
                    {t('stock.cartBlocked')}
                  </div>
                )}

                {deliveryType === 'locked' ? (
                  <div className="checkout-vault-banner mb-5">
                    <Lock className="mt-0.5 h-5 w-5 shrink-0 text-[#3F6F00]" />
                    <div>
                      <p className="font-semibold text-[#0B0F19]">{t('checkoutPage.vaultReviewTitle')}</p>
                      <p className="mt-1 text-xs leading-5 text-[#64748B]">{t('checkoutPage.vaultReviewBody')}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-5 flex items-start gap-3 rounded-xl border border-black/8 bg-[#F9F9FA] px-4 py-3">
                    <Truck className="mt-0.5 h-5 w-5 shrink-0 text-[#3F6F00]" />
                    <div>
                      <p className="text-sm font-semibold text-[#0B0F19]">{t('checkoutPage.deliveryPhysical')}</p>
                      <p className="mt-0.5 text-xs text-[#64748B]">{t('checkoutPage.deliveryPhysicalHint')}</p>
                    </div>
                  </div>
                )}

                <div className="mb-5 space-y-3">
                  {cart.items.map((item) => {
                    const lineList = cartLineStandardTotal(item)
                    const lineSave = cartLineClubMemberSavings(item)
                    const imageSrc = productImageSrc(item.product)
                    const productName =
                      isAr && item.product.name_ar ? item.product.name_ar : item.product.name_en
                    const itemOutOfStock = isProductOutOfStock(item.product)
                    const carat =
                      item.product.carat?.display_name_en
                      || item.product.carat?.display_name_ar
                      || (item.product.carat?.carat_value != null
                        ? `${item.product.carat.carat_value}K`
                        : null)
                    const weight = item.product.weight_grams
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          'checkout-line-item',
                          itemOutOfStock && 'checkout-line-item--warn',
                        )}
                      >
                        <span className="checkout-line-item__rail" aria-hidden />
                        <div
                          className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F4F4F5] ring-1 ring-black/5 sm:h-[4.5rem] sm:w-[4.5rem] ${itemOutOfStock ? 'grayscale-[0.35]' : ''}`}
                        >
                          {imageSrc ? (
                            <img
                              src={imageSrc}
                              alt={productName}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5">
                            <ProductStockBadge product={item.product} />
                          </div>
                          <p className="font-semibold leading-snug text-[#0B0F19]">{productName}</p>
                          <p className="mt-1 text-xs leading-5 text-[#64748B]">
                            {t('checkoutPage.qty', { count: item.quantity })}
                            {weight != null ? ` · ${weight}g` : ''}
                            {carat ? ` · ${carat}` : ''}
                            {item.product.sku ? ` · ${item.product.sku}` : ''}
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

                <div className="checkout-totals mb-5 space-y-2">
                  <span className="checkout-totals__rail" aria-hidden />
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
                {hasUnavailableItems && (
                  <p className="mb-4 text-sm font-medium text-[#B91C1C]">{t('stock.cartBlocked')}</p>
                )}

                <CheckoutTrustBadges variant="compact" className="mb-4 lg:hidden" />

                {step === 3 && isTurnstileConfigured && turnstileMountReady && (
                  <div className="checkout-turnstile-wrap">
                    <TurnstileWidget
                      key="checkout-turnstile"
                      ref={turnstileRef}
                      theme="light"
                      onToken={setTurnstileToken}
                      onExpire={clearTurnstile}
                      onError={clearTurnstile}
                    />
                  </div>
                )}

                <div className="checkout-actions-inline hidden gap-3 lg:flex">
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
                    disabled={placeOrderDisabled}
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

          <aside className="commerce-sidebar commerce-sidebar--checkout hidden lg:block">
            <div className="sticky top-[var(--nav-offset,7.25rem)] space-y-4">
              <div className="checkout-summary-card">
                <h2 className="mb-4 text-base font-bold text-[#0B0F19] sm:text-lg">{t('cartPage.orderSummary')}</h2>
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
                <div className="mt-4 border-t border-black/8 pt-4">
                  <div className="flex justify-between gap-2">
                    <span className="text-base font-bold text-[#0B0F19]">{t('cartPage.total')}</span>
                    <span className="text-xl font-bold tabular-nums text-[#0B0F19] sm:text-2xl">
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

      <div className="checkout-mobile-actions">
        {step === 1 ? (
          <button type="button" onClick={() => setStep(2)} className={cn(checkoutPrimaryBtnClass, 'flex-1')}>
            {t('checkoutPage.continuePayment')}
          </button>
        ) : null}
        {step === 2 ? (
          <>
            <button type="button" onClick={() => setStep(1)} className={checkoutSecondaryBtnClass}>
              {t('checkoutPage.back')}
            </button>
            <button type="button" onClick={() => setStep(3)} className={cn(checkoutPrimaryBtnClass, 'flex-[1.4]')}>
              {t('checkoutPage.reviewOrder')}
            </button>
          </>
        ) : null}
        {step === 3 ? (
          <>
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
              disabled={placeOrderDisabled}
              className={cn(checkoutPrimaryBtnClass, 'flex-[1.4]')}
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
          </>
        ) : null}
      </div>
    </div>
  )
}
