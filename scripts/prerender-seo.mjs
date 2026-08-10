/**
 * Post-vite build: emit static HTML shells per public route with unique
 * title / description / OG / JSON-LD so WhatsApp and crawlers see real meta
 * without executing React. SPA assets still hydrate from the same JS bundle.
 *
 * Kuwait-first: default <title> / description / WebPage.name use Arabic
 * (html lang=ar); og:locale stays ar_KW with en_US alternate.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  PRERENDER_PAGES,
  SITE_NAME,
  SITE_OG_IMAGE,
  SITE_ORIGIN,
  STORE_NAP,
} from './seo-catalog.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.resolve(__dirname, '../dist')
const PUBLIC = path.resolve(__dirname, '../public')
const ROOT_HTML = path.join(DIST, 'index.html')

/** Static FAQ for /prices shells (keep aligned with locales pricesPage.faq). */
const PRICES_FAQ = [
  {
    qAr: 'أسعار الذهب اليوم عيار 21؟',
    aAr: 'افتح بطاقة عيار 21 في هذه الصفحة لسعر الشراء والبيع المباشر بالدينار للغرام. أدخل الوزن لترى الإجمالي فوراً — الأسعار تُحدَّث باستمرار.',
    qEn: 'How much is 22K gold in Kuwait today?',
    aEn: 'Open the 22K card on this page for the live buy and sell price in KWD per gram. Enter your weight to see the total instantly — rates refresh continuously.',
  },
  {
    qAr: 'كم سعر جرام الذهب عيار 21؟',
    aAr: 'عند ضبط الوزن على 1 غرام، سعر الشراء لعيار 21 هو ما تدفعه للغرام وسعر البيع ما تستلمه عند البيع لنا. قارن أيضاً عيارات 24 و22 و18 على اللوحة.',
    qEn: 'How much is 1 gram of 22 karat gold today?',
    aEn: 'With the weight set to 1 g, the 22K buy price is what you pay per gram and the sell price is what you receive if you sell to us. Switch karats to compare 24K, 21K, and 18K.',
  },
  {
    qAr: 'سعر مصنعية الذهب في الكويت؟',
    aAr: 'لوحة الأسعار تعرض معدن الذهب المباشر. رسوم المصنعية تظهر شفافة على صفحة المنتجات عند شراء سبائك أو عملات معتمدة.',
    qEn: 'How much is 18 carat gold in Kuwait?',
    aEn: 'Select the 18K card for today’s Kuwait buy and sell rates in KWD/g. Precious metals appear in the spot section below the karat board.',
  },
  {
    qAr: 'أين أشتري ذهباً أونلاين في الكويت؟',
    aAr: 'تسوّق السبائك والعملات المعتمدة من صفحة المنتجات بأسعار الدينار المباشرة، مع ختم وزارة التجارة والشحن المؤمَّن — أو زر صالتنا في سوق الذهب المركزي بمدينة الكويت.',
    qEn: 'Where can I buy gold online in Kuwait?',
    aEn: 'Shop certified bars and coins on our products page at live KWD prices, with MOCI hallmark and insured delivery — or visit our Central Gold Market showroom in Kuwait City.',
  },
]

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function absoluteUrl(p) {
  if (!p || p === '/') return `${SITE_ORIGIN}/`
  return `${SITE_ORIGIN}${p.startsWith('/') ? p : `/${p}`}`
}

