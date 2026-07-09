import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Phone, Lock, ArrowRight, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { authApi } from '../services/api'

type Step = 'request' | 'otp' | 'password'

export default function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('request')
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const navigate = useNavigate()

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const payload =
        method === 'email'
          ? { email: email.trim(), phone_number: '' }
          : { email: '', phone_number: phoneNumber.trim() }
      await authApi.forgotPassword(payload)
      toast.success(t('auth.forgotPasswordPage.toasts.resetSent'))
      setStep('otp')
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string }; status?: number } })?.response?.data
      const status = (err as { response?: { status?: number } })?.response?.status
      const normalizedErr = String(data?.error || '').toLowerCase()
      if (status === 404 || normalizedErr.includes('user not found')) {
        toast.success(t('auth.forgotPasswordPage.toasts.resetSent'))
        setStep('otp')
      } else if (data?.error) {
        toast.error(data.error)
      } else if (status === 503) {
        toast.error(t('auth.forgotPasswordPage.toasts.emailSendFailed'))
      } else {
        toast.error(t('auth.forgotPasswordPage.toasts.requestFailed'))
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
      setUserId(res.user_id)
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
    if (!userId) {
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
      await authApi.resetPassword({ user_id: userId, new_password: newPassword })
      toast.success(t('auth.forgotPasswordPage.toasts.resetSuccess'))
      navigate('/login')
    } catch {
      toast.error(t('auth.forgotPasswordPage.toasts.resetFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const subtitle =
    step === 'request'
      ? t('auth.forgotPasswordPage.subtitleRequest')
      : step === 'otp'
        ? t('auth.forgotPasswordPage.subtitleOtp')
        : t('auth.forgotPasswordPage.subtitlePassword')

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gold-gradient-text mb-2">
            {t('auth.forgotPasswordPage.title')}
          </h1>
          <p className="text-gold-100/60">{subtitle}</p>
        </div>

        <div className="gold-card">
          {step === 'request' && (
            <>
              <div className="flex gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setMethod('email')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    method === 'email'
                      ? 'bg-gold-500 text-charcoal-950'
                      : 'bg-charcoal-800 text-gold-100/60'
                  }`}
                >
                  <Mail className="w-4 h-4 inline mr-2 rtl:ml-2 rtl:mr-0" />
                  {t('auth.forgotPasswordPage.emailTab')}
                </button>
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                {method === 'email' ? (
                  <div>
                    <label className="block text-sm font-medium text-gold-100 mb-2">
                      {t('auth.email')}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60 rtl:left-auto rtl:right-3" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('auth.placeholderEmail')}
                        className="w-full pl-10 pr-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500 rtl:pl-4 rtl:pr-10"
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
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60 rtl:left-auto rtl:right-3" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={t('auth.placeholderPhone')}
                        className="w-full pl-10 pr-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500 rtl:pl-4 rtl:pr-10"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full gold-button flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      {t('auth.forgotPasswordPage.sendCode')}
                      <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gold-100 mb-2">
                  {t('auth.forgotPasswordPage.otpLabel')}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60 rtl:left-auto rtl:right-3" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full pl-10 pr-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500 tracking-widest rtl:pl-4 rtl:pr-10"
                    required
                  />
                </div>
                <p className="text-xs text-gold-100/50 mt-2">
                  {t('auth.forgotPasswordPage.otpHint')}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full gold-button flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {t('auth.forgotPasswordPage.verifyCode')}
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full py-2 text-sm text-gold-400 hover:text-gold-300"
              >
                {t('auth.forgotPasswordPage.useDifferent')}
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gold-100 mb-2">
                  {t('auth.forgotPasswordPage.newPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60 rtl:left-auto rtl:right-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('auth.forgotPasswordPage.placeholderPassword')}
                    className="w-full pl-10 pr-12 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500 rtl:pl-12 rtl:pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-400/60 hover:text-gold-400 rtl:right-auto rtl:left-3"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gold-100 mb-2">
                  {t('auth.forgotPasswordPage.confirmPassword')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60 rtl:left-auto rtl:right-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.forgotPasswordPage.placeholderConfirm')}
                    className="w-full pl-10 pr-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500 rtl:pl-4 rtl:pr-10"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full gold-button flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-charcoal-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {t('auth.forgotPasswordPage.resetCta')}
                    <ArrowRight className="w-5 h-5 rtl:rotate-180" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-gold-400 hover:text-gold-300 font-medium">
              {t('auth.forgotPasswordPage.backToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
