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
      <div className="min-h-screen py-16 bg-siteBg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-24 h-24 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-amber-800" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-4">{t('cartPage.emptyTitle')}</h1>
          <p className="text-stone-600 mb-8 max-w-md mx-auto">{t('cartPage.emptyDesc')}</p>
          <Link to="/products" className="gold-button inline-flex items-center gap-2">
            {t('cartPage.continueShopping')}
            <ArrowRight className="w-5 h-5 rtl:rotate-180" />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 bg-siteBg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold gold-gradient-text-on-light mb-8">{t('cartPage.pageTitle')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
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
                  className="gold-card-light flex flex-col sm:flex-row gap-4 border-amber-900/10"
                >
                  <div className="w-full sm:w-24 h-48 sm:h-24 flex-shrink-0 rounded-lg overflow-hidden bg-stone-100 ring-1 ring-amber-900/10">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-stone-400 text-sm">
                        {t('cartPage.noImage')}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          to={`/products/${item.product.slug}`}
                          className="text-lg font-semibold text-stone-900 hover:text-amber-800 transition-colors line-clamp-2"
                        >
                          {productName}
                        </Link>
                        <p className="text-sm text-stone-600 mt-1">
                          {caratLabel} • {item.product.weight_grams}g
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                        aria-label={t('cartPage.removeItem')}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-9 h-9 rounded-lg bg-stone-100 border border-amber-900/15 text-stone-800 hover:bg-amber-50 flex items-center justify-center"
                          aria-label={t('cartPage.decreaseQty')}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-10 text-center font-semibold text-stone-900 tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-9 h-9 rounded-lg bg-stone-100 border border-amber-900/15 text-stone-800 hover:bg-amber-50 flex items-center justify-center"
                          aria-label={t('cartPage.increaseQty')}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-end space-y-0.5">
                        {lineMemberSave > 0 ? (
                          <>
                            <p className="text-xs text-stone-500 line-through tabular-nums">
                              {formatOrderKwd(lineListTotal)} KWD
                              <span className="text-stone-400 font-normal not-italic">
                                {' '}
                                {t('cartPage.listSuffix')}
                              </span>
                            </p>
                            <p className="flex items-center justify-end gap-1 text-xs font-semibold text-emerald-800">
                              <Crown className="w-3.5 h-3.5 shrink-0" aria-hidden />
                              {t('cartPage.memberPrice')}
                            </p>
                            <p className="text-lg font-bold text-amber-900 tabular-nums">
                              {formatOrderKwd(item.total_price)} KWD
                            </p>
                            <p className="text-xs text-emerald-700 tabular-nums">
                              {t('cartPage.saveVsList', { amount: formatOrderKwd(lineMemberSave) })}
                            </p>
                          </>
                        ) : (
                          <span className="text-lg font-bold text-amber-900 tabular-nums">
                            {formatOrderKwd(item.total_price)} KWD
                          </span>
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
              className="text-sm font-medium text-red-700 hover:text-red-800 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('cartPage.clearCart')}
            </button>
          </div>

          <div className="lg:col-span-1">
            <div className="gold-card-light sticky top-24 border-amber-900/10">
              <h2 className="text-xl font-bold text-stone-900 mb-6">{t('cartPage.orderSummary')}</h2>

              <div className="space-y-3 mb-6 text-stone-700">
                {clubSavings > 0 ? (
                  <>
                    <div className="flex items-center justify-between gap-2">
                      <span>{t('cartPage.standardListTotal', { count: cart.item_count })}</span>
                      <span className="font-medium tabular-nums flex items-center gap-1">
                        {summary.previewLoading && (
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700 shrink-0" aria-hidden />
                        )}
                        {formatOrderKwd(displaySubtotal)} KWD
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-emerald-800 gap-2">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Crown className="w-3.5 h-3.5 shrink-0 text-emerald-700" aria-hidden />
                        {t('cartPage.clubMemberSavings')}
                      </span>
                      <span className="tabular-nums font-semibold">−{formatOrderKwd(clubSavings)} KWD</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-0.5 border-t border-amber-900/10">
                      <span className="font-medium text-stone-900">{t('cartPage.yourPriceMember')}</span>
                      <span className="font-semibold tabular-nums text-stone-900">
                        {formatOrderKwd(displayTotalAfterClub)} KWD
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span>{t('cartPage.subtotal', { count: cart.item_count })}</span>
                    <span className="font-medium tabular-nums flex items-center gap-1">
                      {summary.previewLoading && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700 shrink-0" aria-hidden />
                      )}
                      {formatOrderKwd(displayTotalAfterClub)} KWD
                    </span>
                  </div>
                )}
                {summary.discountAmount > 0 && (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200/80 px-3 py-2 space-y-1">
                    <div className="flex items-center justify-between text-emerald-900">
                      <span className="flex items-center gap-1.5 text-sm font-medium">
                        <Tag className="w-3.5 h-3.5 shrink-0" />
                        {summary.offerTitle ? summary.offerTitle : t('cartPage.offerFallback')}
                      </span>
                      <span className="tabular-nums font-semibold">
                        −{formatOrderKwd(summary.discountAmount)} KWD
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800/80">{t('cartPage.offerPreviewHint')}</p>
                  </div>
                )}
                {summary.useServerPreview && summary.discountAmount <= 0 && !summary.previewLoading && (
                  <div className="flex items-center justify-between text-stone-500 text-sm">
                    <span>{t('cartPage.promotionalOffer')}</span>
                    <span className="tabular-nums">—</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span>{t('cartPage.tax')}</span>
                  <span className="tabular-nums">{formatOrderKwd(summary.taxAmount)} KWD</span>
                </div>
              </div>

              <div className="border-t border-amber-900/15 pt-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-stone-900">{t('cartPage.total')}</span>
                  <span className="text-2xl font-bold text-amber-900 tabular-nums">
                    {formatOrderKwd(displayFinalTotal)} KWD
                  </span>
                </div>
              </div>

              <Link
                to="/checkout"
                className="gold-button w-full flex items-center justify-center gap-2 mb-4"
              >
                {t('cartPage.proceedCheckout')}
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </Link>

              <Link
                to="/products"
                className="w-full px-6 py-3 rounded-lg font-semibold text-amber-900 border-2 border-amber-800/30 bg-white hover:bg-amber-50 transition-all text-center block"
              >
                {t('cartPage.continueShopping')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
