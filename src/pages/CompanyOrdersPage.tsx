import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  ArrowUpRight,
  Banknote,
  Box,
  Check,
  Clock3,
  Coins,
  CreditCard,
  Eye,
  LoaderCircle,
  MapPin,
  PackageCheck,
  Plus,
  RefreshCw,
  RotateCcw,
  Scale,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { KuwaitLocationFields } from '@/components/checkout/KuwaitLocationFields'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { useAuth } from '@/contexts/AuthContext'
import { sanitizeKnetPaymentUrl } from '@/lib/knetPaymentUrl'
import { newestCompanyOrdersFirst } from '@/lib/companyOrders'
import { isStaffRole } from '@/utils/authRedirect'
import { companyDeskApi } from '@/services/companyDeskApi'
import {
  companyCatalogSettings,
  companyOrderLineTitle,
  companyOrdersApi,
  type CompanyOrder,
  type CompanyOrderCatalogProduct,
} from '@/services/companyOrdersApi'

type PageTab = 'new' | 'history'
type HistoryFilter = 'all' | 'pending_review' | 'awaiting_payment' | 'paid' | 'rejected'
type Selection = { weightOptionId: string; quantity: number }
type FieldErrors = Partial<Record<'lines' | 'governorate' | 'city' | 'address', string>>

