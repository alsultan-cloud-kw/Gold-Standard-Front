import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Circle, Link2, Watch, Gem, Crown, BarChart3, ChevronLeft, ChevronRight } from 'lucide-react'
import { productsApi } from '../../services/api'
import type { Category } from '../../types'

const categoryIcons: Record<string, React.ElementType> = {
  rings: Circle,
  necklaces: Link2,
  watches: Watch,
  gems: Gem,
  bracelets: Crown,
  bars: BarChart3,
}

type SubItem = { id: string; slug: string; name_en: string; name_ar?: string; cat: Category }

function normalizeSubcategories(category: Category): SubItem[] {
  const raw = category.subcategories
  if (!Array.isArray(raw) || raw.length === 0) return []
  return raw
    .map((sub) => {
      if (!sub || typeof sub !== 'object') return null
      const s = sub as Category
      if (!s.slug) return null
      return {
        id: String(s.id ?? s.slug),
        slug: s.slug,
        name_en: s.name_en || s.slug,
        name_ar: s.name_ar,
        cat: s,
      }
    })
    .filter(Boolean) as SubItem[]
}

function categoryImageSrc(category: Category): string | null {
  const c = category as Category & { image_url?: string }
  if (c.image_url) return c.image_url
  if (!category.image) return null
  if (category.image.startsWith('http')) return category.image
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
  const origin = apiBase.replace(/\/api\/?$/, '')
  const path = category.image.startsWith('/') ? category.image : `/${category.image}`
  return `${origin}${path}`
}

/** One row: four tiles fill the width; extra subcategories scroll horizontally with snap + arrows. */
const SUBS_VISIBLE_ROW = 4

