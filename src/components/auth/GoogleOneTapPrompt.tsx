import { useCallback, useEffect, useRef, useState } from 'react'
import { ClerkLoaded, GoogleOneTap, useAuth as useClerkAuth, useClerk } from '@clerk/react'
import { useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cancelGoogleOneTap, promptGoogleOneTap } from '@/lib/googleOneTap'
import { buildClerkOAuthUrls, clerkOAuthStrategy, getClerkUnavailableMessage } from '@/lib/clerkOAuth'

const HIDDEN_PATHS = new Set(['/login', '/register', '/sso-callback', '/forgot-password'])
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
 * Google One Tap for storefront guests.
 * - With VITE_GOOGLE_CLIENT_ID: native GIS prompt (needs JS origins on your Google OAuth client).
 * - Otherwise: Clerk <GoogleOneTap /> (needs custom Google credentials in Clerk Dashboard).
 * ClerkAuthBridge exchanges the Clerk session for Django JWT after sign-in.
 */
export default function GoogleOneTapPrompt() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth()
  const clerk = useClerk()
  const [useClerkComponent, setUseClerkComponent] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [oauthBusy, setOauthBusy] = useState(false)
  const promptedRef = useRef(false)

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
      return
    }

    if (!googleClientId) {
      setUseClerkComponent(true)
      const fallbackTimer = window.setTimeout(() => {
        if (!fallbackDismissed()) setShowFallback(true)
      }, FALLBACK_DELAY_MS)
      return () => window.clearTimeout(fallbackTimer)
    }

    const fallbackTimer = window.setTimeout(() => {
      if (!fallbackDismissed()) setShowFallback(true)
    }, FALLBACK_DELAY_MS)

    const markDisplayed = () => {
      window.clearTimeout(fallbackTimer)
      setShowFallback(false)
    }

    const markUnavailable = (reason?: string) => {
      console.info('Google One Tap unavailable:', reason || 'unknown')
      setUseClerkComponent(true)
      if (!fallbackDismissed()) setShowFallback(true)
    }

    if (promptedRef.current) {
      return () => window.clearTimeout(fallbackTimer)
    }

    const promptTimer = window.setTimeout(() => {
      if (promptedRef.current || !clerk.loaded) return
      promptedRef.current = true

      void promptGoogleOneTap(googleClientId, clerk, (moment) => {
        if (moment.type === 'displayed') {
          markDisplayed()
        } else {
          markUnavailable(moment.reason)
        }
      }).catch((err) => {
        console.error('Google One Tap failed to initialize:', err)
        markUnavailable('gsi_init_failed')
      })
    }, PROMPT_DELAY_MS)

    return () => {
      window.clearTimeout(promptTimer)
      window.clearTimeout(fallbackTimer)
      cancelGoogleOneTap()
    }
  }, [showPrompt, googleClientId, clerk, pathname])

  useEffect(() => {
    if (!showPrompt) {
      promptedRef.current = false
      setUseClerkComponent(!googleClientId)
      setShowFallback(false)
      return
    }
  }, [showPrompt, googleClientId])

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
      {(!googleClientId || useClerkComponent) && (
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
          className="fixed end-3 z-[60] w-[min(20.5rem,calc(100%_-_1.5rem))] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_40px_-12px_rgba(11,15,25,0.35)] sm:end-6"
          style={{ top: 'calc(var(--nav-offset, 7.25rem) + 0.5rem)' }}
        >
          <div className="flex items-start gap-3 border-b border-stone-100 px-3.5 py-3 ps-4">
            <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#ECFCCB] text-[#0B0F19] ring-1 ring-[#85E307]/25">
              <span className="text-sm font-bold">GS</span>
            </div>
            <h2
              id="gs-signin-nudge-title"
              className="min-w-0 flex-1 pt-1.5 text-sm font-semibold leading-5 text-stone-950"
            >
              {t('auth.signInNudgeTitle')}
            </h2>
            <button
              type="button"
              onClick={dismissFallback}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-50 text-stone-700 transition hover:border-stone-300 hover:bg-stone-100 hover:text-stone-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/60"
              aria-label={t('common.dismissSignInPrompt')}
              title={t('common.dismissSignInPrompt')}
            >
              <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
            </button>
          </div>

          <div className="px-4 py-3.5">
            <p className="text-sm leading-5 text-stone-600">{t('auth.signInNudgeBody')}</p>
            <button
              type="button"
              onClick={() => void continueWithGoogle()}
              disabled={oauthBusy}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 active:scale-[0.99] disabled:opacity-60"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-stone-950">
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
              className="mt-2 w-full py-2 text-center text-xs font-medium text-stone-500 transition hover:text-stone-800"
            >
              {t('auth.signInWithEmail')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