const COPY = {
  en: {
    eyebrow: 'Approved merchant procurement',
    title: 'Wholesale gold requests',
    subtitle: 'Choose Hub-supplied bar or coin designs, set weights and quantities, then submit for review. KNET payment opens only after approval.',
    newRequest: 'New request',
    history: 'Order history',
    catalogTitle: 'Bars and coins',
    catalogHint: 'Images, designs and available weights come directly from the Gold Standard catalog.',
    bar: 'Gold bar',
    coin: 'Gold coin',
    purity: 'Purity',
    weight: 'Weight',
    quantity: 'Quantity',
    add: 'Add',
    unavailable: 'No weight options available',
    moq: 'Minimum order',
    selected: 'Selected',
    remaining: '{{grams}} g remaining',
    met: 'Minimum reached',
    indicative: 'Indicative amount',
    indicativeHint: 'For guidance only. The final payable amount is confirmed after Hub review.',
    delivery: 'Delivery address',
    deliveryHint: 'Enter the Kuwait address where an approved order should be delivered.',
    address: 'Street, building and floor',
    postal: 'Postal code (optional)',
    note: 'Company note (optional)',
    notePlaceholder: 'Fulfilment or delivery notes for the review team',
    submit: 'Review request',
    submitting: 'Submitting request',
    confirmTitle: 'Submit this wholesale request?',
    confirmBody: 'After submission, product lines and delivery details cannot be edited. Hub will review the request and confirm the final payable amount.',
    confirmSubmit: 'Submit request',
    cancel: 'Go back',
    submitted: 'Request submitted for review.',
    loadingCatalog: 'Loading wholesale catalog',
    catalogError: 'We could not load the company catalog.',
    retry: 'Try again',
    emptyCatalog: 'No wholesale products are available right now.',
    disabledCatalog: 'Wholesale requests are temporarily unavailable.',
    signInRequired: 'Company access is required',
    signInBody: 'Sign in with an approved company account to submit and review wholesale orders.',
    companySignIn: 'Company sign-in',
    historyTitle: 'Submitted requests',
    historyHint: 'Requests are newest first. Submitted details remain read-only.',
    filters: {
      all: 'All',
      pending_review: 'Under review',
      awaiting_payment: 'Awaiting payment',
      paid: 'Paid',
      rejected: 'Rejected',
    },
    reference: 'Reference',
    date: 'Submitted',
    grams: 'Total weight',
    orderStatus: 'Order status',
    paymentStatus: 'Payment status',
    amount: 'Amount',
    addressLabel: 'Delivery',
    view: 'View details',
    pay: 'Pay with KNET',
    payAgain: 'Pay again',
    paymentRedirect: 'Opening KNET',
    unsafePayment: 'The payment link was not accepted. Please contact Gold Standard.',
    payFailed: 'We could not start KNET payment.',
    historyError: 'We could not load your order history.',
    historyEmpty: 'No orders yet',
    historyEmptyBody: 'Build your first wholesale request from the approved catalog.',
    startRequest: 'Start a request',
    detailTitle: 'Order details',
    detailHint: 'Read-only record for this company request.',
    lines: 'Requested items',
    finalAmount: 'Final payable amount',
    indicativeAmount: 'Indicative request amount',
    companyNote: 'Company note',
    reviewNote: 'Review note',
    paymentReturnSuccess: 'KNET returned successfully. The latest order status is shown below.',
    paymentReturnFailed: 'KNET did not complete the payment. You can retry when the order remains payable.',
    errors: {
      lines: 'Add at least one catalog item.',
      moq: 'The request must reach the configured minimum of {{grams}} g.',
      governorate: 'Select a Kuwait governorate.',
      city: 'Select a city or area.',
      address: 'Enter the street and building details.',
      generic: 'We could not submit the request. Review the details and try again.',
    },
  },
  ar: {
    eyebrow: 'مشتريات التجار المعتمدين',
    title: 'طلبات الذهب بالجملة',
    subtitle: 'اختر تصاميم السبائك أو العملات المعتمدة من لوحة الإدارة، وحدد الأوزان والكميات، ثم أرسل الطلب للمراجعة. يفتح دفع كي نت بعد القبول فقط.',
    newRequest: 'طلب جديد',
    history: 'سجل الطلبات',
    catalogTitle: 'السبائك والعملات',
    catalogHint: 'الصور والتصاميم والأوزان المتاحة تأتي مباشرة من كتالوج جولد ستاندرد.',
    bar: 'سبيكة ذهب',
    coin: 'عملة ذهبية',
    purity: 'النقاوة',
    weight: 'الوزن',
    quantity: 'الكمية',
    add: 'إضافة',
    unavailable: 'لا توجد أوزان متاحة',
    moq: 'الحد الأدنى للطلب',
    selected: 'المحدد',
    remaining: 'متبقي {{grams}} غ',
    met: 'تم بلوغ الحد الأدنى',
    indicative: 'المبلغ الاسترشادي',
    indicativeHint: 'للاسترشاد فقط. يؤكد فريق المراجعة المبلغ النهائي المستحق بعد قبول الطلب.',
    delivery: 'عنوان التسليم',
    deliveryHint: 'أدخل عنوان الكويت الذي سيُسلّم إليه الطلب بعد اعتماده.',
    address: 'الشارع والمبنى والطابق',
    postal: 'الرمز البريدي (اختياري)',
    note: 'ملاحظة الشركة (اختياري)',
    notePlaceholder: 'ملاحظات التجهيز أو التسليم لفريق المراجعة',
    submit: 'مراجعة الطلب',
    submitting: 'جارٍ إرسال الطلب',
    confirmTitle: 'هل تريد إرسال طلب الجملة؟',
    confirmBody: 'بعد الإرسال لا يمكن تعديل المنتجات أو عنوان التسليم. يراجع الفريق الطلب ويؤكد المبلغ النهائي المستحق.',
    confirmSubmit: 'إرسال الطلب',
    cancel: 'رجوع',
    submitted: 'تم إرسال الطلب للمراجعة.',
    loadingCatalog: 'جارٍ تحميل كتالوج الجملة',
    catalogError: 'تعذّر تحميل كتالوج الشركات.',
    retry: 'إعادة المحاولة',
    emptyCatalog: 'لا توجد منتجات جملة متاحة حالياً.',
    disabledCatalog: 'طلبات الجملة غير متاحة مؤقتاً.',
    signInRequired: 'يتطلب وصول الشركات',
    signInBody: 'سجّل الدخول بحساب شركة معتمد لإرسال طلبات الجملة ومراجعتها.',
    companySignIn: 'دخول الشركات',
    historyTitle: 'الطلبات المرسلة',
    historyHint: 'تظهر الطلبات من الأحدث. تبقى التفاصيل المرسلة للقراءة فقط.',
    filters: {
      all: 'الكل',
      pending_review: 'قيد المراجعة',
      awaiting_payment: 'بانتظار الدفع',
      paid: 'مدفوع',
      rejected: 'مرفوض',
    },
    reference: 'المرجع',
    date: 'تاريخ الإرسال',
    grams: 'الوزن الإجمالي',
    orderStatus: 'حالة الطلب',
    paymentStatus: 'حالة الدفع',
    amount: 'المبلغ',
    addressLabel: 'التسليم',
    view: 'عرض التفاصيل',
    pay: 'الدفع عبر كي نت',
    payAgain: 'إعادة الدفع',
    paymentRedirect: 'جارٍ فتح كي نت',
    unsafePayment: 'لم يتم قبول رابط الدفع. تواصل مع جولد ستاندرد.',
    payFailed: 'تعذّر بدء الدفع عبر كي نت.',
    historyError: 'تعذّر تحميل سجل الطلبات.',
    historyEmpty: 'لا توجد طلبات بعد',
    historyEmptyBody: 'أنشئ أول طلب جملة من الكتالوج المعتمد.',
    startRequest: 'ابدأ طلباً',
    detailTitle: 'تفاصيل الطلب',
    detailHint: 'سجل للقراءة فقط خاص بطلب هذه الشركة.',
    lines: 'المنتجات المطلوبة',
    finalAmount: 'المبلغ النهائي المستحق',
    indicativeAmount: 'المبلغ الاسترشادي للطلب',
    companyNote: 'ملاحظة الشركة',
    reviewNote: 'ملاحظة المراجعة',
    paymentReturnSuccess: 'تمت العودة من كي نت بنجاح. تظهر أحدث حالة للطلب أدناه.',
    paymentReturnFailed: 'لم يكتمل الدفع عبر كي نت. يمكنك إعادة المحاولة إذا بقي الطلب قابلاً للدفع.',
    errors: {
      lines: 'أضف منتجاً واحداً على الأقل من الكتالوج.',
      moq: 'يجب أن يبلغ الطلب الحد الأدنى المحدد وهو {{grams}} غ.',
      governorate: 'اختر محافظة في الكويت.',
      city: 'اختر المدينة أو المنطقة.',
      address: 'أدخل تفاصيل الشارع والمبنى.',
      generic: 'تعذّر إرسال الطلب. راجع التفاصيل وحاول مرة أخرى.',
    },
  },
} as const

