import { useAuth as useClerkAuth } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Full-page auth veil: centered spinner + blurred site behind.
 * Covers Clerk→Django sync, manual login submit, and sign-out.
 */
export default function AuthTransitionOverlay() {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading, isClerkSyncing, isLoggingOut, authBusy } = useAuth()
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth()

  const syncing =
    isLoggingOut
    || authBusy
    || isClerkSyncing
    || (clerkLoaded && isSignedIn && !isAuthenticated && !isLoading && !isLoggingOut)

  if (!syncing) return null

  const message = isLoggingOut
    ? t('common.signingOut')
    : t('common.completingSignIn')

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-[#0B0F19]/25 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-4 flex max-w-xs flex-col items-center gap-4 rounded-2xl border border-white/20 bg-white/95 px-10 py-9 shadow-[0_24px_64px_-16px_rgba(11,15,25,0.45)]">
        <Loader2 className="h-10 w-10 animate-spin text-[#3F6F00]" aria-hidden />
        <p className="text-center text-sm font-bold text-[#0B0F19]">{message}</p>
      </div>
    </div>
  )
}
