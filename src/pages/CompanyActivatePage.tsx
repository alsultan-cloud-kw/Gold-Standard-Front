import { useMemo, useRef, useState, useCallback, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Check, Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { authApi } from '../services/api'
import { companyDeskApi } from '../services/companyDeskApi'
import { AuthFlowShell } from '../components/auth/AuthFlowShell'
import { AuthSupportFooter } from '../components/auth/AuthSupportFooter'
import TurnstileWidget, { type TurnstileWidgetHandle } from '../components/auth/TurnstileWidget'
import { isTurnstileConfigured } from '@/lib/turnstile'
import { getSafeUserErrorMessage } from '@/utils/apiErrors'
import { cn } from '@/lib/utils'

type Step = 'request' | 'otp' | 'password' | 'done'

function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++
  return score as 0 | 1 | 2 | 3
}

/**
 * After Hub approval: email OTP → set password → success → company login.
 * Does not issue an authenticated session (no auto sign-in).
 */
export default function CompanyActivatePage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState<Step>('request')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [sentHint, setSentHint] = useState('')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)

  const clearTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  useEffect(() => {
    const fromQuery = (searchParams.get('email') || '').trim()
    if (fromQuery) setEmail(fromQuery)
  }, [searchParams])

  const flowSteps = useMemo(
    () => [
      { id: 'request', label: t('auth.companyActivate.stepRequest') },
      { id: 'otp', label: t('auth.companyActivate.stepOtp') },
      { id: 'password', label: t('auth.companyActivate.stepPassword') },
    ],
    [t],
  )

  const strength = passwordStrength(newPassword)
  const fieldClass =
    'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#0B0F19] outline-none placeholder:text-[#94A3B8] focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#0B0F19]'
  const isDone = step === 'done'

  const title = isDone
    ? t('auth.companyActivate.successTitle')
    : t('auth.companyActivate.title')

  const subtitle = isDone
    ? t('auth.companyActivate.successBody')
    : step === 'request'
      ? t('auth.companyActivate.subtitleRequest')
      : step === 'otp'
        ? t('auth.companyActivate.subtitleOtp')
        : t('auth.companyActivate.subtitlePassword')

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isTurnstileConfigured && !turnstileToken) {
      toast.error(t('auth.captchaRequired'))
      return
    }
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !trimmed.includes('@')) {
      toast.error(t('auth.companyActivate.emailRequired'))
      return
    }
    setIsLoading(true)
    try {
      const res = await companyDeskApi.requestActivateOtp({
        email: trimmed,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      })
      const dest = (res as { delivery?: { destination?: string } })?.delivery?.destination
      setSentHint(dest || trimmed)
      toast.success(t('auth.companyActivate.toasts.codeSent'))
      setStep('otp')
    } catch (err: unknown) {
      clearTurnstile()
      toast.error(getSafeUserErrorMessage(err, t, t('auth.companyActivate.toasts.sendFailed')))
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.trim().length < 4) {
      toast.error(t('auth.companyActivate.otpRequired'))
      return
    }
    setIsLoading(true)
    try {
      const res = await authApi.verifyOTP({
        otp_code: otpCode.trim(),
        purpose: 'password_reset',
      })
      const token = res.reset_token
      if (!token) {
        toast.error(t('auth.companyActivate.toasts.verifyFailed'))
        return
      }
      setResetToken(token)
      toast.success(t('auth.companyActivate.toasts.verified'))
      setStep('password')
    } catch (err: unknown) {
      toast.error(getSafeUserErrorMessage(err, t, t('auth.companyActivate.toasts.verifyFailed')))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 8) {
      toast.error(t('auth.passwordTooShort'))
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('auth.forgotPasswordPage.toasts.passwordsMismatch'))
      return
    }
    if (!resetToken) {
      toast.error(t('auth.companyActivate.toasts.sessionExpired'))
      setStep('request')
      return
    }
    setIsLoading(true)
    try {
      await authApi.resetPassword({
        reset_token: resetToken,
        new_password: newPassword,
      })
      setResetToken(null)
      setOtpCode('')
      setNewPassword('')
      setConfirmPassword('')
      setStep('done')
    } catch (err: unknown) {
      toast.error(getSafeUserErrorMessage(err, t, t('auth.companyActivate.toasts.passwordFailed')))
    } finally {
      setIsLoading(false)
    }
  }

  const loginHref = `/company-login${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`

  return (
    <AuthFlowShell
      title={title}
      subtitle={subtitle}
      steps={isDone ? undefined : flowSteps}
      currentStepId={isDone ? undefined : step}
      beforeTitle={
        !isDone ? (
          <div className="mx-auto mb-4 max-w-md rounded-xl border border-[#85E307]/40 bg-[#ECFCCB]/60 px-4 py-3 text-start">
            <p className="flex items-center gap-2 text-sm font-semibold text-[#3F6F00]">
              <span
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#85E307] text-[#0B0F19]"
                aria-hidden
              >
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
              {t('auth.companyActivate.approvedBadge')}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#64748B] sm:text-sm">
              {t('auth.companyActivate.approvedHint')}
            </p>
            <p className="mt-2 text-xs font-semibold text-[#1A2E1C] sm:text-sm">
              {t('auth.companyActivate.nextStepLabel')}
            </p>
          </div>
        ) : null
      }
      footer={<AuthSupportFooter />}
    >
      {step === 'request' ? (
        <form className="space-y-4" onSubmit={(e) => void handleRequestOtp(e)}>
          <div>
            <label className={labelClass}>{t('auth.companyActivate.emailLabel')}</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn(fieldClass, 'ps-10')}
                required
              />
            </div>
            <p className="mt-1.5 text-xs text-[#64748B]">{t('auth.companyActivate.emailHint')}</p>
          </div>
          {isTurnstileConfigured ? (
            <TurnstileWidget ref={turnstileRef} onToken={setTurnstileToken} />
          ) : null}
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-4 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('auth.companyActivate.sendCode')}
          </button>
          <p className="text-center text-xs text-[#64748B]">
            <Link to="/gs-kyc" className="font-semibold text-[#3F6F00] underline-offset-2 hover:underline">
              {t('auth.companyActivate.backToGsKyc')}
            </Link>
          </p>
        </form>
      ) : null}

      {step === 'otp' ? (
        <form className="space-y-4" onSubmit={(e) => void handleVerifyOtp(e)}>
          <p className="text-sm text-[#334155]">
            {t('auth.companyActivate.codeSentTo', { dest: sentHint || email })}
          </p>
          <div>
            <label className={labelClass}>{t('auth.companyActivate.otpLabel')}</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className={fieldClass}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-4 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('auth.companyActivate.verifyCode')}
          </button>
          <button
            type="button"
            className="w-full text-center text-xs font-semibold text-[#3F6F00]"
            onClick={() => setStep('request')}
          >
            {t('auth.companyActivate.resend')}
          </button>
        </form>
      ) : null}

      {step === 'password' ? (
        <form className="space-y-4" onSubmit={(e) => void handleSetPassword(e)}>
          <div>
            <label className={labelClass}>{t('auth.companyActivate.newPassword')}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={cn(fieldClass, 'ps-10 pe-10')}
                required
                minLength={8}
              />
              <button
                type="button"
                className="absolute end-3 top-1/2 -translate-y-1/2 text-[#94A3B8]"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Hide' : 'Show'}
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
                    strength >= n ? 'bg-[#85E307]' : 'bg-black/10',
                  )}
                />
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>{t('auth.companyActivate.confirmPassword')}</label>
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={fieldClass}
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-4 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('auth.companyActivate.setPassword')}
          </button>
        </form>
      ) : null}

      {step === 'done' ? (
        <div className="space-y-5 text-center">
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFCCB]"
            aria-hidden
          >
            <Check className="h-7 w-7 text-[#3F6F00]" strokeWidth={2.5} />
          </div>
          <p className="text-sm leading-relaxed text-[#64748B]">
            {t('auth.companyActivate.successDetail')}
          </p>
          <Link
            to={loginHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B0F19] px-4 py-3 text-sm font-semibold text-white hover:bg-black"
          >
            {t('auth.companyActivate.successLoginCta')}
          </Link>
          <p className="text-xs text-[#64748B]">
            <Link to="/gs-kyc" className="font-semibold text-[#3F6F00] underline-offset-2 hover:underline">
              {t('auth.companyActivate.backToGsKyc')}
            </Link>
          </p>
        </div>
      ) : null}
    </AuthFlowShell>
  )
}
