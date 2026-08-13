import { useCallback } from 'react'
import { useAuth as useClerkAuth } from '@clerk/react'
import { useAuth } from '@/contexts/AuthContext'
import { cancelGoogleOneTap } from '@/lib/googleOneTap'

/**
 * Full storefront sign-out: Clerk session + Django JWT.
 * Dashboard used to call Django-only logout, which left Clerk signed in and
 * ClerkAuthBridge immediately re-issued Django tokens (felt like auto re-login).
 */
export function useFullSignOut() {
  const { logout, isLoggingOut } = useAuth()
  const { isSignedIn: clerkSignedIn, signOut: clerkSignOut } = useClerkAuth()

  const fullSignOut = useCallback(async () => {
    cancelGoogleOneTap()
    if (clerkSignedIn) {
      try {
        await clerkSignOut()
      } catch (e) {
        console.error('Clerk signOut failed:', e)
      }
    }
    await logout()
  }, [clerkSignedIn, clerkSignOut, logout])

  return { fullSignOut, isLoggingOut }
}
