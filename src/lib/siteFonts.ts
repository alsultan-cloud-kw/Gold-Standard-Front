/**
 * Site UI fonts — locked pairing: Source Sans 3 (EN) + Cairo (AR).
 * Price display numerals: Source Serif 4 (editorial karat / amount scale).
 * Brand display (The Year of The Camel) stays available via `.font-brand`.
 */

export const SITE_LATIN_FONT = 'Source Sans 3'
export const SITE_ARABIC_FONT = 'Cairo'
export const SITE_PRICE_DISPLAY_FONT = 'Source Serif 4'

const GOOGLE_LINK_ID = 'gs-google-fonts'

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;700&display=swap'

/** Load Source Sans 3 + Cairo + Source Serif 4 from Google Fonts (swap display). */
export function ensureSiteFontsLoaded() {
  let link = document.getElementById(GOOGLE_LINK_ID) as HTMLLinkElement | null
  if (!link) {
    link = document.createElement('link')
    link.id = GOOGLE_LINK_ID
    link.rel = 'stylesheet'
    document.head.appendChild(link)
  }
  if (link.href !== GOOGLE_FONTS_HREF) link.href = GOOGLE_FONTS_HREF
}

/** Apply locked font CSS variables (fallbacks are also set in index.css). */
export function initSiteFonts() {
  const root = document.documentElement
  root.dataset.fontPreset = 'cairo'
  root.style.setProperty(
    '--font-latin',
    `"${SITE_LATIN_FONT}", "Segoe UI", -apple-system, BlinkMacSystemFont, system-ui, sans-serif`,
  )
  root.style.setProperty(
    '--font-arabic',
    `"${SITE_ARABIC_FONT}", "Segoe UI", "Noto Sans Arabic", Tahoma, system-ui, sans-serif`,
  )
  root.style.setProperty(
    '--font-price-display',
    `"${SITE_PRICE_DISPLAY_FONT}", "Times New Roman", Georgia, serif`,
  )
}
