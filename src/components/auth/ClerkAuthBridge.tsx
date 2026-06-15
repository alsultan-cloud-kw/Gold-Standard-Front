import { useEffect, useRef } from 'react'
import { useAuth as useClerkAuth } from '@clerk/react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'

/** After Clerk OAuth, exchange session for Django JWT so the rest of the app keeps working. */
export default function ClerkAuthBridge() {
  const { t } = useTranslation()
  const { isSignedIn, isLoaded, getToken, signOut } = useClerkAuth()
  const { isAuthenticated, isLoading, loginWithClerk } = useAuth()
  const syncingRef = useRef(false)

  useEffect(() => {
    if (!isLoaded || isLoading || !isSignedIn || isAuthenticated || syncingRef.current) return

    syncingRef.current = true
    void (async () => {
      try {
        const token = await getToken()
        if (!token) throw new Error('No Clerk session')
        await loginWithClerk(token)
      } catch (err: unknown) {
        const res = (err as { response?: { status?: number; data?: { error?: string; admin_email?: string } } })
          ?.response
        if (res?.status === 403 && res?.data?.error === 'inactive') {
          const adminEmail = res.data.admin_email || ''
          toast.error(
            adminEmail
              ? t('auth.accountInactiveWithAdmin', { email: adminEmail })
              : t('auth.accountInactive'),
          )
        } else {
          const apiError =
            (err as { response?: { data?: { error?: string; detail?: string } } })?.response?.data
              ?.error ||
            (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail
          const message = (err as Error)?.message
          toast.error(
            apiError === 'Invalid Clerk session token'
              ? 'Clerk session could not be verified on the server. Check Django CLERK_SECRET_KEY and redeploy.'
              : apiError || message || t('auth.googleSignInFailed'),
          )
        }
        console.error('Clerk → Django sync failed:', err)
        try {
          await signOut()
        } catch {
          // ignore
        }
      } finally {
        syncingRef.current = false
      }
    })()
  }, [isLoaded, isLoading, isSignedIn, isAuthenticated, getToken, loginWithClerk, signOut, t])

  return null
}
