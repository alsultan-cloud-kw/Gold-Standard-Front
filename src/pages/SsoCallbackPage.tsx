import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthenticateWithRedirectCallback } from '@clerk/react'
import { useAuth } from '../contexts/AuthContext'
import { resolvePostAuthPath } from '../utils/authRedirect'
import { AuthLoadingFallback } from '../components/routing/ProtectedRoute'

export default function SsoCallbackPage() {
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
    return <AuthLoadingFallback message="Signing you in…" />
  }

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
      <AuthenticateWithRedirectCallback
        signInUrl={`${origin}/login`}
        signUpUrl={`${origin}/register`}
        signInFallbackRedirectUrl={`${origin}/`}
        signUpFallbackRedirectUrl={`${origin}/`}
      />
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gold-100/70 text-sm">Signing you in…</p>
      <div id="clerk-captcha" className="hidden" aria-hidden />
    </div>
  )
}
