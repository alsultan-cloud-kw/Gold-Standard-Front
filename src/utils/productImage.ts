import { getApiBaseUrl } from '@/lib/apiBase'

/**
 * Resolve product thumbnail URL from list/detail payload.
 * List API sends primary_image with image_url (absolute) or image (relative /media/...).
 */
export function productImageSrc(product: {
  primary_image?: { image?: string; image_url?: string } | null
  images?: { image?: string; image_url?: string }[]
}): string | null {
  const img = product.primary_image || product.images?.[0]
  if (!img) return null
  if (img.image_url) return img.image_url
  if (img.image?.startsWith('http')) return img.image
  if (img.image) {
    const apiBase = getApiBaseUrl()
    const origin = apiBase.replace(/\/api\/?$/, '')
    const path = img.image.startsWith('/') ? img.image : `/${img.image}`
    return `${origin}${path}`
  }
  return null
}
