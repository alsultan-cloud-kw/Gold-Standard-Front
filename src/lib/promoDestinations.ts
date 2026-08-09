export const PROMO_DESTINATION_IDS = [
  'dismiss',
  'apply_discount',
  'home',
  'shop',
  'product',
  'cart',
  'prices',
  'trade',
  'about',
  'contact',
  'branches',
  'verify',
  'join_club',
  'dashboard',
  'favourites',
  'login',
] as const

export type PromoDestinationId = (typeof PROMO_DESTINATION_IDS)[number]

export type PromoCtaAction = {
  destination?: string | null
  productSlug?: string | null
  discountCode?: string | null
  /** @deprecated prefer destination */
  href?: string | null
}

export type ResolvedPromoCta =
  | { kind: 'dismiss' }
  | { kind: 'apply_discount'; code: string }
  | { kind: 'navigate'; path: string }
  | { kind: 'external'; url: string }

function slugFromHref(href: string): string {
  const m = href.match(/\/products?\/([^/?#]+)/i)
  return m?.[1] ? decodeURIComponent(m[1]) : ''
}

/** Map Hub destination id → website path (platform-specific). */
export function resolvePromoCtaForWeb(cta: PromoCtaAction): ResolvedPromoCta {
  const dest = (cta.destination || '').trim()
  if (dest === 'dismiss' || (!dest && !(cta.href || '').trim())) {
    return { kind: 'dismiss' }
  }
  if (dest === 'apply_discount') {
    const code = (cta.discountCode || '').trim().toUpperCase()
    if (!code) return { kind: 'dismiss' }
    return { kind: 'apply_discount', code }
  }

  const slug = (cta.productSlug || '').trim() || (cta.href ? slugFromHref(cta.href) : '')

  switch (dest) {
    case 'home':
      return { kind: 'navigate', path: '/' }
    case 'shop':
      return { kind: 'navigate', path: '/products' }
    case 'product':
      return slug
        ? { kind: 'navigate', path: `/products/${encodeURIComponent(slug)}` }
        : { kind: 'navigate', path: '/products' }
    case 'cart':
      return { kind: 'navigate', path: '/cart' }
    case 'prices':
      return { kind: 'navigate', path: '/prices' }
    case 'trade':
      return { kind: 'navigate', path: '/holdings' }
    case 'about':
      return { kind: 'navigate', path: '/about' }
    case 'contact':
      return { kind: 'navigate', path: '/contact' }
    case 'branches':
      return { kind: 'navigate', path: '/branches' }
    case 'verify':
      return { kind: 'navigate', path: '/verify' }
    case 'join_club':
      return { kind: 'navigate', path: '/join-club' }
    case 'dashboard':
      return { kind: 'navigate', path: '/dashboard' }
    case 'favourites':
      return { kind: 'navigate', path: '/dashboard' }
    case 'login':
      return { kind: 'navigate', path: '/login' }
    default:
      break
  }

  const href = (cta.href || '').trim()
  if (!href) return { kind: 'dismiss' }
  if (/^https?:\/\//i.test(href)) return { kind: 'external', url: href }
  return { kind: 'navigate', path: href.startsWith('/') ? href : `/${href}` }
}
