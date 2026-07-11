import { Link } from 'react-router-dom'
import type { MouseEvent } from 'react'
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
import { usePurchaseAuth } from '@/hooks/usePurchaseAuth'
import { productImageSrc } from '../utils/productImage'
import { formatOrderKwd, useOrderSummaryDisplay } from '../hooks/useOrderSummaryDisplay'
import {
  cartClubPricingBreakdown,
  cartLineClubMemberSavings,
  cartLineStandardTotal,
} from '../utils/clubCartPricing'
import { CheckoutTrustBadges } from '@/components/checkout/CheckoutTrustBadges'
import { ProductStockBadge } from '@/components/products/ProductStockBadge'
import {
  isProductOutOfStock,
  productAvailableQuantity,
} from '@/utils/productStock'

function OrderSummaryCard({
  cart,
  summary,
  displaySubtotal,
  clubSavings,
  displayTotalAfterClub,
  displayFinalTotal,
}: {
  cart: ReturnType<typeof useCart>['cart']
  summary: ReturnType<typeof useOrderSummaryDisplay>
  displaySubtotal: number
  clubSavings: number
  displayTotalAfterClub: number
  displayFinalTotal: number
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
      <h2 className="store-section-title mb-5 text-[#0B0F19]">{t('cartPage.orderSummary')}</h2>

      <div className="space-y-3 text-sm sm:text-base">
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
            <div className="flex items-center justify-between gap-2 border-t border-black/5 pt-3 font-medium text-[#0B0F19]">
              <span>{t('cartPage.yourPriceMember')}</span>
              <span className="tabular-nums">
                {formatOrderKwd(displayTotalAfterClub)} {t('common.kwd')}
              </span>
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
          <span className="text-sm font-medium text-[#64748B]">
            {t('cartPage.shippingAtCheckout')}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-[#64748B]">
          <span>{t('cartPage.tax')}</span>
          <span className="tabular-nums">
            {formatOrderKwd(summary.taxAmount)} {t('common.kwd')}
          </span>
        </div>
      </div>

      <div className="mt-5 border-t border-black/10 pt-5">
        <div className="flex items-center justify-between gap-2">
          <span className="store-section-title text-[#0B0F19]">{t('cartPage.total')}</span>
          <span className="text-2xl font-bold tabular-nums text-[#0B0F19] lg:text-3xl">
            {formatOrderKwd(displayFinalTotal)} {t('common.kwd')}
          </span>
        </div>
        <p className="mt-2 text-xs text-[#64748B] sm:text-sm">{t('cartPage.livePriceNote')}</p>
      </div>
    </div>
  )
}

export default function CartPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart()
  const summary = useOrderSummaryDisplay(cart)
  const { ensureCanPurchase, isAuthenticated, needsVerification, loginHref } = usePurchaseAuth()
  const { standardSubtotal: displaySubtotal, clubMemberSavings: clubSavings, chargedSubtotal } =
    cartClubPricingBreakdown(cart.items)
  const displayTotalAfterClub = chargedSubtotal
  const displayFinalTotal = Math.max(0, displayTotalAfterClub - summary.discountAmount + summary.taxAmount)
  const hasUnavailableItems = cart.items.some(
    (item) =>
      isProductOutOfStock(item.product) || item.quantity > productAvailableQuantity(item.product),
  )

  const checkoutHref = !isAuthenticated
    ? loginHref('/checkout')
    : needsVerification
      ? '/dashboard?tab=profile'
      : '/checkout'

  const onCheckoutClick = (e: MouseEvent) => {
    if (hasUnavailableItems) {
      e.preventDefault()
      return
    }
    if (!ensureCanPurchase('/checkout')) {
      e.preventDefault()
    }
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F9FA]">
        <div className="page-shell flex max-w-lg flex-col items-center py-20 text-center sm:py-28">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#F4F4F5] text-[#64748B]">
            <ShoppingCart className="h-9 w-9" strokeWidth={1.75} />
          </div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
            {t('cartPage.kicker')}
          </p>
          <h1 className="store-display-title text-[#0B0F19]">{t('cartPage.emptyTitle')}</h1>
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
          <div className="page-shell page-section">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
            {t('cartPage.kicker')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <h1 className="store-display-title text-[#0B0F19]">{t('cartPage.pageTitle')}</h1>
            <p className="text-sm text-[#64748B] sm:text-base">
              {t('cartPage.itemsCount', { count: cart.item_count })}
            </p>
          </div>
        </div>
      </div>

      <div className="page-shell page-section">
        <div className="commerce-layout">
          <div className="min-w-0 space-y-4">
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
              const itemOutOfStock = isProductOutOfStock(item.product)
              const itemMaxQty = productAvailableQuantity(item.product)
              return (
                <div
                  key={item.id}
                  className={`flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:p-5 lg:p-6 ${
                    itemOutOfStock ? 'border-[#FCA5A5] bg-[#FFFBFB]' : 'border-black/10'
                  }`}
                >
                  <Link
                    to={`/products/${item.product.slug}`}
                    className={`relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-[#F4F4F5] sm:h-28 sm:w-28 lg:h-32 lg:w-32 ${itemOutOfStock ? 'grayscale-[0.35]' : ''}`}
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
                        <div className="mb-2">
                          <ProductStockBadge product={item.product} />
                        </div>
                        <Link
                          to={`/products/${item.product.slug}`}
                          className="text-base font-bold text-[#0B0F19] transition-colors hover:text-[#3F6F00] sm:text-lg lg:text-xl"
                        >
                          {productName}
                        </Link>
                        <p className="mt-1 text-sm text-[#64748B] sm:text-base">
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

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 lg:mt-5">
                      <div className="inline-flex items-center rounded-full bg-[#F0F0F0] p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="flex h-10 w-10 items-center justify-center rounded-full text-[#0B0F19] transition hover:bg-white"
                          aria-label={t('cartPage.decreaseQty')}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-10 text-center text-sm font-bold tabular-nums text-[#0B0F19] sm:text-base">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={itemOutOfStock || item.quantity >= itemMaxQty}
                          className="flex h-10 w-10 items-center justify-center rounded-full text-[#0B0F19] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label={t('cartPage.increaseQty')}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-end">
                        {lineMemberSave > 0 ? (
                          <>
                            <p className="text-xs text-[#94A3B8] line-through tabular-nums sm:text-sm">
                              {formatOrderKwd(lineListTotal)} {t('common.kwd')}
                            </p>
                            <p className="flex items-center justify-end gap-1 text-xs font-semibold text-[#059669] sm:text-sm">
                              <Crown className="h-3.5 w-3.5" aria-hidden />
                              {t('cartPage.memberPrice')}
                            </p>
                            <p className="text-xl font-bold tabular-nums text-[#85E307] lg:text-2xl">
                              {formatOrderKwd(item.total_price)} {t('common.kwd')}
                            </p>
                          </>
                        ) : (
                          <p className="text-xl font-bold tabular-nums text-[#85E307] lg:text-2xl">
                            {formatOrderKwd(item.total_price)} {t('common.kwd')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            <button
              type="button"
              onClick={clearCart}
              className="inline-flex items-center gap-2 text-sm font-medium text-red-700 transition-colors hover:text-red-800 sm:text-base"
            >
              <Trash2 className="h-4 w-4" />
              {t('cartPage.clearCart')}
            </button>
          </div>

          <aside className="commerce-sidebar">
            <OrderSummaryCard
              cart={cart}
              summary={summary}
              displaySubtotal={displaySubtotal}
              clubSavings={clubSavings}
              displayTotalAfterClub={displayTotalAfterClub}
              displayFinalTotal={displayFinalTotal}
            />

            <Link
              to={checkoutHref}
              onClick={onCheckoutClick}
              aria-disabled={hasUnavailableItems}
              className={`flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl border text-base font-bold shadow-[0_14px_28px_-14px_rgba(133,227,7,0.55)] transition sm:text-lg ${
                hasUnavailableItems
                  ? 'pointer-events-none cursor-not-allowed border-[#CBD5E1] bg-[#E2E8F0] text-[#64748B]'
                  : 'border-[#3F6F00] bg-[#85E307] text-[#3F6F00] hover:bg-[#9AEF2A]'
              }`}
            >
              {hasUnavailableItems
                ? t('stock.cartBlocked')
                : !isAuthenticated
                  ? t('auth.signInToCheckout')
                  : needsVerification
                    ? t('auth.verifyToCheckout')
                    : t('cartPage.proceedCheckout')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-[#64748B] sm:text-xs">
              <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>{t('cartPage.secureCheckoutNote')}</span>
            </div>

            <CheckoutTrustBadges variant="panel" />
          </aside>
        </div>
      </div>
    </div>
  )
}
