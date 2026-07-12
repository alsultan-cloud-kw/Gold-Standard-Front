import { useCallback, useEffect, useRef, useState } from 'react'
import { ClerkLoaded, GoogleOneTap, useAuth as useClerkAuth, useClerk } from '@clerk/react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  cancelGoogleOneTap,
  hasNativeGoogleClientId,
  promptGoogleOneTap,
} from '@/lib/googleOneTap'
import { buildClerkOAuthUrls, clerkOAuthStrategy, getClerkUnavailableMessage } from '@/lib/clerkOAuth'

const HIDDEN_PATHS = new Set([
  '/login',
  '/register',
  '/sso-callback',
  '/forgot-password',
  '/checkout',
])
const PROMPT_DELAY_MS = 700
const FALLBACK_DELAY_MS = 3200
const DISMISS_KEY = 'gs_google_signin_nudge_dismissed_until'
const DISMISS_MS = 24 * 60 * 60 * 1000

function hasDjangoJwt(): boolean {
  try {
    return Boolean(localStorage.getItem('access_token'))
  } catch {
    return false
  }
}

function fallbackDismissed(): boolean {
  try {
    const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || '0')
    return dismissedUntil > Date.now()
  } catch {
    return false
  }
}

/**
 * Google One Tap for storefront guests — exactly one GSI path:
 * - VITE_GOOGLE_CLIENT_ID set → native GIS only (never Clerk <GoogleOneTap />).
 * - Otherwise → Clerk <GoogleOneTap /> only (never native initialize).
 */
export default function GoogleOneTapPrompt() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth()
  const clerk = useClerk()
  const [showFallback, setShowFallback] = useState(false)
  const [oauthBusy, setOauthBusy] = useState(false)
  const promptedRef = useRef(false)

  const useNativeGsi = hasNativeGoogleClientId()
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? ''
  const redirectUrl = `${window.location.origin}${pathname}${window.location.search}`
  const hiddenPath = HIDDEN_PATHS.has(pathname)
  const showPrompt =
    clerkLoaded
    && clerk.loaded
    && !isSignedIn
    && !hasDjangoJwt()
    && !hiddenPath

  useEffect(() => {
    if (!showPrompt) {
      cancelGoogleOneTap()
      setShowFallback(false)
      promptedRef.current = false
      return
    }

    const fallbackTimer = window.setTimeout(() => {
      if (!fallbackDismissed()) setShowFallback(true)
    }, FALLBACK_DELAY_MS)

    if (!useNativeGsi) {
      return () => window.clearTimeout(fallbackTimer)
    }

    if (promptedRef.current) {
      return () => window.clearTimeout(fallbackTimer)
    }

    const promptTimer = window.setTimeout(() => {
      if (promptedRef.current || !clerk.loaded) return
      promptedRef.current = true

      void promptGoogleOneTap(googleClientId, clerk, (moment) => {
        if (moment.type === 'displayed') {
          window.clearTimeout(fallbackTimer)
          setShowFallback(false)
        } else {
          console.info('Google One Tap unavailable:', moment.reason || 'unknown')
          if (!fallbackDismissed()) setShowFallback(true)
        }
      }).catch((err) => {
        console.error('Google One Tap failed to initialize:', err)
        if (!fallbackDismissed()) setShowFallback(true)
      })
    }, PROMPT_DELAY_MS)

    return () => {
      window.clearTimeout(promptTimer)
      window.clearTimeout(fallbackTimer)
      cancelGoogleOneTap()
    }
  }, [showPrompt, useNativeGsi, googleClientId, clerk, pathname])

  const dismissFallback = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS))
    } catch {
      // ignore
    }
    setShowFallback(false)
  }, [])

  const continueWithGoogle = async () => {
    if (oauthBusy) return
    if (!clerk.loaded || !clerk.client) {
      toast.error(getClerkUnavailableMessage() ?? t('auth.googleSignInFailed'))
      return
    }

    setOauthBusy(true)
    try {
      const { redirectUrl: ssoRedirectUrl, redirectUrlComplete } = buildClerkOAuthUrls(redirectUrl)
      const params = {
        strategy: clerkOAuthStrategy('google'),
        redirectUrl: ssoRedirectUrl,
        redirectUrlComplete,
      }
      try {
        await clerk.client.signIn.authenticateWithRedirect(params)
      } catch (signInErr) {
        console.warn('Nudge Google sign-in failed, trying sign-up:', signInErr)
        await clerk.client.signUp.authenticateWithRedirect(params)
      }
    } catch (err) {
      console.error('Google OAuth nudge failed:', err)
      toast.error(t('auth.googleSignInFailed'))
      setOauthBusy(false)
    }
  }

  useEffect(() => {
    if (!showFallback) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissFallback()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [showFallback, dismissFallback])

  if (!showPrompt) return null

  return (
    <>
      {!useNativeGsi && (
        <ClerkLoaded>
          <GoogleOneTap
            cancelOnTapOutside
            itpSupport
            fedCmSupport
            signInForceRedirectUrl={redirectUrl}
            signUpForceRedirectUrl={redirectUrl}
          />
        </ClerkLoaded>
      )}

      {showFallback && (
        <div
          role="dialog"
          aria-modal="false"
          aria-labelledby="gs-signin-nudge-title"
          className="fixed end-3 z-[60] w-[min(20.5rem,calc(100%_-_1.5rem))] overflow-hidden rounded-2xl border border-black/8 bg-white sm:end-6"
          style={{ top: 'calc(var(--nav-offset, 7.25rem) + 0.5rem)' }}
        >
          <div className="flex items-start gap-3 border-b border-black/6 px-3.5 py-3 ps-4">
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ECFCCB] text-[#0B0F19] ring-1 ring-[#85E307]/25">
              <span className="text-sm font-bold">G</span>
            </div>
            <h2
              id="gs-signin-nudge-title"
              className="min-w-0 flex-1 pt-1.5 text-sm font-semibold leading-5 text-[#0B0F19]"
            >
              {t('auth.signInNudgeTitle')}
            </h2>
            <button
              type="button"
              onClick={dismissFallback}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-black/8 bg-[#F9F9FA] text-[#64748B] transition hover:border-black/12 hover:bg-[#F4F4F5] hover:text-[#0B0F19] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/60"
              aria-label={t('common.dismissSignInPrompt')}
              title={t('common.dismissSignInPrompt')}
            >
              <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </button>
          </div>

          <div className="px-4 py-3.5">
            <p className="text-sm leading-5 text-[#64748B]">{t('auth.signInNudgeBody')}</p>
            <button
              type="button"
              onClick={() => void continueWithGoogle()}
              disabled={oauthBusy}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a2230] active:scale-[0.99] disabled:opacity-60"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-[#0B0F19]">
                G
              </span>
              {oauthBusy ? t('auth.oauthSigningIn') : t('auth.continueWithGoogle')}
            </button>
            <button
              type="button"
              onClick={() => {
                dismissFallback()
                window.location.assign('/login')
              }}
              className="mt-2 w-full py-2 text-center text-xs font-medium text-[#64748B] transition hover:text-[#0B0F19]"
            >
              {t('auth.signInWithEmail')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
