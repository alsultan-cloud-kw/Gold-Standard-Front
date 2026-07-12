import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { useAuth } from '../contexts/AuthContext'
import { completeAuthNavigation } from '@/lib/completeAuthNavigation'

export default function SsoCallbackPage() {
  const { t } = useTranslation()
  const origin = window.location.origin
  const { isAuthenticated, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (isLoading || !isAuthenticated) return
    completeAuthNavigation(navigate, user, searchParams.get('next'))
  }, [isAuthenticated, isLoading, navigate, searchParams, user])

  return (
    <div className="relative min-h-[50dvh]">
      <div className="auth-route-loading" aria-busy="true">
        <AppLoadingScreen message={t('common.signingIn')} variant="page" />
      </div>
      <AuthenticateWithRedirectCallback
        signInUrl={`${origin}/login`}
        signUpUrl={`${origin}/register`}
        signInFallbackRedirectUrl={`${origin}/sso-callback`}
        signUpFallbackRedirectUrl={`${origin}/sso-callback`}
      />
      <div id="clerk-captcha" className="hidden" aria-hidden />
    </div>
  )
}
