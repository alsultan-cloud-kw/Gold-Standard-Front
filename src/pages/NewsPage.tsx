import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Newspaper } from 'lucide-react'
import { SultanNewsCard } from '@/components/news/SultanNewsCard'
import {
  fetchNewsByCategory,
  fetchNewsCategories,
  fetchAllNews,
  sortNewsByNewestFirst,
  newsGridColumnCount,
} from '@/lib/sultanNewsApi'

const ROWS_PER_CHUNK = 4

export default function NewsPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')
  const [categoryId, setCategoryId] = useState<'all' | number>('all')
  const [gridCols, setGridCols] = useState<1 | 2 | 3>(newsGridColumnCount)
  /** How many “4-row” blocks are visible (each block = 4 rows × current column count). */
  const [rowBlocks, setRowBlocks] = useState(1)

  useEffect(() => {
    const onResize = () => setGridCols(newsGridColumnCount())
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    setRowBlocks(1)
  }, [categoryId])

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

  const articles = useMemo(() => {
    const raw =
      categoryId === 'all' ? (allNewsQuery.data ?? []) : (categoryNewsQuery.data ?? [])
    return sortNewsByNewestFirst(raw)
  }, [categoryId, allNewsQuery.data, categoryNewsQuery.data])

  const itemsPerChunk = ROWS_PER_CHUNK * gridCols
  const visibleArticles = useMemo(
    () => articles.slice(0, rowBlocks * itemsPerChunk),
    [articles, rowBlocks, itemsPerChunk],
  )
  const hasMore = articles.length > visibleArticles.length

  const loading =
    categoriesQuery.isLoading ||
    (categoryId === 'all' ? allNewsQuery.isLoading : categoryNewsQuery.isLoading)

  const error =
    categoriesQuery.error ||
    (categoryId === 'all' ? allNewsQuery.error : categoryNewsQuery.error)

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-lime-50/60 via-white to-white">
      <div className="page-shell py-8 sm:py-10">
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-bold text-black hover:text-lime-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            {t('newsPage.backHome')}
          </Link>
          <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-yellow-300 border border-black/15 flex items-center justify-center shrink-0 mb-3 shadow-sm">
              <Newspaper className="w-6 h-6 text-black" aria-hidden />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-black">{t('newsPage.title')}</h1>
            <p className="text-stone-800 font-medium mt-2 max-w-2xl mx-auto">{t('newsPage.subtitle')}</p>
            <p className="text-xs text-stone-600 mt-2 max-w-2xl mx-auto">{t('newsPage.dateHint')}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10">
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
            {Array.from({ length: 9 }).map((_, i) => (
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
          <p className="text-center text-stone-600 py-12">{t('home.newsSection.empty')}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleArticles.map((item) => (
                <SultanNewsCard key={`${categoryId}-${item.id}`} article={item} />
              ))}
            </div>
            {hasMore ? (
              <div className="mt-10 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setRowBlocks((n) => n + 1)}
                  className="gold-button inline-flex items-center justify-center px-6 py-3 rounded-lg font-semibold border-2 border-black/10 shadow-lg shadow-lime-900/10"
                >
                  {t('newsPage.showMoreNews')}
                </button>
                <p className="text-xs text-stone-500">
                  {t('newsPage.showingCount', {
                    visible: visibleArticles.length,
                    total: articles.length,
                  })}
                </p>
              </div>
            ) : visibleArticles.length > 0 ? (
              <p className="mt-8 text-center text-xs text-stone-500">
                {t('newsPage.allLoaded', { total: articles.length })}
              </p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