const STATUS_COPY = {
  en: {
    pending_review: 'Under review',
    awaiting_payment: 'Awaiting payment',
    paid: 'Paid',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
    payment_failed: 'Payment failed',
    none: 'Not due',
    unpaid: 'Pending KNET',
    failed: 'Failed',
  },
  ar: {
    pending_review: 'قيد المراجعة',
    awaiting_payment: 'بانتظار الدفع',
    paid: 'مدفوع',
    rejected: 'مرفوض',
    cancelled: 'ملغى',
    payment_failed: 'فشل الدفع',
    none: 'غير مستحق',
    unpaid: 'بانتظار كي نت',
    failed: 'فشل',
  },
} as const

function asNumber(value: string | number | null | undefined): number {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatKwd(value: string | number | null | undefined, locale: string): string {
  if (value == null || value === '') return '—'
  return `${asNumber(value).toLocaleString(locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} ${locale === 'ar' ? 'د.ك' : 'KWD'}`
}

function isPayable(order: CompanyOrder): boolean {
  return order.status === 'awaiting_payment' || order.status === 'payment_failed'
}

function statusTone(status: string): string {
  if (status === 'paid') return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (status === 'rejected' || status === 'payment_failed' || status === 'failed') {
    return 'border-red-200 bg-red-50 text-red-800'
  }
  if (status === 'awaiting_payment' || status === 'unpaid') {
    return 'border-amber-200 bg-amber-50 text-amber-900'
  }
  return 'border-slate-200 bg-slate-50 text-slate-700'
}

function apiErrorMessage(error: unknown, fallback: string): string {
  if (!error || typeof error !== 'object' || !('response' in error)) return fallback
  const data = (error as { response?: { data?: unknown } }).response?.data
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const value = record.detail ?? record.error ?? record.non_field_errors
    if (typeof value === 'string') return value
    if (Array.isArray(value) && typeof value[0] === 'string') return value[0]
  }
  return fallback
}

