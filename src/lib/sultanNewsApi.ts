/**
 * Sultan Gold Laravel news API (hardcoded test host) — home + /news page.
 */
export const SULTAN_GOLD_NEWS_ORIGIN = 'https://apii.test.sultangold.net'
export const SULTAN_GOLD_NEWS_API_BASE = `${SULTAN_GOLD_NEWS_ORIGIN}/public/api`

export function effectiveNewsApiBase(): string {
  if (import.meta.env.DEV) return '/sultan-gold-news-api'
  return SULTAN_GOLD_NEWS_API_BASE
}

export type NewsCategoryRow = {
  id: number
  arabicName?: string
  englishName?: string
  imagePath?: string
}

export type NewsArticleRow = {
  id: number
  categoryId?: number
  title?: string
  imagePath?: string
  created_at?: string
  updated_at?: string
  breaking?: number
}

function unwrapArray<T>(json: Record<string, unknown>, ...keys: string[]): T[] {
  const data = json.data as Record<string, unknown> | undefined
  for (const key of keys) {
    const fromData = data?.[key]
    if (Array.isArray(fromData)) return fromData as T[]
    const fromRoot = json[key]
    if (Array.isArray(fromRoot)) return fromRoot as T[]
  }
  return []
}

export async function fetchNewsCategories(): Promise<NewsCategoryRow[]> {
  const res = await fetch(`${effectiveNewsApiBase()}/home-page/news-category/getAllData`)
  if (!res.ok) throw new Error(String(res.status))
  const json = (await res.json()) as Record<string, unknown>
  return unwrapArray<NewsCategoryRow>(json, 'newCategory')
}

export async function fetchAllNews(): Promise<NewsArticleRow[]> {
  const res = await fetch(`${effectiveNewsApiBase()}/home-page/news/getAllData`)
  if (!res.ok) throw new Error(String(res.status))
  const json = (await res.json()) as Record<string, unknown>
  return unwrapArray<NewsArticleRow>(json, 'news')
}

export async function fetchNewsByCategory(categoryId: number): Promise<NewsArticleRow[]> {
  const res = await fetch(
    `${effectiveNewsApiBase()}/home-page/news-by-new-category/${encodeURIComponent(String(categoryId))}`,
  )
  if (!res.ok) throw new Error(String(res.status))
  const json = (await res.json()) as Record<string, unknown>
  return unwrapArray<NewsArticleRow>(json, 'new', 'news')
}

/** Laravel serves disk files under `/public/storage/...` on this host (not bare `/storage/...`). */
export function resolveSultanNewsImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath || typeof imagePath !== 'string') return null
  const p = imagePath.trim()
  if (!p) return null
  if (p.startsWith('http://') || p.startsWith('https://')) return p
  const normalized = p.startsWith('/') ? p : `/${p}`
  if (normalized.startsWith('/storage/')) {
    return `${SULTAN_GOLD_NEWS_ORIGIN}/public${normalized}`
  }
  return `${SULTAN_GOLD_NEWS_ORIGIN}/public${normalized}`
}

export function sortNewsByNewestFirst<T extends { created_at?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0
    const tb = b.created_at ? Date.parse(b.created_at) : 0
    return tb - ta
  })
}

/** Matches Tailwind `sm` (640px) / `lg` (1024px) for `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. */
export function newsGridColumnCount(): 1 | 2 | 3 {
  if (typeof window === 'undefined') return 3
  if (window.innerWidth >= 1024) return 3
  if (window.innerWidth >= 640) return 2
  return 1
}
