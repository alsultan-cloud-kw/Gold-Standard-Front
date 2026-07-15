import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  BadgeCheck,
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Scale,
  Gem,
  Hash,
  Calendar,
  Tag,
  Search,
  QrCode,
} from 'lucide-react'
import { productsApi, type ProductAuthenticityResponse } from '../services/api'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { ProductAuthenticityAssurance } from '@/components/products/ProductAuthenticityAssurance'

function formatWeight(value: string | number | null | undefined, locale?: string) {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return '—'
  return new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 3 }).format(n)
}

function DetailRow({
  icon: Icon,
  label,
  value,
  rtl,
}: {
  icon: typeof Hash
  label: string
  value: string
  rtl?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-stone-200/80 py-3.5 last:border-b-0">
      <div className={`flex items-center gap-2 text-stone-500 ${rtl ? 'flex-row-reverse' : ''}`}>
        <Icon className="h-4 w-4 shrink-0 text-[#3F6F00]" aria-hidden />
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-sm font-semibold text-stone-900 ${rtl ? 'text-left' : 'text-right'}`}>{value}</span>
    </div>
  )
}

function VerifyCodeForm({
  initialCode = '',
  onSubmit,
  rtl,
  autoFocus,
  compact,
}: {
  initialCode?: string
  onSubmit: (code: string) => void
  rtl?: boolean
  autoFocus?: boolean
  compact?: boolean
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initialCode)

  useEffect(() => {
    setValue(initialCode)
  }, [initialCode])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next = value.trim()
    if (!next) return
    onSubmit(next)
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? 'mt-5' : 'mt-6'} dir={rtl ? 'rtl' : 'ltr'}>
      <label htmlFor="verify-code-input" className="mb-2 block text-start text-sm font-semibold text-stone-800">
        {t('authenticity.codeLabel')}
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <div className="relative min-w-0 flex-1">
          <QrCode
            className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 start-3"
            aria-hidden
          />
          <input
            id="verify-code-input"
            type="text"
            name="code"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus={autoFocus}
            autoComplete="off"
            spellCheck={false}
            inputMode="text"
            placeholder={t('authenticity.codePlaceholder')}
            className="w-full rounded-xl border border-stone-200 bg-white py-3 pe-4 ps-10 text-sm font-medium text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-[#3F6F00] focus:ring-2 focus:ring-[#85E307]/35"
            aria-describedby="verify-code-hint"
          />
        </div>
        <button
          type="submit"
          disabled={!value.trim()}
          className="gold-button inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Search className="h-4 w-4" aria-hidden />
          {t('authenticity.submitCode')}
        </button>
      </div>
      <p id="verify-code-hint" className="mt-2 text-start text-xs leading-relaxed text-stone-500">
        {t('authenticity.codeHint')}
      </p>
    </form>
  )
}

export default function ProductAuthenticityPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const rtl = isAr
  const [searchParams, setSearchParams] = useSearchParams()
  const code = (searchParams.get('code') || searchParams.get('q') || '').trim()

  const applyCode = (next: string) => {
    const trimmed = next.trim()
    if (!trimmed) return
    setSearchParams({ code: trimmed }, { replace: false })
  }

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['product-authenticity', code],
    queryFn: () => productsApi.verifyAuthenticity(code),
    enabled: Boolean(code),
    retry: 1,
    staleTime: 60_000,
  })

  const payload = data as ProductAuthenticityResponse | undefined
  const product = payload?.product
  const verified = Boolean(payload?.verified)
  const status = payload?.status || (code ? 'error' : 'missing')

  const productName = useMemo(() => {
    if (!product) return ''
    return isAr ? product.name_ar || product.name_en : product.name_en || product.name_ar
  }, [product, isAr])

  const categoryLabel = useMemo(() => {
    if (!product) return '—'
    return isAr
      ? product.category_ar || product.category_en || '—'
      : product.category_en || product.category_ar || '—'
  }, [product, isAr])

  const caratLabel = useMemo(() => {
    if (!product) return '—'
    if (isAr && product.carat_label_ar) return product.carat_label_ar
    if (product.carat_label_en) return product.carat_label_en
    if (product.carat_value) return `${product.carat_value}K`
    return '—'
  }, [product, isAr])

  const metalLabel = useMemo(() => {
    if (!product) return '—'
    return isAr
      ? product.metal_type_ar || product.metal_type_en || '—'
      : product.metal_type_en || product.metal_type_ar || '—'
  }, [product, isAr])

  const brandLabel = useMemo(() => {
    if (!product) return '—'
    return isAr
      ? product.brand_ar || product.brand_en || '—'
      : product.brand_en || product.brand_ar || '—'
  }, [product, isAr])

  const coverImage = product?.primary_image_url || product?.image_urls?.[0] || null

  if (!code) {
    return (
      <div
        className="min-h-[70vh] bg-gradient-to-b from-lime-50/60 via-white to-white py-10 sm:py-14"
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <div className="page-shell page-shell--reading py-8 sm:py-10">
          <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#3F6F00]/15 bg-[#ECFCCB]/70 text-[#3F6F00]">
              <ShieldCheck className="h-6 w-6" strokeWidth={1.75} aria-hidden />
            </div>
            <h1 className="mt-4 text-center text-xl font-bold text-stone-900 sm:text-2xl">
              {t('authenticity.enterCodeTitle')}
            </h1>
            <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-relaxed text-stone-600">
              {t('authenticity.enterCodeBody')}
            </p>

            <VerifyCodeForm autoFocus onSubmit={applyCode} rtl={rtl} />

            <div className="mt-6 flex flex-col items-center gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:justify-center">
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50"
              >
                {t('authenticity.browseProducts')}
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#3F6F00] hover:underline"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                {t('authenticity.contactSupport')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading || isFetching) {
    return <AppLoadingScreen />
  }

  if (isError || payload?.status === 'not_found' || status === 'error') {
    return (
      <div
        className="min-h-[70vh] bg-gradient-to-b from-lime-50/60 via-white to-white py-10 sm:py-14"
        dir={rtl ? 'rtl' : 'ltr'}
      >
        <div className="page-shell page-shell--reading py-8 sm:py-10">
          <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm sm:p-8">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-red-500" aria-hidden />
            <h1 className="text-center text-xl font-bold text-stone-900">{t('authenticity.notFoundTitle')}</h1>
            <p className="mx-auto mt-2 max-w-lg text-center text-sm leading-relaxed text-stone-600">
              {t('authenticity.notFoundBody')}
            </p>
            <p className="mt-3 text-center font-mono text-xs text-stone-400" dir="ltr">
              {code}
            </p>

            <VerifyCodeForm initialCode={code} onSubmit={applyCode} rtl={rtl} />

            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded-xl border border-[#3F6F00] px-5 py-2.5 text-sm font-semibold text-[#3F6F00]"
              >
                {t('authenticity.tryAgain')}
              </button>
              <Link
                to="/products"
                className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
              >
                {t('authenticity.browseProducts')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const statusIcon = verified ? BadgeCheck : AlertTriangle
  const StatusIcon = statusIcon
  const statusColor = verified ? 'text-[#3F6F00]' : 'text-amber-600'
  const statusBg = verified ? 'bg-lime-50 border-lime-200' : 'bg-amber-50 border-amber-200'

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-lime-50/60 via-white to-white py-8 sm:py-12"
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <header className="mb-6 text-center sm:mb-8 sm:text-start">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#3F6F00]">
            {t('authenticity.eyebrow')}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900 sm:text-3xl">{t('authenticity.pageTitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600 sm:text-base">{t('authenticity.pageSubtitle')}</p>
        </header>

        <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <VerifyCodeForm initialCode={code} onSubmit={applyCode} rtl={rtl} compact />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <section className="relative overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            <div className="pointer-events-none absolute inset-3">
              <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-[#85E307]/80" />
              <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-[#85E307]/80" />
              <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-[#85E307]/80" />
              <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-[#85E307]/80" />
            </div>
            <div className="aspect-square p-6 sm:p-8">
              {coverImage ? (
                <img src={coverImage} alt={productName} className="h-full w-full rounded-xl object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-stone-100 text-stone-400">
                  <Gem className="h-16 w-16" />
                </div>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            <div className={`mb-6 flex items-start gap-3 rounded-xl border p-4 ${statusBg}`}>
              <div className={`mt-0.5 rounded-full bg-white p-2 shadow-sm ${statusColor}`}>
                <StatusIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-stone-900">
                  {verified ? t('authenticity.verifiedTitle') : t('authenticity.inactiveTitle')}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-stone-700">
                  {isAr ? payload?.message_ar : payload?.message_en}
                </p>
              </div>
            </div>

            {product ? (
              <>
                <h3 className="text-xl font-bold text-stone-900">{productName}</h3>
                <p className="mt-1 text-sm text-stone-500">{t('authenticity.registryMatch')}</p>

                <div className="mt-5 rounded-xl border border-stone-200 bg-stone-50/70 px-4">
                  <DetailRow icon={Tag} label={t('authenticity.brand')} value={brandLabel} rtl={rtl} />
                  <DetailRow icon={Tag} label={t('authenticity.category')} value={categoryLabel} rtl={rtl} />
                  <DetailRow
                    icon={Hash}
                    label={t('authenticity.serialNumber')}
                    value={product.serial_number || product.sku}
                    rtl={rtl}
                  />
                  <DetailRow icon={ShieldCheck} label={t('authenticity.sku')} value={product.sku} rtl={rtl} />
                  <DetailRow icon={Gem} label={t('authenticity.metal')} value={metalLabel} rtl={rtl} />
                  <DetailRow icon={Scale} label={t('authenticity.karat')} value={caratLabel} rtl={rtl} />
                  <DetailRow
                    icon={Scale}
                    label={t('authenticity.weight')}
                    value={`${formatWeight(product.weight_grams, isAr ? 'ar-KW' : undefined)} ${t('authenticity.grams')}`}
                    rtl={rtl}
                  />
                  <DetailRow
                    icon={Calendar}
                    label={t('authenticity.registeredYear')}
                    value={String(product.registered_year || '—')}
                    rtl={rtl}
                  />
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <Link
                    to={`/products/${product.slug}`}
                    className="gold-button inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {t('authenticity.viewProduct')}
                  </Link>
                  <Link
                    to="/contact"
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#3F6F00] bg-white px-4 py-3 text-sm font-semibold text-[#3F6F00] hover:bg-lime-50"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {t('authenticity.contactSupport')}
                  </Link>
                </div>

                {verified ? (
                  <p className="mt-4 rounded-xl border border-[#3F6F00]/15 bg-[#ECFCCB]/35 px-4 py-3 text-sm leading-relaxed text-[#3F6F00]">
                    {t('authenticity.certificateAfterPurchase')}
                  </p>
                ) : null}
                <div className="mt-4">
                  <ProductAuthenticityAssurance
                    verifyCode={product.serial_number || product.sku || code}
                    variant="compact"
                  />
                </div>
                <p className="mt-3 text-xs leading-relaxed text-stone-500">{t('authenticity.registryOnlyNote')}</p>
              </>
            ) : null}
          </section>
        </div>

        <p className="mt-8 text-center text-xs text-stone-500">{t('authenticity.footerNote')}</p>
      </div>
    </div>
  )
}
