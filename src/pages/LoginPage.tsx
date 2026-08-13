import { useState, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Phone, Lock, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { resolveAuthReturnPath } from '../utils/safeNextPath'
import { completeAuthNavigation } from '@/lib/completeAuthNavigation'
import SocialSignInButtons from '../components/auth/SocialSignInButtons'
import TurnstileWidget, { type TurnstileWidgetHandle } from '../components/auth/TurnstileWidget'
import { AuthFlowShell } from '../components/auth/AuthFlowShell'
import { AuthSupportFooter } from '../components/auth/AuthSupportFooter'
import { isTurnstileConfigured } from '@/lib/turnstile'
import { getLastAuthMethod, setLastAuthMethod } from '@/lib/lastAuthMethod'
import { GS_CONTACT } from '@/constants/contact'
import { getSafeUserErrorMessage } from '../utils/apiErrors'
import { cn } from '@/lib/utils'
import { KuwaitPhoneField } from '@/components/auth/KuwaitPhoneField'
import { normalizeKuwaitPhone } from '@/lib/kuwaitPhone'
import { authApi } from '@/services/api'
import type { User } from '@/types'

type LoginMethod = 'email' | 'phone'
type Step = 'choose' | 'otp' | 'password'

export default function LoginPage() {
  const { t } = useTranslation()
  const lastAuthMethod = getLastAuthMethod()
  const [loginMethod, setLoginMethod] = useState<LoginMethod>(
    lastAuthMethod === 'phone' ? 'phone' : 'email',
  )
  const [step, setStep] = useState<Step>('choose')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    phone_number: '',
    password: '',
    otp: '',
  })
  const [otpUserId, setOtpUserId] = useState<string | null>(null)
  const [otpDestination, setOtpDestination] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const clearTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  const { login, loginWithSession, user, isAuthenticated, setAuthBusy } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = resolveAuthReturnPath(searchParams.get('next'), searchParams.get('returnUrl'))
  const oauthParam = searchParams.get('oauth')
  const autoProvider =
    oauthParam === 'apple' || oauthParam === 'google' ? oauthParam : null
  const registerHref =
    nextPath != null
      ? `/register?next=${encodeURIComponent(nextPath)}&returnUrl=${encodeURIComponent(nextPath)}`
      : '/register'

  const switchMethod = (method: LoginMethod) => {
    setLoginMethod(method)
    setStep('choose')
    setFormData((f) => ({ ...f, otp: '', password: '' }))
    setOtpUserId(null)
    setOtpDestination('')
  }

  const sendOtp = async () => {
    if (isTurnstileConfigured && !turnstileToken) {
      toast.error(t('auth.captchaRequired'))
      return
    }
    setIsLoading(true)
    setAuthBusy(true)
    try {
      if (loginMethod === 'email') {
        const email = formData.email.trim()
        if (!email.includes('@')) {
          toast.error(t('auth.invalidCredentials'))
          return
        }
        const res = await authApi.requestLoginOtp({
          email,
          channel: 'email',
          ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
        })
        setOtpUserId(res.user_id || res.delivery?.user_id || null)
        setOtpDestination(res.delivery?.destination || email)
      } else {
        const phoneE164 = normalizeKuwaitPhone(formData.phone_number)
        if (!phoneE164) {
          toast.error(t('auth.flow.invalidKuwaitPhone'))
          return
        }
        const res = await authApi.requestLoginOtp({
          phone_number: phoneE164,
          channel: 'whatsapp',
          ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
        })
        setOtpUserId(res.user_id || res.delivery?.user_id || null)
        setOtpDestination(res.delivery?.destination || phoneE164)
      }
      setLastAuthMethod(loginMethod)
      setStep('otp')
      toast.success(t('auth.otpCodeSent'))
    } catch (err: unknown) {
      clearTurnstile()
      toast.error(getSafeUserErrorMessage(err, t, t('auth.otpSendFailed')))
    } finally {
      setIsLoading(false)
      setAuthBusy(false)
    }
  }

  const verifyOtp = async () => {
    const code = formData.otp.trim()
    if (code.length !== 6) {
      toast.error(t('auth.otpInvalid'))
      return
    }
    setIsLoading(true)
    setAuthBusy(true)
    try {
      const res = await authApi.verifyOTP({
        otp_code: code,
        purpose: 'login',
        user_id: otpUserId || undefined,
      })
      if (!res.access || !res.refresh || !res.user) {
        toast.error(t('auth.otpInvalid'))
        return
      }
      const loggedIn = await loginWithSession({
        access: res.access,
        refresh: res.refresh,
        user: res.user as User,
      })
      setLastAuthMethod(loginMethod)
      completeAuthNavigation(navigate, loggedIn, nextPath)
    } catch (err: unknown) {
      toast.error(getSafeUserErrorMessage(err, t, t('auth.otpInvalid')))
    } finally {
      setIsLoading(false)
      setAuthBusy(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isTurnstileConfigured && !turnstileToken) {
      toast.error(t('auth.captchaRequired'))
      return
    }

    setIsLoading(true)
    setAuthBusy(true)

    if (isAuthenticated) {
      completeAuthNavigation(navigate, user, nextPath)
      setIsLoading(false)
      setAuthBusy(false)
      return
    }

    try {
      const phoneE164 =
        loginMethod === 'phone' ? normalizeKuwaitPhone(formData.phone_number) : null
      if (loginMethod === 'phone' && !phoneE164) {
        toast.error(t('auth.flow.invalidKuwaitPhone'))
        return
      }

      const credentials =
        loginMethod === 'email'
          ? { email: formData.email, password: formData.password }
          : { phone_number: phoneE164!, password: formData.password }

      const loggedInUser = await login({
        ...credentials,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      })
      setLastAuthMethod(loginMethod)
      completeAuthNavigation(navigate, loggedInUser, nextPath)
    } catch (err: unknown) {
      clearTurnstile()
      const res = (err as {
        response?: { status?: number; data?: { error?: string; code?: string; admin_email?: string } }
      })?.response
      if (res?.status === 400 && res?.data?.error === 'captcha_failed') {
        toast.error(t('auth.captchaFailed'))
      } else if (
        res?.status === 403 &&
        (res?.data?.error === 'use_company_login' || res?.data?.code === 'use_company_login')
      ) {
        toast.error(t('auth.companyLogin.useCompanyLogin'))
        navigate(
          `/company-login${formData.email.trim() ? `?email=${encodeURIComponent(formData.email.trim())}` : ''}`,
          { replace: true },
        )
      } else if (res?.status === 403 && res?.data?.error === 'inactive') {
        const adminEmail = res.data.admin_email || GS_CONTACT.email
        toast.error(
          adminEmail
            ? t('auth.accountInactiveWithAdmin', { email: adminEmail })
            : t('auth.accountInactive'),
        )
      } else {
        toast.error(getSafeUserErrorMessage(err, t, t('auth.invalidCredentials')))
      }
    } finally {
      setIsLoading(false)
      setAuthBusy(false)
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
      {step !== 'otp' ? (
        <SocialSignInButtons
          mode="sign-in"
          redirectComplete={nextPath ?? '/'}
          disabled={isLoading}
          autoProvider={autoProvider}
        />
      ) : null}

      {step === 'otp' ? (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#0B0F19]">{t('auth.otpTitle')}</h3>
          <p className="text-sm text-[#64748B]">
            {loginMethod === 'email' ? t('auth.otpSubtitleEmail') : t('auth.otpSubtitlePhone')}
          </p>
          {otpDestination ? (
            <p className="text-sm font-medium text-[#3F6F00]">
              {t('auth.otpSentTo', { destination: otpDestination })}
            </p>
          ) : null}
          <div>
            <label className={labelClass}>{t('auth.otpLabel')}</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={formData.otp}
              onChange={(e) =>
                setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })
              }
              className={fieldClass}
              required
            />
          </div>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void verifyOtp()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition enabled:hover:bg-[#9AF01A] disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#94A3B8]"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#0B0F19] border-t-transparent" />
            ) : (
              t('auth.otpVerify')
            )}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => void sendOtp()}
            className="w-full text-sm font-semibold text-[#3F6F00] hover:underline"
          >
            {t('auth.otpResend')}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('choose')
              setFormData((f) => ({ ...f, otp: '' }))
            }}
            className="w-full text-sm text-[#64748B] hover:underline"
          >
            {t('auth.otpBack')}
          </button>
        </div>
      ) : (
        <>
          {/* ChatGPT-style: pick the other channel as a button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => switchMethod(loginMethod === 'email' ? 'phone' : 'email')}
            className="mt-3 flex w-full items-center justify-center gap-3 rounded-xl border border-black/10 bg-white py-3 text-sm font-semibold text-[#0B0F19] hover:bg-stone-50"
          >
            {loginMethod === 'email' ? (
              <>
                <Phone className="h-5 w-5" />
                {t('auth.continueWithPhone')}
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                {t('auth.continueWithEmail')}
              </>
            )}
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/8" />
            </div>
            <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-wide">
              <span className="bg-white px-3 text-[#94A3B8]">{t('auth.orDivider')}</span>
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <button type="button" onClick={() => switchMethod('email')} className={methodBtn(loginMethod === 'email')}>
              <Mail className="me-2 inline h-4 w-4" />
              {t('auth.email')}
            </button>
            <button type="button" onClick={() => switchMethod('phone')} className={methodBtn(loginMethod === 'phone')}>
              <Phone className="me-2 inline h-4 w-4" />
              {t('auth.phone')}
            </button>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (step === 'password') void handlePasswordSubmit(e)
              else void sendOtp()
            }}
            className="space-y-4"
          >
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
              <KuwaitPhoneField
                value={formData.phone_number}
                onChange={(local) => setFormData({ ...formData, phone_number: local })}
                disabled={isLoading}
              />
            )}

            {step === 'password' ? (
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
                <div className="mt-2 flex justify-end">
                  <Link to="/forgot-password" className="text-sm font-semibold text-[#3F6F00] hover:underline">
                    {t('auth.forgotPassword')}
                  </Link>
                </div>
              </div>
            ) : null}

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
                  {step === 'password' ? t('auth.signIn') : t('auth.continueCta')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={() => setStep(step === 'password' ? 'choose' : 'password')}
            className="mt-3 w-full text-center text-sm font-semibold text-[#3F6F00] hover:underline"
          >
            {step === 'password' ? t('auth.useOtpInstead') : t('auth.usePasswordInstead')}
          </button>
        </>
      )}
    </AuthFlowShell>
  )
}
