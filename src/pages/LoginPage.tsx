import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Phone, Lock, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { safeAppNextPath } from '../utils/safeNextPath'
import { resolvePostAuthPath } from '../utils/authRedirect'
import SocialSignInButtons from '../components/auth/SocialSignInButtons'
import TurnstileWidget, { type TurnstileWidgetHandle } from '../components/auth/TurnstileWidget'
import { isTurnstileConfigured } from '@/lib/turnstile'

export default function LoginPage() {
  const { t } = useTranslation()
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    phone_number: '',
    password: '',
  })
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const clearTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  const { login, user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = safeAppNextPath(searchParams.get('next'))
  const registerHref =
    nextPath != null ? `/register?next=${encodeURIComponent(nextPath)}` : '/register'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isTurnstileConfigured && !turnstileToken) {
      toast.error(t('auth.captchaRequired'))
      return
    }

    setIsLoading(true)

    if (isAuthenticated) {
      navigate(resolvePostAuthPath(user, nextPath))
      return
    }

    try {
      const credentials =
        loginMethod === 'email'
          ? { email: formData.email, password: formData.password }
          : { phone_number: formData.phone_number, password: formData.password }

      const loggedInUser = await login({
        ...credentials,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      })
      toast.success(t('auth.loginSuccess'))
      navigate(resolvePostAuthPath(loggedInUser, nextPath))
    } catch (err: unknown) {
      clearTurnstile()
      const res = (err as { response?: { status?: number; data?: { error?: string; admin_email?: string } } })
        ?.response
      if (res?.status === 400 && res?.data?.error === 'captcha_failed') {
        toast.error(t('auth.captchaFailed'))
      } else if (res?.status === 403 && res?.data?.error === 'inactive') {
        const adminEmail = res.data.admin_email || ''
        toast.error(
          adminEmail
            ? t('auth.accountInactiveWithAdmin', { email: adminEmail })
            : t('auth.accountInactive'),
        )
      } else {
        toast.error(t('auth.invalidCredentials'))
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gold-gradient-text-on-light mb-2">{t('auth.welcomeBack')}</h1>
          <p className="gold-gradient-text-on-light">{t('auth.signInSubtitle')}</p>
        </div>

        <div className="gold-card">
          <SocialSignInButtons mode="sign-in" redirectComplete={nextPath ?? '/'} disabled={isLoading} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gold-500/20" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-charcoal-900 px-2 text-gold-100/50">{t('auth.orEmailPhone')}</span>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                loginMethod === 'email'
                  ? 'bg-gold-500 text-charcoal-950'
                  : 'bg-charcoal-800 text-gold-100/60'
              }`}
            >
              <Mail className="w-4 h-4 inline me-2" />
              {t('auth.email')}
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                loginMethod === 'phone'
                  ? 'bg-gold-500 text-charcoal-950'
                  : 'bg-charcoal-800 text-gold-100/60'
              }`}
            >
              <Phone className="w-4 h-4 inline me-2" />
              {t('auth.phone')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMethod === 'email' ? (
              <div>
                <label className="block text-sm font-medium text-gold-100 mb-2">{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={t('auth.placeholderEmail')}
                    className="w-full ps-10 pe-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500"
                    required
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gold-100 mb-2">
                  {t('auth.phoneNumber')}
                </label>
                <div className="relative">
                  <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                  <input
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                    placeholder={t('auth.placeholderPhone')}
                    className="w-full ps-10 pe-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gold-100 mb-2">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('auth.enterPassword')}
                  className="w-full ps-10 pe-12 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 text-gold-400/60 hover:text-gold-400"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gold-500/30 bg-charcoal-800 text-gold-500" />
                <span className="text-sm text-gold-100/60">{t('auth.rememberMe')}</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-gold-400 hover:text-gold-300">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <TurnstileWidget
              ref={turnstileRef}
              onToken={setTurnstileToken}
              onExpire={clearTurnstile}
              onError={clearTurnstile}
            />

            <button
              type="submit"
              disabled={isLoading || (isTurnstileConfigured && !turnstileToken)}
              className="w-full gold-button flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {t('auth.signIn')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gold-100/60">
              {t('auth.noAccount')}{' '}
              <Link to={registerHref} className="text-gold-400 hover:text-gold-300 font-medium">
                {t('auth.createOne')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
