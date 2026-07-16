import { useState, useMemo, useRef, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Shield,
  MessageCircle,
  Loader2,
  CreditCard,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { STOREFRONT_USER_ROLES, type StorefrontUserRole } from '../constants/storefrontRoles'
import { formatApiErrorMessage } from '../utils/apiErrors'
import { safeAppNextPath } from '../utils/safeNextPath'
import { resolvePostAuthPath } from '../utils/authRedirect'
import { RegionSelectField } from '@/components/auth/RegionSelectField'
import { getRegionDisplayName } from '@/lib/registrationRegions'
import { cn } from '@/lib/utils'
import SocialSignInButtons from '../components/auth/SocialSignInButtons'
import TurnstileWidget, { type TurnstileWidgetHandle } from '../components/auth/TurnstileWidget'
import AmlOpenSanctionsNotice from '../components/auth/AmlOpenSanctionsNotice'
import { AuthFlowShell } from '../components/auth/AuthFlowShell'
import { AuthSupportFooter } from '../components/auth/AuthSupportFooter'
import { isTurnstileConfigured } from '@/lib/turnstile'
import { setLastAuthMethod } from '@/lib/lastAuthMethod'
import { authApi } from '@/services/api'

const ROLE_LABEL_KEYS: Record<StorefrontUserRole, string> = {
  customer: 'auth.roleCustomer',
  long_term_customer: 'auth.roleLongTerm',
  trader: 'auth.roleTrader',
}

type StepId = 'identity' | 'details' | 'verify'
type SignInPreference = 'email' | 'phone'

function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++
  return score as 0 | 1 | 2 | 3
}

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const regionLocale = i18n.language?.startsWith('ar') ? 'ar' : 'en'

  const [step, setStep] = useState<StepId>('identity')
  const [signInPreference, setSignInPreference] = useState<SignInPreference>('email')

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const clearTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  const [otp, setOtp] = useState('')
  const [verifyChannel, setVerifyChannel] = useState<'email' | 'whatsapp'>('email')
  const [sentHint, setSentHint] = useState('')

  const [formData, setFormData] = useState({
    full_name: '',
    country: 'KW',
    nationality: '',
    civil_id: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    role: 'customer' as StorefrontUserRole,
  })

  const { register, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = safeAppNextPath(searchParams.get('next'))
  const loginHref = nextPath != null ? `/login?next=${encodeURIComponent(nextPath)}` : '/login'

  const flowSteps = useMemo(
    () => [
      { id: 'identity', label: t('auth.flow.stepIdentity') },
      { id: 'details', label: t('auth.flow.stepDetails') },
      { id: 'verify', label: t('auth.flow.stepVerify') },
    ],
    [t],
  )

  const strength = passwordStrength(formData.password)

  const goDetails = () => {
    if (!formData.email.trim()) {
      toast.error(t('auth.emailRequired'))
      return
    }
    if (!formData.phone_number.trim()) {
      toast.error(t('auth.phoneRequired'))
      return
    }
    setStep('details')
  }

  const createAccount = async () => {
    if (formData.password !== formData.confirm_password) {
      toast.error(t('auth.passwordsMismatch'))
      return
    }
    if (formData.password.length < 8) {
      toast.error(t('auth.passwordTooShort'))
      return
    }
    if (!formData.nationality || formData.nationality.length !== 2) {
      toast.error(t('auth.nationalityRequired'))
      return
    }
    if (!formData.country || formData.country.length !== 2) {
      toast.error(t('auth.countryRequired'))
      return
    }
    const civilDigits = formData.civil_id.replace(/\D/g, '')
    if (civilDigits.length !== 12) {
      toast.error(t('auth.civilIdRequired'))
      return
    }
    if (!acceptedLegal) {
      toast.error(t('auth.termsAcceptRequired'))
      return
    }
    if (isTurnstileConfigured && !turnstileToken) {
      toast.error(t('auth.captchaRequired'))
      return
    }

    setIsLoading(true)
    try {
      const channel = signInPreference === 'email' ? 'email' : 'whatsapp'
      await register({
        full_name: formData.full_name,
        nationality: formData.nationality.toUpperCase(),
        country: getRegionDisplayName(formData.country, regionLocale),
        civil_id: civilDigits,
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: formData.role,
        terms_accepted: acceptedLegal,
        privacy_policy_accepted: acceptedLegal,
        kyc_answers: {},
        registration_source: 'website',
        verification_channel: channel,
        ...(turnstileToken ? { turnstile_token: turnstileToken } : {}),
      })
      setLastAuthMethod(signInPreference)
      setVerifyChannel(signInPreference === 'email' ? 'email' : 'whatsapp')
      setSentHint(signInPreference === 'email' ? formData.email : formData.phone_number)
      toast.success(t('auth.verifyAccount.codeSent'))
      setStep('verify')
    } catch (error) {
      clearTurnstile()
      const res = (error as { response?: { status?: number; data?: { error?: string } } })?.response
      if (res?.status === 400 && res?.data?.error === 'captcha_failed') {
        toast.error(t('auth.captchaFailed'))
      } else {
        toast.error(formatApiErrorMessage(error, t('auth.registerFailed')))
      }
    } finally {
      setIsLoading(false)
    }
  }

  const confirmOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.trim().length !== 6) {
      toast.error(t('auth.verifyAccount.enterCode'))
      return
    }
    setIsLoading(true)
    try {
      await authApi.verifyOTP({
        otp_code: otp.trim(),
        purpose: 'registration',
      })
      const refreshed = await refreshUser()
      toast.success(t('auth.verifyAccount.verified'))
      navigate(resolvePostAuthPath(refreshed, nextPath), { replace: true })
    } catch {
      toast.error(t('auth.verifyAccount.invalidCode'))
    } finally {
      setIsLoading(false)
    }
  }

  const resendOtp = async (channel: 'email' | 'whatsapp' = verifyChannel) => {
    setIsLoading(true)
    try {
      const res = await authApi.sendVerificationOTP({ channel })
      setSentHint(res.verification?.destination || sentHint)
      toast.success(t('auth.verifyAccount.codeSent'))
    } catch {
      toast.error(t('auth.verifyAccount.sendFailed'))
    } finally {
      setIsLoading(false)
    }
  }

  const switchVerifyChannel = (channel: 'email' | 'whatsapp') => {
    if (channel === verifyChannel || isLoading) return
    setVerifyChannel(channel)
    setOtp('')
    setSentHint(channel === 'email' ? formData.email : formData.phone_number)
    void resendOtp(channel)
  }

  const fieldClass =
    'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#0B0F19] outline-none placeholder:text-[#94A3B8] focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#0B0F19]'

  return (
    <AuthFlowShell
      title={
        step === 'verify' ? t('auth.verifyAccount.title') : t('auth.createAccountTitle')
      }
      subtitle={
        step === 'verify' ? t('auth.verifyAccount.subtitle') : t('auth.flow.registerSubtitle')
      }
      steps={flowSteps}
      currentStepId={step}
      banner={step === 'identity' ? <AmlOpenSanctionsNotice /> : null}
      footer={
        step !== 'verify' ? (
          <p>
            {t('auth.hasAccount')}{' '}
            <Link to={loginHref} className="font-semibold text-[#3F6F00] hover:underline">
              {t('auth.signInLink')}
            </Link>
          </p>
        ) : (
          <AuthSupportFooter />
        )
      }
    >
      {step === 'identity' ? (
        <div className="space-y-5">
          <SocialSignInButtons
            mode="sign-up"
            redirectComplete={nextPath ?? '/'}
            disabled={isLoading}
          />

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-black/8" />
            </div>
            <div className="relative flex justify-center text-[11px] font-semibold uppercase tracking-wide">
              <span className="bg-white px-3 text-[#94A3B8]">{t('auth.flow.orContinue')}</span>
            </div>
          </div>

          <p className="text-xs text-[#64748B]">{t('auth.flow.bothContactsHint')}</p>

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
              />
            </div>
          </div>

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
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('auth.flow.signInPreference')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSignInPreference('email')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                  signInPreference === 'email'
                    ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
                    : 'border-black/10 text-[#64748B] hover:border-black/20',
                )}
              >
                <Mail className="h-4 w-4" />
                {t('auth.email')}
              </button>
              <button
                type="button"
                onClick={() => setSignInPreference('phone')}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
                  signInPreference === 'phone'
                    ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
                    : 'border-black/10 text-[#64748B] hover:border-black/20',
                )}
              >
                <Phone className="h-4 w-4" />
                {t('auth.phone')}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-[#64748B]">{t('auth.flow.signInPreferenceHint')}</p>
          </div>

          <button
            type="button"
            onClick={goDetails}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9AF01A]"
          >
            {t('auth.flow.continue')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </button>
        </div>
      ) : null}

      {step === 'details' ? (
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setStep('identity')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#3F6F00] hover:underline"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('auth.flow.back')}
          </button>

          <div>
            <label className={labelClass}>{t('auth.accountType')}</label>
            <div className="relative">
              <Shield className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <select
                value={formData.role}
                aria-label={t('auth.accountTypeAria')}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as StorefrontUserRole })
                }
                className={cn(fieldClass, 'appearance-none ps-10')}
              >
                {STOREFRONT_USER_ROLES.map((value) => (
                  <option key={value} value={value}>
                    {t(ROLE_LABEL_KEYS[value])}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass}>{t('auth.fullName')}</label>
            <div className="relative">
              <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                autoComplete="name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder={t('auth.placeholderFullName')}
                className={cn(fieldClass, 'ps-10')}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <RegionSelectField
              id="register-country-label"
              label={t('auth.country')}
              value={formData.country}
              onChange={(code) => setFormData((prev) => ({ ...prev, country: code }))}
              placeholder={t('auth.selectCountry')}
            />
            <RegionSelectField
              id="register-nationality-label"
              label={t('auth.nationality')}
              value={formData.nationality}
              onChange={(code) => setFormData((prev) => ({ ...prev, nationality: code }))}
              placeholder={t('auth.selectNationality')}
            />
          </div>

          <div>
            <label className={labelClass}>{t('auth.civilId')}</label>
            <div className="relative">
              <CreditCard className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={formData.civil_id}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    civil_id: e.target.value.replace(/\D/g, '').slice(0, 12),
                  })
                }
                placeholder={t('auth.placeholderCivilId')}
                className={cn(fieldClass, 'ps-10')}
                required
              />
            </div>
            <p className="mt-1.5 text-xs text-[#64748B]">{t('auth.civilIdHint')}</p>
          </div>

          <div>
            <label className={labelClass}>{t('auth.password')}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder={t('auth.placeholderCreatePassword')}
                className={cn(fieldClass, 'ps-10 pe-12')}
                minLength={8}
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
            <p className="mt-1 text-[11px] text-[#64748B]">{t('auth.flow.passwordHint')}</p>
          </div>

          <div>
            <label className={labelClass}>{t('auth.confirmPassword')}</label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                placeholder={t('auth.placeholderConfirmPassword')}
                className={cn(fieldClass, 'ps-10')}
                required
              />
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 accent-[#3F6F00]"
              checked={acceptedLegal}
              onChange={(e) => setAcceptedLegal(e.target.checked)}
            />
            <span className="text-sm text-[#64748B]">
              <Trans
                i18nKey="auth.termsAgreement"
                components={{
                  legalLink: (
                    <Link to="/terms-and-privacy" className="font-semibold text-[#3F6F00] hover:underline" />
                  ),
                }}
              />
            </span>
          </label>

          <TurnstileWidget
            ref={turnstileRef}
            onToken={setTurnstileToken}
            onExpire={clearTurnstile}
            onError={clearTurnstile}
          />

          <button
            type="button"
            disabled={isLoading || !acceptedLegal || (isTurnstileConfigured && !turnstileToken)}
            onClick={() => void createAccount()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition enabled:hover:bg-[#9AF01A] disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#94A3B8]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('auth.flow.createAndVerify')}
            {!isLoading ? <ArrowRight className="h-4 w-4 rtl:rotate-180" /> : null}
          </button>
        </div>
      ) : null}

      {step === 'verify' ? (
        <form onSubmit={(e) => void confirmOtp(e)} className="space-y-4">
          <p className="text-center text-xs text-[#64748B]">{t('auth.flow.verifyChannelHint')}</p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => switchVerifyChannel('email')}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold',
                verifyChannel === 'email'
                  ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
                  : 'border-black/10 text-[#64748B] hover:border-black/20',
              )}
            >
              <Mail className="h-4 w-4" />
              {t('auth.verifyAccount.email')}
            </button>
            <button
              type="button"
              disabled={isLoading}
              onClick={() => switchVerifyChannel('whatsapp')}
              className={cn(
                'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold',
                verifyChannel === 'whatsapp'
                  ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
                  : 'border-black/10 text-[#64748B] hover:border-black/20',
              )}
            >
              <MessageCircle className="h-4 w-4" />
              {t('auth.verifyAccount.whatsapp')}
            </button>
          </div>

          <p className="text-center text-xs text-[#64748B]">
            {t('auth.verifyAccount.sentTo', { destination: sentHint })}
          </p>

          <div>
            <label className={labelClass}>{t('auth.verifyAccount.codeLabel')}</label>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.35em] text-[#0B0F19] outline-none focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25"
              placeholder="••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.length !== 6}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition enabled:hover:bg-[#9AF01A] disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#94A3B8]"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t('auth.verifyAccount.confirm')}
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={() => void resendOtp()}
            className="w-full text-center text-sm font-semibold text-[#3F6F00] hover:underline disabled:opacity-50"
          >
            {t('auth.verifyAccount.resend')}
          </button>
        </form>
      ) : null}
    </AuthFlowShell>
  )
}
