import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import TurnstileWidget, { type TurnstileWidgetHandle } from '../components/auth/TurnstileWidget'
import { AuthFlowShell } from '../components/auth/AuthFlowShell'
import { AuthSupportFooter } from '../components/auth/AuthSupportFooter'
import { isTurnstileConfigured } from '@/lib/turnstile'
import { getSafeUserErrorMessage } from '../utils/apiErrors'
import { cn } from '@/lib/utils'
import { COMPANY_DESK_HOME } from '@/lib/companyDeskScope'

/**
 * Dedicated B2B company-desk login — email + password only.
 * No Google / Clerk / self-register (Hub provisions accounts).
 */
export default function CompanyLoginPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { loginWithCompany, setAuthBusy } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
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

  const fieldClass =
    'w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#0B0F19] outline-none placeholder:text-[#94A3B8] focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-[#0B0F19]'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isTurnstileConfigured && !turnstileToken) {
      toast.error(t('auth.captchaRequired'))
      return
    }
    const cleaned = email.trim()
    if (!cleaned.includes('@')) {
      toast.error(t('auth.companyLogin.emailRequired'))
      return
    }
    if (!password) {
      toast.error(t('auth.companyLogin.passwordRequired'))
      return
    }

    setIsLoading(true)
    setAuthBusy(true)
    try {
      await loginWithCompany({
        email: cleaned,
        password,
        turnstile_token: turnstileToken || undefined,
      })
      navigate(COMPANY_DESK_HOME, { replace: true })
    } catch (err: unknown) {
      clearTurnstile()
      const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
      const code = typeof data?.code === 'string' ? data.code : typeof data?.error === 'string' ? data.error : ''
      if (code === 'company_desk_inactive') {
        toast.error(t('auth.companyLogin.inactive'))
      } else if (code === 'inactive') {
        toast.error(t('auth.accountInactive'))
      } else {
        toast.error(getSafeUserErrorMessage(err, t, t('auth.invalidCredentials')))
      }
    } finally {
      setIsLoading(false)
      setAuthBusy(false)
    }
  }

  return (
    <AuthFlowShell
      title={t('auth.companyLogin.title')}
      subtitle={t('auth.companyLogin.subtitle')}
      footer={
        <div className="space-y-3">
          <p>
            {t('auth.companyLogin.needActivate')}{' '}
            <Link
              to={`/company-activate${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ''}`}
              className="font-semibold text-[#3F6F00] hover:underline"
            >
              {t('auth.companyLogin.activateLink')}
            </Link>
          </p>
          <p>
            <Link to="/gs-kyc" className="font-semibold text-[#3F6F00] hover:underline">
              {t('auth.companyLogin.backToGate')}
            </Link>
          </p>
          <AuthSupportFooter />
        </div>
      }
    >
      <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
        <div>
          <label className={labelClass} htmlFor="company-login-email">
            {t('auth.companyLogin.emailLabel')}
          </label>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden />
            <input
              id="company-login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={cn(fieldClass, 'ps-10')}
              required
            />
          </div>
          <p className="mt-1.5 text-xs text-[#64748B]">{t('auth.companyLogin.emailHint')}</p>
        </div>

        <div>
          <label className={labelClass} htmlFor="company-login-password">
            {t('auth.companyLogin.passwordLabel')}
          </label>
          <div className="relative">
            <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden />
            <input
              id="company-login-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(fieldClass, 'ps-10 pe-11')}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute end-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#64748B] hover:bg-black/5"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {isTurnstileConfigured ? (
          <TurnstileWidget
            ref={turnstileRef}
            onToken={setTurnstileToken}
            onExpire={clearTurnstile}
            onError={clearTurnstile}
          />
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center rounded-xl bg-[#0B0F19] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1a2230] disabled:opacity-60"
        >
          {isLoading ? t('auth.companyLogin.signingIn') : t('auth.companyLogin.submit')}
        </button>
      </form>
    </AuthFlowShell>
  )
}
