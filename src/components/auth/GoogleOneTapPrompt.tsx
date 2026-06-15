import { useEffect, useRef, useState } from 'react'
import { ClerkLoaded, GoogleOneTap, useAuth as useClerkAuth, useClerk } from '@clerk/react'
import { useLocation } from 'react-router-dom'
import { cancelGoogleOneTap, promptGoogleOneTap } from '@/lib/googleOneTap'

const HIDDEN_PATHS = new Set(['/login', '/register', '/sso-callback', '/forgot-password'])
const PROMPT_DELAY_MS = 700

function hasDjangoJwt(): boolean {
  try {
    return Boolean(localStorage.getItem('access_token'))
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
  const { pathname } = useLocation()
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth()
  const clerk = useClerk()
  const [useClerkComponent, setUseClerkComponent] = useState(false)
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
      return
    }

    if (!googleClientId) {
      setUseClerkComponent(true)
      return
    }

    if (promptedRef.current) return

    const timer = window.setTimeout(() => {
      if (promptedRef.current || !clerk.loaded) return
      promptedRef.current = true

      void promptGoogleOneTap(googleClientId, clerk, (reason) => {
        console.info('Google One Tap unavailable, using Clerk fallback:', reason)
        setUseClerkComponent(true)
      })
    }, PROMPT_DELAY_MS)

    return () => {
      window.clearTimeout(timer)
      cancelGoogleOneTap()
    }
  }, [showPrompt, googleClientId, clerk, pathname])

  useEffect(() => {
    if (!showPrompt) {
      promptedRef.current = false
      setUseClerkComponent(!googleClientId)
    }
  }, [showPrompt, googleClientId])

  if (!showPrompt) return null

  if (googleClientId && !useClerkComponent) return null

  return (
    <ClerkLoaded>
      <GoogleOneTap
        cancelOnTapOutside
        itpSupport
        fedCmSupport
        signInForceRedirectUrl={redirectUrl}
        signUpForceRedirectUrl={redirectUrl}
      />
    </ClerkLoaded>
  )
}
