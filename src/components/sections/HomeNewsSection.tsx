import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Newspaper } from 'lucide-react'
import { SultanNewsCard } from '@/components/news/SultanNewsCard'
import {
  fetchNewsByCategory,
  fetchNewsCategories,
  fetchAllNews,
  sortNewsByNewestFirst,
  newsGridColumnCount,
} from '@/lib/sultanNewsApi'

const HOME_VISIBLE_ROWS = 2

export default function HomeNewsSection() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')
  const [categoryId, setCategoryId] = useState<'all' | number>('all')
  const [gridCols, setGridCols] = useState<1 | 2 | 3>(newsGridColumnCount)

  useEffect(() => {
    const onResize = () => setGridCols(newsGridColumnCount())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const categoriesQuery = useQuery({
    queryKey: ['sultanGoldNewsCategories'],
    queryFn: fetchNewsCategories,
    staleTime: 5 * 60_000,
  })

  const allNewsQuery = useQuery({
    queryKey: ['sultanGoldNewsAll'],
    queryFn: fetchAllNews,
    staleTime: 2 * 60_000,
  })

  const categoryNewsQuery = useQuery({
    queryKey: ['sultanGoldNewsByCategory', categoryId],
    queryFn: () => fetchNewsByCategory(categoryId as number),
    enabled: categoryId !== 'all',
    staleTime: 2 * 60_000,
  })

  const sortedArticles = useMemo(() => {
    const raw =
      categoryId === 'all'
        ? (allNewsQuery.data ?? [])
        : (categoryNewsQuery.data ?? [])
    return sortNewsByNewestFirst(raw)
  }, [categoryId, allNewsQuery.data, categoryNewsQuery.data])

  const homeVisibleCount = HOME_VISIBLE_ROWS * gridCols
  const articles = useMemo(
    () => sortedArticles.slice(0, homeVisibleCount),
    [sortedArticles, homeVisibleCount],
  )

  const loading =
    categoriesQuery.isLoading ||
    (categoryId === 'all' ? allNewsQuery.isLoading : categoryNewsQuery.isLoading)

  const error =
    categoriesQuery.error ||
    (categoryId === 'all' ? allNewsQuery.error : categoryNewsQuery.error)

  return (
    <section className="py-16 sm:py-20 bg-white border-t border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-11 h-11 rounded-xl bg-yellow-300 border border-black/15 flex items-center justify-center shrink-0 mb-3 shadow-sm">
            <Newspaper className="w-5 h-5 text-black" aria-hidden />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold gold-gradient-text-on-light">
            {t('home.newsSection.title')}
          </h2>
          <p className="text-sm text-stone-600 mt-2 max-w-2xl mx-auto">{t('home.newsSection.subtitle')}</p>
          <p className="text-xs text-stone-500 mt-1 max-w-2xl mx-auto">{t('home.newsSection.dateHint')}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            type="button"
            onClick={() => setCategoryId('all')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-2 ${
              categoryId === 'all'
                ? 'bg-black text-yellow-300 border-black shadow-md'
                : 'bg-lime-100/80 text-black border-black/15 hover:bg-lime-200 hover:border-black/30'
            }`}
          >
            {t('home.newsSection.allCategories')}
          </button>
          {(categoriesQuery.data ?? []).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all border-2 ${
                categoryId === cat.id
                  ? 'bg-black text-yellow-300 border-black shadow-md'
                  : 'bg-lime-100/80 text-black border-black/15 hover:bg-lime-200 hover:border-black/30'
              }`}
            >
              {isAr ? cat.arabicName || cat.englishName : cat.englishName || cat.arabicName}
            </button>
          ))}
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-900">
            {t('home.newsSection.loadError')}
          </div>
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: Math.min(6, homeVisibleCount) }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-black/10 bg-lime-50/50 overflow-hidden animate-pulse"
              >
                <div className="h-40 bg-lime-200/40" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-lime-300/50 rounded w-3/4" />
                  <div className="h-3 bg-lime-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : articles.length === 0 ? (
          <p className="text-center text-stone-600 py-8">{t('home.newsSection.empty')}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {articles.map((item) => (
                <SultanNewsCard key={`${categoryId}-${item.id}`} article={item} />
              ))}
            </div>
            <div className="mt-10 flex justify-center">
              <Link
                to="/news"
                className="gold-button inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold shadow-lg shadow-lime-900/15 border-2 border-black/10"
              >
                {t('home.newsSection.showAllNews')}
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
