import { ClerkLoaded, GoogleOneTap } from '@clerk/react'
import { useAuth as useClerkAuth } from '@clerk/react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useGoogleOneTapSignIn } from '@/hooks/useGoogleOneTapSignIn'

const HIDDEN_PATHS = new Set(['/login', '/register', '/sso-callback', '/forgot-password'])

/**
 * Google's One Tap prompt (top-right) for guests — same UX as major storefronts.
 * After Clerk signs the user in, ClerkAuthBridge exchanges the session for Django JWT.
 */
export default function GoogleOneTapPrompt() {
  const { pathname } = useLocation()
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth()
  const { isAuthenticated, isLoading } = useAuth()
  const { redirectUrl } = useGoogleOneTapSignIn()

  if (!clerkLoaded || isLoading || isAuthenticated || isSignedIn || HIDDEN_PATHS.has(pathname)) {
    return null
  }

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
