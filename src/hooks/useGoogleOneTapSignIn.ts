import { useCallback } from 'react'
import { useClerk } from '@clerk/react'
import { useLocation } from 'react-router-dom'

/** Open Clerk Google One Tap with return to the current page after sign-in. */
export function useGoogleOneTapSignIn() {
  const { loaded, openGoogleOneTap } = useClerk()
  const location = useLocation()

  const redirectUrl = `${window.location.origin}${location.pathname}${location.search}`

  const open = useCallback(() => {
    if (!loaded) return false
    openGoogleOneTap({
      cancelOnTapOutside: true,
      itpSupport: true,
      fedCmSupport: true,
      signInForceRedirectUrl: redirectUrl,
      signUpForceRedirectUrl: redirectUrl,
    })
    return true
  }, [loaded, openGoogleOneTap, redirectUrl])

  return { openGoogleOneTap: open, clerkLoaded: loaded, redirectUrl }
}
