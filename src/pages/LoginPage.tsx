import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Phone, Lock, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { safeAppNextPath } from '../utils/safeNextPath'
import { completeAuthNavigation } from '@/lib/completeAuthNavigation'
import SocialSignInButtons from '../components/auth/SocialSignInButtons'
import TurnstileWidget, { type TurnstileWidgetHandle } from '../components/auth/TurnstileWidget'
import { AuthFlowShell } from '../components/auth/AuthFlowShell'
import { AuthSupportFooter } from '../components/auth/AuthSupportFooter'
import { isTurnstileConfigured } from '@/lib/turnstile'
import { getLastAuthMethod, setLastAuthMethod } from '@/lib/lastAuthMethod'
import { GS_CONTACT } from '@/constants/contact'
import { cn } from '@/lib/utils'

export default function LoginPage() {
  const { t } = useTranslation()
  const lastAuthMethod = getLastAuthMethod()
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>(
    lastAuthMethod === 'phone' ? 'phone' : 'email',
  )
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
      completeAuthNavigation(navigate, user, nextPath)
      setIsLoading(false)
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
      setLastAuthMethod(loginMethod)
      completeAuthNavigation(navigate, loggedInUser, nextPath)
    } catch (err: unknown) {
      clearTurnstile()
      const res = (err as { response?: { status?: number; data?: { error?: string; admin_email?: string } } })
        ?.response
      if (res?.status === 400 && res?.data?.error === 'captcha_failed') {
        toast.error(t('auth.captchaFailed'))
      } else if (res?.status === 403 && res?.data?.error === 'inactive') {
        const adminEmail = res.data.admin_email || GS_CONTACT.email
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

  const fieldClass =
    'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#0B0F19] outline-none placeholder:text-[#94A3B8] focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#0B0F19]'
  const methodBtn = (active: boolean) =>
    cn(
      'w-full rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
      active
        ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
        : 'border-black/10 text-[#64748B] hover:border-black/20',
    )

  return (
    <AuthFlowShell
      title={t('auth.welcomeBack')}
      subtitle={t('auth.signInSubtitle')}
      footer={
        <div className="space-y-3">
          <p>
            {t('auth.noAccount')}{' '}
            <Link to={registerHref} className="font-semibold text-[#3F6F00] hover:underline">
              {t('auth.createOne')}
            </Link>
          </p>
          <AuthSupportFooter />
        </div>
      }
    >
      <SocialSignInButtons mode="sign-in" redirectComplete={nextPath ?? '/'} disabled={isLoading} />

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-black/8" />
        </div>
        <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-wide">
          <span className="bg-white px-3 text-[#94A3B8]">{t('auth.orEmailPhone')}</span>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        <div className="relative flex-1">
          {lastAuthMethod === 'email' ? (
            <span className="pointer-events-none absolute -top-2.5 start-3 z-10 rounded-full border border-[#85E307]/50 bg-[#85E307] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0B0F19] shadow-sm">
              {t('auth.lastUsed')}
            </span>
          ) : null}
          <button type="button" onClick={() => setLoginMethod('email')} className={methodBtn(loginMethod === 'email')}>
            <Mail className="me-2 inline h-4 w-4" />
            {t('auth.email')}
          </button>
        </div>
        <div className="relative flex-1">
          {lastAuthMethod === 'phone' ? (
            <span className="pointer-events-none absolute -top-2.5 start-3 z-10 rounded-full border border-[#85E307]/50 bg-[#85E307] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0B0F19] shadow-sm">
              {t('auth.lastUsed')}
            </span>
          ) : null}
          <button type="button" onClick={() => setLoginMethod('phone')} className={methodBtn(loginMethod === 'phone')}>
            <Phone className="me-2 inline h-4 w-4" />
            {t('auth.phone')}
          </button>
        </div>
      </div>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        {loginMethod === 'email' ? (
          <div>
            <label className={labelClass}>{t('auth.email')}</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder={t('auth.placeholderEmail')}
                className={cn(fieldClass, 'ps-10')}
                required
              />
            </div>
          </div>
        ) : (
          <div>
            <label className={labelClass}>{t('auth.phoneNumber')}</label>
            <div className="relative">
              <Phone className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="tel"
                autoComplete="tel"
                value={formData.phone_number}
                onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                placeholder={t('auth.placeholderPhone')}
                className={cn(fieldClass, 'ps-10')}
                required
              />
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>{t('auth.password')}</label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t('auth.enterPassword')}
              className={cn(fieldClass, 'ps-10 pe-12')}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute end-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0B0F19]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="h-4 w-4 accent-[#3F6F00]" />
            <span className="text-sm text-[#64748B]">{t('auth.rememberMe')}</span>
          </label>
          <Link to="/forgot-password" className="text-sm font-semibold text-[#3F6F00] hover:underline">
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition enabled:hover:bg-[#9AF01A] disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#94A3B8]"
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0B0F19] border-t-transparent" />
          ) : (
            <>
              {t('auth.signIn')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </>
          )}
        </button>
      </form>
    </AuthFlowShell>
  )
}
