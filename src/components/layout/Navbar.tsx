import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Search,
  LogOut,
  Home,
  LayoutGrid,
  TrendingUp,
  Bell,
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
import { resolveAuthoritativeUsdOunceSpot } from '@/utils/publicStorefrontRates'
import { CartCountBadge } from '@/components/layout/CartCountBadge'
import GoldPriceTicker from '@/components/sections/GoldPriceTicker'
import { ProductSearchBox } from '@/components/products/ProductSearchBox'
import { PriceReminderPanel } from '@/components/reminders/PriceReminderPanel'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

export default function Navbar() {
  const { t } = useTranslation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isReminderOpen, setIsReminderOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [navSearchDraft, setNavSearchDraft] = useState('')
  const searchPanelRef = useRef<HTMLDivElement>(null)
  const searchToggleRef = useRef<HTMLButtonElement>(null)
  const bottomNavRef = useRef<HTMLElement>(null)
  const topChromeRef = useRef<HTMLElement>(null)
  const { user, isAuthenticated, isLoading: authLoading, isClerkSyncing, logout } = useAuth()
  const authPending = authLoading || isClerkSyncing
  const { isSignedIn: clerkSignedIn, signOut: clerkSignOut } = useClerkAuth()
  const { getItemCount } = useCart()
  const cartCount = getItemCount()
  const { data: publicRates } = useEnrichedPublicRates(30_000)
  const navigate = useNavigate()
  const location = useLocation()

  const buyGoldPriceLabel = useMemo(() => {
    const usd = resolveAuthoritativeUsdOunceSpot(publicRates)
    if (usd == null) return null
    return `$${formatPrice(usd, 'USD/oz')}`
  }, [publicRates])

  const iconBtnClass =
    'nav-icon-btn relative rounded-lg text-[#64748B] transition-colors hover:bg-black/[0.04] hover:text-[#0C1512]'

  const navLinks = useMemo(() => {
    const base = [
      { nameKey: 'nav.home', href: '/' },
      { nameKey: 'nav.products', href: '/products' },
      { nameKey: 'nav.prices', href: '/prices' },
      { nameKey: 'nav.customerKyc', href: '/gs-kyc' },
      ...(isAuthenticated ? [{ nameKey: 'nav.holdings', href: '/holdings' }] : []),
      ...(TRADING_AND_VIRTUAL_WALLET_ENABLED
        ? [{ nameKey: 'nav.tradeGold', href: '/trade-gold' }]
        : []),
      { nameKey: 'nav.branches', href: '/branches' },
      { nameKey: 'nav.about', href: '/about' },
      { nameKey: 'nav.contact', href: '/contact' },
    ]
    return base
  }, [isAuthenticated])

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

  const isProductsListPage = location.pathname === '/products'

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
    setNavSearchDraft('')
  }, [])

  const openSearch = useCallback(() => {
    setIsMenuOpen(false)
    setIsSearchOpen(true)
  }, [])

  useEffect(() => {
    closeSearch()
    setIsMenuOpen(false)
    setIsReminderOpen(false)
  }, [location.pathname, closeSearch])

  useEffect(() => {
    if (!isMenuOpen) return

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen])

  /**
   * Sticky (not fixed) chrome sits in document flow — no main padding hack.
   * Still publish --nav-offset for scroll-margin, toasts, and sticky side panels
   * when zoom / text size / open menus change the real header height.
   */
  useEffect(() => {
    const el = topChromeRef.current
    if (!el) return

    const apply = () => {
      const h = Math.ceil(el.getBoundingClientRect().height)
      if (h > 0) {
        document.documentElement.style.setProperty('--nav-offset', `${h}px`)
      }
    }

    apply()
    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(apply)
      ro.observe(el)
    }
    window.addEventListener('resize', apply)
    window.addEventListener('orientationchange', apply)
    window.visualViewport?.addEventListener('resize', apply)

    return () => {
      ro?.disconnect()
      window.removeEventListener('resize', apply)
      window.removeEventListener('orientationchange', apply)
      window.visualViewport?.removeEventListener('resize', apply)
    }
  }, [isSearchOpen, isMenuOpen])

  /**
   * Bottom nav stays at CSS `bottom: 0` + safe-area padding.
   * Do NOT sync with visualViewport — URL-bar show/hide made the bar
   * jump up and snap back (the flicker users reported).
   */
  useEffect(() => {
    const nav = bottomNavRef.current
    if (!nav) return
    nav.style.transform = ''
  }, [])

  useEffect(() => {
    if (!isSearchOpen || isProductsListPage) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (target && searchPanelRef.current?.contains(target)) return
      if (target && searchToggleRef.current?.contains(target)) return
      closeSearch()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeSearch()
        searchToggleRef.current?.focus()
      }
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isSearchOpen, isProductsListPage, closeSearch])

  const isPricesActive = isPathActive('/prices')

  return (
    <>
    <nav
      ref={topChromeRef}
      className="site-chrome-top sticky top-0 z-50 w-full border-b border-black/5 bg-[var(--site-bg)]"
    >
      <GoldPriceTicker />

      {/* Main Navbar */}
      <div className="page-shell min-w-0">
        <div className="navbar-main-row flex min-h-16 min-w-0 items-center justify-between gap-2 py-1 sm:gap-3">
          
          {/* Logo */}
          <Link to="/" className="navbar-logo flex min-w-0 shrink items-center gap-2">
            <img
              src={logo}
              alt={t('common.logoAlt')}
              className="h-10 w-auto max-w-[min(9.5rem,42vw)] object-contain object-start sm:h-12 sm:max-w-[12rem]"
            />
          </Link>

          {/* Desktop Navigation — scrolls horizontally under zoom instead of blowing page width */}
          <div className="navbar-desktop-links hidden min-w-0 flex-1 items-center justify-center gap-4 overflow-visible lg:flex xl:gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.nameKey}
                to={link.href}
                className={`relative shrink-0 whitespace-nowrap text-sm font-medium transition-colors group ${
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
            ))}
          </div>

          {/* Right Section */}
          <div className="navbar-actions flex min-w-0 shrink-0 items-center gap-0.5 sm:gap-1">
            {!isProductsListPage ? (
              <button
                ref={searchToggleRef}
                type="button"
                onClick={() => (isSearchOpen ? closeSearch() : openSearch())}
                className={
                  isSearchOpen
                    ? 'inline-flex min-h-11 min-w-[3.25rem] items-center justify-center rounded-lg bg-black/[0.06] px-2.5 text-[#0C1512] ring-1 ring-black/10 transition-colors hover:bg-black/[0.04] lg:min-h-10 lg:h-10 lg:w-10 lg:min-w-0 lg:px-0'
                    : iconBtnClass
                }
                aria-label={isSearchOpen ? t('nav.closeSearch') : t('nav.searchPlaceholder')}
                aria-expanded={isSearchOpen}
                aria-controls="navbar-search-panel"
              >
                {isSearchOpen ? (
                  <>
                    <span className="text-xs font-bold sm:text-sm lg:hidden">{t('nav.menuClose')}</span>
                    <X className="hidden h-5 w-5 lg:block" strokeWidth={1.75} />
                  </>
                ) : (
                  <Search className="h-5 w-5" strokeWidth={1.75} />
                )}
              </button>
            ) : null}

            {authPending ? (
              <span
                className={`${iconBtnClass} pointer-events-none animate-pulse bg-black/[0.04]`}
                aria-busy="true"
                aria-label={t('common.signingIn')}
              >
                <User className="h-5 w-5 opacity-40" strokeWidth={1.75} aria-hidden />
              </span>
            ) : isAuthenticated ? (
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

            <Link to="/cart" className={`${iconBtnClass} hidden lg:inline-flex`} aria-label={t('nav.cart', { defaultValue: 'Cart' })}>
              <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
              <CartCountBadge count={cartCount} />
            </Link>

            <Link
              to="/products"
              className="navbar-buy-cta ms-1 hidden max-w-[min(100%,18rem)] items-stretch overflow-hidden rounded-full bg-[#85E307] text-sm font-semibold text-[#0B0F19] shadow-sm transition-colors hover:bg-[#9AEF2A] sm:ms-2 lg:inline-flex"
              aria-label={`${t('nav.buyGold')}${buyGoldPriceLabel ? ` ${buyGoldPriceLabel}` : ''}`}
            >
              <span className="flex min-w-0 items-center gap-2 px-2.5 py-2.5 tabular-nums text-[12px] font-bold xl:px-3.5 xl:text-[13px]" dir="ltr">
                <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0B0F19]/55" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#0B0F19]" />
                </span>
                <span className="min-w-0 truncate">{buyGoldPriceLabel ?? '—'}</span>
              </span>
              <span className="w-px self-stretch bg-black/15" aria-hidden />
              <span className="flex shrink-0 items-center px-3 py-2.5 xl:px-4">{t('nav.buyGold')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search panel — hidden on /products (page has its own search) */}
      {isSearchOpen && !isProductsListPage ? (
        <div
          id="navbar-search-panel"
          ref={searchPanelRef}
          role="search"
          className="border-t border-black/5 bg-[var(--site-bg)]"
        >
          <div className="page-shell py-4 sm:py-4">
            <ProductSearchBox
              value={navSearchDraft}
              onChange={setNavSearchDraft}
              onCommit={(q) => {
                navigate(q ? `/products?search=${encodeURIComponent(q)}` : '/products')
                closeSearch()
              }}
              onClear={() => setNavSearchDraft('')}
              className="max-w-none w-full"
              autoFocus
              variant="toolbar"
            />
          </div>
        </div>
      ) : null}

      {/* Mobile Menu — bottom sheet above nav bar (not expanding from header) */}
      {isMenuOpen ? (
        <button
          type="button"
          className="mobile-menu-backdrop fixed inset-0 z-[48] bg-black/45 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
          aria-label={t('nav.closeMenu')}
        />
      ) : null}

      {isMenuOpen ? (
        <div
          className="mobile-menu-sheet fixed inset-x-0 z-[49] max-h-[min(72dvh,34rem)] overflow-y-auto rounded-t-2xl border-t border-black/10 bg-[var(--site-bg)] shadow-[0_-16px_48px_rgba(11,15,25,0.18)] lg:hidden"
          style={{ bottom: 'var(--bottom-nav-height)' }}
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.menu')}
        >
          <div className="page-shell py-4 pb-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-[#0B0F19]">{t('nav.menu')}</p>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    setIsReminderOpen(true)
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#85E307]/35 bg-[#ECFCCB]/50 px-3 py-2 text-xs font-semibold text-[#3F6F00] transition hover:bg-[#ECFCCB]"
                  aria-label={t('priceReminder.ariaLabel')}
                >
                  <Bell className="h-4 w-4 shrink-0" aria-hidden />
                  {t('priceReminder.title')}
                </button>
              ) : null}
            </div>
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.nameKey}
                  to={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`mobile-nav-link ${
                    isPathActive(link.href) ? 'mobile-nav-link--active' : ''
                  }`}
                >
                  {t(link.nameKey)}
                </Link>
              ))}
              {authPending ? (
                <div
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl border border-black/8 bg-white px-4 py-3 text-sm font-medium text-[#64748B]"
                  aria-busy="true"
                >
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#3F6F00]/30 border-t-[#3F6F00]" />
                  {t('common.signingIn')}
                </div>
              ) : !isAuthenticated ? (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="ds-btn-primary mt-2 px-4 py-3 text-center"
                >
                  {t('nav.loginRegister')}
                </Link>
              ) : null}
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
      ) : null}
    </nav>

    <Sheet open={isReminderOpen} onOpenChange={setIsReminderOpen}>
      <SheetContent
        side="bottom"
        className="z-[55] max-h-[min(85dvh,36rem)] overflow-y-auto rounded-t-2xl border-t border-black/10 px-4 pb-6 pt-5 lg:hidden"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <SheetHeader className="px-0 text-start">
          <SheetTitle className="flex items-center gap-2 text-[#0B0F19]">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ECFCCB] text-[#3F6F00]">
              <Bell className="h-4 w-4" aria-hidden />
            </span>
            {t('priceReminder.title')}
          </SheetTitle>
          <SheetDescription className="text-[#64748B]">
            {t('priceReminder.subtitleReady')}
          </SheetDescription>
        </SheetHeader>
        {isAuthenticated ? (
          <PriceReminderPanel
            className="mt-4"
            onSaved={() => setIsReminderOpen(false)}
          />
        ) : null}
      </SheetContent>
    </Sheet>

    {/* Mobile Bottom Navigation */}
    <nav
      ref={bottomNavRef}
      aria-label={t('nav.menu')}
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-50 border-t border-black/10 bg-[var(--site-bg)] lg:hidden"
    >
      <div className="mobile-bottom-nav__row flex min-h-[var(--bottom-nav-content)] items-stretch justify-around px-0.5 pt-1 pb-1">
        <Link
          to="/"
          onClick={() => setIsMenuOpen(false)}
          className={`mobile-bottom-nav__item flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-colors ${isPathActive('/') ? 'text-[#3F6F00]' : 'text-[#64748B] hover:text-[#0C1512]'}`}
        >
          <Home className="h-5 w-5 shrink-0" strokeWidth={isPathActive('/') ? 2.5 : 1.75} />
          <span className="mobile-bottom-nav__label">{t('nav.home')}</span>
        </Link>

        <Link
          to="/products"
          onClick={() => setIsMenuOpen(false)}
          className={`mobile-bottom-nav__item flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-colors ${isPathActive('/products') ? 'text-[#3F6F00]' : 'text-[#64748B] hover:text-[#0C1512]'}`}
        >
          <LayoutGrid className="h-5 w-5 shrink-0" strokeWidth={isPathActive('/products') ? 2.5 : 1.75} />
          <span className="mobile-bottom-nav__label">{t('nav.productsShort')}</span>
        </Link>

        <Link
          to="/prices"
          onClick={() => setIsMenuOpen(false)}
          className={`mobile-bottom-nav__item flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-colors ${isPricesActive ? 'text-[#3F6F00]' : 'text-[#64748B] hover:text-[#0C1512]'}`}
        >
          <TrendingUp className="h-5 w-5 shrink-0" strokeWidth={isPricesActive ? 2.5 : 1.75} />
          <span className="mobile-bottom-nav__label">{t('nav.prices')}</span>
        </Link>

        <Link
          to="/cart"
          onClick={() => setIsMenuOpen(false)}
          className={`mobile-bottom-nav__item relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-colors ${isPathActive('/cart') ? 'text-[#3F6F00]' : 'text-[#64748B] hover:text-[#0C1512]'}`}
        >
          <span className="relative inline-flex shrink-0">
            <ShoppingCart className="h-5 w-5" strokeWidth={isPathActive('/cart') ? 2.5 : 1.75} />
            <CartCountBadge count={cartCount} className="-top-1 -end-1.5" />
          </span>
          <span className="mobile-bottom-nav__label">{t('nav.cart')}</span>
        </Link>

        <button
          type="button"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          onClick={() => {
            closeSearch()
            setIsMenuOpen(!isMenuOpen)
          }}
          className={`mobile-bottom-nav__item flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5 transition-colors ${isMenuOpen ? 'text-[#3F6F00]' : 'text-[#64748B] hover:text-[#0C1512]'}`}
        >
          {isMenuOpen ? <X className="h-5 w-5 shrink-0" strokeWidth={2.5} /> : <Menu className="h-5 w-5 shrink-0" strokeWidth={1.75} />}
          <span className="mobile-bottom-nav__label">
            {isMenuOpen ? t('nav.menuClose') : t('nav.menu')}
          </span>
        </button>
      </div>
    </nav>
    </>
  )
}
