import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, MessageCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { authApi } from '@/services/api'
import { resolvePostAuthPath } from '@/utils/authRedirect'
import { AuthFlowShell } from '@/components/auth/AuthFlowShell'
import { AuthSupportFooter } from '@/components/auth/AuthSupportFooter'
import { cn } from '@/lib/utils'

type Channel = 'email' | 'whatsapp'

export default function VerifyAccountPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth()
  const [channel, setChannel] = useState<Channel>('email')
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [sentHint, setSentHint] = useState('')
  const [autoSent, setAutoSent] = useState(false)

  const hasEmail = Boolean(user?.email)
  const hasPhone = Boolean(user?.phone_number)

  const flowSteps = useMemo(
    () => [
      { id: 'identity', label: t('auth.flow.stepIdentity') },
      { id: 'details', label: t('auth.flow.stepDetails') },
      { id: 'verify', label: t('auth.flow.stepVerify') },
    ],
    [t],
  )

  useEffect(() => {
    if (!user) return
    if (hasEmail) setChannel('email')
    else if (hasPhone) setChannel('whatsapp')
  }, [user, hasEmail, hasPhone])

  useEffect(() => {
    if (isLoading) return
    if (!isAuthenticated) {
      navigate('/login?next=/verify-account', { replace: true })
      return
    }
    if (user?.is_verified) {
      navigate(resolvePostAuthPath(user, searchParams.get('next'), searchParams.get('returnUrl')), {
        replace: true,
      })
    }
  }, [isLoading, isAuthenticated, user, navigate, searchParams])

  useEffect(() => {
    if (!isAuthenticated || !user || user.is_verified || autoSent) return
    setAutoSent(true)
    void (async () => {
      try {
        const preferred: Channel = hasEmail ? 'email' : 'whatsapp'
        setChannel(preferred)
        const res = await authApi.sendVerificationOTP({ channel: preferred })
        const dest = res.verification?.destination
        setSentHint(dest || '')
        toast.success(t('auth.verifyAccount.codeSent'))
      } catch {
        /* user can tap resend */
      }
    })()
  }, [isAuthenticated, user, autoSent, hasEmail, t])

  const channelLabel = useMemo(() => {
    if (channel === 'email') return user?.email || t('auth.verifyAccount.email')
    return user?.phone_number || t('auth.verifyAccount.whatsapp')
  }, [channel, user, t])

  const handleResend = async () => {
    setBusy(true)
    try {
      const res = await authApi.sendVerificationOTP({ channel })
      setSentHint(res.verification?.destination || '')
      toast.success(t('auth.verifyAccount.codeSent'))
    } catch {
      toast.error(t('auth.verifyAccount.sendFailed'))
    } finally {
      setBusy(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otp.trim().length !== 6) {
      toast.error(t('auth.verifyAccount.enterCode'))
      return
    }
    setBusy(true)
    try {
      await authApi.verifyOTP({
        otp_code: otp.trim(),
        purpose: 'registration',
        user_id: user?.id,
      })
      const refreshed = await refreshUser()
      toast.success(t('auth.verifyAccount.verified'))
      const nextUser = refreshed ?? (user ? { ...user, is_verified: true } : null)
      navigate(
        resolvePostAuthPath(nextUser, searchParams.get('next'), searchParams.get('returnUrl')),
        { replace: true },
      )
    } catch {
      toast.error(t('auth.verifyAccount.invalidCode'))
    } finally {
      setBusy(false)
    }
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#3F6F00]" />
      </div>
    )
  }

  return (
    <AuthFlowShell
      title={t('auth.verifyAccount.title')}
      subtitle={t('auth.verifyAccount.subtitle')}
      steps={flowSteps}
      currentStepId="verify"
      footer={
        <div className="space-y-3">
          <Link to="/contact" className="text-sm font-medium text-[#64748B] hover:text-[#0B0F19]">
            {t('auth.verifyAccount.needHelp')}
          </Link>
          <AuthSupportFooter />
        </div>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!hasEmail || busy}
          onClick={() => setChannel('email')}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
            channel === 'email'
              ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
              : 'border-black/10 text-[#64748B] hover:border-black/20',
            !hasEmail && 'cursor-not-allowed opacity-40',
          )}
        >
          <Mail className="h-4 w-4" />
          {t('auth.verifyAccount.email')}
        </button>
        <button
          type="button"
          disabled={!hasPhone || busy}
          onClick={() => setChannel('whatsapp')}
          className={cn(
            'inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition',
            channel === 'whatsapp'
              ? 'border-[#85E307] bg-[#ECFCCB] text-[#0B0F19]'
              : 'border-black/10 text-[#64748B] hover:border-black/20',
            !hasPhone && 'cursor-not-allowed opacity-40',
          )}
        >
          <MessageCircle className="h-4 w-4" />
          {t('auth.verifyAccount.whatsapp')}
        </button>
      </div>

      <p className="mb-4 text-center text-xs text-[#64748B]">
        {t('auth.verifyAccount.sentTo', { destination: sentHint || channelLabel })}
      </p>

      <form onSubmit={(e) => void handleVerify(e)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-[#0B0F19]">
            {t('auth.verifyAccount.codeLabel')}
          </label>
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
          disabled={busy || otp.length !== 6}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#85E307] px-4 py-3.5 text-sm font-bold text-[#0B0F19] transition enabled:hover:bg-[#9AF01A] disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#94A3B8]"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {t('auth.verifyAccount.confirm')}
        </button>
      </form>

      <button
        type="button"
        disabled={busy}
        onClick={() => void handleResend()}
        className="mt-4 w-full text-center text-sm font-semibold text-[#3F6F00] hover:underline disabled:opacity-50"
      >
        {t('auth.verifyAccount.resend')}
      </button>
    </AuthFlowShell>
  )
}
