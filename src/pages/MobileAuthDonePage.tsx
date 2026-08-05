import { useEffect, useRef, useState } from 'react'
import { useAuth as useClerkAuth } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void }
  }
}

const HANDOFF_TYPE = 'gs_mobile_clerk_auth'

function postToNative(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload)
  try {
    if (typeof payload.clerk_session_token === 'string' && payload.clerk_session_token) {
      ;(window as Window & { __GS_MOBILE_CLERK_TOKEN?: string }).__GS_MOBILE_CLERK_TOKEN =
        payload.clerk_session_token
    }
  } catch {
    /* ignore */
  }
  try {
    window.ReactNativeWebView?.postMessage(json)
  } catch {
    /* not in RN WebView */
  }
  // Also set document title marker for URL/title observers as a backup.
  try {
    document.title = `GS_MOBILE_AUTH:${payload.status || 'pending'}`
  } catch {
    /* ignore */
  }
}

/**
 * Landing page after Clerk web login/register when opened from the mobile app WebView.
 * Posts the Clerk session JWT to React Native; the app exchanges it via clerk_login.
 */
export default function MobileAuthDonePage() {
  const { t } = useTranslation()
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const [status, setStatus] = useState<'waiting' | 'sent' | 'error'>('waiting')
  const sentRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || sentRef.current) return

    let cancelled = false
    const startedAt = Date.now()

    void (async () => {
      // Clerk session can lag briefly after OAuth redirect into this route.
      while (!cancelled && Date.now() - startedAt < 20_000) {
        if (!isSignedIn) {
          await new Promise((r) => window.setTimeout(r, 250))
          const probe = await getToken().catch(() => null)
          if (probe) {
            sentRef.current = true
            postToNative({
              type: HANDOFF_TYPE,
              status: 'ok',
              clerk_session_token: probe,
            })
            if (!cancelled) setStatus('sent')
            return
          }
          continue
        }

        try {
          let token = await getToken()
          if (!token) {
            await new Promise((r) => window.setTimeout(r, 400))
            token = await getToken()
          }
          if (!token) {
            await new Promise((r) => window.setTimeout(r, 400))
            continue
          }
          sentRef.current = true
          postToNative({
            type: HANDOFF_TYPE,
            status: 'ok',
            clerk_session_token: token,
          })
          if (!cancelled) setStatus('sent')
          return
        } catch (err) {
          postToNative({
            type: HANDOFF_TYPE,
            status: 'error',
            error: err instanceof Error ? err.message : 'handoff_failed',
          })
          if (!cancelled) setStatus('error')
          return
        }
      }

      if (!cancelled && !sentRef.current) {
        postToNative({ type: HANDOFF_TYPE, status: 'unsigned' })
        setStatus('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [getToken, isLoaded, isSignedIn])

  // Retry postMessage a few times — RN may attach the bridge slightly late.
  useEffect(() => {
    if (status !== 'sent') return
    const timers = [300, 800, 1600].map((ms) =>
      window.setTimeout(() => {
        void getToken().then((token) => {
          if (!token) return
          postToNative({
            type: HANDOFF_TYPE,
            status: 'ok',
            clerk_session_token: token,
          })
        })
      }, ms),
    )
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [getToken, status])

  return (
    <div className="relative min-h-[50dvh]">
      <div className="auth-route-loading" aria-busy="true">
        <AppLoadingScreen
          message={
            status === 'error'
              ? t('auth.googleSignInFailed')
              : t('common.signingIn')
          }
          variant="page"
        />
      </div>
      <p className="sr-only" data-gs-mobile-auth={status}>
        {status}
      </p>
    </div>
  )
}
