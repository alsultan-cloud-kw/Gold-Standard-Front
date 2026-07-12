import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/contexts/AuthContext'
import { consumeLoginSuccessPending, showLoginSuccessToast } from '@/lib/authToast'

const AUTH_PAGES = new Set(['/login', '/register', '/sso-callback', '/forgot-password'])

/**
 * Shows the login success toast on the post-auth destination (not during auth screens),
 * so the navbar stays visible and the toast is not lost to a route swap.
 */
export default function AuthSuccessNotifier() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  useEffect(() => {
    if (isLoading || !isAuthenticated) return
    if (AUTH_PAGES.has(location.pathname)) return
    if (!consumeLoginSuccessPending()) return

    const id = window.requestAnimationFrame(() => {
      showLoginSuccessToast({
        title: t('auth.loginSuccess'),
        body: t('auth.loginSuccessBody'),
      })
    })
    return () => window.cancelAnimationFrame(id)
  }, [isAuthenticated, isLoading, location.pathname, t])

  return null
}
