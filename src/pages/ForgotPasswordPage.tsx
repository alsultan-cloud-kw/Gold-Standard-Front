import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Phone, Lock, ArrowRight, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '../services/api'

type Step = 'request' | 'otp' | 'password'

export default function ForgotPasswordPage() {
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
      const res = await authApi.forgotPassword(payload) as { message?: string; error?: string }
      toast.success(res.message || 'Check your email for the code.')
      setStep('otp')
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string }; status?: number } })?.response?.data
      const status = (err as { response?: { status?: number } })?.response?.status
      if (data?.error) {
        toast.error(data.error)
      } else if (status === 503) {
        toast.error('Email could not be sent. Try again later.')
      } else {
        toast.error('User not found or request failed.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.trim().length !== 6) {
      toast.error('Enter the 6-digit code.')
      return
    }
    setIsLoading(true)
    try {
      const res = await authApi.verifyOTP({
        otp_code: otpCode.trim(),
        purpose: 'password_reset',
      })
      setUserId(res.user_id)
      toast.success('Code verified. Set your new password.')
      setStep('password')
    } catch {
      toast.error('Invalid or expired code.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) {
      toast.error('Session expired. Start again.')
      setStep('request')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    setIsLoading(true)
    try {
      await authApi.resetPassword({ user_id: userId, new_password: newPassword })
      toast.success('Password reset. You can sign in now.')
      navigate('/login')
    } catch {
      toast.error('Could not reset password. Try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gold-gradient-text mb-2">Forgot password</h1>
          <p className="text-gold-100/60">
            {step === 'request' && 'We’ll send a code to reset your password'}
            {step === 'otp' && 'Enter the code we sent you'}
            {step === 'password' && 'Choose a new password'}
          </p>
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
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email
                </button>
                {/* <button
                  type="button"
                  onClick={() => setMethod('phone')}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    method === 'phone'
                      ? 'bg-gold-500 text-charcoal-950'
                      : 'bg-charcoal-800 text-gold-100/60'
                  }`}
                >
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone
                </button> */}
              </div>

              <form onSubmit={handleRequestOtp} className="space-y-4">
                {method === 'email' ? (
                  <div>
                    <label className="block text-sm font-medium text-gold-100 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500"
                        required
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gold-100 mb-2">Phone number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+965 1234 5678"
                        className="w-full pl-10 pr-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500"
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
                      Send code
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gold-100 mb-2">6-digit code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full pl-10 pr-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500 tracking-widest"
                    required
                  />
                </div>
                <p className="text-xs text-gold-100/50 mt-2">
                  Check your inbox (and spam folder) for the 6-digit code.
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
                    Verify code
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('request')}
                className="w-full py-2 text-sm text-gold-400 hover:text-gold-300"
              >
                Use a different email or phone
              </button>
            </form>
          )}

          {step === 'password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gold-100 mb-2">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full pl-10 pr-12 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gold-400/60 hover:text-gold-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gold-100 mb-2">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full pl-10 pr-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500"
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
                    Reset password
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-gold-400 hover:text-gold-300 font-medium">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
