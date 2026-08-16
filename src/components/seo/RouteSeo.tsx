import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SeoHead } from './SeoHead'
import { SITE_NAME, SITE_OG_IMAGE, SITE_ORIGIN, absoluteUrl } from '@/constants/site'
import { GS_CONTACT } from '@/constants/contact'
import { GS_INSTAGRAM } from '@/constants/social'
import { GS_MAIN_LOCATION } from '@/constants/location'
import { matchPublicPageSeo } from '@/seo/publicPages'
import { pricesFaqEntries } from '@/components/prices/PricesFaqSection'
import { homeFaqEntries } from '@/components/home/HomeFaqSection'

/** Kuwait showroom hours (Asia/Kuwait) — Sat–Thu 09:00–21:00, Fri 14:00–21:00. */
const STORE_OPENING_HOURS = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    opens: '09:00',
    closes: '21:00',
  },
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: 'Friday',
    opens: '14:00',
    closes: '21:00',
  },
] as const

function organizationJsonLd(lang: string, ogImage: string) {
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
        image: ogImage,
        email: GS_CONTACT.email,
        telephone: [GS_CONTACT.phoneTel, GS_CONTACT.switchboardTel],
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'KW',
          addressLocality: 'Kuwait City',
          postalCode: '85951',
          streetAddress: isAr ? GS_CONTACT.addressAr : GS_CONTACT.addressEn,
        },
        sameAs: [GS_INSTAGRAM.url, GS_MAIN_LOCATION.placeUrl],
        geo: {
          '@type': 'GeoCoordinates',
          latitude: GS_MAIN_LOCATION.lat,
          longitude: GS_MAIN_LOCATION.lng,
        },
      },
      {
        '@type': ['JewelryStore', 'LocalBusiness'],
        '@id': `${SITE_ORIGIN}/#store`,
        name: isAr ? 'جولد ستاندرد' : SITE_NAME,
        url: SITE_ORIGIN,
        image: ogImage,
        telephone: [GS_CONTACT.phoneTel, GS_CONTACT.switchboardTel],
        email: GS_CONTACT.email,
        priceRange: '$$',
        currenciesAccepted: 'KWD',
        paymentAccepted: 'Cash, KNET, Card',
        hasMap: GS_MAIN_LOCATION.placeUrl,
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'KW',
          addressLocality: 'Kuwait City',
          postalCode: '85951',
          streetAddress: isAr ? GS_CONTACT.addressAr : GS_CONTACT.addressEn,
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: GS_MAIN_LOCATION.lat,
          longitude: GS_MAIN_LOCATION.lng,
        },
        openingHoursSpecification: STORE_OPENING_HOURS,
        parentOrganization: { '@id': `${SITE_ORIGIN}/#organization` },
        sameAs: [GS_INSTAGRAM.url, GS_MAIN_LOCATION.placeUrl],
        areaServed: {
          '@type': 'Country',
          name: 'Kuwait',
        },
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: SITE_ORIGIN,
        name: isAr ? 'جولد ستاندرد' : SITE_NAME,
        publisher: { '@id': `${SITE_ORIGIN}/#organization` },
        inLanguage: ['ar', 'en'],
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

  const matched = matchPublicPageSeo(pathname)
  const seo = matched ?? {
    titleKey: 'seo.default.title',
    descKey: 'seo.default.description',
    path: pathname,
    noIndex: undefined as boolean | undefined,
  }

  const title = t(seo.titleKey)
  const description = t(seo.descKey)
  const path = matched ? matched.path : pathname
  const isPrices = path === '/prices'
  const isHome = path === '/'

  const jsonLd = useMemo(() => {
    const base = organizationJsonLd(lang, SITE_OG_IMAGE)
    const graph = base['@graph'] as Record<string, unknown>[]
    const pageUrl = absoluteUrl(path)
    const inLanguage = lang.startsWith('ar') ? 'ar' : 'en'

    graph.push({
      '@type': 'WebPage',
      '@id': pageUrl,
      url: pageUrl,
      name: title,
      description,
      isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
      about: { '@id': `${SITE_ORIGIN}/#store` },
      inLanguage,
    })

    if (path !== '/') {
      graph.push({
        '@type': 'BreadcrumbList',
        '@id': `${pageUrl}#breadcrumb`,
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: lang.startsWith('ar') ? 'الرئيسية' : 'Home',
            item: `${SITE_ORIGIN}/`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: title,
            item: pageUrl,
          },
        ],
      })
    }

    if (isPrices) {
      const faqs = pricesFaqEntries(t)
      graph.push({
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: faqs.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      })
    } else if (isHome) {
      const faqs = homeFaqEntries(t)
      graph.push({
        '@type': 'FAQPage',
        '@id': `${pageUrl}#faq`,
        mainEntity: faqs.map((item) => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      })
    }

    return base
  }, [lang, path, title, description, isPrices, isHome, t])

  return (
    <SeoHead
      title={title}
      description={description}
      path={path}
      image={SITE_OG_IMAGE}
      noIndex={Boolean(seo.noIndex)}
      locale={locale}
      jsonLd={jsonLd}
    />
  )
}
