import { useEffect, useRef } from 'react'
import { useAuth as useClerkAuth } from '@clerk/react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useGoogleOneTapSignIn } from '@/hooks/useGoogleOneTapSignIn'

const HIDDEN_PATHS = new Set(['/login', '/register', '/sso-callback', '/forgot-password'])
/** Shown once per browser tab session so navigation does not re-prompt. */
const SESSION_ATTEMPTED_KEY = 'gs_google_one_tap_attempted'
/** Brief pause after page is ready — responsive but not a popup slap. */
const SHOW_DELAY_MS = 900

function hasAccessToken(): boolean {
  try {
    return Boolean(localStorage.getItem('access_token'))
  } catch {
    return false
  }
}

/**
 * Google One Tap for guests: opens once per session after a short delay.
 * Uses Clerk programmatic API (not a persistent mount) to avoid slow re-init on SPA navigation.
 */
export default function GoogleOneTapPrompt() {
  const { pathname } = useLocation()
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth()
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const { openGoogleOneTap, clerkLoaded: clerkReady } = useGoogleOneTapSignIn()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hiddenPath = HIDDEN_PATHS.has(pathname)
  const tokenPresent = hasAccessToken()

  // Guests without a JWT: do not wait on Django auth bootstrap.
  const guestReady =
    clerkLoaded
    && clerkReady
    && !isSignedIn
    && !hiddenPath
    && (!tokenPresent || (!authLoading && !isAuthenticated))

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (!guestReady) return
    if (sessionStorage.getItem(SESSION_ATTEMPTED_KEY)) return

    timerRef.current = setTimeout(() => {
      if (sessionStorage.getItem(SESSION_ATTEMPTED_KEY)) return
      sessionStorage.setItem(SESSION_ATTEMPTED_KEY, '1')
      openGoogleOneTap()
    }, SHOW_DELAY_MS)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [guestReady, openGoogleOneTap, pathname])

  return null
}
