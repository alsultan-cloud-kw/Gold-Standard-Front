import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Grid3X3, List, SlidersHorizontal, ShoppingCart } from 'lucide-react'
import { productsApi } from '../services/api'
import type { Product, Category } from '../types'
import ProductPriceTrendArrow from '../components/ProductPriceTrendArrow'
import { productImageSrc } from '../utils/productImage'
import { productUnitPrice } from '../utils/productPrice'
import { useCart } from '../contexts/CartContext'

export default function ProductsPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const caratsParam = searchParams.get('carats') || ''
  const minPriceParam = searchParams.get('minPrice') || ''
  const maxPriceParam = searchParams.get('maxPrice') || ''

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', category ?? '', search ?? ''],
    queryFn: () => productsApi.getProducts({ category, search }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  })

  // When filtering by category slug, load category detail for subcategory navigation
  const { data: categoryDetail } = useQuery({
    queryKey: ['category', category],
    queryFn: () => productsApi.getCategory(category!),
    enabled: !!category,
  })

  type PaginatedResponse<T> = {
    count: number
    next: string | null
    previous: string | null
    results: T[]
  }

  const productsResp = products as PaginatedResponse<Product> | undefined
  const productList = productsResp?.results || []

  const categoriesResp = categories as PaginatedResponse<Category> | undefined
  const categoryList = categoriesResp?.results || []

  const activeCategory = categoryDetail as Category | undefined
  const subcategories = Array.isArray(activeCategory?.subcategories)
    ? (activeCategory!.subcategories as Array<{ slug?: string; name_en?: string }>)
    : []

  const selectedCarats = caratsParam
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
  const minPrice = minPriceParam ? Number(minPriceParam) : NaN
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : NaN

  const filteredProducts = productList.filter((product) => {
    const unitPrice = productUnitPrice(product)
    const productCaratValue = product.carat?.carat_value
    const productCaratLabel = productCaratValue ? `${productCaratValue}K` : null

    if (selectedCarats.length > 0 && (!productCaratLabel || !selectedCarats.includes(productCaratLabel))) {
      return false
    }
    if (Number.isFinite(minPrice) && unitPrice < minPrice) return false
    if (Number.isFinite(maxPrice) && unitPrice > maxPrice) return false
    return true
  })

  const categoryLabel = (c: { name_en: string; name_ar?: string }) =>
    isAr && c.name_ar ? c.name_ar : c.name_en

  const pageTitle =
    activeCategory != null
      ? categoryLabel(activeCategory)
      : category
        ? t('productsPage.categoryProducts')
        : t('productsPage.allProductsTitle')

  const updateParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams)
    if (!value) next.delete(key)
    else next.set(key, value)
    setSearchParams(next)
  }

  const toggleCarat = (carat: string) => {
    const current = new Set(selectedCarats)
    if (current.has(carat)) current.delete(carat)
    else current.add(carat)
    const value = Array.from(current).sort((a, b) => Number(b.replace('K', '')) - Number(a.replace('K', ''))).join(',')
    updateParam('carats', value)
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="min-w-0 flex-1">
            {category && (
              <nav className="text-sm text-slate-500 mb-2 mt-4">
                <Link to="/products" className="text-amber-700 hover:text-amber-900 hover:underline">
                  {t('productsPage.allProducts')}
                </Link>
                <span className="mx-2 text-slate-400">/</span>
                <span className="text-slate-700 font-medium">
                  {activeCategory != null ? categoryLabel(activeCategory) : category}
                </span>
              </nav>
            )}
            <h1 className="text-3xl font-bold gold-gradient-text-on-light mb-2 mt-4">{pageTitle}</h1>
            <p className="text-slate-600">
              {isLoading ? t('common.loading') : t('productsPage.productsFound', { count: filteredProducts.length })}
              {subcategories.length > 0 && !activeCategory?.parent && (
                <span className="block mt-1 text-slate-500 text-sm">{t('productsPage.subcategoryHint')}</span>
              )}
            </p>
            {/* Subcategories: root category shows children; subcategory page can show siblings if needed */}
            {/* Subcategory chips when viewing a root category */}
            {subcategories.length > 0 && !activeCategory?.parent && (
              <div className="mt-4 flex flex-wrap gap-2">
                {subcategories.map((sub) => {
                  if (!sub.slug) return null
                  const isActive = category === sub.slug
                  const subAr = (sub as { name_ar?: string }).name_ar
                  const subLabel = isAr && subAr ? subAr : (sub.name_en || sub.slug)
                  return (
                    <Link
                      key={sub.slug}
                      to={`/products?category=${encodeURIComponent(sub.slug)}`}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border shadow-sm transition-colors ${
                        isActive
                          ? 'border-amber-600 bg-amber-100 text-amber-950 ring-1 ring-amber-600/30'
                          : 'border-slate-300 bg-white text-slate-800 hover:border-amber-500 hover:bg-amber-50 hover:text-amber-900'
                      }`}
                    >
                      {subLabel}
                    </Link>
                  )
                })}
              </div>
            )}
            {/* When viewing a subcategory, link back to parent to see all + other subs */}
            {activeCategory?.parent_slug && (
              <div className="mt-4">
                <Link
                  to={`/products?category=${encodeURIComponent(activeCategory.parent_slug)}`}
                  className="text-sm font-medium text-amber-700 hover:text-amber-900 hover:underline"
                >
                  {t('productsPage.backToParent', {
                    parent:
                      activeCategory.parent_name || t('productsPage.parentCategoryFallback'),
                  })}
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-charcoal-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gold-500 text-charcoal-950' : 'text-gold-100/60'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-gold-500 text-charcoal-950' : 'text-gold-100/60'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Button */}
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 hover:bg-gold-500/10 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {t('productsPage.filters')}
            </button>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters */}
          {isFilterOpen && (
            <aside className="w-64 flex-shrink-0">
              <div className="gold-card sticky top-24">
                <h3 className="text-lg font-semibold text-gold-100 mb-4">{t('productsPage.filtersHeading')}</h3>
                
                {/* Categories */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gold-100/80 mb-3">{t('productsPage.categories')}</h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!category}
                        onChange={() => updateParam('category', '')}
                        className="rounded border-gold-500/30 bg-charcoal-800 text-gold-500"
                      />
                      <span className="text-sm text-gold-100/60">{t('productsPage.allCategories')}</span>
                    </label>
                    {categoryList.map((cat) => (
                      <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={category === cat.slug}
                          onChange={() => updateParam('category', category === cat.slug ? '' : cat.slug)}
                          className="rounded border-gold-500/30 bg-charcoal-800 text-gold-500"
                        />
                        <span className="text-sm text-gold-100/60">{categoryLabel(cat)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Carat */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gold-100/80 mb-3">{t('productsPage.goldCarat')}</h4>
                  <div className="space-y-2">
                    {['24K', '22K', '21K', '18K'].map((carat) => (
                      <label key={carat} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedCarats.includes(carat)}
                          onChange={() => toggleCarat(carat)}
                          className="rounded border-gold-500/30 bg-charcoal-800 text-gold-500"
                        />
                        <span className="text-sm text-gold-100/60">{carat}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h4 className="text-sm font-medium text-gold-100/80 mb-3">{t('productsPage.priceRange')}</h4>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder={t('productsPage.minPlaceholder')}
                      value={minPriceParam}
                      onChange={(e) => updateParam('minPrice', e.target.value)}
                      className="w-20 px-3 py-2 bg-charcoal-800 border border-gold-500/30 rounded text-sm text-gold-100"
                    />
                    <span className="text-gold-100/40">-</span>
                    <input
                      type="number"
                      placeholder={t('productsPage.maxPlaceholder')}
                      value={maxPriceParam}
                      onChange={(e) => updateParam('maxPrice', e.target.value)}
                      className="w-20 px-3 py-2 bg-charcoal-800 border border-gold-500/30 rounded text-sm text-gold-100"
                    />
                  </div>
                </div>
              </div>
            </aside>
          )}

          {/* Products Grid */}
          <div className="flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="gold-card animate-pulse">
                    <div className="aspect-[4/3] bg-gold-500/10 rounded-lg mb-4" />
                    <div className="h-4 bg-gold-500/10 rounded mb-2" />
                    <div className="h-4 bg-gold-500/10 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6'
                : 'space-y-4'
              }>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} viewMode={viewMode} isAr={isAr} />
                ))}
              </div>
            )}
            {!isLoading && filteredProducts.length === 0 && (
              <div className="gold-card text-center py-10 text-gold-100/70 mt-4">
                {t('productsPage.noMatchFilters')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({
  product,
  viewMode,
  isAr,
}: {
  product: Product
  viewMode: 'grid' | 'list'
  isAr: boolean
}) {
  const { t } = useTranslation()
  const { addToCart } = useCart()
  const imageSrc = productImageSrc(product)
  const unitPrice = productUnitPrice(product)
  const productName = isAr && product.name_ar ? product.name_ar : product.name_en
  const descSource =
    isAr && product.description_ar ? product.description_ar : product.description_en
  const caratLabel =
    isAr && product.carat?.display_name_ar
      ? product.carat.display_name_ar
      : product.carat?.display_name_en
  const priceLocale = isAr ? 'ar-KW' : undefined

  const addButtonClass =
    'flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors shadow-sm shrink-0'

  if (viewMode === 'list') {
    return (
      <div className="gold-card flex flex-col sm:flex-row gap-4 hover:border-gold-500/50 transition-colors">
        <Link to={`/products/${product.slug}`} className="flex gap-4 flex-1 min-w-0">
          <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-charcoal-800">
            {imageSrc ? (
              <img src={imageSrc} alt={productName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gold-400/40">
                {t('productsPage.noImage')}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-medium text-gold-100 mb-1">{productName}</h3>
            <p className="text-sm text-gold-100/60 mb-2 line-clamp-2">
              {descSource ? `${descSource.substring(0, 100)}...` : ''}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="price-tag inline-flex items-center gap-1.5">
                <ProductPriceTrendArrow product={product} variant="dark" />
                {unitPrice.toLocaleString(priceLocale)} KWD
              </span>
              <span className="text-sm text-gold-100/40">{caratLabel}</span>
            </div>
          </div>
        </Link>
        <div className="flex items-center sm:flex-col sm:justify-center gap-2 sm:w-36">
          <button type="button" onClick={() => addToCart(product)} className={`${addButtonClass} w-full`}>
            <ShoppingCart className="w-4 h-4 shrink-0" />
            {t('productsPage.addToCart')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="gold-card group flex flex-col hover:border-gold-500/50 transition-colors">
      <Link to={`/products/${product.slug}`} className="block flex-1 min-w-0">
        <div className="relative overflow-hidden rounded-lg mb-4 aspect-[4/3]">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={productName}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full bg-charcoal-800 flex items-center justify-center">
              <span className="text-gold-400/40">{t('productsPage.noImage')}</span>
            </div>
          )}
          <div className="absolute top-2 end-2">
            <span className="px-2 py-1 text-xs font-medium bg-charcoal-950/80 text-gold-400 rounded">
              {caratLabel}
            </span>
          </div>
        </div>
        <h3 className="text-sm font-medium text-gold-100 group-hover:text-gold-400 transition-colors line-clamp-1">
          {productName}
        </h3>
        <p className="text-xs text-gold-100/50 mb-2">{product.weight_grams}g</p>
        <div className="price-tag text-sm inline-flex items-center gap-1.5 flex-wrap">
          <ProductPriceTrendArrow product={product} variant="dark" />
          <span>{unitPrice.toLocaleString(priceLocale)} KWD</span>
        </div>
      </Link>
      <button type="button" onClick={() => addToCart(product)} className={`${addButtonClass} mt-3 w-full`}>
        <ShoppingCart className="w-4 h-4 shrink-0" />
        {t('productsPage.addToCart')}
      </button>
    </div>
  )
}
