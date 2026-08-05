import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'

const APP_DEEP_LINK = 'goldstandard://sso-callback'

/**
 * Clerk native SSO → HTTPS (allowlisted) with rotating_token_nonce,
 * then hand off into the Expo app custom scheme (query preserved).
 *
 * Custom-scheme-only redirects often arrive bare on Android production
 * when the URL is missing from Clerk "Allowlist for mobile SSO redirect".
 * HTTPS allowlisting is reliable; this page forwards the nonce into the app.
 */
export default function MobileSsoCallbackPage() {
  const { t } = useTranslation()
  const target = useMemo(() => {
    if (typeof window === 'undefined') return APP_DEEP_LINK
    const q = window.location.search || ''
    const hash = window.location.hash || ''
    if (q) return `${APP_DEEP_LINK}${q}`
    if (hash.includes('rotating_token_nonce') || hash.includes('created_session_id')) {
      const frag = hash.startsWith('#') ? hash.slice(1) : hash
      return `${APP_DEEP_LINK}?${frag.replace(/^\?/, '')}`
    }
    return APP_DEEP_LINK
  }, [])

  useEffect(() => {
    const tmr = window.setTimeout(() => {
      window.location.replace(target)
    }, 50)
    return () => window.clearTimeout(tmr)
  }, [target])

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 px-6 text-center">
      <AppLoadingScreen />
      <p className="text-sm text-muted-foreground">
        {t('auth.returningToApp', 'Returning to the Gold Standard app…')}
      </p>
      <a className="text-sm underline text-primary" href={target}>
        {t('auth.openApp', 'Open app')}
      </a>
    </div>
  )
}
