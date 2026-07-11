import { useState, useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useAuth as useClerkAuth } from '@clerk/react'
import { useAuth } from '../../contexts/AuthContext'
import { useCart } from '../../contexts/CartContext'
import logo from '../../assets/logo.png'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { RegionFlagImg } from '@/components/RegionFlagImg'
import { TRADING_AND_VIRTUAL_WALLET_ENABLED } from '@/featureFlags'
import { isStaffRole } from '@/utils/authRedirect'
import { useEnrichedPublicRates } from '@/hooks/useEnrichedPublicRates'
import { formatPrice } from '@/utils/metalChartSeries'
import { CartCountBadge } from '@/components/layout/CartCountBadge'
import GoldPriceTicker from '@/components/sections/GoldPriceTicker'

export default function Navbar() {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const { isSignedIn: clerkSignedIn, signOut: clerkSignOut } = useClerkAuth()
  const { getItemCount } = useCart()
  const cartCount = getItemCount()
  const { data: publicRates } = useEnrichedPublicRates(30_000)
  const navigate = useNavigate()
  const location = useLocation()

  const buyGoldPriceLabel = useMemo(() => {
    const raw = publicRates?.goldOuncePrice
    if (raw == null || !Number.isFinite(Number(raw))) return null
    let usd = Number(raw)
    // Some payloads send KWD/oz; convert when clearly not USD spot.
    if (usd > 0 && usd < 1500) {
      const rate = Number(
        (publicRates as { usd_to_kwd_rate?: number } | undefined)?.usd_to_kwd_rate,
      )
      if (Number.isFinite(rate) && rate > 0) usd = usd / rate
      else return null
    }
    return `$${formatPrice(usd, 'USD/oz')}`
  }, [publicRates])

  const iconBtnClass =
    'relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-black/[0.04] hover:text-[#0C1512]'

  const navLinks = [
    { nameKey: 'nav.home', href: '/' },
    { nameKey: 'nav.products', href: '/products' },
    { nameKey: 'nav.prices', href: '/prices' },
    // News temporarily hidden — re-enable with HomeNewsSection + /news route
    // { nameKey: 'nav.news', href: '/news' },
    ...(TRADING_AND_VIRTUAL_WALLET_ENABLED
      ? [{ nameKey: 'nav.tradeGold', href: '/trade-gold' }]
      : []),
    // { nameKey: 'nav.sellGold', href: '/sell-gold' },
    { nameKey: 'nav.branches', href: '/branches' },
    { nameKey: 'nav.about', href: '/about' },
    { nameKey: 'nav.contact', href: '/contact' },
  ]

  const handleLogout = () => {
    logout()
    if (clerkSignedIn) {
      void clerkSignOut()
    }
    navigate('/')
  }

  const isPathActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

  const isPricesActive =
    isPathActive('/prices') || isPathActive('/company-prices')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-black/5 bg-[var(--site-bg)]/95 backdrop-blur-md">
      <GoldPriceTicker />

      {/* Main Navbar */}
      <div className="page-shell">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logo}
              alt={t('common.logoAlt')}
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              link.nameKey === 'nav.prices' ? (
                <div key={link.nameKey} className="relative group/prices">
                  <button
                    type="button"
                    aria-haspopup="menu"
                    className={`inline-flex items-center gap-1 text-sm font-medium transition-colors relative ${
                      isPricesActive ? 'text-[#3F6F00]' : 'text-[#0C1512] group-hover/prices:text-[#3F6F00]'
                    }`}
                  >
                    {t('nav.prices')}
                    <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200 group-hover/prices:rotate-180" />
                    <span
                      className={`absolute -bottom-1 left-0 h-0.5 bg-[#85E307] transition-all duration-300 rtl:right-0 rtl:left-auto ${
                        isPricesActive ? 'w-full' : 'w-0 group-hover/prices:w-full'
                      }`}
                    />
                  </button>
                  {/* Hover bridge + panel — opens on hover, no click required */}
                  <div className="pointer-events-none invisible absolute start-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 opacity-0 transition-all duration-150 group-hover/prices:pointer-events-auto group-hover/prices:visible group-hover/prices:opacity-100 rtl:translate-x-1/2">
                    <div
                      role="menu"
                      className="overflow-hidden rounded-xl border border-black/10 bg-white py-1.5 shadow-lg shadow-black/10"
                    >
                      <Link
                        to="/prices"
                        role="menuitem"
                        className={`block px-4 py-2.5 text-sm transition-colors hover:bg-[#ECFCCB]/60 ${
                          isPathActive('/prices')
                            ? 'font-semibold text-[#3F6F00]'
                            : 'font-medium text-[#0B0F19]'
                        }`}
                      >
                        {t('nav.customerPrices')}
                      </Link>
                      <Link
                        to="/company-prices"
                        role="menuitem"
                        className={`block px-4 py-2.5 text-sm transition-colors hover:bg-[#ECFCCB]/60 ${
                          isPathActive('/company-prices')
                            ? 'font-semibold text-[#3F6F00]'
                            : 'font-medium text-[#0B0F19]'
                        }`}
                      >
                        {t('nav.companyPrices')}
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={link.nameKey}
                  to={link.href}
                  className={`text-sm font-medium transition-colors relative group ${
                    isPathActive(link.href) ? 'text-[#3F6F00]' : 'text-[#0C1512] hover:text-[#3F6F00]'
                  }`}
                >
                  {t(link.nameKey)}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-[#85E307] transition-all duration-300 rtl:right-0 rtl:left-auto ${
                      isPathActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              )
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            <button
              type="button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={iconBtnClass}
              aria-label={t('nav.searchPlaceholder')}
            >
              <Search className="h-5 w-5" strokeWidth={1.75} />
            </button>

            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className={iconBtnClass} aria-label={t('nav.dashboard')}>
                    <User className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-52 border-black/10 bg-white"
                >
                  <div className="border-b border-black/10 px-3 py-2">
                    <p className="text-sm font-medium text-[#0C1512]">{user?.full_name}</p>
                    <p className="text-xs text-[#64748B]">{user?.email}</p>
                  </div>
                  <DropdownMenuItem
                    onClick={() => navigate('/dashboard')}
                    className="cursor-pointer text-[#0C1512] hover:bg-[#ECFCCB]/50"
                  >
                    <User className="me-2 h-4 w-4" />
                    {t('nav.dashboard')}
                  </DropdownMenuItem>
                  {user?.nationality && /^[A-Za-z]{2}$/.test(user.nationality) ? (
                    <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-[#64748B]">
                      <RegionFlagImg code={user.nationality} size="md" className="h-3.5 w-5 rounded-[2px]" />
                      {user.nationality}
                    </div>
                  ) : null}
                  {isStaffRole(user?.role) ? (
                    <DropdownMenuItem
                      onClick={() => navigate('/admin')}
                      className="cursor-pointer text-[#0C1512] hover:bg-[#ECFCCB]/50"
                    >
                      {t('nav.adminPanel')}
                    </DropdownMenuItem>
                  ) : null}
                  <DropdownMenuSeparator className="bg-black/10" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="cursor-pointer text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="me-2 h-4 w-4" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className={iconBtnClass} aria-label={t('nav.login')}>
                <User className="h-5 w-5" strokeWidth={1.75} />
              </Link>
            )}

            <Link to="/cart" className={iconBtnClass} aria-label={t('nav.cart', { defaultValue: 'Cart' })}>
              <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
              <CartCountBadge count={cartCount} />
            </Link>

            <Link
              to="/products"
              className="ms-1 hidden items-stretch overflow-hidden rounded-full bg-[#85E307] text-sm font-semibold text-[#0B0F19] shadow-sm transition-colors hover:bg-[#9AEF2A] sm:ms-2 sm:inline-flex"
              aria-label={`${t('nav.buyGold')}${buyGoldPriceLabel ? ` ${buyGoldPriceLabel}` : ''}`}
            >
              <span className="flex items-center gap-2 px-3.5 py-2.5 tabular-nums text-[13px] font-bold" dir="ltr">
                <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0B0F19]/55" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0B0F19]" />
                </span>
                {buyGoldPriceLabel ?? '—'}
              </span>
              <span className="w-px self-stretch bg-black/15" aria-hidden />
              <span className="flex items-center px-4 py-2.5">{t('nav.buyGold')}</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`${iconBtnClass} lg:hidden`}
              aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className="border-t border-black/5 bg-white/95 backdrop-blur-md">
          <div className="page-shell py-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#5B728D] rtl:left-auto rtl:right-4" />
              <input
                type="text"
                placeholder={t('nav.searchPlaceholder')}
                className="w-full rounded-lg border border-black/10 bg-[#F9F9FA] py-3 pl-12 pr-4 text-[#0C1512] placeholder-[#94A3B8] focus:border-[#85E307] focus:outline-none focus:ring-1 focus:ring-[#85E307]/30 rtl:pl-4 rtl:pr-12"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-black/5 bg-white/95 backdrop-blur-md lg:hidden">
          <div className="page-shell py-4">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                link.nameKey === 'nav.prices' ? (
                  <div key={link.nameKey} className="px-2 py-1">
                    <div
                      className={`px-2 py-2 text-sm font-semibold rounded-lg ${
                        isPricesActive ? 'text-gold-700 bg-gold-500/10' : 'text-slate-700'
                      }`}
                    >
                      {t('nav.prices')}
                    </div>
                    <div className="mt-1 flex flex-col gap-1">
                      <Link
                        to="/prices"
                        onClick={() => setIsMenuOpen(false)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          isPathActive('/prices')
                            ? 'text-gold-700 bg-gold-500/15 font-semibold'
                            : 'text-slate-800 hover:text-gold-600 hover:bg-gold-500/10'
                        }`}
                      >
                        {t('nav.customerPrices')}
                      </Link>
                      <Link
                        to="/company-prices"
                        onClick={() => setIsMenuOpen(false)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          isPathActive('/company-prices')
                            ? 'text-gold-700 bg-gold-500/15 font-semibold'
                            : 'text-slate-800 hover:text-gold-600 hover:bg-gold-500/10'
                        }`}
                      >
                        {t('nav.companyPrices')}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.nameKey}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-3 rounded-lg transition-colors ${
                      isPathActive(link.href)
                        ? 'text-gold-700 bg-gold-500/15 font-semibold'
                        : 'text-slate-800 hover:text-gold-600 hover:bg-gold-500/10'
                    }`}
                  >
                    {t(link.nameKey)}
                  </Link>
                )
              ))}
              {!isAuthenticated && (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="ds-btn-primary mt-2 px-4 py-3 text-center"
                >
                  {t('nav.loginRegister')}
                </Link>
              )}
              <Link
                to="/products"
                onClick={() => setIsMenuOpen(false)}
                className="mt-2 inline-flex items-center justify-center overflow-hidden rounded-full bg-[#85E307] text-sm font-semibold text-[#0B0F19] sm:hidden"
              >
                <span className="flex items-center gap-2 px-3 py-3 tabular-nums text-[13px] font-bold" dir="ltr">
                  <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0B0F19]/55" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0B0F19]" />
                  </span>
                  {buyGoldPriceLabel ?? '—'}
                </span>
                <span className="w-px self-stretch bg-black/15" aria-hidden />
                <span className="px-4 py-3">{t('nav.buyGold')}</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
