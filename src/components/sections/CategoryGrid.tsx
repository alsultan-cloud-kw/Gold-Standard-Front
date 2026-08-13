import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { productsApi } from '@/services/api'
import type { Category } from '@/types'
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader'
import { VaultCategoryTile } from '@/components/home/VaultCategoryTile'
import { categoryDisplayName } from '@/lib/categoryDisplayName'

type CategoryResponse = {
  count: number
  next: string | null
  previous: string | null
  results: Category[]
}

function CategoryRailSkeleton() {
  return (
    <section className="home-section home-section--compact">
      <div className="home-section-inner">
        <div className="mb-8 space-y-3">
          <div className="h-3 w-28 animate-pulse rounded bg-[#E2E8F0]" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-[#E2E8F0]" />
        </div>
        <div className="home-category-rail-wrap" aria-hidden>
          <div className="home-category-rail">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="home-category-rail__item">
                <div className="home-category-rail__skeleton" />
              </div>
            ))}
          </div>
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
    staleTime: 15_000,
    refetchOnWindowFocus: true,
  })

  const roots = useMemo(() => {
    const list = ((data as CategoryResponse | undefined)?.results ?? []).filter((c) => !c.parent)
    return [...list].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
  }, [data])

  if (isLoading) {
    return <CategoryRailSkeleton />
  }

  if (!roots.length) {
    return null
  }

  const isAr = i18n.language?.startsWith('ar')
  const rootLabel = (cat: Category) => {
    const name = categoryDisplayName(cat, Boolean(isAr))
    return isAr ? name : name.trim().toUpperCase()
  }

  return (
    <section
      className="home-section home-section--compact bg-[var(--site-bg)]"
      aria-labelledby="home-categories-heading"
    >
      <div className="home-section-inner">
        <HomeSectionHeader
          kicker={t('home.vaultCollections')}
          title={t('home.categories')}
          subtitle={t('home.categoriesSub')}
          linkTo="/products"
          linkLabel={t('home.viewAll')}
        />

        {/*
          Fixed-size horizontal rail — adding categories never reflows the page.
          Snap + peek keep tiles big/clear while scrolling sideways only.
        */}
        <div className="home-category-rail-wrap">
          <div
            id="home-categories-heading"
            className="home-category-rail"
            role="list"
            aria-label={t('home.categories')}
          >
            {roots.map((cat) => (
              <div key={cat.id} className="home-category-rail__item" role="listitem">
                <VaultCategoryTile category={cat} label={rootLabel(cat)} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
