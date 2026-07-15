import { useAuth as useClerkAuth } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Soft full-page veil while Clerk→Django exchange runs after OAuth.
 * Keeps navbar chrome stable and prevents guest UI / sign-in nudge flash.
 */
export default function AuthTransitionOverlay() {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading, isClerkSyncing } = useAuth()
  const { isSignedIn, isLoaded: clerkLoaded } = useClerkAuth()

  const syncing =
    isClerkSyncing
    || (clerkLoaded && isSignedIn && !isAuthenticated && !isLoading)

  if (!syncing) return null

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#F7F9F5]/72 backdrop-blur-[3px]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-4 flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-black/10 bg-white px-8 py-7 shadow-[0_20px_50px_-20px_rgba(11,15,25,0.35)]">
        <Loader2 className="h-8 w-8 animate-spin text-[#3F6F00]" aria-hidden />
        <p className="text-center text-sm font-semibold text-[#0B0F19]">
          {t('common.completingSignIn')}
        </p>
        <p className="text-center text-xs leading-relaxed text-[#64748B]">
          {t('auth.authTransitionHint')}
        </p>
      </div>
    </div>
  )
}
