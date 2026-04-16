import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { NewsArticleRow } from '@/lib/sultanNewsApi'
import { resolveSultanNewsImageUrl } from '@/lib/sultanNewsApi'

type Props = {
  article: NewsArticleRow
}

export function SultanNewsCard({ article }: Props) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language.startsWith('ar')
  const [expanded, setExpanded] = useState(false)

  const img = resolveSultanNewsImageUrl(article.imagePath)
  const title = article.title?.trim() || t('home.newsSection.untitled')
  const dateStr = article.created_at
    ? new Date(article.created_at).toLocaleDateString(isAr ? 'ar' : 'en', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : ''
  const updatedStr =
    article.updated_at &&
    article.created_at &&
    article.updated_at !== article.created_at
      ? new Date(article.updated_at).toLocaleDateString(isAr ? 'ar' : 'en', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        })
      : ''

  return (
    <article className="group rounded-xl border border-amber-900/10 bg-white/80 shadow-sm hover:shadow-md hover:border-amber-700/25 overflow-hidden flex flex-col transition-all">
      <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
        {img ? (
          <img
            src={img}
            alt=""
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-stone-400 text-sm">
            {t('home.noImage')}
          </div>
        )}
        {article.breaking === 1 ? (
          <span className="absolute top-2 start-2 px-2 py-0.5 rounded bg-red-600 text-white text-[10px] font-bold uppercase">
            {t('home.newsSection.breaking')}
          </span>
        ) : null}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3
          className={`text-base font-semibold text-stone-900 leading-snug ${
            expanded ? '' : 'line-clamp-2'
          }`}
        >
          {title}
        </h3>
        {dateStr ? (
          <time className="mt-2 text-xs text-stone-500 tabular-nums" dateTime={article.created_at}>
            {dateStr}
          </time>
        ) : null}

        {expanded ? (
          <div className="mt-3 pt-3 border-t border-amber-900/10 space-y-2 text-sm text-stone-600 leading-relaxed">
            {updatedStr ? (
              <p className="text-xs text-stone-500">
                {t('home.newsSection.updatedLabel')}: {updatedStr}
              </p>
            ) : null}
            <p className="text-xs text-stone-500 leading-relaxed">{t('home.newsSection.expandedNote')}</p>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="text-xs font-semibold text-amber-800 hover:text-amber-950 mt-1"
            >
              {t('home.newsSection.showLess')}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="mt-3 self-start text-xs font-semibold text-amber-800 hover:text-amber-950"
          >
            {t('home.newsSection.showMore')}
          </button>
        )}
      </div>
    </article>
  )
}