function SubcategoryGrid({
  subs,
  categoryIcons,
  activeIcon,
  lang,
}: {
  subs: SubItem[]
  categoryIcons: Record<string, React.ElementType>
  activeIcon: React.ElementType
  lang: string
}) {
  const { t } = useTranslation()
  const rowRef = useRef<HTMLDivElement>(null)

  const scrollSubRow = useCallback((forward: boolean) => {
    const el = rowRef.current
    if (!el) return
    const w = el.clientWidth
    const mult = forward ? 1 : -1
    const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl'
    el.scrollBy({ left: mult * w * 0.92 * (rtl ? -1 : 1), behavior: 'smooth' })
  }, [])

  const needsScroll = subs.length > SUBS_VISIBLE_ROW
  const tileWidthClass = needsScroll
    ? 'w-[max(6.75rem,calc((100%-1.5rem)/4))] sm:w-[calc((100%-1.5rem)/4)] flex-none'
    : 'min-w-0 flex-1 basis-0 max-w-none'

  return (
    <div className="relative">
      {needsScroll && (
        <>
          <button
            type="button"
            onClick={() => scrollSubRow(false)}
            className="absolute left-0 top-1/2 z-20 hidden sm:flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-stone-900/85 text-amber-100 shadow-lg backdrop-blur-sm hover:bg-stone-800 hover:border-amber-400/40 transition-colors"
            aria-label={t('home.scrollSubcategoriesPrev')}
          >
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
          <button
            type="button"
            onClick={() => scrollSubRow(true)}
            className="absolute right-0 top-1/2 z-20 hidden sm:flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-stone-900/85 text-amber-100 shadow-lg backdrop-blur-sm hover:bg-stone-800 hover:border-amber-400/40 transition-colors"
            aria-label={t('home.scrollSubcategoriesNext')}
          >
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </>
      )}

      {needsScroll && (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-stone-950 via-stone-950/85 to-transparent sm:w-12"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-stone-950 via-stone-950/85 to-transparent sm:w-12"
            aria-hidden
          />
        </>
      )}

      <div
        ref={rowRef}
        className={`flex w-full flex-nowrap gap-2 py-1 pl-0.5 pr-0.5 [scrollbar-width:thin] [scrollbar-color:rgba(251,191,36,0.5)_rgba(255,255,255,0.06)] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-amber-500/40 ${
          needsScroll
            ? 'overflow-x-auto scroll-smooth snap-x snap-mandatory sm:pl-11 sm:pr-11'
            : 'overflow-x-hidden justify-stretch'
        }`}
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {subs.map((item) => {
          const img = categoryImageSrc(item.cat)
          const SubIcon = categoryIcons[item.slug] || activeIcon
          const label =
            lang === 'ar' && (item.name_ar || item.cat.name_ar)
              ? item.name_ar || item.cat.name_ar
              : item.name_en
          return (
            <Link
              key={item.id}
              to={`/products?category=${encodeURIComponent(item.slug)}`}
              className={`group flex min-h-[118px] sm:min-h-[128px] snap-start flex-col items-center gap-2 rounded-xl border border-white/12 bg-white/[0.93] p-2.5 shadow-md transition-all duration-300 hover:border-amber-400/50 hover:bg-white hover:shadow-lg hover:-translate-y-0.5 ${tileWidthClass}`}
            >
              <span className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-amber-100 to-stone-100 ring-1 ring-stone-900/10">
                {img ? (
                  <img
                    src={img}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <SubIcon className="h-7 w-7 text-amber-700/45" />
                  </span>
                )}
              </span>
              <span className="w-full text-center text-[10px] sm:text-xs font-semibold leading-snug text-stone-900 line-clamp-2 group-hover:text-amber-950">
                {label}
              </span>
              <span className="text-amber-800/80 group-hover:text-amber-900">
                <ArrowRight className="mx-auto h-3 w-3 rtl:rotate-180" />
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function CategoryGrid() {
  const { t, i18n } = useTranslation()
  const [page, setPage] = useState(1)
  const [activeSlug, setActiveSlug] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['categories', page],
    queryFn: () => productsApi.getCategories({ page, page_size: 48 }),
  })

  type CategoryResponse = {
    count: number
    next: string | null
    previous: string | null
    results: Category[]
  }

  const resp = data as CategoryResponse | undefined

  const roots = useMemo(() => {
    const list = (resp?.results || []).filter((c) => !c.parent)
    return [...list].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  }, [resp?.results])

  useEffect(() => {
    setActiveSlug((prev) => {
      if (prev && roots.some((c) => c.slug === prev)) return prev
      return roots[0]?.slug ?? null
    })
  }, [roots])

  const active = roots.find((c) => c.slug === activeSlug) ?? roots[0]
  const subs = active ? normalizeSubcategories(active) : []

  const hasNext = !!resp?.next
  const hasPrev = !!resp?.previous
  const showPageNav = hasNext || hasPrev

  const rootLabel = (cat: Category) =>
    i18n.language === 'ar' && cat.name_ar ? cat.name_ar : cat.name_en

  if (isLoading) {
    return (
      <section className="py-20 md:py-28 bg-siteBg border-y border-gold-900/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 bg-stone-200/80 rounded-lg mx-auto mb-3 animate-pulse" />
          <div className="h-3 w-64 bg-stone-200/50 rounded-lg mx-auto mb-10 animate-pulse" />
          <div className="h-80 rounded-[2rem] bg-stone-200/50 animate-pulse" />
        </div>
      </section>
    )
  }

  if (!roots.length) {
    return null
  }

  const activeImg = active ? categoryImageSrc(active) : null
  const ActiveIcon = active ? categoryIcons[active.slug] || Gem : Gem

  return (
    <section className="relative py-20 md:py-28 overflow-hidden border-y border-gold-900/12">
      <div className="absolute inset-0 bg-siteBg" />
      <div
        className="absolute inset-0 opacity-[0.85]"
        style={{
          background:
            'radial-gradient(ellipse 120% 80% at 100% 0%, rgba(133, 227, 7, 0.16), transparent 50%), radial-gradient(ellipse 90% 70% at 0% 100%, rgba(52, 89, 0, 0.10), transparent 45%), linear-gradient(180deg, #F6FDEB 0%, #ECFCCB 100%)',
        }}
      />
      <div className="absolute top-24 left-[8%] w-px h-32 bg-gradient-to-b from-gold-700/35 to-transparent hidden lg:block" />
      <div className="absolute bottom-32 right-[12%] w-px h-24 bg-gradient-to-t from-gold-700/30 to-transparent hidden lg:block" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="text-center mb-8 md:mb-10 max-w-lg mx-auto">
          <p className="text-[10px] md:text-[11px] font-semibold tracking-[0.3em] uppercase text-gold-800 mb-2">
            {t('home.browseByCategory')}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-stone-900 tracking-tight leading-tight">
            <span className="gold-gradient-text-on-light">{t('home.categories')}</span>
          </h2>
        </header>

        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-8 md:mb-10">
          {roots.map((cat) => {
            const isOn = active?.slug === cat.slug
            const thumb = categoryImageSrc(cat)
            const Icon = categoryIcons[cat.slug] || Gem
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveSlug(cat.slug)}
                aria-pressed={isOn}
                className={`group flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full border transition-all duration-300 ${
                  isOn
                    ? 'border-gold-700/55 bg-white shadow-[0_8px_30px_-8px_rgba(79,142,0,0.35)] ring-2 ring-gold-500/30 scale-[1.02]'
                    : 'border-gold-800/20 bg-white/70 hover:bg-white hover:border-gold-600/45 hover:shadow-md'
                }`}
              >
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full overflow-hidden border transition-colors ${
                    isOn ? 'border-gold-500/60 bg-gold-100' : 'border-gold-800/15 bg-gold-50 group-hover:border-gold-300'
                  }`}
                >
                  {thumb ? (
                    <img src={thumb} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <Icon className="h-5 w-5 text-gold-800/70" />
                  )}
                </span>
                <span
                  className={`text-sm font-semibold tracking-tight ${
                    isOn ? 'text-gold-900' : 'text-stone-800'
                  }`}
                >
                  {rootLabel(cat)}
                </span>
              </button>
            )
          })}
        </div>

        {active && (
          <div
            key={active.slug}
            className="relative overflow-hidden rounded-[1.75rem] md:rounded-[2rem] border border-stone-900/12 shadow-[0_25px_80px_-20px_rgba(28,25,23,0.45)] animate-category-spotlight"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-stone-950 via-[#162906] to-[#214108]" />
            {activeImg ? (
              <div
                className="absolute inset-0 opacity-25 bg-cover bg-center scale-105 blur-[2px]"
                style={{ backgroundImage: `url(${activeImg})` }}
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-900/92 to-stone-900/75" />
            <div className="absolute top-0 right-0 w-[60%] h-full bg-[radial-gradient(ellipse_at_70%_30%,rgba(133,227,7,0.16),transparent_55%)] pointer-events-none" />

            <div className="relative grid lg:grid-cols-12 gap-0">
              <div className="lg:col-span-4 xl:col-span-4 p-6 md:p-8 lg:p-10 flex flex-col justify-between min-h-[200px] lg:min-h-[280px] border-b lg:border-b-0 lg:border-r border-white/[0.08]">
                <div>
                  <p className="text-gold-200/80 text-[10px] font-semibold tracking-[0.2em] uppercase mb-2">
                    {t('home.collectionLabel')}
                  </p>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-white tracking-tight leading-tight mb-4">
                    {rootLabel(active)}
                  </h3>
                </div>
                <Link
                  to={`/products?category=${encodeURIComponent(active.slug)}`}
                  className="mt-4 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-gold-500 to-gold-700 px-5 py-2.5 text-sm font-semibold text-on-theme-light shadow-lg shadow-gold-900/30 hover:from-gold-400 hover:to-gold-600 transition-colors"
                >
                  {t('home.viewAll')}
                  <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                </Link>
              </div>

              <div className="lg:col-span-8 xl:col-span-8 p-5 md:p-8 lg:p-10 bg-black/20">
                {subs.length > 0 && (
                  <p className="text-gold-200/70 text-[10px] font-semibold tracking-[0.2em] uppercase mb-3">
                    {t('home.subcategoriesLabel')}
                  </p>
                )}

                {subs.length > 0 ? (
                  <SubcategoryGrid
                    subs={subs}
                    categoryIcons={categoryIcons}
                    activeIcon={ActiveIcon}
                    lang={i18n.language}
                  />
                ) : (
                  <div className="rounded-2xl border border-white/15 bg-white/[0.08] backdrop-blur-sm p-6 text-center">
                    <Link
                      to={`/products?category=${encodeURIComponent(active.slug)}`}
                      className="inline-flex items-center gap-2 text-sm text-gold-200 font-semibold hover:text-gold-100"
                    >
                      {t('home.viewAll')}
                      <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {showPageNav && (
          <nav className="mt-10 flex flex-wrap justify-center gap-3" aria-label="Category pages">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
              disabled={!hasPrev}
              className="inline-flex items-center gap-2 rounded-full border border-gold-800/20 bg-white/80 px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:border-gold-600/50 disabled:opacity-35 disabled:pointer-events-none"
            >
              <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => hasNext && setPage((p) => p + 1)}
              disabled={!hasNext}
              className="inline-flex items-center gap-2 rounded-full border border-gold-800/20 bg-white/80 px-4 py-2 text-sm font-medium text-stone-800 shadow-sm hover:border-gold-600/50 disabled:opacity-35 disabled:pointer-events-none"
            >
              Next
              <ChevronRight className="w-4 h-4 rtl:rotate-180" />
            </button>
          </nav>
        )}
      </div>
    </section>
  )
}
