import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Grid3X3,
  List,
  SlidersHorizontal,
  ShoppingCart,
  X,
  ArrowUpDown,
} from 'lucide-react'
import { productsApi } from '../services/api'
import type { Product, Category } from '../types'
import ProductPriceTrendArrow from '../components/ProductPriceTrendArrow'
import { productImageSrc } from '../utils/productImage'
import { productUnitPrice, formatKwd } from '../utils/productPrice'
import { formatProductCaratLabel } from '../utils/productCaratLabel'
import { useCart } from '../contexts/CartContext'
import { ProductStockBadge, ProductStockOverlay, ProductStockStatusLabel } from '@/components/products/ProductStockBadge'
import { DigitalOwnershipBadge } from '@/components/products/DigitalOwnershipBadge'
import { PriceRangeFilter } from '@/components/products/PriceRangeFilter'
import { ProductSearchBox } from '@/components/products/ProductSearchBox'
import { Skeleton } from '@/components/ui/skeleton'
import { isProductLowStock, isProductOutOfStock, productFineness } from '@/utils/productStock'
import {
  useProductPriceTrendSincePreviousFetch,
  type ProductFetchTrendMap,
} from '../hooks/useProductPriceTrendSincePreviousFetch'
import { useShippingEtaLabel } from '@/hooks/useShippingEtaLabel'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { RevealSection } from '@/components/motion/RevealSection'
import { usePageEnter } from '@/motion/usePageEnter'

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
  priceBoundsMin,
  priceBoundsMax,
  onCategory,
  onToggleCarat,
  onToggleMetal,
  onPriceRange,
  onClear,
  activeFilterCount,
  showHeading = true,
  /** Desktop sticky sidebar: constrain height + internal scroll so long lists never blow the page */
  constrained = false,
}: {
  category: string | null
  categoryList: Category[]
  categoryLabel: (c: { name_en: string; name_ar?: string }) => string
  selectedCarats: string[]
  selectedMetals: string[]
  minPriceParam: string
  maxPriceParam: string
  priceBoundsMin: number
  priceBoundsMax: number
  onCategory: (slug: string) => void
  onToggleCarat: (carat: string) => void
  onToggleMetal: (metal: string) => void
  onPriceRange: (min: string, max: string) => void
  onClear: () => void
  activeFilterCount: number
  showHeading?: boolean
  constrained?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex min-h-0 flex-col', constrained && 'h-full')}>
      {showHeading ? (
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3 sm:mb-5">
          <div className="min-w-0">
            <h3 className="type-card-title text-[#0B0F19]">
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
              className="shrink-0 text-xs font-semibold text-[#3F6F00] transition-colors hover:text-[#2d5200]"
            >
              {t('productsPage.clearAll')}
            </button>
          ) : null}
        </div>
      ) : activeFilterCount > 0 ? (
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <p className="text-xs text-[#64748B]">
            {t('productsPage.activeFiltersCount', { count: activeFilterCount })}
          </p>
          <button
            type="button"
            onClick={onClear}
            className="text-xs font-semibold text-[#3F6F00] transition-colors hover:text-[#2d5200]"
          >
            {t('productsPage.clearAll')}
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          'space-y-7 pe-1',
          constrained
            ? 'min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]'
            : 'overflow-visible',
        )}
      >
        <section className="min-w-0">
          <h4 className="filter-panel__section-title page-kicker">
            {t('productsPage.categories')}
          </h4>
          <div
            className={cn(
              'filter-panel__option-list flex flex-col gap-1.5',
              // Cap category growth so karat / metal / price stay reachable as catalog expands
              'max-h-[min(40vh,17.5rem)] overflow-y-auto overscroll-contain pe-0.5',
            )}
            role="listbox"
            aria-label={t('productsPage.categories')}
          >
            <button
              type="button"
              role="option"
              aria-selected={!category}
              onClick={() => onCategory('')}
              className={`filter-panel__option shrink-0 rounded-xl px-3.5 py-2.5 text-start text-sm font-medium transition-colors ${
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
                  role="option"
                  aria-selected={active}
                  onClick={() => onCategory(active ? '' : cat.slug)}
                  className={`filter-panel__option shrink-0 rounded-xl px-3.5 py-2.5 text-start text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#0B0F19] text-white'
                      : 'bg-[#F4F4F5] text-[#0B0F19] hover:bg-[#ECFCCB]/70'
                  }`}
                >
                  <span className="line-clamp-2 break-words">{categoryLabel(cat)}</span>
                </button>
              )
            })}
          </div>
        </section>

        <section className="min-w-0">
          <h4 className="filter-panel__section-title page-kicker">
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
                  className={`filter-panel__chip rounded-xl border px-3 py-3 text-center text-sm font-bold tabular-nums transition-colors ${
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

        <section className="min-w-0">
          <h4 className="filter-panel__section-title page-kicker">
            {t('productsPage.metalType')}
          </h4>
          <div className="flex max-h-[min(28vh,11rem)] flex-wrap content-start gap-2 overflow-y-auto overscroll-contain pe-0.5">
            {METAL_OPTIONS.map((metal) => {
              const active = selectedMetals.includes(metal)
              return (
                <button
                  key={metal}
                  type="button"
                  onClick={() => onToggleMetal(metal)}
                  aria-pressed={active}
                  className={`filter-panel__chip shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold capitalize transition-colors ${
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

        <section className="min-w-0">
          <h4 className="filter-panel__section-title page-kicker">
            {t('productsPage.priceRange')}
          </h4>
          <p className="mb-3 text-xs text-[#64748B]">{t('productsPage.priceRangeHint')}</p>
          <PriceRangeFilter
            minParam={minPriceParam}
            maxParam={maxPriceParam}
            boundsMin={priceBoundsMin}
            boundsMax={priceBoundsMax}
            onCommit={onPriceRange}
          />
        </section>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const heroRef = usePageEnter()
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

  const { data: products, isLoading, isFetching } = useQuery({
    queryKey: ['products', category ?? '', search ?? ''],
    queryFn: () =>
      productsApi.getProducts({
        category: category || undefined,
        search: search || undefined,
        // FTS ranks server-side; pull a fuller page when searching so relevance isn't truncated at 20.
        page_size: search ? 100 : 40,
      }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
    staleTime: 60_000,
  })

  const { data: categoryDetail, isPending: categoryDetailPending } = useQuery({
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

  const { priceBoundsMin, priceBoundsMax } = useMemo(() => {
    if (activeProductList.length === 0) {
      return { priceBoundsMin: 0, priceBoundsMax: 1000 }
    }
    let lo = Infinity
    let hi = -Infinity
    for (const p of activeProductList) {
      const price = productUnitPrice(p)
      if (!Number.isFinite(price)) continue
      if (price < lo) lo = price
      if (price > hi) hi = price
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
      return { priceBoundsMin: 0, priceBoundsMax: 1000 }
    }
    const floor = Math.max(0, Math.floor(lo))
    const ceil = Math.max(floor + 1, Math.ceil(hi))
    return { priceBoundsMin: floor, priceBoundsMax: ceil }
  }, [activeProductList])

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

  const updateParams = (entries: Record<string, string>, replace = false) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(entries)) {
      if (!value) next.delete(key)
      else next.set(key, value)
    }
    setSearchParams(next, { replace })
  }

  const commitPriceRange = (min: string, max: string) => {
    updateParams({ minPrice: min, maxPrice: max }, true)
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

  const isInitialLoad = isLoading && productList.length === 0

  const filterProps = {
    category,
    categoryList,
    categoryLabel,
    selectedCarats,
    selectedMetals,
    minPriceParam,
    maxPriceParam,
    priceBoundsMin,
    priceBoundsMax,
    onCategory: (slug: string) => updateParam('category', slug),
    onToggleCarat: toggleCarat,
    onToggleMetal: toggleMetal,
    onPriceRange: commitPriceRange,
    onClear: clearFilters,
    activeFilterCount,
  }

  return (
    <div className="min-h-screen bg-[#F9F9FA]">
      <div
        ref={heroRef as React.RefObject<HTMLDivElement>}
        className="border-b border-black/5 bg-white"
      >
        <div className="page-shell py-4 sm:py-[var(--space-page-y)]">
          {category ? (
            <nav className="mb-2 text-xs text-[#64748B] sm:mb-3 sm:text-sm" aria-label={t('common.breadcrumb')} data-motion="enter">
              <Link to="/products" className="font-medium text-[#3F6F00] hover:underline">
                {t('productsPage.allProducts')}
              </Link>
              <span className="mx-2 text-[#94A3B8]">/</span>
              <span className="font-medium text-[#0B0F19]">
                {activeCategory != null ? categoryLabel(activeCategory) : category}
              </span>
            </nav>
          ) : null}

          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0" data-motion="enter">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#3F6F00] sm:mb-1.5 sm:text-[11px] sm:tracking-[0.22em]">
                {t('productsPage.kicker')}
              </p>
              <h1 className="type-page-title min-h-[1.75rem] text-xl text-[#0B0F19] sm:min-h-[2.5rem] sm:text-3xl">
                {pageTitle}
              </h1>
              <p className="mt-1 min-h-[1.125rem] text-xs tabular-nums text-[#64748B] sm:mt-1.5 sm:min-h-[1.25rem] sm:text-sm">
                {isInitialLoad ? (
                  <Skeleton className="inline-block h-3.5 w-28 rounded bg-[#E2E8F0]" aria-hidden />
                ) : (
                  t('productsPage.productsFound', { count: filteredProducts.length })
                )}
              </p>
            </div>

            <div data-motion="enter">
            <ProductSearchBox
              value={searchDraft}
              category={category}
              onChange={setSearchDraft}
              onCommit={(q) => {
                setSearchDraft(q)
                updateParam('search', q)
              }}
              onClear={() => {
                setSearchDraft('')
                updateParam('search', '')
              }}
            />
            </div>
          </div>

          {category && !activeCategory?.parent ? (
            <div className="mt-3 min-h-[2rem] sm:mt-5">
              {categoryDetailPending && subcategories.length === 0 ? (
                <div className="flex gap-1.5 overflow-hidden sm:gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-20 shrink-0 rounded-full bg-[#E2E8F0] sm:w-24" />
                  ))}
                </div>
              ) : subcategories.length > 0 ? (
                <div className="flex gap-1.5 overflow-x-auto pb-1 sm:gap-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {subcategories.map((sub) => {
                    if (!sub.slug) return null
                    const isActive = category === sub.slug
                    const subLabel = isAr && sub.name_ar ? sub.name_ar : sub.name_en || sub.slug
                    return (
                      <Link
                        key={sub.slug}
                        to={`/products?category=${encodeURIComponent(sub.slug)}`}
                        className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors sm:px-4 sm:py-2 sm:text-sm ${
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

      <RevealSection as="div" className="page-shell pb-6 pt-2 sm:py-[var(--space-page-y)]" y="sm">
        {/* Toolbar */}
        <div className="mb-3 flex min-h-[2.75rem] flex-col gap-2 sm:mb-5 sm:min-h-0 sm:gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-h-[2.5rem] flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterSheetOpen(true)}
              className="products-filter-trigger inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2.5 text-xs font-semibold text-[#0B0F19] shadow-sm transition hover:border-[#85E307]/40 hover:bg-[#ECFCCB]/40 sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t('productsPage.filters')}
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#0B0F19] px-1.5 text-[11px] font-bold text-[#85E307]">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>

            {activeFilterCount > 0 ? (
              <div className="flex max-h-[4.75rem] max-w-full flex-wrap items-center gap-1.5 overflow-y-auto overscroll-contain pe-0.5 sm:max-h-[6.5rem]">
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
              <ArrowUpDown className="pointer-events-none absolute start-3 top-1/2 z-10 h-3.5 w-3.5 -translate-y-1/2 text-[#94A3B8]" />
              <Select
                value={sortParam}
                onValueChange={(v) => updateParam('sort', v === 'featured' ? '' : v)}
              >
                <SelectTrigger
                  aria-label={t('productsPage.sortBy')}
                  className="touch-target--row h-auto min-h-11 w-full rounded-xl border border-black/10 bg-white py-2.5 pe-7 ps-8 text-xs font-semibold text-[#0B0F19] shadow-none outline-none transition hover:border-[#85E307]/50 focus-visible:border-[#85E307] focus-visible:ring-2 focus-visible:ring-[#85E307]/25 sm:w-52 sm:py-2.5 sm:pe-8 sm:ps-9 sm:text-sm [&>svg]:hidden"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  align="end"
                  sideOffset={6}
                  className="z-[80] overflow-hidden rounded-xl border border-black/10 bg-white p-0 text-[#0B0F19] shadow-[0_18px_40px_-16px_rgba(11,15,25,0.35)]"
                >
                  <div className="p-1.5">
                    {(
                      [
                        ['featured', 'productsPage.sort.featured'],
                        ['newest', 'productsPage.sort.newest'],
                        ['price-asc', 'productsPage.sort.priceAsc'],
                        ['price-desc', 'productsPage.sort.priceDesc'],
                        ['weight-asc', 'productsPage.sort.weightAsc'],
                        ['weight-desc', 'productsPage.sort.weightDesc'],
                      ] as const
                    ).map(([value, labelKey]) => (
                      <SelectItem
                        key={value}
                        value={value}
                        className="cursor-pointer rounded-lg py-2.5 ps-3 pe-10 text-sm font-medium text-[#0B0F19] outline-none data-[highlighted]:bg-[#ECFCCB]/75 data-[highlighted]:text-[#0B0F19] data-[state=checked]:bg-[#ECFCCB] data-[state=checked]:font-semibold data-[state=checked]:text-[#3F6F00] focus:bg-[#ECFCCB]/75 focus:text-[#0B0F19] [&_svg]:text-[#3F6F00]"
                      >
                        {t(labelKey)}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
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
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm ${
                  viewMode === 'grid'
                    ? 'bg-[#0B0F19] text-white'
                    : 'text-[#64748B] hover:text-[#0B0F19]'
                }`}
              >
                <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('productsPage.gridView')}</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold transition sm:gap-1.5 sm:px-3 sm:py-2 sm:text-sm ${
                  viewMode === 'list'
                    ? 'bg-[#0B0F19] text-white'
                    : 'text-[#64748B] hover:text-[#0B0F19]'
                }`}
              >
                <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{t('productsPage.listView')}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop sidebar — always visible */}
          <aside className="hidden w-72 shrink-0 self-start lg:block xl:w-80">
            <div className="sticky top-[calc(var(--nav-offset,7.25rem)+0.5rem)] flex max-h-[calc(100dvh-var(--nav-offset,7.25rem)-1.25rem)] flex-col overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
              <FilterPanel {...filterProps} constrained />
            </div>
          </aside>

          <div
            className={`min-w-0 flex-1 transition-opacity duration-200 ${isFetching && !isInitialLoad ? 'opacity-70' : 'opacity-100'}`}
          >
            {isInitialLoad ? (
              <ProductGridSkeleton viewMode={viewMode} />
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
                    ? 'grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3'
                    : 'space-y-2 sm:space-y-3'
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
      </RevealSection>

      {/* Mobile filter sheet */}
      <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
        <SheetContent
          side={isAr ? 'left' : 'right'}
          className="flex w-full max-w-md flex-col border-black/10 bg-white p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-black/5 px-5 py-4 pe-12 text-start">
            <SheetTitle className="pe-1 text-[#0B0F19]">{t('productsPage.filtersHeading')}</SheetTitle>
            <SheetDescription className="text-[#64748B]">
              {t('productsPage.filtersSheetDesc')}
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <FilterPanel {...filterProps} showHeading={false} />
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

function ProductGridSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-2 sm:space-y-3" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex gap-3 rounded-xl border border-black/10 bg-white p-2.5 md:hidden"
          >
            <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-lg bg-[#E2E8F0]" />
            <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-[85%] rounded bg-[#E2E8F0]" />
                <Skeleton className="h-2.5 w-[55%] rounded bg-[#E2E8F0]" />
              </div>
              <div className="flex items-center justify-between gap-2">
                <Skeleton className="h-4 w-20 rounded bg-[#E2E8F0]" />
                <Skeleton className="h-8 w-8 shrink-0 rounded-lg bg-[#E2E8F0]" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex min-w-0 flex-col rounded-2xl border border-black/10 bg-white p-2 sm:p-3.5"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-xl bg-[#E2E8F0]" />
          <div className="mt-1.5 space-y-2 px-0.5">
            <Skeleton className="h-3.5 w-full rounded bg-[#E2E8F0]" />
            <Skeleton className="h-2.5 w-[80%] rounded bg-[#E2E8F0]" />
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <Skeleton className="h-4 w-16 rounded bg-[#E2E8F0]" />
              <Skeleton className="h-3 w-10 rounded bg-[#E2E8F0]" />
            </div>
            <Skeleton className="h-3 w-full rounded bg-[#E2E8F0]" />
            <Skeleton className="h-8 w-full rounded-lg bg-[#E2E8F0]" />
          </div>
        </div>
      ))}
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
  const shipsInLabel = useShippingEtaLabel()
  const imageSrc = productImageSrc(product)
  const unitPrice = productUnitPrice(product)
  const productName = isAr && product.name_ar ? product.name_ar : product.name_en
  const descSource =
    isAr && product.description_ar ? product.description_ar : product.description_en
  const caratLabel = formatProductCaratLabel(product.carat, isAr ? 'ar' : 'en')
  const categoryName =
    isAr && product.category?.name_ar ? product.category.name_ar : product.category?.name_en
  const fineness = productFineness(product)
  const specParts = [
    `${product.weight_grams}g`,
    fineness != null
      ? t('home.fineSpec', { value: fineness.toLocaleString('en-US'), defaultValue: '{{value}} fine' })
      : caratLabel,
    categoryName,
  ].filter(Boolean) as string[]
  const ft = fetchTrends[product.id]
  const trendOverride = ft?.trend ?? null
  const percentOverride = ft?.percent ?? null
  const outOfStock = isProductOutOfStock(product)
  const lowStock = isProductLowStock(product)

  const addButtonClass =
    'flex items-center justify-center gap-1 sm:gap-1.5 rounded-lg sm:rounded-xl bg-[#0B0F19] px-1.5 py-1.5 sm:px-3 sm:py-2.5 text-[10px] sm:text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#1F2937] shrink-0 disabled:cursor-not-allowed disabled:bg-[#94A3B8]'

  if (viewMode === 'list') {
    return (
      <article className="group overflow-hidden rounded-xl border border-black/10 bg-white transition-shadow hover:shadow-md sm:rounded-2xl">
        {/* Mobile — compact catalog row */}
        <div className="flex gap-3 p-2.5 md:hidden">
          <Link to={`/products/${product.slug}`} className="shrink-0">
            <div
              className={`relative h-[72px] w-[72px] overflow-hidden rounded-lg bg-[#F4F4F5] ring-1 ring-black/5 ${
                outOfStock ? 'grayscale-[0.35]' : ''
              }`}
            >
              {imageSrc ? (
                <img src={imageSrc} alt={productName} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-[#94A3B8]">
                  {t('productsPage.noImage')}
                </div>
              )}
              <ProductStockOverlay product={product} />
            </div>
          </Link>

          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div className="min-w-0">
              <Link to={`/products/${product.slug}`} className="block min-w-0">
                <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-[#0B0F19] transition-colors group-hover:underline decoration-black/20">
                  {productName}
                </h3>
              </Link>
              {specParts.length ? (
                <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-[#64748B]">{specParts.join(' · ')}</p>
              ) : null}
              <div className="mt-1">
                <DigitalOwnershipBadge
                  variant="compact"
                  verifyCode={product.serial_number || product.sku || null}
                  to={`/products/${product.slug}#product-authenticity`}
                />
              </div>
              {!outOfStock ? (
                <div className="mt-1">
                  <ProductStockStatusLabel product={product} className="text-[9px]" />
                </div>
              ) : null}
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
                <span className="text-[14px] font-bold leading-none text-[#0B0F19] tabular-nums tracking-tight">
                  {formatKwd(unitPrice)}
                  <span className="ms-0.5 text-[9px] font-semibold text-[#64748B]">KWD</span>
                </span>
                <span className="inline-flex min-h-[14px] min-w-[2.75rem] shrink-0 items-center">
                  <ProductPriceTrendArrow
                    product={product}
                    variant="light"
                    showPercent
                    trendOverride={trendOverride}
                    percentOverride={percentOverride}
                    className="shrink-0"
                    size="sm"
                    forceVisible
                  />
                </span>
              </div>
              <button
                type="button"
                onClick={() => addToCart(product)}
                disabled={outOfStock}
                aria-label={outOfStock ? t('stock.outOfStock') : t('productsPage.addToCart')}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B0F19] text-white transition-colors hover:bg-[#1F2937] disabled:cursor-not-allowed disabled:bg-[#94A3B8]"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Desktop — horizontal detail row */}
        <div className="hidden md:flex md:items-stretch md:gap-4 md:p-4 lg:gap-5 lg:p-5">
          <Link to={`/products/${product.slug}`} className="shrink-0">
            <div
              className={`relative h-28 w-28 overflow-hidden rounded-xl bg-[#F4F4F5] ring-1 ring-black/5 lg:h-32 lg:w-32 ${
                outOfStock ? 'grayscale-[0.35]' : ''
              }`}
            >
              {imageSrc ? (
                <img src={imageSrc} alt={productName} className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-[#94A3B8]">
                  {t('productsPage.noImage')}
                </div>
              )}
              <ProductStockOverlay product={product} />
            </div>
          </Link>

          <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
            <div className="min-w-0">
              {lowStock ? (
                <div className="mb-2">
                  <ProductStockBadge product={product} />
                </div>
              ) : null}
              <Link to={`/products/${product.slug}`} className="block min-w-0">
                <h3 className="line-clamp-1 text-lg font-semibold text-[#0B0F19] transition-colors group-hover:underline decoration-black/20">
                  {productName}
                </h3>
              </Link>
              {descSource ? (
                <p className="mt-1 line-clamp-1 text-sm text-[#64748B]">{descSource}</p>
              ) : null}
              {specParts.length ? (
                <p className="mt-1.5 text-xs text-[#64748B]">{specParts.join(' · ')}</p>
              ) : null}
              <div className="mt-2">
                <DigitalOwnershipBadge
                  variant="compact"
                  verifyCode={product.serial_number || product.sku || null}
                  to={`/products/${product.slug}#product-authenticity`}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-3">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <span className="text-xl font-bold leading-none text-[#0B0F19] tabular-nums tracking-tight">
                  {formatKwd(unitPrice)}
                  <span className="ms-1 text-xs font-semibold text-[#64748B]">KWD</span>
                </span>
                <span className="inline-flex min-h-[14px] min-w-[2.75rem] items-center">
                  <ProductPriceTrendArrow
                    product={product}
                    variant="light"
                    showPercent
                    trendOverride={trendOverride}
                    percentOverride={percentOverride}
                    size="sm"
                    forceVisible
                  />
                </span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col justify-center">
            <button
              type="button"
              onClick={() => addToCart(product)}
              disabled={outOfStock}
              className={`${addButtonClass} min-w-[9.5rem] px-4`}
            >
              <ShoppingCart className="h-4 w-4 shrink-0" />
              <span className="truncate">{outOfStock ? t('stock.outOfStock') : t('productsPage.addToCart')}</span>
            </button>
          </div>
        </div>
      </article>
    )
  }

  return (
    <div className="group flex min-w-0 flex-col rounded-2xl border border-black/10 bg-white p-2 transition-[box-shadow,transform] duration-[var(--motion-base)] ease-[var(--ease-luxury)] hover:-translate-y-1 hover:shadow-[0_16px_40px_-20px_rgba(15,23,42,0.28)] sm:h-full sm:p-3.5">
      <Link to={`/products/${product.slug}`} className="block min-w-0">
        <div className={`relative aspect-[4/3] overflow-hidden rounded-xl bg-[#F4F4F5] ring-1 ring-black/5 ${outOfStock ? 'grayscale-[0.35]' : ''}`}>
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={productName}
              className="h-full w-full object-cover transition-transform duration-[var(--motion-slow)] ease-[var(--ease-luxury)] group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-xs text-[#94A3B8] sm:text-sm">{t('productsPage.noImage')}</span>
            </div>
          )}
          <ProductStockOverlay product={product} />
          {!outOfStock && caratLabel ? (
            <div className="absolute top-1.5 end-1.5">
              <span className="rounded bg-white/92 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold text-[#0B0F19] ring-1 ring-black/10">
                {caratLabel}
              </span>
            </div>
          ) : null}
        </div>
      </Link>

      <div className="flex flex-col px-0.5 pt-1.5">
        <Link to={`/products/${product.slug}`} className="min-w-0">
          <h3 className="line-clamp-2 text-[12px] font-semibold leading-snug text-[#0B0F19] transition-colors group-hover:underline decoration-black/20 sm:line-clamp-1 sm:text-[15px] sm:leading-normal">
            {productName}
          </h3>
        </Link>

        {specParts.length ? (
          <p className="mt-0.5 min-h-[1.25rem] text-[9px] leading-snug text-[#64748B] sm:min-h-[1rem] sm:text-xs">
            {specParts.join(' · ')}
          </p>
        ) : (
          <p className="mt-0.5 min-h-[1.25rem] sm:min-h-[1rem]" aria-hidden />
        )}

        <div className="mt-1.5">
          <DigitalOwnershipBadge
            variant="compact"
            verifyCode={product.serial_number || product.sku || null}
            to={`/products/${product.slug}#product-authenticity`}
          />
        </div>

        <div className="mt-1.5 flex flex-col gap-1 sm:gap-1.5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-1.5 gap-y-0.5">
            <span className="min-w-0 text-[13px] font-bold leading-none text-[#0B0F19] tabular-nums tracking-tight sm:text-lg">
              {formatKwd(unitPrice)}
              <span className="ms-0.5 text-[9px] font-semibold text-[#64748B] sm:text-xs">KWD</span>
            </span>
            <span className="inline-flex min-h-[14px] min-w-[2.75rem] shrink-0 items-center justify-end">
              <ProductPriceTrendArrow
                product={product}
                variant="light"
                showPercent
                trendOverride={trendOverride}
                percentOverride={percentOverride}
                className="shrink-0"
                size="sm"
                forceVisible
              />
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-1 gap-y-0.5 border-t border-black/5 pt-1 sm:pt-1.5">
            <span className="text-[9px] leading-tight text-[#64748B] sm:text-[11px]">{shipsInLabel}</span>
            <ProductStockStatusLabel product={product} className="shrink-0 text-[9px] sm:text-[11px]" />
          </div>
        </div>

        <button
          type="button"
          onClick={() => addToCart(product)}
          disabled={outOfStock}
          className={`${addButtonClass} mt-1.5 min-h-[2rem] w-full sm:mt-2 sm:min-h-[2.5rem]`}
        >
          <ShoppingCart className="hidden sm:block h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
          <span className="truncate">{outOfStock ? t('stock.outOfStock') : t('productsPage.addToCart')}</span>
        </button>
      </div>
    </div>
  )
}
