import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  ShoppingCart,
  Search,
  X,
  ArrowUpDown,
} from 'lucide-react'
import { productsApi } from '../services/api'
import type { Product, Category } from '../types'
import ProductPriceTrendArrow from '../components/ProductPriceTrendArrow'
import { productImageSrc } from '../utils/productImage'
import { productUnitPrice, formatKwd } from '../utils/productPrice'
import { useCart } from '../contexts/CartContext'
import { ProductStockBadge, ProductStockOverlay } from '@/components/products/ProductStockBadge'
import { isProductOutOfStock } from '@/utils/productStock'
import {
  useProductPriceTrendSincePreviousFetch,
  type ProductFetchTrendMap,
} from '../hooks/useProductPriceTrendSincePreviousFetch'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'

type SortKey = 'featured' | 'price-asc' | 'price-desc' | 'weight-asc' | 'weight-desc' | 'newest'
type ViewMode = 'grid' | 'list'

const CARAT_OPTIONS = ['24K', '22K', '21K', '18K'] as const
const METAL_OPTIONS = ['gold', 'silver', 'platinum', 'palladium'] as const

type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

function FilterPanel({
  category,
  categoryList,
  categoryLabel,
  selectedCarats,
  selectedMetals,
  minPriceParam,
  maxPriceParam,
  onCategory,
  onToggleCarat,
  onToggleMetal,
  onMinPrice,
  onMaxPrice,
  onClear,
  activeFilterCount,
}: {
  category: string | null
  categoryList: Category[]
  categoryLabel: (c: { name_en: string; name_ar?: string }) => string
  selectedCarats: string[]
  selectedMetals: string[]
  minPriceParam: string
  maxPriceParam: string
  onCategory: (slug: string) => void
  onToggleCarat: (carat: string) => void
  onToggleMetal: (metal: string) => void
  onMinPrice: (v: string) => void
  onMaxPrice: (v: string) => void
  onClear: () => void
  activeFilterCount: number
}) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full flex-col">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold tracking-tight text-[#0B0F19]">
            {t('productsPage.filtersHeading')}
          </h3>
          {activeFilterCount > 0 ? (
            <p className="mt-0.5 text-xs text-[#64748B]">
              {t('productsPage.activeFiltersCount', { count: activeFilterCount })}
            </p>
          ) : null}
        </div>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-[#3F6F00] transition-colors hover:text-[#2d5200]"
          >
            {t('productsPage.clearAll')}
          </button>
        ) : null}
      </div>

      <div className="space-y-7 overflow-y-auto pe-1">
        <section>
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#3F6F00]">
            {t('productsPage.categories')}
          </h4>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => onCategory('')}
              className={`rounded-xl px-3.5 py-2.5 text-start text-sm font-medium transition-colors ${
                !category
                  ? 'bg-[#0B0F19] text-white'
                  : 'bg-[#F4F4F5] text-[#0B0F19] hover:bg-[#ECFCCB]/70'
              }`}
            >
              {t('productsPage.allCategories')}
            </button>
            {categoryList.map((cat) => {
              const active = category === cat.slug
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategory(active ? '' : cat.slug)}
                  className={`rounded-xl px-3.5 py-2.5 text-start text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#0B0F19] text-white'
                      : 'bg-[#F4F4F5] text-[#0B0F19] hover:bg-[#ECFCCB]/70'
                  }`}
                >
                  {categoryLabel(cat)}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#3F6F00]">
            {t('productsPage.goldCarat')}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {CARAT_OPTIONS.map((carat) => {
              const active = selectedCarats.includes(carat)
              return (
                <button
                  key={carat}
                  type="button"
                  onClick={() => onToggleCarat(carat)}
                  aria-pressed={active}
                  className={`rounded-xl border px-3 py-3 text-center text-sm font-bold tabular-nums transition-colors ${
                    active
                      ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19] ring-1 ring-[#85E307]/40'
                      : 'border-black/10 bg-white text-[#0B0F19] hover:border-[#85E307]/50 hover:bg-[#F9F9FA]'
                  }`}
                >
                  {carat}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#3F6F00]">
            {t('productsPage.metalType')}
          </h4>
          <div className="flex flex-wrap gap-2">
            {METAL_OPTIONS.map((metal) => {
              const active = selectedMetals.includes(metal)
              return (
                <button
                  key={metal}
                  type="button"
                  onClick={() => onToggleMetal(metal)}
                  aria-pressed={active}
                  className={`rounded-full border px-3.5 py-2 text-sm font-semibold capitalize transition-colors ${
                    active
                      ? 'border-[#0B0F19] bg-[#0B0F19] text-white'
                      : 'border-black/10 bg-white text-[#475569] hover:border-black/20'
                  }`}
                >
                  {t(`productsPage.metal.${metal}`)}
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-[#3F6F00]">
            {t('productsPage.priceRange')}
          </h4>
          <p className="mb-2 text-xs text-[#64748B]">{t('productsPage.priceRangeHint')}</p>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#64748B]">
                {t('productsPage.minPlaceholder')}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder={t('productsPage.minPlaceholder')}
                value={minPriceParam}
                onChange={(e) => onMinPrice(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm font-medium text-[#0B0F19] outline-none transition focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[#64748B]">
                {t('productsPage.maxPlaceholder')}
              </span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                placeholder={t('productsPage.maxPlaceholder')}
                value={maxPriceParam}
                onChange={(e) => onMaxPrice(e.target.value)}
                className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm font-medium text-[#0B0F19] outline-none transition focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25"
              />
            </label>
          </div>
        </section>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const [searchParams, setSearchParams] = useSearchParams()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)
  const [searchDraft, setSearchDraft] = useState(searchParams.get('search') || '')

  const category = searchParams.get('category')
  const search = searchParams.get('search')
  const caratsParam = searchParams.get('carats') || ''
  const metalsParam = searchParams.get('metals') || ''
  const minPriceParam = searchParams.get('minPrice') || ''
  const maxPriceParam = searchParams.get('maxPrice') || ''
  const sortParam = (searchParams.get('sort') as SortKey) || 'featured'

  useEffect(() => {
    setSearchDraft(search || '')
  }, [search])

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', category ?? '', search ?? ''],
    queryFn: () => productsApi.getProducts({ category, search }),
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  })

  const { data: categoryDetail } = useQuery({
    queryKey: ['category', category],
    queryFn: () => productsApi.getCategory(category!),
    enabled: !!category,
  })

  const productsResp = products as PaginatedResponse<Product> | undefined
  const productList = useMemo(() => productsResp?.results ?? [], [productsResp])

  const activeProductList = useMemo(
    () => productList.filter((p) => p.status === 'active'),
    [productList],
  )

  const categoriesResp = categories as PaginatedResponse<Category> | undefined
  const categoryList = categoriesResp?.results || []

  const activeCategory = categoryDetail as Category | undefined
  const subcategories = Array.isArray(activeCategory?.subcategories)
    ? (activeCategory!.subcategories as Array<{ slug?: string; name_en?: string; name_ar?: string }>)
    : []

  const selectedCarats = useMemo(
    () =>
      caratsParam
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    [caratsParam],
  )

  const selectedMetals = useMemo(
    () =>
      metalsParam
        .split(',')
        .map((v) => v.trim().toLowerCase())
        .filter(Boolean),
    [metalsParam],
  )

  const minPrice = minPriceParam ? Number(minPriceParam) : NaN
  const maxPrice = maxPriceParam ? Number(maxPriceParam) : NaN

  const filteredProducts = useMemo(() => {
    let list = activeProductList.filter((product) => {
      const unitPrice = productUnitPrice(product)
      const productCaratValue = product.carat?.carat_value
      const productCaratLabel = productCaratValue ? `${productCaratValue}K` : null
      const metal = (
        product.metal_type?.name ||
        product.metal_type?.display_name_en ||
        ''
      )
        .toString()
        .toLowerCase()

      if (selectedCarats.length > 0 && (!productCaratLabel || !selectedCarats.includes(productCaratLabel))) {
        return false
      }
      if (selectedMetals.length > 0) {
        const match = selectedMetals.some((m) => metal.includes(m))
        if (!match) return false
      }
      if (Number.isFinite(minPrice) && unitPrice < minPrice) return false
      if (Number.isFinite(maxPrice) && unitPrice > maxPrice) return false
      return true
    })

    list = [...list]
    switch (sortParam) {
      case 'price-asc':
        list.sort((a, b) => productUnitPrice(a) - productUnitPrice(b))
        break
      case 'price-desc':
        list.sort((a, b) => productUnitPrice(b) - productUnitPrice(a))
        break
      case 'weight-asc':
        list.sort((a, b) => Number(a.weight_grams) - Number(b.weight_grams))
        break
      case 'weight-desc':
        list.sort((a, b) => Number(b.weight_grams) - Number(a.weight_grams))
        break
      case 'newest':
        list.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        break
      case 'featured':
      default:
        list.sort((a, b) => Number(b.is_featured) - Number(a.is_featured))
        break
    }
    return list
  }, [activeProductList, selectedCarats, selectedMetals, minPrice, maxPrice, sortParam])

  const fetchTrends = useProductPriceTrendSincePreviousFetch(activeProductList)

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

  const updateParams = (entries: Record<string, string>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(entries)) {
      if (!value) next.delete(key)
      else next.set(key, value)
    }
    setSearchParams(next)
  }

  const toggleCarat = (carat: string) => {
    const current = new Set(selectedCarats)
    if (current.has(carat)) current.delete(carat)
    else current.add(carat)
    const value = Array.from(current)
      .sort((a, b) => Number(b.replace('K', '')) - Number(a.replace('K', '')))
      .join(',')
    updateParam('carats', value)
  }

  const toggleMetal = (metal: string) => {
    const current = new Set(selectedMetals)
    if (current.has(metal)) current.delete(metal)
    else current.add(metal)
    updateParam('metals', Array.from(current).join(','))
  }

  const clearFilters = () => {
    updateParams({
      category: '',
      carats: '',
      metals: '',
      minPrice: '',
      maxPrice: '',
      search: '',
      sort: '',
    })
    setSearchDraft('')
  }

  const activeFilterCount =
    (category ? 1 : 0) +
    selectedCarats.length +
    selectedMetals.length +
    (minPriceParam ? 1 : 0) +
    (maxPriceParam ? 1 : 0) +
    (search ? 1 : 0)

  const commitSearch = () => {
    updateParam('search', searchDraft.trim())
  }

  const filterProps = {
    category,
    categoryList,
    categoryLabel,
    selectedCarats,
    selectedMetals,
    minPriceParam,
    maxPriceParam,
    onCategory: (slug: string) => updateParam('category', slug),
    onToggleCarat: toggleCarat,
    onToggleMetal: toggleMetal,
    onMinPrice: (v: string) => updateParam('minPrice', v),
    onMaxPrice: (v: string) => updateParam('maxPrice', v),
    onClear: clearFilters,
    activeFilterCount,
  }

  return (
    <div className="min-h-screen bg-[#F9F9FA]">
      <div className="border-b border-black/5 bg-white">
        <div className="page-shell py-6 sm:py-8">
          {category ? (
            <nav className="mb-3 text-sm text-[#64748B]" aria-label={t('common.breadcrumb')}>
              <Link to="/products" className="font-medium text-[#3F6F00] hover:underline">
                {t('productsPage.allProducts')}
              </Link>
              <span className="mx-2 text-[#94A3B8]">/</span>
              <span className="font-medium text-[#0B0F19]">
                {activeCategory != null ? categoryLabel(activeCategory) : category}
              </span>
            </nav>
          ) : null}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
                {t('productsPage.kicker')}
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-[#0B0F19] sm:text-3xl">
                {pageTitle}
              </h1>
              <p className="mt-1.5 text-sm text-[#64748B]">
                {isLoading
                  ? t('common.loading')
                  : t('productsPage.productsFound', { count: filteredProducts.length })}
              </p>
            </div>

            <form
              className="relative w-full max-w-md"
              onSubmit={(e) => {
                e.preventDefault()
                commitSearch()
              }}
            >
              <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="search"
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder={t('productsPage.searchPlaceholder')}
                className="w-full rounded-xl border border-black/10 bg-[#F9F9FA] py-3 pe-10 ps-10 text-sm font-medium text-[#0B0F19] outline-none transition focus:border-[#85E307] focus:bg-white focus:ring-2 focus:ring-[#85E307]/25"
                aria-label={t('productsPage.searchPlaceholder')}
              />
              {searchDraft ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchDraft('')
                    updateParam('search', '')
                  }}
                  className="absolute end-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#94A3B8] hover:bg-black/5 hover:text-[#0B0F19]"
                  aria-label={t('productsPage.clearSearch')}
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </form>
          </div>

          {subcategories.length > 0 && !activeCategory?.parent ? (
            <div className="mt-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {subcategories.map((sub) => {
                if (!sub.slug) return null
                const isActive = category === sub.slug
                const subLabel = isAr && sub.name_ar ? sub.name_ar : sub.name_en || sub.slug
                return (
                  <Link
                    key={sub.slug}
                    to={`/products?category=${encodeURIComponent(sub.slug)}`}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-[#0B0F19] bg-[#0B0F19] text-white'
                        : 'border-black/10 bg-white text-[#0B0F19] hover:border-[#85E307]/50 hover:bg-[#ECFCCB]/50'
                    }`}
                  >
                    {subLabel}
                  </Link>
                )
              })}
            </div>
          ) : null}

          {activeCategory?.parent_slug ? (
            <div className="mt-4">
              <Link
                to={`/products?category=${encodeURIComponent(activeCategory.parent_slug)}`}
                className="text-sm font-semibold text-[#3F6F00] hover:underline"
              >
                {t('productsPage.backToParent', {
                  parent: activeCategory.parent_name || t('productsPage.parentCategoryFallback'),
                })}
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      <div className="page-shell py-6 sm:py-8">
        {/* Toolbar */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-semibold text-[#0B0F19] shadow-sm transition hover:border-[#85E307]/40 hover:bg-[#ECFCCB]/40 lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {t('productsPage.filters')}
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0B0F19] px-1.5 text-[11px] font-bold text-[#85E307]">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            {activeFilterCount > 0 ? (
              <div className="flex max-w-full flex-wrap items-center gap-1.5">
                {search ? (
                  <FilterChip
                    label={`${t('productsPage.searchChip')}: ${search}`}
                    onRemove={() => {
                      setSearchDraft('')
                      updateParam('search', '')
                    }}
                  />
                ) : null}
                {selectedCarats.map((c) => (
                  <FilterChip key={c} label={c} onRemove={() => toggleCarat(c)} />
                ))}
                {selectedMetals.map((m) => (
                  <FilterChip
                    key={m}
                    label={t(`productsPage.metal.${m}`)}
                    onRemove={() => toggleMetal(m)}
                  />
                ))}
                {minPriceParam || maxPriceParam ? (
                  <FilterChip
                    label={`${minPriceParam || '0'} – ${maxPriceParam || '∞'} ${t('productsPage.kwd')}`}
                    onRemove={() => updateParams({ minPrice: '', maxPrice: '' })}
                  />
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:flex-none">
              <ArrowUpDown className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
              <select
                value={sortParam}
                onChange={(e) => updateParam('sort', e.target.value === 'featured' ? '' : e.target.value)}
                className="w-full appearance-none rounded-xl border border-black/10 bg-white py-2.5 pe-8 ps-9 text-sm font-semibold text-[#0B0F19] outline-none transition focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25 sm:w-48"
                aria-label={t('productsPage.sortBy')}
              >
                <option value="featured">{t('productsPage.sort.featured')}</option>
                <option value="newest">{t('productsPage.sort.newest')}</option>
                <option value="price-asc">{t('productsPage.sort.priceAsc')}</option>
                <option value="price-desc">{t('productsPage.sort.priceDesc')}</option>
                <option value="weight-asc">{t('productsPage.sort.weightAsc')}</option>
                <option value="weight-desc">{t('productsPage.sort.weightDesc')}</option>
              </select>
            </div>

            <div
              className="inline-flex rounded-xl border border-black/10 bg-white p-1 shadow-sm"
              role="group"
              aria-label={t('productsPage.viewMode')}
            >
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-pressed={viewMode === 'grid'}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  viewMode === 'grid'
                    ? 'bg-[#0B0F19] text-white'
                    : 'text-[#64748B] hover:text-[#0B0F19]'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span className="hidden sm:inline">{t('productsPage.gridView')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  viewMode === 'list'
                    ? 'bg-[#0B0F19] text-white'
                    : 'text-[#64748B] hover:text-[#0B0F19]'
                }`}
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">{t('productsPage.listView')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar — always visible */}
          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-24 rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <FilterPanel {...filterProps} />
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-3">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-2xl border border-black/5 bg-white p-4"
                  >
                    <div className="mb-4 aspect-[4/3] rounded-xl bg-[#E2E8F0]" />
                    <div className="mb-2 h-4 rounded bg-[#E2E8F0]" />
                    <div className="h-4 w-2/3 rounded bg-[#E2E8F0]" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-black/10 bg-white px-6 py-16 text-center">
                <p className="text-base font-semibold text-[#0B0F19]">
                  {t('productsPage.noMatchFilters')}
                </p>
                <p className="mt-2 text-sm text-[#64748B]">{t('productsPage.noMatchHint')}</p>
                {activeFilterCount > 0 ? (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="gold-button mt-6 inline-flex"
                  >
                    {t('productsPage.clearAll')}
                  </button>
                ) : null}
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3'
                    : 'space-y-3'
                }
              >
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode={viewMode}
                    isAr={isAr}
                    fetchTrends={fetchTrends}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent
          side={isAr ? 'left' : 'right'}
          className="flex w-full max-w-md flex-col border-black/10 bg-white p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-black/5 px-5 py-4 text-start">
            <SheetTitle className="text-[#0B0F19]">{t('productsPage.filtersHeading')}</SheetTitle>
            <SheetDescription className="text-[#64748B]">
              {t('productsPage.filtersSheetDesc')}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <FilterPanel {...filterProps} />
          </div>
          <SheetFooter className="border-t border-black/5 bg-[#F9F9FA]">
            <button
              type="button"
              onClick={() => setFilterSheetOpen(false)}
              className="gold-button w-full"
            >
              {t('productsPage.showResults', { count: filteredProducts.length })}
            </button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-[14rem] items-center gap-1.5 rounded-full border border-black/10 bg-white py-1.5 pe-2 ps-3 text-xs font-semibold text-[#0B0F19] transition hover:border-[#85E307]/40 hover:bg-[#ECFCCB]/40"
    >
      <span className="truncate">{label}</span>
      <X className="h-3.5 w-3.5 shrink-0 text-[#64748B]" />
    </button>
  )
}

function ProductCard({
  product,
  viewMode,
  isAr,
  fetchTrends,
}: {
  product: Product
  viewMode: ViewMode
  isAr: boolean
  fetchTrends: ProductFetchTrendMap
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
  const ft = fetchTrends[product.id]
  const trendOverride = ft?.trend ?? null
  const percentOverride = ft?.percent ?? null
  const outOfStock = isProductOutOfStock(product)

  const addButtonClass =
    'flex items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1F2937] shrink-0 disabled:cursor-not-allowed disabled:bg-[#94A3B8]'

  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center">
        <Link to={`/products/${product.slug}`} className="flex min-w-0 flex-1 gap-4">
          <div className="h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-[#F4F4F5] ring-1 ring-black/10 sm:h-32 sm:w-32 relative">
            {imageSrc ? (
              <img src={imageSrc} alt={productName} className={`h-full w-full object-cover ${outOfStock ? 'grayscale-[0.35]' : ''}`} />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-[#94A3B8]">
                {t('productsPage.noImage')}
              </div>
            )}
            <ProductStockOverlay product={product} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <ProductStockBadge product={product} />
            </div>
            <h3 className="mb-1 text-base font-semibold text-[#0B0F19] sm:text-lg">{productName}</h3>
            <p className="mb-2 line-clamp-2 text-sm text-[#64748B]">
              {descSource ? `${descSource.substring(0, 100)}...` : ''}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-lg border border-black/10 bg-[#F9F9FA] px-2.5 py-1.5 text-sm font-semibold text-[#0B0F19]">
                <ProductPriceTrendArrow
                  product={product}
                  variant="light"
                  showPercent
                  trendOverride={trendOverride}
                  percentOverride={percentOverride}
                />
                {formatKwd(unitPrice)} KWD
              </span>
              <span className="text-sm text-[#64748B]">{caratLabel}</span>
              <span className="text-sm text-[#64748B]">{product.weight_grams}g</span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-2 sm:w-40 sm:flex-col sm:justify-center">
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={outOfStock}
            className={`${addButtonClass} w-full`}
          >
            <ShoppingCart className="h-4 w-4 shrink-0" />
            {outOfStock ? t('stock.outOfStock') : t('productsPage.addToCart')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex flex-col rounded-2xl border border-black/10 bg-white p-3 transition-shadow hover:shadow-md sm:p-4">
      <Link to={`/products/${product.slug}`} className="block min-w-0 flex-1">
        <div className={`relative mb-3 aspect-[4/3] overflow-hidden rounded-xl bg-[#F4F4F5] ring-1 ring-black/10 ${outOfStock ? 'grayscale-[0.35]' : ''}`}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={productName}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-sm text-[#94A3B8]">{t('productsPage.noImage')}</span>
            </div>
          )}
          <ProductStockOverlay product={product} />
          <div className="absolute start-2 top-2 flex flex-col gap-1">
            <ProductStockBadge product={product} />
          </div>
          <div className="absolute end-2 top-2">
            <span className="rounded-lg bg-white/95 px-2 py-1 text-xs font-bold text-[#0B0F19] shadow-sm ring-1 ring-black/10">
              {caratLabel}
            </span>
          </div>
        </div>
        <h3 className="line-clamp-1 text-sm font-semibold text-[#0B0F19] transition-colors group-hover:underline decoration-black/20">
          {productName}
        </h3>
        <p className="mb-2 text-xs text-[#64748B]">{product.weight_grams}g</p>
        <div className="inline-flex flex-wrap items-center gap-2 rounded-lg border border-black/10 bg-[#F9F9FA] px-2.5 py-1.5 text-sm font-semibold text-[#0B0F19]">
          <ProductPriceTrendArrow
            product={product}
            variant="light"
            showPercent
            trendOverride={trendOverride}
            percentOverride={percentOverride}
          />
          <span>{formatKwd(unitPrice)} KWD</span>
        </div>
      </Link>
      <button
        type="button"
        onClick={() => addToCart(product)}
        disabled={outOfStock}
        className={`${addButtonClass} mt-3 w-full`}
      >
        <ShoppingCart className="h-4 w-4 shrink-0" />
        {outOfStock ? t('stock.outOfStock') : t('productsPage.addToCart')}
      </button>
    </div>
  )
}