function buildJsonLd(page) {
  const pageUrl = absoluteUrl(page.path)
  const graph = [
    {
      '@type': 'Organization',
      '@id': `${SITE_ORIGIN}/#organization`,
      name: SITE_NAME,
      alternateName: 'جولد ستاندرد',
      url: SITE_ORIGIN,
      logo: `${SITE_ORIGIN}/logo.png`,
      email: STORE_NAP.email,
      telephone: STORE_NAP.phone,
      sameAs: [STORE_NAP.instagram, STORE_NAP.placeUrl],
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'KW',
        addressLocality: 'Kuwait City',
        postalCode: '85951',
        streetAddress: STORE_NAP.addressEn,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: STORE_NAP.lat,
        longitude: STORE_NAP.lng,
      },
    },
    {
      '@type': ['JewelryStore', 'LocalBusiness'],
      '@id': `${SITE_ORIGIN}/#store`,
      name: SITE_NAME,
      url: SITE_ORIGIN,
      image: SITE_OG_IMAGE,
      telephone: STORE_NAP.phone,
      email: STORE_NAP.email,
      priceRange: '$$',
      currenciesAccepted: 'KWD',
      paymentAccepted: 'Cash, KNET, Card',
      hasMap: STORE_NAP.placeUrl,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'KW',
        addressLocality: 'Kuwait City',
        postalCode: '85951',
        streetAddress: STORE_NAP.addressEn,
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: STORE_NAP.lat,
        longitude: STORE_NAP.lng,
      },
      openingHoursSpecification: [
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
      ],
      parentOrganization: { '@id': `${SITE_ORIGIN}/#organization` },
      sameAs: [STORE_NAP.instagram, STORE_NAP.placeUrl],
      areaServed: { '@type': 'Country', name: 'Kuwait' },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      url: SITE_ORIGIN,
      name: SITE_NAME,
      publisher: { '@id': `${SITE_ORIGIN}/#organization` },
      inLanguage: ['ar', 'en'],
    },
    {
      '@type': 'WebPage',
      '@id': pageUrl,
      url: pageUrl,
      name: page.titleAr,
      description: page.descAr,
      inLanguage: 'ar',
      isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
      about: { '@id': `${SITE_ORIGIN}/#store` },
    },
  ]

  if (page.path !== '/') {
    graph.push({
      '@type': 'BreadcrumbList',
      '@id': `${pageUrl}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'الرئيسية',
          item: `${SITE_ORIGIN}/`,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: page.titleAr,
          item: pageUrl,
        },
      ],
    })
  }

  if (page.path === '/prices') {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${pageUrl}#faq`,
      mainEntity: PRICES_FAQ.map((item) => ({
        '@type': 'Question',
        name: item.qAr,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.aAr,
        },
      })),
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

function replaceOrInsertMeta(html, attr, key, content) {
  const re = new RegExp(`<meta\\s+[^>]*${attr}=["']${key}["'][^>]*>`, 'i')
  const tag = `<meta ${attr}="${key}" content="${escapeHtml(content)}" />`
  if (re.test(html)) return html.replace(re, tag)
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`)
}

function replaceOrInsertProperty(html, property, content) {
  return replaceOrInsertMeta(html, 'property', property, content)
}

function replaceOrInsertName(html, name, content) {
  return replaceOrInsertMeta(html, 'name', name, content)
}

function replaceCanonical(html, href) {
  const re = /<link\s+[^>]*rel=["']canonical["'][^>]*>/i
  const tag = `<link rel="canonical" href="${escapeHtml(href)}" />`
  if (re.test(html)) return html.replace(re, tag)
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`)
}

function replaceTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`)
}

function replaceJsonLd(html, jsonLd) {
  const re = /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i
  const tag = `<script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n    </script>`
  if (re.test(html)) return html.replace(re, tag)
  return html.replace(/<\/head>/i, `    ${tag}\n  </head>`)
}

function injectNoscript(html, page) {
  const faqBlock =
    page.path === '/prices'
      ? `<section lang="ar" dir="rtl"><h2>أسئلة شائعة</h2>${PRICES_FAQ.map(
          (f) => `<h3>${escapeHtml(f.qAr)}</h3><p>${escapeHtml(f.aAr)}</p>`,
        ).join('')}</section>`
      : ''
  const block = `
    <noscript>
      <div lang="ar" dir="rtl" style="max-width:42rem;margin:1.5rem auto;padding:1rem;font-family:system-ui,sans-serif;color:#0b0f19">
        <h1>${escapeHtml(page.titleAr)}</h1>
        <p>${escapeHtml(page.descAr)}</p>
        <p>${escapeHtml(STORE_NAP.addressAr)} · ${escapeHtml(STORE_NAP.phone)}</p>
        ${faqBlock}
        <p><a href="${SITE_ORIGIN}/products">اشترِ ذهباً معتمداً</a> · <a href="${SITE_ORIGIN}/prices">سعر الذهب الكويت اليوم</a></p>
      </div>
      <div lang="en" dir="ltr" style="max-width:42rem;margin:1.5rem auto;padding:1rem;font-family:system-ui,sans-serif;color:#0b0f19">
        <h1>${escapeHtml(page.titleEn)}</h1>
        <p>${escapeHtml(page.descEn)}</p>
        <p>${escapeHtml(STORE_NAP.addressEn)} · ${escapeHtml(STORE_NAP.phone)}</p>
        <p><a href="${SITE_ORIGIN}/products">Buy certified gold</a> · <a href="${SITE_ORIGIN}/prices">Gold price Kuwait today</a></p>
      </div>
    </noscript>`
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `${block}\n  </body>`)
  }
  return html + block
}

function applyPageMeta(html, page) {
  const url = absoluteUrl(page.path)
  // Arabic-first: matches html lang=ar and Kuwait SERP demand.
  const title = page.titleAr
  const description = page.descAr

  let out = html
  out = replaceTitle(out, title)
  out = replaceCanonical(out, url)
  out = replaceOrInsertName(out, 'description', description)
  out = replaceOrInsertName(out, 'robots', 'index, follow, max-image-preview:large')
  out = replaceOrInsertName(out, 'geo.region', 'KW')
  out = replaceOrInsertName(out, 'geo.placename', 'Kuwait City')

  out = replaceOrInsertProperty(out, 'og:site_name', SITE_NAME)
  out = replaceOrInsertProperty(out, 'og:type', 'website')
  out = replaceOrInsertProperty(out, 'og:url', url)
  out = replaceOrInsertProperty(out, 'og:title', title)
  out = replaceOrInsertProperty(out, 'og:description', description)
  out = replaceOrInsertProperty(out, 'og:image', SITE_OG_IMAGE)
  out = replaceOrInsertProperty(out, 'og:image:width', '1200')
  out = replaceOrInsertProperty(out, 'og:image:height', '630')
  out = replaceOrInsertProperty(out, 'og:image:alt', title)
  out = replaceOrInsertProperty(out, 'og:locale', 'ar_KW')
  out = replaceOrInsertProperty(out, 'og:locale:alternate', 'en_US')

  out = replaceOrInsertName(out, 'twitter:card', 'summary_large_image')
  out = replaceOrInsertName(out, 'twitter:title', title)
  out = replaceOrInsertName(out, 'twitter:description', description)
  out = replaceOrInsertName(out, 'twitter:image', SITE_OG_IMAGE)
  out = replaceOrInsertName(out, 'twitter:image:alt', title)

  out = replaceJsonLd(out, buildJsonLd(page))
  out = injectNoscript(out, page)
  return out
}

function writeSitemap() {
  const lastmod = new Date().toISOString().slice(0, 10)
  const pageUrls = PRERENDER_PAGES.map((page) => {
    const loc = absoluteUrl(page.path)
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  })
  // Legal page is indexable but not a prerender shell — keep in sitemap.
  pageUrls.push(`  <url>
    <loc>${absoluteUrl('/terms-and-privacy')}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>`)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pageUrls.join('\n')}
</urlset>
`
  fs.writeFileSync(path.join(DIST, 'sitemap.xml'), xml, 'utf8')
  fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), xml, 'utf8')
}

function main() {
  if (!fs.existsSync(ROOT_HTML)) {
    console.error(`[prerender-seo] Missing ${ROOT_HTML}. Run vite build first.`)
    process.exit(1)
  }

  const template = fs.readFileSync(ROOT_HTML, 'utf8')
  let written = 0

  for (const page of PRERENDER_PAGES) {
    const html = applyPageMeta(template, page)
    if (page.path === '/') {
      fs.writeFileSync(ROOT_HTML, html, 'utf8')
      written += 1
      continue
    }
    const dir = path.join(DIST, page.path.replace(/^\//, ''))
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, 'index.html'), html, 'utf8')
    written += 1
  }

  writeSitemap()
  console.log(`[prerender-seo] Wrote ${written} HTML shells + sitemap.xml → ${DIST}`)
}

main()
