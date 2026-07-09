import { Link } from 'react-router-dom'
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Loader2,
  Tag,
  Crown,
  Lock,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useCart } from '../contexts/CartContext'
import { productImageSrc } from '../utils/productImage'
import { formatOrderKwd, useOrderSummaryDisplay } from '../hooks/useOrderSummaryDisplay'
import {
  cartClubPricingBreakdown,
  cartLineClubMemberSavings,
  cartLineStandardTotal,
} from '../utils/clubCartPricing'
import { CheckoutTrustBadges } from '@/components/checkout/CheckoutTrustBadges'

export default function CartPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart()
  const summary = useOrderSummaryDisplay(cart)
  const { standardSubtotal: displaySubtotal, clubMemberSavings: clubSavings, chargedSubtotal } =
    cartClubPricingBreakdown(cart.items)
  const displayTotalAfterClub = chargedSubtotal
  const displayFinalTotal = Math.max(0, displayTotalAfterClub - summary.discountAmount + summary.taxAmount)

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F9FA]">
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:py-28">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F4F4F5] text-[#64748B]">
            <ShoppingCart className="h-9 w-9" strokeWidth={1.75} />
          </div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
            {t('cartPage.kicker')}
          </p>
          <h1 className="font-serif text-2xl font-bold tracking-tight text-[#0B0F19] sm:text-3xl">
            {t('cartPage.emptyTitle')}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[#64748B] sm:text-base">
            {t('cartPage.emptyDesc')}
          </p>
          <Link
            to="/products"
            className="mt-8 inline-flex min-h-[3.25rem] items-center justify-center gap-2 rounded-2xl border border-[#3F6F00] bg-[#85E307] px-8 text-base font-bold text-[#3F6F00] shadow-[0_14px_28px_-14px_rgba(133,227,7,0.55)] transition hover:bg-[#9AEF2A]"
          >
            {t('cartPage.continueShopping')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F9F9FA]">
      <div className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
            {t('cartPage.kicker')}
          </p>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="font-serif text-2xl font-bold tracking-tight text-[#0B0F19] sm:text-3xl">
              {t('cartPage.pageTitle')}
            </h1>
            <p className="text-sm text-[#64748B]">
              {t('cartPage.itemsCount', { count: cart.item_count })}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="space-y-3">
          {cart.items.map((item) => {
            const imageSrc = productImageSrc(item.product)
            const lineListTotal = cartLineStandardTotal(item)
            const lineMemberSave = cartLineClubMemberSavings(item)
            const productName =
              isAr && item.product.name_ar ? item.product.name_ar : item.product.name_en
            const caratLabel =
              isAr && item.product.carat?.display_name_ar
                ? item.product.carat.display_name_ar
                : item.product.carat?.display_name_en
            return (
              <div
                key={item.id}
                className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:flex-row sm:p-5"
              >
                <Link
                  to={`/products/${item.product.slug}`}
                  className="h-36 w-full shrink-0 overflow-hidden rounded-xl bg-[#F4F4F5] sm:h-[5.75rem] sm:w-[5.75rem]"
                >
                  {imageSrc ? (
                    <img src={imageSrc} alt={productName} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-[#94A3B8]">
                      {t('cartPage.noImage')}
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/products/${item.product.slug}`}
                        className="font-serif text-base font-bold text-[#0B0F19] transition-colors hover:text-[#3F6F00] sm:text-lg"
                      >
                        {productName}
                      </Link>
                      <p className="mt-1 text-sm text-[#64748B]">
                        {caratLabel} · {item.product.weight_grams}
                        {t('common.gramsAbbr')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="rounded-lg p-2 text-[#94A3B8] transition-colors hover:bg-red-50 hover:text-red-600"
                      aria-label={t('cartPage.removeItem')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-full bg-[#F0F0F0] p-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#0B0F19] transition hover:bg-white"
                        aria-label={t('cartPage.decreaseQty')}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center text-sm font-bold tabular-nums text-[#0B0F19]">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#0B0F19] transition hover:bg-white"
                        aria-label={t('cartPage.increaseQty')}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="text-end">
                      {lineMemberSave > 0 ? (
                        <>
                          <p className="text-xs text-[#94A3B8] line-through tabular-nums">
                            {formatOrderKwd(lineListTotal)} {t('common.kwd')}
                          </p>
                          <p className="flex items-center justify-end gap-1 text-xs font-semibold text-[#059669]">
                            <Crown className="h-3.5 w-3.5" aria-hidden />
                            {t('cartPage.memberPrice')}
                          </p>
                          <p className="text-lg font-bold tabular-nums text-[#85E307]">
                            {formatOrderKwd(item.total_price)} {t('common.kwd')}
                          </p>
                        </>
                      ) : (
                        <p className="text-lg font-bold tabular-nums text-[#85E307]">
                          {formatOrderKwd(item.total_price)} {t('common.kwd')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-red-700 transition-colors hover:text-red-800"
        >
          <Trash2 className="h-4 w-4" />
          {t('cartPage.clearCart')}
        </button>

        <div className="mt-6 rounded-2xl border border-black/10 bg-[#F5F5F5] p-5 sm:p-[1.125rem]">
          <h2 className="mb-4 font-serif text-lg font-bold text-[#0B0F19]">
            {t('cartPage.orderSummary')}
          </h2>

          <div className="space-y-2.5 text-sm">
            {clubSavings > 0 ? (
              <>
                <div className="flex items-center justify-between gap-2 text-[#64748B]">
                  <span>{t('cartPage.standardListTotal', { count: cart.item_count })}</span>
                  <span className="inline-flex items-center gap-1 font-medium tabular-nums text-[#0B0F19]">
                    {summary.previewLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3F6F00]" aria-hidden />
                    ) : null}
                    {formatOrderKwd(displaySubtotal)} {t('common.kwd')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-[#059669]">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {t('cartPage.clubMemberSavings')}
                  </span>
                  <span className="font-semibold tabular-nums">
                    −{formatOrderKwd(clubSavings)} {t('common.kwd')}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-black/5 pt-2.5 font-medium text-[#0B0F19]">
                  <span>{t('cartPage.yourPriceMember')}</span>
                  <span className="tabular-nums">{formatOrderKwd(displayTotalAfterClub)} {t('common.kwd')}</span>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-2 text-[#64748B]">
                <span>{t('cartPage.subtotal', { count: cart.item_count })}</span>
                <span className="inline-flex items-center gap-1 font-medium tabular-nums text-[#0B0F19]">
                  {summary.previewLoading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3F6F00]" aria-hidden />
                  ) : null}
                  {formatOrderKwd(displayTotalAfterClub)} {t('common.kwd')}
                </span>
              </div>
            )}

            {summary.discountAmount > 0 ? (
              <div className="flex items-center justify-between gap-2 text-[#059669]">
                <span className="inline-flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 shrink-0" />
                  {summary.offerTitle ? summary.offerTitle : t('cartPage.offerFallback')}
                </span>
                <span className="font-semibold tabular-nums">
                  −{formatOrderKwd(summary.discountAmount)} {t('common.kwd')}
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-2 text-[#64748B]">
              <span>{t('cartPage.shipping')}</span>
              <span className="inline-flex rounded-full border border-[#3F6F00] bg-[#85E307] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0B0F19]">
                {t('cartPage.shippingFree')}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 text-[#64748B]">
              <span>{t('cartPage.tax')}</span>
              <span className="tabular-nums">{formatOrderKwd(summary.taxAmount)} {t('common.kwd')}</span>
            </div>
          </div>

          <div className="mt-4 border-t border-black/10 pt-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-serif text-lg font-bold text-[#0B0F19]">{t('cartPage.total')}</span>
              <span className="font-serif text-2xl font-bold tabular-nums text-[#0B0F19]">
                {formatOrderKwd(displayFinalTotal)} {t('common.kwd')}
              </span>
            </div>
            <p className="mt-2 text-xs text-[#64748B]">{t('cartPage.livePriceNote')}</p>
          </div>
        </div>

        <Link
          to="/checkout"
          className="mt-5 flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl border border-[#3F6F00] bg-[#85E307] text-base font-bold text-[#3F6F00] shadow-[0_14px_28px_-14px_rgba(133,227,7,0.55)] transition hover:bg-[#9AEF2A]"
        >
          {t('cartPage.proceedCheckout')}
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>

        <div className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-[#64748B]">
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>{t('cartPage.secureCheckoutNote')}</span>
        </div>

        <CheckoutTrustBadges variant="panel" className="mt-5" />
      </div>
    </div>
  )
}
