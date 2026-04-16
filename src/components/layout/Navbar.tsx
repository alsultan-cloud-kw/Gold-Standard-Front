import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { 
  ShoppingCart, 
  User, 
  Menu, 
  X, 
  Search, 
  Phone,
  MapPin,
  LogOut,
  ChevronDown,
  Languages
} from 'lucide-react'
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

export default function Navbar() {
  const { t, i18n } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const { getItemCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  const navLinks = [
    { nameKey: 'nav.home', href: '/' },
    { nameKey: 'nav.products', href: '/products' },
    { nameKey: 'nav.prices', href: '/prices' },
    { nameKey: 'nav.news', href: '/news' },
    { nameKey: 'nav.tradeGold', href: '/trade-gold' },
    // { nameKey: 'nav.sellGold', href: '/sell-gold' },
    // { nameKey: 'nav.branches', href: '/branches' },
    { nameKey: 'nav.about', href: '/about' },
    { nameKey: 'nav.contact', href: '/contact' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const isPathActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname === href || location.pathname.startsWith(`${href}/`)
  }

  const isPricesActive =
    isPathActive('/prices') || isPathActive('/company-prices')

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Top Bar */}
      <div className="bg-gold-500/10 border-b border-gold-500/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-8 text-xs">
            <div className="flex items-center gap-4 gold-gradient-text-on-light">
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                +965 1234 5678
              </span>
              <span className="hidden sm:flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {t('nav.location')}
              </span>
            </div>
            <div className="flex items-center gap-4 gold-gradient-text-on-light">
              <Link to="/prices" className="live-indicator hover:underline">
                {t('nav.liveGoldPrices')}
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 hover:underline" aria-label={t('common.language')}>
                    <Languages className="w-3.5 h-3.5" />
                    <span>{i18n.language === 'ar' ? t('common.arabic') : t('common.english')}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[120px] bg-white border-gold-500/30">
                  <DropdownMenuItem onClick={() => i18n.changeLanguage('en')} className="cursor-pointer">
                    English
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => i18n.changeLanguage('ar')} className="cursor-pointer">
                    العربية
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img
              src={logo}
              alt="Gold & Jewelry Trading Co. logo"
              className="h-12 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              link.nameKey === 'nav.prices' ? (
                <DropdownMenu key={link.nameKey}>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={`inline-flex items-center gap-1 text-sm font-medium transition-colors relative group ${
                        isPricesActive ? 'text-gold-700' : 'text-slate-800 hover:text-gold-600'
                      }`}
                    >
                      {t('nav.prices')}
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span
                        className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-300 rtl:right-0 rtl:left-auto ${
                          isPricesActive ? 'w-full' : 'w-0 group-hover:w-full'
                        }`}
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center" className="min-w-[200px] bg-white border-gold-500/30">
                    <DropdownMenuItem asChild>
                      <Link
                        to="/prices"
                        className={`cursor-pointer ${isPathActive('/prices') ? 'text-gold-700 font-semibold' : ''}`}
                      >
                        {t('nav.customerPrices')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/company-prices"
                        className={`cursor-pointer ${isPathActive('/company-prices') ? 'text-gold-700 font-semibold' : ''}`}
                      >
                        {t('nav.companyPrices')}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  key={link.nameKey}
                  to={link.href}
                  className={`text-sm font-medium transition-colors relative group ${
                    isPathActive(link.href) ? 'text-gold-700' : 'text-slate-800 hover:text-gold-600'
                  }`}
                >
                  {t(link.nameKey)}
                  <span
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-gold-400 to-gold-600 transition-all duration-300 rtl:right-0 rtl:left-auto ${
                      isPathActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
                    }`}
                  />
                </Link>
              )
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {/* Search */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="p-2 text-slate-700 hover:text-gold-600 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 text-slate-700 hover:text-gold-600 transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-0.5 bg-gold-500 text-charcoal-950 text-xs font-bold rounded-full flex items-center justify-center tabular-nums motion-safe:animate-cart-badge-blink">
                  {getItemCount()}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-2 text-slate-700 hover:text-gold-600 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                      {user?.nationality && /^[A-Za-z]{2}$/.test(user.nationality) ? (
                        <span className="inline-flex items-center justify-center rounded bg-charcoal-950/80 p-0.5 ring-1 ring-white/20">
                          <RegionFlagImg
                            code={user.nationality}
                            size="md"
                            className="w-5 h-3.5 rounded-[2px] ring-1 ring-gold-200/30"
                          />
                        </span>
                      ) : (
                        <span className="text-charcoal-950 font-bold text-sm">
                          {user?.full_name?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 hidden sm:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 bg-white border-gold-500/30"
                >
                  <div className="px-3 py-2 border-b border-gold-500/20">
                    <p className="text-sm font-medium text-slate-900">{user?.full_name}</p>
                    <p className="text-xs text-slate-600">{user?.email}</p>
                  </div>
                  <DropdownMenuItem 
                    onClick={() => navigate('/dashboard')}
                    className="text-slate-700 hover:text-gold-600 hover:bg-gold-500/10 cursor-pointer"
                  >
                    <User className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('nav.dashboard')}
                  </DropdownMenuItem>
                  {user?.role === 'admin' && (
                    <DropdownMenuItem 
                      onClick={() => navigate('/admin')}
                      className="text-slate-700 hover:text-gold-600 hover:bg-gold-500/10 cursor-pointer"
                    >
                      {t('nav.adminPanel')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-gold-500/20" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
                    {t('nav.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium text-charcoal-950 bg-gradient-to-r from-gold-400 to-gold-500 rounded-lg hover:from-gold-300 hover:to-gold-400 transition-all"
              >
                <User className="w-4 h-4" />
                {t('nav.login')}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-gold-600 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className="border-t border-stone-200 bg-white/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
              <input
                type="text"
                placeholder={t('nav.searchPlaceholder')}
                className="w-full pl-12 pr-4 py-3 bg-white border border-stone-200 rounded-lg text-slate-900 placeholder-stone-400 focus:outline-none focus:border-lime-600 focus:ring-1 focus:ring-lime-500/25 rtl:pl-4 rtl:pr-12"
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
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
                  className="mt-2 px-4 py-3 text-center text-charcoal-950 font-medium bg-gradient-to-r from-gold-400 to-gold-500 rounded-lg"
                >
                  {t('nav.loginRegister')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
