import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight } from 'lucide-react'
import { productsApi } from '@/services/api'
import type { Category } from '@/types'

type CategoryResponse = {
  results?: Category[]
}

function categoryHref(slug: string) {
  return `/products?category=${encodeURIComponent(slug)}`
}

export function FooterProductsSitemap() {
  const { t, i18n } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['categories-home'],
    queryFn: () => productsApi.getCategories({ page: 1, page_size: 100 }),
    staleTime: 5 * 60_000,
  })

  const { roots, childrenByParent } = useMemo(() => {
    const list = ((data as CategoryResponse | undefined)?.results ?? []).filter(
      (c) => c.is_active !== false,
    )
    const sorted = [...list].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
    const rootList = sorted.filter((c) => !c.parent)
    const childMap = new Map<string, Category[]>()

    for (const cat of sorted) {
      if (!cat.parent) continue
      const bucket = childMap.get(cat.parent) ?? []
      bucket.push(cat)
      childMap.set(cat.parent, bucket)
    }

    return { roots: rootList, childrenByParent: childMap }
  }, [data])

  const label = (cat: Category) => {
    const name = i18n.language === 'ar' && cat.name_ar ? cat.name_ar : cat.name_en
    return name.trim()
  }

  return (
    <nav aria-label={t('footer.products')}>
      <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#85E307]">
        {t('footer.products')}
      </h4>

      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-white transition-colors hover:text-[#85E307]"
      >
        {t('footer.allProducts')}
        <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden />
      </Link>

      {isLoading ? (
        <ul className="mt-3 space-y-2 border-s border-white/10 ps-3" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i}>
              <div className="h-3.5 w-24 animate-pulse rounded bg-white/10" />
            </li>
          ))}
        </ul>
      ) : roots.length > 0 ? (
        <ul className="mt-3 space-y-2.5 border-s border-white/10 ps-3">
          {roots.map((root) => {
            const children = childrenByParent.get(root.id) ?? []
            return (
              <li key={root.id}>
                <Link
                  to={categoryHref(root.slug)}
                  className="text-sm text-white/60 transition-colors hover:text-white"
                >
                  {label(root)}
                </Link>
                {/* 
                  Hidden on mobile so it doesn't span out and make the footer too long. 
                  Displayed on desktop where there's room. 
                */}
                {children.length > 0 ? (
                  <ul className="mt-1.5 hidden space-y-1.5 border-s border-white/[0.06] ps-2.5 sm:block">
                    {children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          to={categoryHref(sub.slug)}
                          className="text-xs text-white/45 transition-colors hover:text-white/80"
                        >
                          {label(sub)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : null}

      <Link
        to="/products"
        className="mt-4 inline-flex text-xs font-semibold text-[#85E307]/90 transition-colors hover:text-[#85E307]"
      >
        {t('footer.viewAllProducts')}
      </Link>
    </nav>
  )
}
