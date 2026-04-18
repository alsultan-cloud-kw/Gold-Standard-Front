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
  Shield,
  Globe,
  ChevronDown,
} from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'
import { STOREFRONT_USER_ROLES, type StorefrontUserRole } from '../constants/storefrontRoles'
import { formatApiErrorMessage } from '../utils/apiErrors'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { RegionFlagImg } from '@/components/RegionFlagImg'
import { getRegionDisplayName, getSortedIso2RegionCodes } from '@/lib/registrationRegions'
import { cn } from '@/lib/utils'

const ROLE_LABEL_KEYS: Record<StorefrontUserRole, string> = {
  customer: 'auth.roleCustomer',
  long_term_customer: 'auth.roleLongTerm',
  trader: 'auth.roleTrader',
}

export default function RegisterPage() {
  const { t, i18n } = useTranslation()
  const regionLocale = i18n.language?.startsWith('ar') ? 'ar' : 'en'
  const sortedRegionCodes = useMemo(
    () => getSortedIso2RegionCodes(regionLocale),
    [regionLocale]
  )
  const nationalityOptions = useMemo(
    () =>
      sortedRegionCodes.map((code) => ({
        code,
        name: getRegionDisplayName(code, regionLocale),
      })),
    [sortedRegionCodes, regionLocale]
  )
  const [nationalityOpen, setNationalityOpen] = useState(false)
  const nationalityRowRef = useRef<HTMLDivElement>(null)
  const [nationalityMenuWidth, setNationalityMenuWidth] = useState<number>()
  const onNationalityOpenChange = useCallback((open: boolean) => {
    setNationalityOpen(open)
    if (open && nationalityRowRef.current) {
      setNationalityMenuWidth(
        Math.max(nationalityRowRef.current.offsetWidth, 304)
      )
    }
  }, [])
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [acceptedLegal, setAcceptedLegal] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    nationality: '',
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

    if (!formData.nationality || formData.nationality.length !== 2) {
      toast.error(t('auth.nationalityRequired'))
      return
    }
    if (!acceptedLegal) {
      toast.error('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }

    setIsLoading(true)

    try {
      await register({
        full_name: formData.full_name,
        nationality: formData.nationality.toUpperCase(),
        email: formData.email || undefined,
        phone_number: formData.phone_number || undefined,
        password: formData.password,
        confirm_password: formData.confirm_password,
        role: formData.role,
        terms_accepted: acceptedLegal,
        privacy_policy_accepted: acceptedLegal,
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
              <label
                id="register-nationality-label"
                className="block text-sm font-medium text-black-100 mb-2"
              >
                {t('auth.nationality')}
              </label>
              <div ref={nationalityRowRef} className="relative w-full">
                {!formData.nationality && (
                  <Globe className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-black-400/60 pointer-events-none z-10" />
                )}
                <Popover open={nationalityOpen} onOpenChange={onNationalityOpenChange}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      aria-expanded={nationalityOpen}
                      aria-haspopup="listbox"
                      aria-labelledby="register-nationality-label"
                      className={cn(
                        'w-full min-h-[48px] h-auto py-3 pe-10 justify-between font-normal',
                        formData.nationality ? 'ps-4' : 'ps-11',
                        'bg-charcoal-800 border border-gold-500/30 rounded-lg text-black-100',
                        'hover:bg-charcoal-700/35 hover:border-gold-500/45 hover:text-black-50',
                        'focus-visible:border-gold-400 focus-visible:ring-2 focus-visible:ring-gold-500/25 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal-900',
                        'shadow-none data-[state=open]:border-gold-400/60 data-[state=open]:ring-1 data-[state=open]:ring-gold-500/20'
                      )}
                    >
                      <span className="flex items-center gap-3 min-w-0 text-start">
                        {formData.nationality ? (
                          <>
                            <RegionFlagImg code={formData.nationality} size="sm" />
                            <span className="truncate font-medium tracking-tight text-black-50">
                              {getRegionDisplayName(formData.nationality, regionLocale)}
                            </span>
                          </>
                        ) : (
                          <span className="truncate ps-5 text-black-400/65">
                            {t('auth.selectNationality')}
                          </span>
                        )}
                      </span>
                      <ChevronDown
                        className={cn(
                          'absolute end-3 top-1/2 -translate-y-1/2 size-4 shrink-0 text-black-400/70',
                          'transition-transform duration-200',
                          nationalityOpen && 'rotate-180'
                        )}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="start"
                    sideOffset={8}
                    collisionPadding={16}
                    className={cn(
                      'p-0 z-[200] overflow-hidden rounded-xl',
                      'border border-gold-500/25 bg-charcoal-900/98 backdrop-blur-sm',
                      'shadow-[0_22px_50px_-12px_rgba(0,0,0,0.65),0_0_0_1px_rgba(212,175,55,0.07),inset_0_1px_0_rgba(212,175,55,0.06)]'
                    )}
                    style={
                      nationalityMenuWidth
                        ? { width: nationalityMenuWidth }
                        : undefined
                    }
                  >
                    <Command
                      className={cn(
                        'bg-transparent pt-3',
                        '[&_[data-slot=command-input-wrapper]]:mx-3 [&_[data-slot=command-input-wrapper]]:mt-0 [&_[data-slot=command-input-wrapper]]:mb-3',
                        '[&_[data-slot=command-input-wrapper]]:flex [&_[data-slot=command-input-wrapper]]:h-auto [&_[data-slot=command-input-wrapper]]:min-h-[46px]',
                        '[&_[data-slot=command-input-wrapper]]:items-center [&_[data-slot=command-input-wrapper]]:gap-3',
                        '[&_[data-slot=command-input-wrapper]]:rounded-lg [&_[data-slot=command-input-wrapper]]:border [&_[data-slot=command-input-wrapper]]:border-gold-500/25',
                        '[&_[data-slot=command-input-wrapper]]:bg-charcoal-800 [&_[data-slot=command-input-wrapper]]:px-3.5 [&_[data-slot=command-input-wrapper]]:py-2.5',
                        '[&_[data-slot=command-input-wrapper]]:shadow-[inset_0_1px_2px_rgba(0,0,0,0.25)]',
                        '[&_[data-slot=command-input-wrapper]]:transition-[border-color,box-shadow] [&_[data-slot=command-input-wrapper]]:focus-within:border-gold-400/55 [&_[data-slot=command-input-wrapper]]:focus-within:shadow-[0_0_0_3px_rgba(212,175,55,0.12),inset_0_1px_2px_rgba(0,0,0,0.2)]',
                        '[&_[data-slot=command-input-wrapper]]:border-b-0',
                        '[&_[data-slot=command-input-wrapper]_svg]:size-[18px] [&_[data-slot=command-input-wrapper]_svg]:shrink-0 [&_[data-slot=command-input-wrapper]_svg]:text-black-400 [&_[data-slot=command-input-wrapper]_svg]:opacity-90'
                      )}
                      label={t('auth.nationality')}
                    >
                      <CommandInput
                        placeholder={t('auth.searchNationality')}
                        className={cn(
                          'h-10 border-0 bg-transparent py-0 text-[15px] text-gold-50',
                          'placeholder:text-gold-400/50 caret-gold-400',
                          'outline-none focus:ring-0 focus-visible:ring-0'
                        )}
                      />
                      <CommandList
                        className={cn(
                          'max-h-[min(20rem,55vh)] scroll-py-2 px-2 pb-2 pt-0',
                          '[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gold-500/20'
                        )}
                      >
                        <CommandEmpty className="py-10 text-center text-sm text-black-400/55">
                          {t('auth.noCountryMatch')}
                        </CommandEmpty>
                        <CommandGroup className="p-0 [&_[cmdk-group-heading]]:hidden">
                          {nationalityOptions.map(({ code, name }) => (
                            <CommandItem
                              key={code}
                              value={code}
                              keywords={[name, code]}
                              onSelect={(selected) => {
                                setFormData((prev) => ({
                                  ...prev,
                                  nationality: selected.toUpperCase(),
                                }))
                                setNationalityOpen(false)
                              }}
                              className={cn(
                                'mx-0 mb-0.5 cursor-pointer rounded-lg px-2.5 py-2 text-sm',
                                'text-black-100/95 transition-colors duration-100',
                                'data-[selected=true]:bg-gold-500/[0.14] data-[selected=true]:text-black-50',
                                'aria-selected:bg-gold-500/[0.14]',
                                'data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-40'
                              )}
                            >
                              <span className="flex items-center gap-3 min-w-0 w-full">
                                <RegionFlagImg code={code} size="md" />
                                <span className="min-w-0 flex-1 truncate leading-snug">{name}</span>
                                <span className="shrink-0 text-[10px] font-semibold tabular-nums text-black-400/45 tracking-wide">
                                  {code}
                                </span>
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <p className="text-xs text-black-100/45 mt-1.5">{t('auth.nationalityHint')}</p>
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
                <input
                  type="checkbox"
                  className="rounded border-gold-500/30 bg-charcoal-800 text-gold-500 mt-1"
                  checked={acceptedLegal}
                  onChange={(e) => setAcceptedLegal(e.target.checked)}
                  required
                />
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
              disabled={isLoading || !acceptedLegal}
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
