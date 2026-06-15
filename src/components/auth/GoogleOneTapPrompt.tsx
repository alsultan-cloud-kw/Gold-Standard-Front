import { useEffect, useRef, useState } from 'react'
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

  const dismissFallback = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_MS))
    } catch {
      // ignore
    }
    setShowFallback(false)
  }

  const continueWithGoogle = async () => {
    if (oauthBusy) return
    if (!clerk.loaded || !clerk.client) {
      toast.error(getClerkUnavailableMessage() ?? t('auth.googleSignInFailed'))
      return
    }

    setOauthBusy(true)
    try {
      const { redirectUrl: ssoRedirectUrl, redirectUrlComplete } = buildClerkOAuthUrls(redirectUrl)
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: clerkOAuthStrategy('google'),
        redirectUrl: ssoRedirectUrl,
        redirectUrlComplete,
      })
    } catch (err) {
      console.error('Google OAuth nudge failed:', err)
      toast.error(t('auth.googleSignInFailed'))
      setOauthBusy(false)
    }
  }

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
        <div className="fixed top-[5.75rem] end-4 sm:end-6 z-[45] w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-stone-200/80 bg-white/95 shadow-xl shadow-black/10 backdrop-blur-md">
          <button
            type="button"
            onClick={dismissFallback}
            className="absolute end-2.5 top-2.5 rounded-full p-1 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            aria-label="Dismiss sign-in prompt"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="px-4 py-4 pe-9">
            <div className="mb-3 flex items-center gap-3">
              <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-charcoal-950 ring-1 ring-gold-500/15">
                <span className="text-sm font-bold">GS</span>
              </div>
              <h2 className="text-sm font-semibold leading-5 text-stone-950">{t('auth.signInNudgeTitle')}</h2>
            </div>
            <p className="mt-1 text-sm leading-5 text-stone-600">{t('auth.signInNudgeBody')}</p>
            <button
              type="button"
              onClick={() => void continueWithGoogle()}
              disabled={oauthBusy}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-stone-800 active:scale-[0.99] disabled:opacity-60"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-stone-950">G</span>
              {oauthBusy ? t('auth.oauthSigningIn') : t('auth.continueWithGoogle')}
            </button>
            <button
              type="button"
              onClick={() => {
                dismissFallback()
                window.location.assign('/login')
              }}
              className="mt-2 w-full text-center text-xs font-medium text-stone-500 transition hover:text-stone-800"
            >
              {t('auth.signInWithEmail')}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
