/**
 * Public indexable routes for RouteSeo + build-time HTML shells.
 * Copy lives in locales (`seo.*`); this catalog owns path matching and sitemap flags.
 */

export type PublicPageSeo = {
  /** Canonical path (no trailing slash except home). */
  path: string
  titleKey: string
  descKey: string
  /** Sitemap priority 0–1 when indexable. */
  priority: number
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  noIndex?: boolean
  match: (pathname: string) => boolean
}

/** Routes emitted as static HTML shells after `vite build`. */
export const PRERENDER_PATHS = [
  '/',
  '/prices',
  '/products',
  '/about',
  '/branches',
  '/contact',
  '/zakat',
  '/holdings',
  '/verify',
] as const

export type PrerenderPath = (typeof PRERENDER_PATHS)[number]

export const PUBLIC_PAGE_SEO: PublicPageSeo[] = [
  {
    path: '/',
    titleKey: 'seo.home.title',
    descKey: 'seo.home.description',
    priority: 1,
    changefreq: 'daily',
    match: (p) => p === '/',
  },
  {
    path: '/prices',
    titleKey: 'seo.prices.title',
    descKey: 'seo.prices.description',
    priority: 0.95,
    changefreq: 'hourly',
    match: (p) => p === '/prices',
  },
  {
    path: '/zakat',
    titleKey: 'seo.zakat.title',
    descKey: 'seo.zakat.description',
    priority: 0.8,
    changefreq: 'weekly',
    match: (p) => p === '/zakat',
  },
  {
    path: '/gs-kyc',
    titleKey: 'seo.customerKyc.title',
    descKey: 'seo.customerKyc.description',
    priority: 0.4,
    changefreq: 'monthly',
    match: (p) => p === '/gs-kyc',
  },
  {
    path: '/moci-kyc',
    titleKey: 'seo.mociKyc.title',
    descKey: 'seo.mociKyc.description',
    priority: 0.3,
    changefreq: 'monthly',
    noIndex: true,
    match: (p) => p === '/moci-kyc' || p === '/kyc',
  },
  {
    path: '/company-prices',
    titleKey: 'seo.companyPrices.title',
    descKey: 'seo.companyPrices.description',
    priority: 0.3,
    changefreq: 'hourly',
    noIndex: true,
    match: (p) => p === '/company-prices',
  },
  {
    path: '/company-orders',
    titleKey: 'seo.companyOrders.title',
    descKey: 'seo.companyOrders.description',
    priority: 0.1,
    changefreq: 'monthly',
    noIndex: true,
    match: (p) => p === '/company-orders',
  },
  {
    path: '/verify-account',
    titleKey: 'seo.auth.title',
    descKey: 'seo.auth.description',
    priority: 0.1,
    changefreq: 'yearly',
    noIndex: true,
    match: (p) => p === '/verify-account',
  },
  {
    path: '/products',
    titleKey: 'seo.products.title',
    descKey: 'seo.products.description',
    priority: 0.9,
    changefreq: 'daily',
    match: (p) => p === '/products' || p.startsWith('/products/'),
  },
  {
    path: '/about',
    titleKey: 'seo.about.title',
    descKey: 'seo.about.description',
    priority: 0.7,
    changefreq: 'monthly',
    match: (p) => p === '/about',
  },
  {
    path: '/holdings',
    titleKey: 'seo.holdings.title',
    descKey: 'seo.holdings.description',
    priority: 0.75,
    changefreq: 'weekly',
    match: (p) => p === '/holdings' || p === '/trading',
  },
  {
    path: '/contact',
    titleKey: 'seo.contact.title',
    descKey: 'seo.contact.description',
    priority: 0.8,
    changefreq: 'monthly',
    match: (p) => p === '/contact',
  },
  {
    path: '/branches',
    titleKey: 'seo.branches.title',
    descKey: 'seo.branches.description',
    priority: 0.85,
    changefreq: 'monthly',
    match: (p) => p === '/branches',
  },
  {
    path: '/verify',
    titleKey: 'seo.verify.title',
    descKey: 'seo.verify.description',
    priority: 0.7,
    changefreq: 'monthly',
    match: (p) => p === '/verify' || p.startsWith('/verify/'),
  },
  {
    path: '/terms-and-privacy',
    titleKey: 'seo.terms.title',
    descKey: 'seo.terms.description',
    priority: 0.3,
    changefreq: 'yearly',
    match: (p) => p === '/terms-and-privacy' || p === '/terms' || p === '/privacy',
  },
  {
    path: '/cart',
    titleKey: 'seo.cart.title',
    descKey: 'seo.cart.description',
    priority: 0.1,
    changefreq: 'yearly',
    noIndex: true,
    match: (p) => p === '/cart',
  },
  {
    path: '/login',
    titleKey: 'seo.auth.title',
    descKey: 'seo.auth.description',
    priority: 0.1,
    changefreq: 'yearly',
    noIndex: true,
    match: (p) => p === '/login' || p === '/register' || p === '/forgot-password',
  },
  {
    path: '/dashboard',
    titleKey: 'seo.app.title',
    descKey: 'seo.app.description',
    priority: 0.1,
    changefreq: 'yearly',
    noIndex: true,
    match: (p) => p.startsWith('/dashboard') || p.startsWith('/admin') || p.startsWith('/checkout'),
  },
]

export function matchPublicPageSeo(pathname: string): PublicPageSeo | undefined {
  return PUBLIC_PAGE_SEO.find((r) => r.match(pathname))
}

/** Indexable marketing URLs for documentation / tooling. Prefer public/sitemap.xml + build prerender. */
export function sitemapEntries(): Array<{
  path: string
  priority: number
  changefreq: PublicPageSeo['changefreq']
}> {
  return PUBLIC_PAGE_SEO.filter(
    (page) => !page.noIndex && PRERENDER_PATHS.includes(page.path as PrerenderPath),
  ).map((page) => ({
    path: page.path,
    priority: page.priority,
    changefreq: page.changefreq,
  }))
}
