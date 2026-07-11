import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import type { Product } from '@/types'
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader'
import { HomeProductCard } from '@/components/home/HomeProductCard'
import type { ProductFetchTrendMap } from '@/hooks/useProductPriceTrendSincePreviousFetch'

interface FeaturedProductsProps {
  title: string
  subtitle?: string
  products: Product[]
  viewAllLink?: string
  fetchTrends?: ProductFetchTrendMap
}

export default function FeaturedProducts({
  title,
  subtitle,
  products,
  viewAllLink,
  fetchTrends,
}: FeaturedProductsProps) {
  const { t } = useTranslation()

  if (!products?.length) {
    return null
  }

  return (
    <section className="home-section">
      <div className="home-section-inner">
        <HomeSectionHeader
          kicker={t('home.featuredKicker', { defaultValue: 'Curated' })}
          title={title}
          subtitle={subtitle ?? t('home.featuredSub')}
          linkTo={viewAllLink}
          linkLabel={viewAllLink ? t('home.viewAll') : undefined}
        />

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 min-w-0">
          {products.slice(0, 8).map((product) => (
            <HomeProductCard key={product.id} product={product} fetchTrends={fetchTrends} />
          ))}
        </div>

        {viewAllLink ? (
          <div className="mt-8 text-center sm:hidden">
            <Link
              to={viewAllLink}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#3F6F00] hover:text-[#2d5200] transition-colors"
            >
              {t('home.viewAll')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        ) : null}
      </div>
    </section>
  )
}
