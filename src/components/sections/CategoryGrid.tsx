import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/services/api'
import type { Category } from '@/types'
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader'
import { VaultCategoryTile } from '@/components/home/VaultCategoryTile'

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
        <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 min-[380px]:gap-3.5 sm:gap-4 md:gap-5 @lg:grid-cols-3">
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
    <section
      className="home-section home-section--compact bg-[var(--site-bg)]"
      aria-labelledby="home-categories-heading"
    >
      <div className="home-section-inner @container">
        <HomeSectionHeader
          kicker={t('home.vaultCollections')}
          title={t('home.categories')}
          subtitle={t('home.categoriesSub')}
          linkTo="/products"
          linkLabel={t('home.viewAll')}
        />

        {/*
          Responsive grid (no flush scroll rail):
          — <380: 1 col
          — 380–~1023 container: 2 cols with real gaps (fixes 584×849)
          — @lg container: 3 cols
          — @3xl container: 4 cols
        */}
        <div
          id="home-categories-heading"
          className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 min-[380px]:gap-3.5 sm:gap-4 md:gap-5 @lg:grid-cols-3 @3xl:grid-cols-4"
        >
          {roots.map((cat) => (
            <div key={cat.id} className="min-w-0">
              <VaultCategoryTile category={cat} label={rootLabel(cat)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