function ProductCard({
  product,
  selection,
  onChange,
  locale,
  copy,
}: {
  product: CompanyOrderCatalogProduct
  selection: Selection
  onChange: (next: Selection) => void
  locale: 'ar' | 'en'
  copy: typeof COPY.en | typeof COPY.ar
}) {
  const options = product.weight_options ?? []
  const activeOption = options.find((option) => option.id === selection.weightOptionId) ?? options[0]
  const minQuantity = Math.max(1, activeOption?.min_quantity ?? 1)
  const maxQuantity = activeOption?.max_quantity ?? 999
  const imageUrl = product.image_url || product.image
  const name = locale === 'ar' ? product.name_ar || product.name_en : product.name_en || product.name_ar

  useEffect(() => {
    if (!activeOption || selection.weightOptionId) return
    onChange({ weightOptionId: activeOption.id, quantity: 0 })
  }, [activeOption, onChange, selection.weightOptionId])

  return (
    <article className="min-w-0 overflow-hidden rounded-2xl border border-black/[0.07] bg-white">
      <div className="aspect-[4/3] overflow-hidden bg-[#ECEDE8]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            width={640}
            height={480}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-200 motion-reduce:transition-none hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[#64748B]">
            {product.kind === 'coin' ? <Coins className="h-10 w-10" /> : <Box className="h-10 w-10" />}
          </div>
        )}
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#3F6F00]">
              {product.kind === 'coin' ? copy.coin : copy.bar}
            </p>
            <h3 className="mt-1 text-lg font-bold leading-snug text-[#0B0F19]">{name}</h3>
          </div>
          {product.purity ? (
            <span className="shrink-0 rounded-lg border border-black/[0.07] bg-[#F4F5F1] px-2 py-1 text-xs font-semibold text-[#475569]">
              {copy.purity} {product.purity}
            </span>
          ) : null}
        </div>

        {options.length ? (
          <>
            <fieldset className="mt-4">
              <legend className="text-xs font-semibold text-[#64748B]">{copy.weight}</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {options.map((option) => {
                  const active = option.id === activeOption?.id
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        onChange({
                          weightOptionId: option.id,
                          quantity: selection.quantity > 0
                            ? Math.max(option.min_quantity ?? 1, selection.quantity)
                            : 0,
                        })
                      }
                      className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307] focus-visible:ring-offset-2 motion-reduce:transition-none ${
                        active
                          ? 'border-[#3F6F00] bg-[#ECFCCB] text-[#2F5700]'
                          : 'border-black/10 bg-white text-[#475569] hover:border-[#85E307]'
                      }`}
                    >
                      {asNumber(option.weight_grams).toLocaleString(locale)} g
                    </button>
                  )
                })}
              </div>
            </fieldset>
            <div className="mt-4 flex items-end justify-between gap-3">
              <label className="min-w-0 flex-1">
                <span className="mb-1.5 block text-xs font-semibold text-[#64748B]">{copy.quantity}</span>
                <input
                  type="number"
                  min={0}
                  max={maxQuantity}
                  step={1}
                  value={selection.quantity}
                  onChange={(event) => {
                    const quantity = Math.max(0, Math.min(maxQuantity, Math.floor(Number(event.target.value) || 0)))
                    onChange({ weightOptionId: activeOption?.id ?? '', quantity })
                  }}
                  className="min-h-11 w-full rounded-xl border border-black/10 bg-[#F9FAF8] px-3 text-sm font-semibold tabular-nums text-[#0B0F19] outline-none transition-colors focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25"
                />
              </label>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    weightOptionId: activeOption?.id ?? '',
                    quantity: selection.quantity > 0 ? selection.quantity : minQuantity,
                  })
                }
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-black/10 bg-[#0B0F19] px-4 py-2 text-sm font-bold text-white transition-colors duration-200 hover:bg-[#202737] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307] focus-visible:ring-offset-2"
              >
                {selection.quantity > 0 ? <Check className="h-4 w-4 text-[#85E307]" /> : <Plus className="h-4 w-4" />}
                {copy.add}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-4 rounded-xl bg-[#F4F5F1] px-3 py-3 text-sm text-[#64748B]">{copy.unavailable}</p>
        )}
      </div>
    </article>
  )
}

export default function CompanyOrdersPage() {
  const { i18n } = useTranslation()
  const locale: 'ar' | 'en' = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const copy = COPY[locale]
  const statusCopy = STATUS_COPY[locale] as Record<string, string>
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const staff = isStaffRole(user?.role)
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const deepLinkOrderId = searchParams.get('order')
  const knetStatus = searchParams.get('knet_status')
  const [tab, setTab] = useState<PageTab>(deepLinkOrderId ? 'history' : 'new')
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(deepLinkOrderId)
  const [selections, setSelections] = useState<Record<string, Selection>>({})
  const [governorate, setGovernorate] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [postal, setPostal] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)

  const accessQuery = useQuery({
    queryKey: ['companyDeskAccess', user?.id ?? 'anon', user?.email ?? ''],
    queryFn: companyDeskApi.getAccess,
    enabled: !authLoading && isAuthenticated && !staff,
    staleTime: 30_000,
    retry: 1,
  })
  const hasAccess = staff || !!accessQuery.data?.has_access
  const gateReady = !authLoading && (!isAuthenticated || staff || !accessQuery.isLoading)

  const catalogQuery = useQuery({
    queryKey: ['companyOrderCatalog'],
    queryFn: companyOrdersApi.getCatalog,
    enabled: hasAccess,
    staleTime: 30_000,
  })
  const historyQuery = useQuery({
    queryKey: ['companyOrdersMine'],
    queryFn: companyOrdersApi.listMine,
    enabled: hasAccess && (tab === 'history' || !!selectedOrderId),
    staleTime: 10_000,
  })
  const detailQuery = useQuery({
    queryKey: ['companyOrderMine', selectedOrderId],
    queryFn: () => companyOrdersApi.getMine(selectedOrderId as string),
    enabled: hasAccess && !!selectedOrderId,
    staleTime: 5_000,
  })

  useEffect(() => {
    if (!deepLinkOrderId) return
    setTab('history')
    setSelectedOrderId(deepLinkOrderId)
  }, [deepLinkOrderId])

  useEffect(() => {
    if (!knetStatus || !hasAccess) return
    let cancelled = false
    const run = async () => {
      if (deepLinkOrderId) {
        try {
          await companyOrdersApi.verify(deepLinkOrderId)
        } catch {
          // Soft verify: list/detail refresh still shows latest status.
        }
      }
      if (cancelled) return
      void queryClient.invalidateQueries({ queryKey: ['companyOrdersMine'] })
      if (deepLinkOrderId) {
        void queryClient.invalidateQueries({ queryKey: ['companyOrderMine', deepLinkOrderId] })
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [deepLinkOrderId, hasAccess, knetStatus, queryClient])

  const catalogSettings = companyCatalogSettings(catalogQuery.data)

  const selectedLines = useMemo(() => {
    const products = catalogQuery.data?.products ?? []
    return products.flatMap((product) => {
      const selection = selections[product.id]
      if (!selection || selection.quantity <= 0) return []
      const option = product.weight_options.find((item) => item.id === selection.weightOptionId)
      if (!option) return []
      return [{ product, option, quantity: selection.quantity }]
    })
  }, [catalogQuery.data?.products, selections])

  const totalGrams = selectedLines.reduce(
    (sum, line) => sum + asNumber(line.option.weight_grams) * line.quantity,
    0,
  )
  const minOrderGrams = asNumber(catalogSettings.min_order_grams)
  const moqPercent = minOrderGrams > 0 ? Math.min(100, (totalGrams / minOrderGrams) * 100) : 100
  const indicativeTotal = selectedLines.reduce((sum, line) => {
    const unit = line.option.indicative_unit_amount_kwd ?? line.option.indicative_amount_kwd
    return sum + asNumber(unit) * line.quantity
  }, 0)
  const hasIndicative = selectedLines.some(
    (line) =>
      line.option.indicative_unit_amount_kwd != null ||
      line.option.indicative_amount_kwd != null,
  )

  const validate = (): boolean => {
    const next: FieldErrors = {}
    if (!selectedLines.length) next.lines = copy.errors.lines
    else if (minOrderGrams > 0 && totalGrams < minOrderGrams) {
      next.lines = copy.errors.moq.replace('{{grams}}', minOrderGrams.toLocaleString(locale))
    }
    if (!governorate.trim()) next.governorate = copy.errors.governorate
    if (!city.trim()) next.city = copy.errors.city
    if (address.trim().length < 4) next.address = copy.errors.address
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const createMutation = useMutation({
    mutationFn: () =>
      companyOrdersApi.create({
        lines: selectedLines.map(({ product, option, quantity }) => ({
          product_id: product.id,
          weight_option_id: option.id,
          quantity,
        })),
        delivery_governorate: governorate.trim(),
        delivery_city: city.trim(),
        delivery_address: address.trim(),
        ...(postal.trim() ? { delivery_postal: postal.trim() } : {}),
        ...(note.trim() ? { company_note: note.trim() } : {}),
      }),
    onSuccess: (order) => {
      toast.success(copy.submitted)
      setConfirmOpen(false)
      setSelections({})
      setGovernorate('')
      setCity('')
      setAddress('')
      setPostal('')
      setNote('')
      setErrors({})
      setTab('history')
      setSelectedOrderId(order.id)
      setSearchParams({ order: order.id }, { replace: true })
      void queryClient.invalidateQueries({ queryKey: ['companyOrdersMine'] })
    },
  })

  const sortedOrders = useMemo(
    () => newestCompanyOrdersFirst(historyQuery.data ?? []),
    [historyQuery.data],
  )
  const filteredOrders = filter === 'all'
    ? sortedOrders
    : sortedOrders.filter((order) => order.status === filter)

  const openOrder = (id: string) => {
    setTab('history')
    setSelectedOrderId(id)
    const next = new URLSearchParams(searchParams)
    next.set('order', id)
    setSearchParams(next, { replace: true })
  }

  const closeOrder = () => {
    setSelectedOrderId(null)
    const next = new URLSearchParams(searchParams)
    next.delete('order')
    next.delete('knet_status')
    setSearchParams(next, { replace: true })
  }

  const startPayment = async (order: CompanyOrder) => {
    if (payingId) return
    setPayingId(order.id)
    try {
      const result = await companyOrdersApi.pay(order.id)
      const safeUrl = sanitizeKnetPaymentUrl(result.payment_url)
      if (!safeUrl) {
        toast.error(copy.unsafePayment)
        return
      }
      window.location.assign(safeUrl)
    } catch (error) {
      toast.error(apiErrorMessage(error, copy.payFailed))
    } finally {
      setPayingId(null)
    }
  }

  if (!gateReady) {
    return <AppLoadingScreen message={copy.loadingCatalog} className="min-h-screen" />
  }

  if (!isAuthenticated || !hasAccess) {
    return (
      <div className="min-h-[70dvh] bg-[#F4F5F1] px-4 py-16">
        <div className="mx-auto max-w-lg rounded-2xl border border-black/[0.07] bg-white p-7 text-center sm:p-9">
          <ShieldCheck className="mx-auto h-9 w-9 text-[#3F6F00]" aria-hidden />
          <h1 className="mt-4 text-2xl font-bold text-[#0B0F19]">{copy.signInRequired}</h1>
          <p className="mt-3 text-sm leading-6 text-[#64748B]">{copy.signInBody}</p>
          <Link
            to={isAuthenticated ? '/gs-kyc' : '/company-login'}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#0B0F19] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#202737] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307] focus-visible:ring-offset-2"
          >
            {copy.companySignIn}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[100dvh] min-w-0 overflow-x-clip bg-[#F4F5F1] text-[#0B0F19]">
      <header className="border-b border-black/[0.07] bg-[#0B0F19] text-white">
        <div className="page-shell py-9 sm:py-12">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#85E307]">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            {copy.eyebrow}
          </p>
          <div className="mt-3 grid gap-5 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{copy.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65 sm:text-base">{copy.subtitle}</p>
            </div>
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10">
              {[
                [PackageCheck, locale === 'ar' ? 'مراجعة الفريق' : 'Hub review'],
                [CreditCard, 'KNET'],
                [MapPin, locale === 'ar' ? 'تسليم الكويت' : 'Kuwait delivery'],
              ].map(([Icon, label]) => {
                const FeatureIcon = Icon as typeof PackageCheck
                return (
                  <div key={String(label)} className="bg-[#121827] px-2 py-3 text-center">
                    <FeatureIcon className="mx-auto h-4 w-4 text-[#85E307]" aria-hidden />
                    <p className="mt-1.5 text-[10px] font-semibold text-white/70 sm:text-xs">{String(label)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </header>

      <main className="page-shell py-7 sm:py-10">
        {knetStatus ? (
          <div
            role="status"
            className={`mb-5 rounded-xl border px-4 py-3 text-sm font-medium ${
              ['success', 'paid', 'captured'].includes(knetStatus.toLowerCase())
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-amber-200 bg-amber-50 text-amber-900'
            }`}
          >
            {['success', 'paid', 'captured'].includes(knetStatus.toLowerCase())
              ? copy.paymentReturnSuccess
              : copy.paymentReturnFailed}
          </div>
        ) : null}

        <div className="inline-grid min-h-12 w-full grid-cols-2 rounded-xl border border-black/[0.08] bg-white p-1 sm:w-auto sm:min-w-[24rem]" role="tablist">
          {([
            ['new', copy.newRequest],
            ['history', copy.history],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => {
                setTab(value)
                if (value === 'new') closeOrder()
              }}
              className={`min-h-11 rounded-lg px-4 text-sm font-bold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307] motion-reduce:transition-none ${
                tab === value ? 'bg-[#0B0F19] text-white' : 'text-[#64748B] hover:bg-[#F4F5F1]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'new' ? (
          <section className="mt-7" aria-labelledby="company-order-catalog-title">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 id="company-order-catalog-title" className="text-2xl font-bold tracking-tight">{copy.catalogTitle}</h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-[#64748B]">{copy.catalogHint}</p>
              </div>
            </div>

            {catalogQuery.isLoading ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                {[0, 1, 2].map((item) => (
                  <div key={item} className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white">
                    <div className="aspect-[4/3] animate-pulse bg-black/[0.06]" />
                    <div className="space-y-3 p-5">
                      <div className="h-4 w-1/3 animate-pulse rounded bg-black/[0.06]" />
                      <div className="h-6 w-2/3 animate-pulse rounded bg-black/[0.06]" />
                      <div className="h-11 animate-pulse rounded-xl bg-black/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : catalogQuery.isError ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-900">
                <AlertCircle className="mx-auto h-7 w-7" aria-hidden />
                <p className="mt-2 text-sm font-semibold">{copy.catalogError}</p>
                <button
                  type="button"
                  onClick={() => void catalogQuery.refetch()}
                  className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                >
                  <RefreshCw className="h-4 w-4" aria-hidden />
                  {copy.retry}
                </button>
              </div>
            ) : catalogSettings.is_enabled === false ? (
              <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center text-sm font-semibold text-amber-900">{copy.disabledCatalog}</p>
            ) : !catalogQuery.data?.products?.length ? (
              <p className="mt-6 rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center text-sm text-[#64748B]">{copy.emptyCatalog}</p>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {catalogQuery.data.products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    selection={selections[product.id] ?? { weightOptionId: '', quantity: 0 }}
                    onChange={(next) => setSelections((current) => ({ ...current, [product.id]: next }))}
                    locale={locale}
                    copy={copy}
                  />
                ))}
              </div>
            )}

            {errors.lines ? (
              <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-red-700" role="alert">
                <AlertCircle className="h-4 w-4 shrink-0" aria-hidden />
                {errors.lines}
              </p>
            ) : null}

            <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
              <div className="rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold">{copy.moq}</p>
                    <p className="mt-1 text-xs text-[#64748B]">
                      {copy.selected}: <span className="font-semibold tabular-nums text-[#0B0F19]">{totalGrams.toLocaleString(locale)} g</span>
                    </p>
                  </div>
                  <p className="font-mono text-sm font-bold tabular-nums text-[#3F6F00]">
                    {minOrderGrams.toLocaleString(locale)} g
                  </p>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-black/[0.07]">
                  <div
                    className="h-full rounded-full bg-[#85E307] transition-transform duration-200 motion-reduce:transition-none"
                    style={{ transform: `scaleX(${moqPercent / 100})`, transformOrigin: locale === 'ar' ? 'right' : 'left' }}
                  />
                </div>
                <p className="mt-2 text-xs font-medium text-[#64748B]">
                  {totalGrams >= minOrderGrams
                    ? copy.met
                    : copy.remaining.replace('{{grams}}', Math.max(0, minOrderGrams - totalGrams).toLocaleString(locale))}
                </p>
                {hasIndicative ? (
                  <div className="mt-5 border-t border-black/[0.07] pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex items-center gap-2 text-sm font-semibold text-[#475569]">
                        <Banknote className="h-4 w-4 text-[#3F6F00]" aria-hidden />
                        {copy.indicative}
                      </span>
                      <strong className="font-mono text-lg tabular-nums">{formatKwd(indicativeTotal, locale)}</strong>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-[#64748B]">{copy.indicativeHint}</p>
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-black/[0.07] bg-[#0B0F19] p-5 text-white sm:p-6">
                <Scale className="h-5 w-5 text-[#85E307]" aria-hidden />
                <p className="mt-4 text-sm font-bold">{copy.selected}</p>
                <p className="mt-1 font-mono text-3xl font-bold tabular-nums">{totalGrams.toLocaleString(locale)} g</p>
                <p className="mt-3 text-xs leading-5 text-white/55">{copy.indicativeHint}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-black/[0.07] bg-white p-5 sm:p-6">
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <MapPin className="h-5 w-5 text-[#3F6F00]" aria-hidden />
                {copy.delivery}
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">{copy.deliveryHint}</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="grid gap-4">
                  <KuwaitLocationFields
                    governorate={governorate}
                    city={city}
                    onGovernorateChange={(value) => {
                      setGovernorate(value)
                      setErrors((current) => ({ ...current, governorate: undefined, city: undefined }))
                    }}
                    onCityChange={(value) => {
                      setCity(value)
                      setErrors((current) => ({ ...current, city: undefined }))
                    }}
                  />
                  {errors.governorate || errors.city ? (
                    <p className="mt-2 text-xs font-semibold text-red-700" role="alert">{errors.governorate || errors.city}</p>
                  ) : null}
                </div>
                <div className="grid gap-4">
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold tracking-wide text-[#64748B]">{copy.address}</span>
                    <input
                      value={address}
                      onChange={(event) => {
                        setAddress(event.target.value)
                        setErrors((current) => ({ ...current, address: undefined }))
                      }}
                      autoComplete="street-address"
                      maxLength={500}
                      className="min-h-12 w-full rounded-xl border border-[#85E307]/35 bg-white px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/20"
                      aria-invalid={!!errors.address}
                    />
                    {errors.address ? <p className="mt-1.5 text-xs font-semibold text-red-700" role="alert">{errors.address}</p> : null}
                  </label>
                  <label>
                    <span className="mb-1.5 block text-xs font-semibold tracking-wide text-[#64748B]">{copy.postal}</span>
                    <input
                      value={postal}
                      onChange={(event) => setPostal(event.target.value)}
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={12}
                      className="min-h-12 w-full rounded-xl border border-black/10 bg-[#F9FAF8] px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/20"
                    />
                  </label>
                </div>
              </div>
              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-semibold tracking-wide text-[#64748B]">{copy.note}</span>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder={copy.notePlaceholder}
                  maxLength={500}
                  rows={3}
                  className="w-full resize-y rounded-xl border border-black/10 bg-[#F9FAF8] px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/20"
                />
              </label>
            </div>

            {createMutation.isError ? (
              <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800" role="alert">
                {apiErrorMessage(createMutation.error, copy.errors.generic)}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={catalogSettings.is_enabled === false || catalogQuery.isLoading}
                onClick={() => {
                  if (validate()) setConfirmOpen(true)
                }}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#85E307] px-6 py-3 text-sm font-bold text-[#0B0F19] transition-colors duration-200 hover:bg-[#9AF01A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0F19] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                <PackageCheck className="h-4 w-4" aria-hidden />
                {copy.submit}
              </button>
            </div>
          </section>
        ) : (
          <section className="mt-7" aria-labelledby="company-order-history-title">
            <h2 id="company-order-history-title" className="text-2xl font-bold tracking-tight">{copy.historyTitle}</h2>
            <p className="mt-1 text-sm leading-6 text-[#64748B]">{copy.historyHint}</p>
            <div className="mt-5 flex max-w-full gap-2 overflow-x-auto pb-2" role="group" aria-label={copy.history}>
              {(Object.keys(copy.filters) as HistoryFilter[]).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={filter === value}
                  onClick={() => setFilter(value)}
                  className={`min-h-11 shrink-0 rounded-xl border px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307] ${
                    filter === value
                      ? 'border-[#0B0F19] bg-[#0B0F19] text-white'
                      : 'border-black/10 bg-white text-[#64748B] hover:border-[#85E307]'
                  }`}
                >
                  {copy.filters[value]}
                </button>
              ))}
            </div>

            {historyQuery.isLoading ? (
              <div className="mt-5 space-y-3" aria-busy="true">
                {[0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-black/[0.06]" />)}
              </div>
            ) : historyQuery.isError ? (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-900">
                <p className="text-sm font-semibold">{copy.historyError}</p>
                <button type="button" onClick={() => void historyQuery.refetch()} className="mt-4 min-h-11 rounded-xl border border-red-300 bg-white px-4 text-sm font-bold">{copy.retry}</button>
              </div>
            ) : !filteredOrders.length ? (
              <div className="mt-5 rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center">
                <Clock3 className="mx-auto h-8 w-8 text-[#64748B]" aria-hidden />
                <h3 className="mt-3 text-lg font-bold">{copy.historyEmpty}</h3>
                <p className="mt-1 text-sm text-[#64748B]">{copy.historyEmptyBody}</p>
                <button type="button" onClick={() => setTab('new')} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0B0F19] px-5 text-sm font-bold text-white">
                  <Plus className="h-4 w-4" aria-hidden />
                  {copy.startRequest}
                </button>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {filteredOrders.map((order) => {
                  const amount = order.final_amount_kwd ?? order.indicative_amount_kwd
                  return (
                    <article key={order.id} className="rounded-2xl border border-black/[0.07] bg-white p-4 sm:p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">{copy.reference}</p>
                            <p className="mt-1 font-mono text-sm font-bold tabular-nums">{order.reference}</p>
                            <p className="mt-1 text-xs text-[#64748B]">{new Date(order.created_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">{copy.grams}</p>
                            <p className="mt-1 font-mono text-lg font-bold tabular-nums">{asNumber(order.total_grams).toLocaleString(locale)} g</p>
                            <p className="mt-1 font-mono text-xs tabular-nums text-[#64748B]">{formatKwd(amount, locale)}</p>
                          </div>
                          <div className="flex flex-wrap content-start gap-2">
                            <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${statusTone(order.status)}`}>{statusCopy[order.status] ?? order.status}</span>
                            <span className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${statusTone(order.payment_status)}`}>{statusCopy[order.payment_status] ?? order.payment_status}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">{copy.addressLabel}</p>
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#475569]">{order.delivery_city}, {order.delivery_governorate} · {order.delivery_address}</p>
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                          <button type="button" onClick={() => openOrder(order.id)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-black/10 px-4 text-sm font-bold text-[#0B0F19] transition-colors hover:bg-[#F4F5F1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]">
                            <Eye className="h-4 w-4" aria-hidden />
                            {copy.view}
                          </button>
                          {isPayable(order) ? (
                            <button type="button" disabled={!!payingId} onClick={() => void startPayment(order)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#85E307] px-4 text-sm font-bold text-[#0B0F19] transition-colors hover:bg-[#9AF01A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0F19] disabled:opacity-60">
                              {payingId === order.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : order.status === 'payment_failed' ? <RotateCcw className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                              {payingId === order.id ? copy.paymentRedirect : order.status === 'payment_failed' ? copy.payAgain : copy.pay}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>
        )}
      </main>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-lg border-black/10 bg-white text-[#0B0F19]">
          <DialogHeader className="text-start">
            <DialogTitle>{copy.confirmTitle}</DialogTitle>
            <DialogDescription className="leading-6 text-[#64748B]">{copy.confirmBody}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-[#F4F5F1] p-4">
            <div>
              <p className="text-xs font-semibold text-[#64748B]">{copy.grams}</p>
              <p className="mt-1 font-mono text-lg font-bold tabular-nums">{totalGrams.toLocaleString(locale)} g</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#64748B]">{copy.delivery}</p>
              <p className="mt-1 text-sm font-bold">{city}, {governorate}</p>
            </div>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setConfirmOpen(false)} className="min-h-11 rounded-xl border border-black/10 px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]">{copy.cancel}</button>
            <button type="button" disabled={createMutation.isPending} onClick={() => createMutation.mutate()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#85E307] px-5 text-sm font-bold text-[#0B0F19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0F19] disabled:opacity-60">
              {createMutation.isPending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <PackageCheck className="h-4 w-4" />}
              {createMutation.isPending ? copy.submitting : copy.confirmSubmit}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedOrderId} onOpenChange={(open) => { if (!open) closeOrder() }}>
        <DialogContent className="max-h-[88dvh] max-w-2xl overflow-y-auto border-black/10 bg-white p-0 text-[#0B0F19]">
          <DialogHeader className="border-b border-black/[0.07] p-5 pe-14 text-start sm:p-6 sm:pe-14">
            <DialogTitle>{copy.detailTitle}</DialogTitle>
            <DialogDescription>{copy.detailHint}</DialogDescription>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <div className="flex min-h-56 items-center justify-center" aria-busy="true">
              <LoaderCircle className="h-7 w-7 animate-spin text-[#3F6F00]" />
            </div>
          ) : detailQuery.isError || !detailQuery.data ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-red-800">{copy.historyError}</p>
              <button type="button" onClick={() => void detailQuery.refetch()} className="mt-4 min-h-11 rounded-xl border border-black/10 px-4 text-sm font-bold">{copy.retry}</button>
            </div>
          ) : (
            <OrderDetail
              order={detailQuery.data}
              locale={locale}
              copy={copy}
              statusCopy={statusCopy}
              paying={payingId === detailQuery.data.id}
              onPay={() => void startPayment(detailQuery.data as CompanyOrder)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function OrderDetail({
  order,
  locale,
  copy,
  statusCopy,
  paying,
  onPay,
}: {
  order: CompanyOrder
  locale: 'ar' | 'en'
  copy: typeof COPY.en | typeof COPY.ar
  statusCopy: Record<string, string>
  paying: boolean
  onPay: () => void
}) {
  return (
    <div>
      <div className="grid gap-px border-b border-black/[0.07] bg-black/[0.07] sm:grid-cols-2">
        {[
          [copy.reference, order.reference],
          [copy.date, new Date(order.created_at).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })],
          [copy.orderStatus, statusCopy[order.status] ?? order.status],
          [copy.paymentStatus, statusCopy[order.payment_status] ?? order.payment_status],
        ].map(([label, value]) => (
          <div key={label} className="bg-white px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold text-[#64748B]">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-6 p-5 sm:p-6">
        <section>
          <h3 className="text-sm font-bold">{copy.lines}</h3>
          <div className="mt-3 divide-y divide-black/[0.07] rounded-xl border border-black/[0.07]">
            {(order.lines ?? []).map((line, index) => (
              <div key={line.id ?? `${line.product_id ?? 'line'}-${index}`} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold">{companyOrderLineTitle(line, locale)}</p>
                  <p className="mt-1 text-xs text-[#64748B]">{asNumber(line.weight_grams).toLocaleString(locale)} g × {line.quantity.toLocaleString(locale)}</p>
                </div>
                <p className="shrink-0 font-mono text-sm font-bold tabular-nums">{asNumber(line.line_grams || asNumber(line.weight_grams) * line.quantity).toLocaleString(locale)} g</p>
              </div>
            ))}
          </div>
        </section>
        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[#F4F5F1] p-4">
            <p className="text-xs font-semibold text-[#64748B]">{copy.grams}</p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums">{asNumber(order.total_grams).toLocaleString(locale)} g</p>
          </div>
          <div className="rounded-xl bg-[#F4F5F1] p-4">
            <p className="text-xs font-semibold text-[#64748B]">{order.final_amount_kwd != null ? copy.finalAmount : copy.indicativeAmount}</p>
            <p className="mt-1 font-mono text-xl font-bold tabular-nums">{formatKwd(order.final_amount_kwd ?? order.indicative_amount_kwd, locale)}</p>
          </div>
        </section>
        <section>
          <h3 className="flex items-center gap-2 text-sm font-bold"><MapPin className="h-4 w-4 text-[#3F6F00]" />{copy.delivery}</h3>
          <address className="mt-2 not-italic text-sm leading-6 text-[#475569]">
            {order.delivery_address}<br />
            {order.delivery_city}, {order.delivery_governorate}
            {order.delivery_postal ? <><br />{order.delivery_postal}</> : null}
          </address>
        </section>
        {order.company_note ? <section><h3 className="text-sm font-bold">{copy.companyNote}</h3><p className="mt-2 text-sm leading-6 text-[#475569]">{order.company_note}</p></section> : null}
        {order.admin_notes ? <section><h3 className="text-sm font-bold">{copy.reviewNote}</h3><p className="mt-2 text-sm leading-6 text-[#475569]">{order.admin_notes}</p></section> : null}
        {isPayable(order) ? (
          <button type="button" disabled={paying} onClick={onPay} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#85E307] px-5 text-sm font-bold text-[#0B0F19] transition-colors hover:bg-[#9AF01A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B0F19] disabled:opacity-60">
            {paying ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowUpRight className="h-4 w-4" />}
            {paying ? copy.paymentRedirect : order.status === 'payment_failed' ? copy.payAgain : copy.pay}
          </button>
        ) : null}
      </div>
    </div>
  )
}
