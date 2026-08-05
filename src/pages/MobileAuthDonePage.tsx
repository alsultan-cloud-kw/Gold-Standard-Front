import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth as useClerkAuth } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { useAuth } from '@/contexts/AuthContext'

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void }
  }
}

/**
 * Handoff contract with the Gold Standard mobile app.
 * The app receives **Django** access/refresh tokens — it never touches Clerk.
 */
const HANDOFF_TYPE = 'gs_mobile_auth'

type HandoffStatus = 'waiting' | 'sent' | 'error'

function postToNative(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload)
  try {
    window.ReactNativeWebView?.postMessage(json)
  } catch {
    /* not in a React Native WebView */
  }
  // Title marker is a fallback for WebViews where the message bridge attaches late.
  try {
    document.title = `GS_MOBILE_AUTH:${payload.status || 'pending'}`
  } catch {
    /* ignore */
  }
}

function readDjangoTokens(): { access: string; refresh: string } | null {
  try {
    const access = (localStorage.getItem('access_token') || '').trim()
    const refresh = (localStorage.getItem('refresh_token') || '').trim()
    if (access && refresh) return { access, refresh }
  } catch {
    /* storage unavailable */
  }
  return null
}

/**
 * Landing page after website Clerk login/register inside the mobile app WebView.
 *
 * Clerk runs only here, in the browser, where it already works. This page
 * exchanges the Clerk session for Django JWTs and posts those to the app, so
 * the device needs no Clerk SDK, custom scheme, or SSO redirect allowlist.
 */
export default function MobileAuthDonePage() {
  const { t } = useTranslation()
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const { user, loginWithClerk } = useAuth()
  const [status, setStatus] = useState<HandoffStatus>('waiting')
  const sentRef = useRef(false)
  const tokensRef = useRef<{ access: string; refresh: string } | null>(null)

  const send = useCallback(
    (tokens: { access: string; refresh: string }, profile?: unknown) => {
      tokensRef.current = tokens
      sentRef.current = true
      postToNative({
        type: HANDOFF_TYPE,
        status: 'ok',
        access: tokens.access,
        refresh: tokens.refresh,
        user: profile ?? null,
      })
      setStatus('sent')
    },
    [],
  )

  useEffect(() => {
    if (!isLoaded || sentRef.current) return

    let cancelled = false
    const startedAt = Date.now()

    void (async () => {
      while (!cancelled && Date.now() - startedAt < 25_000) {
        // ClerkAuthBridge may have already exchanged the session.
        const existing = readDjangoTokens()
        if (existing) {
          if (!cancelled) send(existing, user)
          return
        }

        // Otherwise drive the exchange here so we never depend on bridge timing.
        try {
          const clerkToken = await getToken().catch(() => null)
          if (clerkToken) {
            const profile = await loginWithClerk(clerkToken)
            const fresh = readDjangoTokens()
            if (fresh) {
              if (!cancelled) send(fresh, profile)
              return
            }
          }
        } catch (err) {
          if (!cancelled) {
            postToNative({
              type: HANDOFF_TYPE,
              status: 'error',
              error: err instanceof Error ? err.message : 'handoff_failed',
            })
            setStatus('error')
          }
          return
        }

        await new Promise((r) => window.setTimeout(r, 400))
      }

      if (!cancelled && !sentRef.current) {
        postToNative({ type: HANDOFF_TYPE, status: 'unsigned' })
        setStatus('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [getToken, isLoaded, isSignedIn, loginWithClerk, send, user])

  // Re-post a few times — the native bridge can attach slightly after load.
  useEffect(() => {
    if (status !== 'sent') return
    const timers = [300, 900, 1800].map((ms) =>
      window.setTimeout(() => {
        const tokens = tokensRef.current
        if (!tokens) return
        postToNative({
          type: HANDOFF_TYPE,
          status: 'ok',
          access: tokens.access,
          refresh: tokens.refresh,
          user: user ?? null,
        })
      }, ms),
    )
    return () => timers.forEach((id) => window.clearTimeout(id))
  }, [status, user])

  return (
    <div className="relative min-h-[50dvh]">
      <div className="auth-route-loading" aria-busy="true">
        <AppLoadingScreen
          message={status === 'error' ? t('auth.googleSignInFailed') : t('common.signingIn')}
          variant="page"
        />
      </div>
      <p className="sr-only" data-gs-mobile-auth={status}>
        {status}
      </p>
    </div>
  )
}
