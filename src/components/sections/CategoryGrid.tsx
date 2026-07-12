import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/services/api'
import type { Category } from '@/types'
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader'
import { VaultCategoryTile } from '@/components/home/VaultCategoryTile'
import { HorizontalScrollControls } from '@/components/home/HorizontalScrollControls'
import { useHorizontalScrollRail } from '@/components/home/useHorizontalScrollRail'

type CategoryResponse = {
  count: number
  next: string | null
  previous: string | null
  results: Category[]
}

function CategoryGridSkeleton() {
  return (
    <section className="home-section">
      <div className="home-section-inner">
        <div className="mb-8 space-y-3">
          <div className="h-3 w-28 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[#E2E8F0]" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-2xl bg-gradient-to-br from-[#E2E8F0] to-[#F1F5F9]"
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function CategoryGrid() {
  const { t, i18n } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['categories-home'],
    queryFn: () => productsApi.getCategories({ page: 1, page_size: 100 }),
    staleTime: 5 * 60_000,
  })

  const roots = useMemo(() => {
    const list = ((data as CategoryResponse | undefined)?.results ?? []).filter((c) => !c.parent)
    return [...list].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  }, [data])

  const { railRef, canScrollBack, canScrollForward, scrollBack, scrollForward } =
    useHorizontalScrollRail(roots.length)

  if (isLoading) {
    return <CategoryGridSkeleton />
  }

  if (!roots.length) {
    return null
  }

  const rootLabel = (cat: Category) => {
    const name = i18n.language === 'ar' && cat.name_ar ? cat.name_ar : cat.name_en
    return name.trim().toUpperCase()
  }

  return (
    <section className="home-section home-section--compact bg-[var(--site-bg)]" aria-labelledby="home-categories-heading">
      <div className="home-section-inner @container">
        <HomeSectionHeader
          kicker={t('home.vaultCollections')}
          title={t('home.categories')}
          subtitle={t('home.categoriesSub')}
          linkTo="/products"
          linkLabel={t('home.viewAll')}
        />

        <HorizontalScrollControls
          canScrollBack={canScrollBack}
          canScrollForward={canScrollForward}
          onScrollBack={scrollBack}
          onScrollForward={scrollForward}
          backLabel={t('home.scrollBack')}
          forwardLabel={t('home.scrollForward')}
          className="mb-3"
        />

        <div
          id="home-categories-heading"
          ref={railRef}
          className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 sm:snap-none md:gap-5 @lg:grid-cols-3 @3xl:grid-cols-4"
        >
          {roots.map((cat) => (
            <div
              key={cat.id}
              className="w-[min(46vw,11.5rem)] shrink-0 snap-center sm:w-auto sm:shrink"
            >
              <VaultCategoryTile category={cat} label={rootLabel(cat)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
