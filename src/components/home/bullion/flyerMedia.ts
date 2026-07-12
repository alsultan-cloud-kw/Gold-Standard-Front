/**
 * Desktop flyer journey only when the viewport is truly “desktop-like”.
 * Accessibility zoom / larger display size on phones can push CSS width past
 * the lg breakpoint — we still keep the static hero bar in those cases.
 */
export const BULLION_FLYER_MQ =
  '(min-width: 1024px) and (pointer: fine) and (hover: hover)'

export function prefersBullionFlyer(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  return window.matchMedia(BULLION_FLYER_MQ).matches
}
