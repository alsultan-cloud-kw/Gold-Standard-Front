import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Mail, Phone, Lock, User, ArrowRight, Shield } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { STOREFRONT_USER_ROLES, type StorefrontUserRole } from '../constants/storefrontRoles'
import { formatApiErrorMessage } from '../utils/apiErrors'

const ROLE_LABEL_KEYS: Record<StorefrontUserRole, string> = {
  customer: 'auth.roleCustomer',
  long_term_customer: 'auth.roleLongTerm',
  trader: 'auth.roleTrader',
}

export default function RegisterPage() {
  const { t } = useTranslation()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    password: '',
    confirm_password: '',
    role: 'customer' as StorefrontUserRole,
  })

  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const nextPath = searchParams.get('next')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formData.password !== formData.confirm_password) {
      toast.error(t('auth.passwordsMismatch'))
      return
    }

    setIsLoading(true)

    try {
      await register({
        full_name: formData.full_name,
        email: formData.email || undefined,
        phone_number: formData.phone_number || undefined,
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: formData.role,
      })
      toast.success(t('auth.registerSuccess'))
      if (nextPath && nextPath.startsWith('/')) {
        navigate(nextPath)
      } else {
        navigate('/')
      }
    } catch (error) {
      toast.error(formatApiErrorMessage(error, t('auth.registerFailed')))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-16">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gold-gradient-text mb-2">{t('auth.createAccountTitle')}</h1>
          <p className="text-gold-100/60">{t('auth.registerSubtitle')}</p>
        </div>

        <div className="gold-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gold-100 mb-2">{t('auth.accountType')}</label>
              <div className="relative">
                <Shield className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60 pointer-events-none z-10" />
                <select
                  value={formData.role}
                  aria-label={t('auth.accountTypeAria')}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as StorefrontUserRole,
                    })
                  }
                  className="w-full ps-10 pe-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 focus:outline-none focus:border-gold-500 appearance-none cursor-pointer"
                >
                  {STOREFRONT_USER_ROLES.map((value) => (
                    <option key={value} value={value}>
                      {t(ROLE_LABEL_KEYS[value])}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-gold-100/45 mt-1.5">{t('auth.roleHint')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gold-100 mb-2">{t('auth.fullName')}</label>
              <div className="relative">
                <User className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder={t('auth.placeholderFullName')}
                  className="w-full ps-10 pe-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500"
                  required
                />
              </div>
            </div>

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
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gold-100 mb-2">{t('auth.phoneNumber')}</label>
              <div className="relative">
                <Phone className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder={t('auth.placeholderPhone')}
                  className="w-full ps-10 pe-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500"
                />
              </div>
              <p className="text-xs text-gold-100/40 mt-1">{t('auth.emailOrPhoneRequired')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gold-100 mb-2">{t('auth.password')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder={t('auth.placeholderCreatePassword')}
                  className="w-full ps-10 pe-12 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500"
                  required
                  minLength={8}
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

            <div>
              <label className="block text-sm font-medium text-gold-100 mb-2">{t('auth.confirmPassword')}</label>
              <div className="relative">
                <Lock className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirm_password}
                  onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                  placeholder={t('auth.placeholderConfirmPassword')}
                  className="w-full ps-10 pe-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder-gold-400/40 focus:outline-none focus:border-gold-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gold-500/30 bg-charcoal-800 text-gold-500 mt-1" required />
                <span className="text-sm text-gold-100/60">
                  <Trans
                    i18nKey="auth.termsAgreement"
                    components={{
                      termsLink: <Link to="/terms" className="text-gold-400 hover:text-gold-300" />,
                      privacyLink: <Link to="/privacy" className="text-gold-400 hover:text-gold-300" />,
                    }}
                  />
                </span>
              </label>
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
                  {t('auth.createAccountCta')}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gold-100/60">
              {t('auth.hasAccount')}{' '}
              <Link to="/login" className="text-gold-400 hover:text-gold-300 font-medium">
                {t('auth.signInLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
