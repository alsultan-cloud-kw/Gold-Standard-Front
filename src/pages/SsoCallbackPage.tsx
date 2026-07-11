import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { useAuth } from '../contexts/AuthContext'
import { resolvePostAuthPath } from '../utils/authRedirect'

export default function SsoCallbackPage() {
  const { t } = useTranslation()
  const origin = window.location.origin
  const { isAuthenticated, isLoading, user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(resolvePostAuthPath(user, searchParams.get('next')), { replace: true })
    }
  }, [isAuthenticated, isLoading, navigate, searchParams, user])

  if (isLoading || (isAuthenticated && user)) {
    return <AppLoadingScreen message={t('common.signingIn')} variant="fullscreen" />
  }

  return (
    <div className="relative min-h-[100dvh]">
      <AppLoadingScreen message={t('common.signingIn')} variant="fullscreen" />
      <AuthenticateWithRedirectCallback
        signInUrl={`${origin}/login`}
        signUpUrl={`${origin}/register`}
        signInFallbackRedirectUrl={`${origin}/`}
        signUpFallbackRedirectUrl={`${origin}/`}
      />
      <div id="clerk-captcha" className="hidden" aria-hidden />
    </div>
  )
}
