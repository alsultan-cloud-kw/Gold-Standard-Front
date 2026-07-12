/**
 * Prevents mobile browser page-zoom chrome (%, Reset, ± slider) from appearing
 * over the storefront. Keeps layout at 1×; maps keep their own pinch gestures.
 */
export function installMobilePageZoomLock() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const isEditable = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false
    const tag = target.tagName
    return (
      tag === 'INPUT' ||
      tag === 'TEXTAREA' ||
      tag === 'SELECT' ||
      target.isContentEditable
    )
  }

  const inMap = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false
    return Boolean(target.closest('.leaflet-container, .branches-map-root'))
  }

  // iOS Safari pinch / gesture zoom
  const blockGesture = (event: Event) => {
    event.preventDefault()
  }
  document.addEventListener('gesturestart', blockGesture, { passive: false })
  document.addEventListener('gesturechange', blockGesture, { passive: false })
  document.addEventListener('gestureend', blockGesture, { passive: false })

  // Double-tap zoom (common trigger for the floating % / Reset bar)
  let lastTouchEnd = 0
  document.addEventListener(
    'touchend',
    (event) => {
      if (inMap(event.target) || isEditable(event.target)) return
      const now = Date.now()
      if (now - lastTouchEnd <= 280) {
        event.preventDefault()
      }
      lastTouchEnd = now
    },
    { passive: false },
  )

  // Multi-finger pinch page zoom (leave map gestures alone)
  document.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length > 1 && !inMap(event.target)) {
        event.preventDefault()
      }
    },
    { passive: false },
  )
}
