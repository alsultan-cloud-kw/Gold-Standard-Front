import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SeoHead } from './SeoHead'
import { SITE_NAME, SITE_OG_IMAGE, SITE_ORIGIN, absoluteUrl } from '@/constants/site'
import { GS_CONTACT } from '@/constants/contact'
import { GS_INSTAGRAM } from '@/constants/social'
import { GS_MAIN_LOCATION } from '@/constants/location'

type PageSeo = {
  titleKey: string
  descKey: string
  path: string
  noIndex?: boolean
}

const PUBLIC_ROUTES: Array<{ match: (path: string) => boolean; seo: PageSeo }> = [
  {
    match: (p) => p === '/',
    seo: { titleKey: 'seo.home.title', descKey: 'seo.home.description', path: '/' },
  },
  {
    match: (p) => p === '/prices',
    seo: { titleKey: 'seo.prices.title', descKey: 'seo.prices.description', path: '/prices' },
  },
  {
    match: (p) => p === '/company-prices',
    seo: {
      titleKey: 'seo.companyPrices.title',
      descKey: 'seo.companyPrices.description',
      path: '/company-prices',
    },
  },
  {
    match: (p) => p === '/products' || p.startsWith('/products/'),
    seo: { titleKey: 'seo.products.title', descKey: 'seo.products.description', path: '/products' },
  },
  {
    match: (p) => p === '/about',
    seo: { titleKey: 'seo.about.title', descKey: 'seo.about.description', path: '/about' },
  },
  {
    match: (p) => p === '/trading',
    seo: { titleKey: 'seo.trading.title', descKey: 'seo.trading.description', path: '/trading' },
  },
  {
    match: (p) => p === '/contact',
    seo: { titleKey: 'seo.contact.title', descKey: 'seo.contact.description', path: '/contact' },
  },
  {
    match: (p) => p === '/branches',
    seo: { titleKey: 'seo.branches.title', descKey: 'seo.branches.description', path: '/branches' },
  },
  {
    match: (p) => p === '/cart',
    seo: { titleKey: 'seo.cart.title', descKey: 'seo.cart.description', path: '/cart', noIndex: true },
  },
  {
    match: (p) => p === '/login' || p === '/register' || p === '/forgot-password',
    seo: { titleKey: 'seo.auth.title', descKey: 'seo.auth.description', path: '/login', noIndex: true },
  },
  {
    match: (p) => p.startsWith('/dashboard') || p.startsWith('/admin') || p.startsWith('/checkout'),
    seo: {
      titleKey: 'seo.app.title',
      descKey: 'seo.app.description',
      path: '/dashboard',
      noIndex: true,
    },
  },
]

function organizationJsonLd(lang: string) {
  const isAr = lang.startsWith('ar')
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_ORIGIN}/#organization`,
        name: isAr ? 'جولد ستاندرد' : SITE_NAME,
        alternateName: isAr ? SITE_NAME : 'جولد ستاندرد',
        url: SITE_ORIGIN,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_ORIGIN}/logo.png`,
        },
        image: SITE_OG_IMAGE,
        email: GS_CONTACT.email,
        telephone: GS_CONTACT.phoneTel,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'KW',
          addressLocality: 'Kuwait City',
          streetAddress: isAr ? GS_CONTACT.addressAr : GS_CONTACT.addressEn,
        },
        sameAs: [GS_INSTAGRAM.url],
        geo: {
          '@type': 'GeoCoordinates',
          latitude: GS_MAIN_LOCATION.lat,
          longitude: GS_MAIN_LOCATION.lng,
        },
      },
      {
        '@type': 'JewelryStore',
        '@id': `${SITE_ORIGIN}/#store`,
        name: isAr ? 'جولد ستاندرد' : SITE_NAME,
        url: SITE_ORIGIN,
        image: SITE_OG_IMAGE,
        telephone: GS_CONTACT.phoneTel,
        email: GS_CONTACT.email,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'KW',
          addressLocality: 'Kuwait City',
          streetAddress: isAr ? GS_CONTACT.addressAr : GS_CONTACT.addressEn,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: GS_MAIN_LOCATION.lat,
          longitude: GS_MAIN_LOCATION.lng,
        },
        parentOrganization: { '@id': `${SITE_ORIGIN}/#organization` },
        sameAs: [GS_INSTAGRAM.url, GS_MAIN_LOCATION.placeUrl],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: SITE_ORIGIN,
        name: isAr ? 'جولد ستاندرد' : SITE_NAME,
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        inLanguage: [isAr ? 'ar' : 'en'],
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_ORIGIN}/products?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }
}

export function RouteSeo() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()
  const lang = i18n.language || 'ar'
  const locale = lang.startsWith('ar') ? 'ar_KW' : 'en_US'

  const matched = PUBLIC_ROUTES.find((r) => r.match(pathname))
  const seo = matched?.seo ?? {
    titleKey: 'seo.default.title',
    descKey: 'seo.default.description',
    path: pathname,
  }

  const title = t(seo.titleKey)
  const description = t(seo.descKey)
  const path = matched ? seo.path : pathname

  const jsonLd = useMemo(() => {
    const base = organizationJsonLd(lang)
    if (path === '/prices' || path === '/company-prices') {
      ;(base['@graph'] as Record<string, unknown>[]).push({
        '@type': 'WebPage',
        '@id': absoluteUrl(path),
        url: absoluteUrl(path),
        name: title,
        description,
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        about: {
          '@type': 'Thing',
          name: lang.startsWith('ar') ? 'أسعار الذهب والمعادن' : 'Gold and precious metal prices',
        },
        inLanguage: lang.startsWith('ar') ? 'ar' : 'en',
      })
    }
    return base
  }, [lang, path, title, description])

  return (
    <SeoHead
      title={title}
      description={description}
      path={path}
      image={SITE_OG_IMAGE}
      noIndex={seo.noIndex}
      locale={locale}
      jsonLd={jsonLd}
    />
  )
}
