import { getApiBaseUrl } from '@/lib/apiBase'
import type { Category } from '@/types'

export function categoryImageSrc(category: Category): string | null {
  const c = category as Category & { image_url?: string }
  if (c.image_url) return c.image_url
  if (!category.image) return null
  if (category.image.startsWith('http')) return category.image
  const apiBase = getApiBaseUrl()
  const origin = apiBase.replace(/\/api\/?$/, '')
  const path = category.image.startsWith('/') ? category.image : `/${category.image}`
  return `${origin}${path}`
}
