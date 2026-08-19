/** Phone, tablet, or Gold Standard in-app WebView (camera scan path). */
export function isMobileCameraClient(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  if (window.ReactNativeWebView) return true

  const ua = navigator.userAgent || ''
  if (/GoldStandard|Expo|wv\)|WebView/i.test(ua)) return true
  if (/Android|iPhone|iPod|iPad|Mobile/i.test(ua)) return true

  const coarse = window.matchMedia?.('(pointer: coarse)').matches
  const narrow = window.innerWidth < 768
  return Boolean(coarse && narrow)
}

export function isSecureCameraContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.isSecureContext || window.location.hostname === 'localhost'
}
