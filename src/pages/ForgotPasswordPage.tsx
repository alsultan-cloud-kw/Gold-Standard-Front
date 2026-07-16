import { useMemo, useRef, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  ArrowLeft,
  MessageCircle,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { authApi } from '../services/api'
import { AuthFlowShell } from '../components/auth/AuthFlowShell'
import { AuthSupportFooter } from '../components/auth/AuthSupportFooter'
import TurnstileWidget, { type TurnstileWidgetHandle } from '../components/auth/TurnstileWidget'
import { isTurnstileConfigured } from '@/lib/turnstile'
import { getSafeUserErrorMessage } from '@/utils/apiErrors'
import { cn } from '@/lib/utils'

type Step = 'request' | 'otp' | 'password'
type DeliveryChannel = 'email' | 'whatsapp'

function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++
  return score as 0 | 1 | 2 | 3
}

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('request')
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannel>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [sentHint, setSentHint] = useState('')

  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const clearTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  const flowSteps = useMemo(
    () => [
      { id: 'request', label: t('auth.forgotPasswordPage.stepRequest') },
      { id: 'otp', label: t('auth.forgotPasswordPage.stepOtp') },
      { id: 'password', label: t('auth.forgotPasswordPage.stepPassword') },
    ],
    [t],
  )

  const strength = passwordStrength(newPassword)
  const fieldClass =
    'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#0B0F19] outline-none placeholder:text-[#94A3B8] focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#0B0F19]'

  const subtitle =
    step === 'request'
      ? t('auth.forgotPasswordPage.subtitleRequest')
      : step === 'otp'
        ? t('auth.forgotPasswordPage.subtitleOtp')
        : t('auth.forgotPasswordPage.subtitlePassword')

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isTurnstileConfigured && !turnstileToken) {
      toast.error(t('auth.captchaRequired'))
      return
    }

    setIsLoading(true)
    try {
      const payload =
        deliveryChannel === 'email'
          ? {
              email: email.trim(),
              channel: 'email' as const,
              ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
            }
          : {
              phone_number: phoneNumber.trim(),
              channel: 'whatsapp' as const,
              ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
            }

      const res = await authApi.forgotPassword(payload)
      const dest = (res as { delivery?: { destination?: string } })?.delivery?.destination
      setSentHint(
        dest || (deliveryChannel === 'email' ? email.trim() : phoneNumber.trim()),
      )
      toast.success(t('auth.forgotPasswordPage.toasts.resetSent'))
      setStep('otp')
    } catch (err: unknown) {
      clearTurnstile()
      const data = (err as { response?: { data?: { error?: string }; status?: number } })?.response
        ?.data
      const status = (err as { response?: { status?: number } })?.response?.status
      const normalizedErr = String(data?.error || '').toLowerCase()
      // Do not reveal whether the account exists
      if (status === 404 || normalizedErr.includes('user not found')) {
        toast.success(t('auth.forgotPasswordPage.toasts.resetSent'))
        setStep('otp')
      } else if (status === 400 && data?.error === 'captcha_failed') {
        toast.error(t('auth.captchaFailed'))
      } else if (status === 503) {
        toast.error(t('auth.forgotPasswordPage.toasts.sendFailed'))
      } else {
        toast.error(
          getSafeUserErrorMessage(err, t, t('auth.forgotPasswordPage.toasts.requestFailed')),
        )
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.trim().length !== 6) {
      toast.error(t('auth.forgotPasswordPage.toasts.enterOtp'))
      return
    }
    setIsLoading(true)
    try {
      const res = await authApi.verifyOTP({
        otp_code: otpCode.trim(),
        purpose: 'password_reset',
      })
      if (!res.reset_token) {
        toast.error(t('auth.forgotPasswordPage.toasts.sessionExpired'))
        return
      }
      setResetToken(res.reset_token)
      toast.success(t('auth.forgotPasswordPage.toasts.codeVerified'))
      setStep('password')
    } catch {
      toast.error(t('auth.forgotPasswordPage.toasts.invalidCode'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetToken) {
      toast.error(t('auth.forgotPasswordPage.toasts.sessionExpired'))
      setStep('request')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.forgotPasswordPage.toasts.passwordsMismatch'))
      return
    }
    if (newPassword.length < 8) {
      toast.error(t('auth.forgotPasswordPage.toasts.passwordTooShort'))
      return
    }
    setIsLoading(true)
    try {
      await authApi.resetPassword({ reset_token: resetToken, new_password: newPassword })
      toast.success(t('auth.forgotPasswordPage.toasts.resetSuccess'))
      navigate('/login')
    } catch {
      toast.error(t('auth.forgotPasswordPage.toasts.resetFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthFlowShell
      title={t('auth.forgotPasswordPage.title')}
      subtitle={subtitle}
      steps={flowSteps}
      currentStepId={step}
      footer={
        <div className="space-y-3">
          <Link to="/login" className="text-sm font-semibold text-[#3F6F00] hover:underline">
            {t('auth.forgotPasswordPage.backToSignIn')}
          </Link>
          <AuthSupportFooter />
        </div>
      }
    >
      {step === 'request' ? (
        <>
          <p className="mb-4 text-xs text-[#64748B]">{t('auth.forgotPasswordPage.channelHint')}</p>

          <div className="mb-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setDeliveryChannel('email')}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                deliveryChannel === 'email'
                  ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
                  : 'border-black/10 text-[#64748B] hover:border-black/20',
              )}
            >
              <Mail className="h-4 w-4" />
              {t('auth.forgotPasswordPage.emailTab')}
            </button>
            <button
              type="button"
              onClick={() => setDeliveryChannel('whatsapp')}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                deliveryChannel === 'whatsapp'
                  ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
                  : 'border-black/10 text-[#64748B] hover:border-black/20',
              )}
            >
              <MessageCircle className="h-4 w-4" />
              {t('auth.forgotPasswordPage.whatsappTab')}
            </button>
          </div>

          <form onSubmit={(e) => void handleRequestOtp(e)} className="space-y-4">
            {deliveryChannel === 'email' ? (
              <div>
                <label className={labelClass}>{t('auth.email')}</label>
                <div className="relative">
                  <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder={t('auth.placeholderPhone')}
                    className={cn(fieldClass, 'ps-10')}
                    required
                  />
                </div>
              </div>
            )}

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
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t('auth.forgotPasswordPage.sendCode')}
              {!isLoading ? <ArrowRight className="h-4 w-4 rtl:rotate-180" /> : null}
            </button>
          </form>
        </>
      ) : null}

      {step === 'otp' ? (
        <form onSubmit={(e) => void handleVerifyOtp(e)} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep('request')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3F6F00] hover:underline"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('auth.forgotPasswordPage.useDifferent')}
          </button>

          <p className="text-center text-xs text-[#64748B]">
            {t('auth.verifyAccount.sentTo', { destination: sentHint })}
          </p>

          <div>
            <label className={labelClass}>{t('auth.forgotPasswordPage.otpLabel')}</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.35em] text-[#0B0F19] outline-none focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25"
              placeholder="••••••"
            />
            <p className="mt-2 text-xs text-[#64748B]">{t('auth.forgotPasswordPage.otpHint')}</p>
          </div>

          <button
            type="submit"
            disabled={isLoading || otpCode.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition enabled:hover:bg-[#9AF01A] disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#94A3B8]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('auth.forgotPasswordPage.verifyCode')}
          </button>
        </form>
      ) : null}

      {step === 'password' ? (
        <form onSubmit={(e) => void handleResetPassword(e)} className="space-y-4">
          <div>
            <label className={labelClass}>{t('auth.forgotPasswordPage.newPassword')}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('auth.forgotPasswordPage.placeholderPassword')}
                className={cn(fieldClass, 'ps-10 pe-12')}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute end-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0B0F19]"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  className={cn(
                    'h-1 flex-1 rounded-full',
                    strength >= n ? 'bg-[#85E307]' : 'bg-[#E8EBE3]',
                  )}
                />
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('auth.forgotPasswordPage.confirmPassword')}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('auth.forgotPasswordPage.placeholderConfirm')}
                className={cn(fieldClass, 'ps-10')}
                required
                minLength={8}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition enabled:hover:bg-[#9AF01A] disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#94A3B8]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('auth.forgotPasswordPage.resetCta')}
          </button>
        </form>
      ) : null}
    </AuthFlowShell>
  )
}
