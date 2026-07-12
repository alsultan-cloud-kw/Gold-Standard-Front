import { useEffect } from 'react'
import { SITE_NAME, SITE_OG_IMAGE, absoluteUrl } from '@/constants/site'

type JsonLd = Record<string, unknown> | Record<string, unknown>[]

type SeoHeadProps = {
  title: string
  description: string
  path?: string
  image?: string
  type?: 'website' | 'article' | 'product'
  noIndex?: boolean
  jsonLd?: JsonLd
  locale?: string
}

const META_ATTR = 'data-gs-seo'
const LINK_ATTR = 'data-gs-seo-link'
const SCRIPT_ID = 'gs-seo-jsonld'

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"][${META_ATTR}]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.setAttribute(META_ATTR, '1')
    document.head.appendChild(el)
  }
  el.content = content
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const langSel = hreflang ? `[hreflang="${hreflang}"]` : ':not([hreflang])'
  let el = document.head.querySelector<HTMLLinkElement>(
    `link[rel="${rel}"]${langSel}[${LINK_ATTR}]`,
  )
  if (!el) {
    el = document.createElement('link')
    el.rel = rel
    el.setAttribute(LINK_ATTR, '1')
    if (hreflang) el.hreflang = hreflang
    document.head.appendChild(el)
  }
  el.href = href
}

/**
 * Client-side SEO / social meta for the Vite SPA.
 * Crawlers that execute JS (and in-app browsers) pick these up; index.html
 * still carries strong static defaults for first paint / non-JS scrapers.
 */
export function SeoHead({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  noIndex = false,
  jsonLd,
  locale = 'ar_KW',
}: SeoHeadProps) {
  useEffect(() => {
    const url = absoluteUrl(path)
    const ogImage = image || SITE_OG_IMAGE

    document.title = title

    upsertMeta('name', 'description', description)
    upsertMeta(
      'name',
      'robots',
      noIndex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large',
    )
    upsertMeta('name', 'author', SITE_NAME)
    upsertMeta('name', 'theme-color', '#f7f9f5')
    upsertMeta('name', 'application-name', SITE_NAME)

    upsertLink('canonical', url)
    upsertLink('alternate', url, locale.startsWith('ar') ? 'ar' : 'en')
    upsertLink('alternate', url, 'x-default')

    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', ogImage)
    upsertMeta('property', 'og:image:alt', title)
    upsertMeta('property', 'og:image:width', '512')
    upsertMeta('property', 'og:image:height', '512')
    upsertMeta('property', 'og:locale', locale)
    upsertMeta('property', 'og:locale:alternate', locale.startsWith('ar') ? 'en_US' : 'ar_KW')

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', ogImage)
    upsertMeta('name', 'twitter:image:alt', title)

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script')
        script.type = 'application/ld+json'
        script.id = SCRIPT_ID
        document.head.appendChild(script)
      }
      script.textContent = JSON.stringify(jsonLd)
    } else if (script) {
      script.remove()
    }
  }, [title, description, path, image, type, noIndex, jsonLd, locale])

  return null
}
