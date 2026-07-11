/** Brand display face — optional accents via `.font-brand`. UI uses Google pairings. */
export const BRAND_FONT_FAMILY = 'The Year of The Camel'

export const brandFontStack = `"${BRAND_FONT_FAMILY}", var(--font-latin), var(--font-arabic), system-ui, sans-serif`

/** Active UI stack — Source Sans 3 + Cairo with system fallbacks. */
export const uiFontStack =
  'var(--font-latin), var(--font-arabic), system-ui, sans-serif'
