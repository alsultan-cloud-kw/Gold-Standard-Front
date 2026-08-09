export type PromoLayout = {
  background?: {
    type?: 'solid' | 'gradient' | 'image'
    colors?: string[]
    imageUrl?: string
    overlayOpacity?: number
  }
  badges?: Array<{
    shape?: 'rect' | 'circle'
    text?: string
    textAr?: string
    icon?: string
    bg?: string
    fg?: string
  }>
  header?: {
    title?: string
    titleAccent?: string
    titleAr?: string
    titleAccentAr?: string
    body?: string
    bodyAr?: string
    align?: 'start' | 'center'
  }
  hero?: { imageUrl?: string; fit?: 'contain' | 'cover' }
  featureItems?: Array<{
    kind?: 'text' | 'countdown'
    icon?: string
    subtitle?: string
    subtitleAr?: string
    title?: string
    titleAr?: string
    body?: string
    bodyAr?: string
    countdownEndsAt?: string | null
  }>
  ctas?: Array<{
    label?: string
    labelAr?: string
    destination?: string
    productSlug?: string
    discountCode?: string
    href?: string
    style?: 'primary' | 'ghost'
    size?: 'md' | 'lg'
    effect?: 'none' | 'glow'
  }>
  trustIcons?: Array<{ icon?: string; label?: string; labelAr?: string }>
  footer?: { text?: string; textAr?: string; icon?: string }
  colors?: { panel?: string; accent?: string; text?: string; muted?: string; divider?: string }
  direction?: 'ltr' | 'rtl' | 'auto'
}

export type PromoPopupPublic = {
  active: boolean
  campaign_key?: string
  show_mode?: 'once_dismissed' | 'every_session' | 'scheduled_once'
  ends_at?: string | null
  locale_mode?: 'ltr' | 'rtl' | 'auto'
  layout?: PromoLayout | null
}

function storageKey(campaignKey: string) {
  return `gs.promoPopup.${campaignKey || 'v1'}`
}

export function shouldShowPromoPopup(payload: PromoPopupPublic): boolean {
  if (!payload.active || !payload.layout) return false
  const key = storageKey(payload.campaign_key || 'v1')
  const mode = payload.show_mode || 'once_dismissed'
  if (mode === 'every_session') {
    return sessionStorage.getItem(key) !== '1'
  }
  return localStorage.getItem(key) !== '1'
}

export function dismissPromoPopup(payload: PromoPopupPublic) {
  const key = storageKey(payload.campaign_key || 'v1')
  const mode = payload.show_mode || 'once_dismissed'
  if (mode === 'every_session') {
    sessionStorage.setItem(key, '1')
  } else {
    localStorage.setItem(key, '1')
  }
}
