import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Shield } from 'lucide-react'
import logo from '@/assets/logo.png'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import {
  SESSION_EXPIRED_EVENT,
  acknowledgeSessionExpiredUi,
  clearSessionDeadline,
  consumePendingSessionExpiredUi,
  dismissSessionExpiredUi,
  hydrateSessionDeadline,
  isAuthSessionExpired,
  msUntilSessionExpiry,
  notifySessionExpired,
  resetSessionExpiredFlag,
} from '@/lib/authSession'
import { cn } from '@/lib/utils'

const AUTH_PATHS = new Set(['/login', '/register', '/forgot-password', '/sso-callback'])

/**
 * Watches the absolute 30-minute session and shows a branded re-auth modal.
 * Mount inside the router (needs navigate / location).
 */
export function SessionExpiredModal() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAuth()
  const [open, setOpen] = useState(false)
  const isRtl = i18n.dir() === 'rtl'

  const showExpired = useCallback(() => {
    acknowledgeSessionExpiredUi()
    // Always show — even on /login — so ProtectedRoute redirects don't skip the message.
    setOpen(true)
  }, [])

  useEffect(() => {
    if (consumePendingSessionExpiredUi()) {
      showExpired()
    }
    const onExpired = () => showExpired()
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired)
  }, [showExpired])

  // Proactive timer from absolute deadline (and re-check on tab focus).
  useEffect(() => {
    if (!localStorage.getItem('access_token') && !user) return

    hydrateSessionDeadline()
    if (isAuthSessionExpired()) {
      notifySessionExpired()
      return
    }

    const remaining = msUntilSessionExpiry()
    const timer = window.setTimeout(() => {
      notifySessionExpired()
    }, remaining)

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (isAuthSessionExpired()) notifySessionExpired()
    }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onVisible)

    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onVisible)
    }
  }, [user, isAuthenticated, location.pathname])

  // Hide modal once they successfully sign in again.
  useEffect(() => {
    if (isAuthenticated && open) {
      setOpen(false)
      resetSessionExpiredFlag()
    }
  }, [isAuthenticated, open])

  const returnPath =
    location.pathname.startsWith('/login') || AUTH_PATHS.has(location.pathname)
      ? '/dashboard'
      : `${location.pathname}${location.search}`

  const handleSignIn = () => {
    dismissSessionExpiredUi()
    setOpen(false)
    if (AUTH_PATHS.has(location.pathname)) {
      // Already on sign-in / register — just close; form is ready.
      return
    }
    const q = encodeURIComponent(returnPath)
    navigate(`/login?next=${q}&returnUrl=${q}`)
  }

  const handleContinueBrowsing = () => {
    dismissSessionExpiredUi()
    setOpen(false)
    clearSessionDeadline()
    const onProtected =
      location.pathname.startsWith('/dashboard') ||
      location.pathname.startsWith('/admin') ||
      location.pathname.startsWith('/checkout') ||
      location.pathname.startsWith('/verify-account') ||
      AUTH_PATHS.has(location.pathname)
    if (onProtected) {
      navigate('/', { replace: true })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // Non-dismissible via overlay / Esc — must choose an action.
        if (!next) return
        setOpen(next)
      }}
    >
      <DialogContent
        showCloseButton={false}
        dir={isRtl ? 'rtl' : 'ltr'}
        className={cn(
          'max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden border-black/10 p-0 sm:max-w-md',
          'rounded-2xl bg-white shadow-[0_24px_80px_rgba(11,15,25,0.28)]',
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <div className="relative overflow-hidden bg-[#0B0F19] px-6 pb-8 pt-7 text-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.12]"
            style={{
              background:
                'radial-gradient(ellipse 80% 60% at 50% 0%, #85E307 0%, transparent 70%)',
            }}
            aria-hidden
          />
          <div className="relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <img
              src={logo}
              alt=""
              className="h-8 w-auto object-contain"
              width={96}
              height={32}
            />
          </div>
          <p className="relative text-[10px] font-semibold uppercase tracking-[0.2em] text-[#85E307]">
            {t('auth.sessionExpired.kicker')}
          </p>
          <DialogTitle className="relative mt-2 text-xl font-bold tracking-tight text-white sm:text-2xl">
            {t('auth.sessionExpired.title')}
          </DialogTitle>
          <DialogDescription className="relative mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/70">
            {t('auth.sessionExpired.body')}
          </DialogDescription>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-start gap-3 rounded-xl border border-black/8 bg-[#F7F8F5] px-3.5 py-3 text-start">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B0F19] text-[#85E307]">
              <Shield className="size-4" aria-hidden />
            </span>
            <p className="text-xs leading-relaxed text-[#64748B] sm:text-sm">
              {t('auth.sessionExpired.securityNote')}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              type="button"
              onClick={handleSignIn}
              className="h-11 w-full rounded-xl bg-[#0B0F19] text-sm font-semibold text-white hover:bg-[#161C2A]"
            >
              {t('auth.sessionExpired.signInAgain')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleContinueBrowsing}
              className="h-10 w-full rounded-xl text-sm font-medium text-[#64748B] hover:bg-black/5 hover:text-[#0B0F19]"
            >
              {t('auth.sessionExpired.continueBrowsing')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
