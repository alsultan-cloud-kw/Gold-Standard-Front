import { Link, type To } from 'react-router-dom'
import { GS_CONTACT } from '@/constants/contact'
import { GS_INSTAGRAM } from '@/constants/social'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Building2,
  Headset,
  Instagram,
  MapPin,
  Phone,
  type LucideIcon,
} from 'lucide-react'
import logo from '@/assets/logo.png'
import { FooterProductsSitemap } from '@/components/layout/FooterProductsSitemap'
import { scrollToHash } from '@/utils/scrollToHash'

type FooterLink = { nameKey: string; to: To; hashTarget?: string }

type CompanyLink = Omit<FooterLink, 'hashTarget'> & {
  descKey: string
  icon: LucideIcon
}

export default function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  const shopLinks: FooterLink[] = [
    { nameKey: 'footer.prices', to: '/prices' },
    { nameKey: 'footer.verifyAuthenticity', to: '/verify' },
    { nameKey: 'footer.holdings', to: '/holdings' },
  ]

  const companyLinks: CompanyLink[] = [
    {
      nameKey: 'footer.aboutUs',
      descKey: 'footer.aboutUsDesc',
      to: '/about',
      icon: Building2,
    },
    {
      nameKey: 'footer.ourBranches',
      descKey: 'footer.ourBranchesDesc',
      to: '/branches',
      icon: MapPin,
    },
    {
      nameKey: 'footer.contactUs',
      descKey: 'footer.contactUsDesc',
      to: '/contact',
      icon: Headset,
    },
  ]

  const helpLinks: FooterLink[] = [
    { nameKey: 'footer.faqs', to: { pathname: '/', hash: '#faq' }, hashTarget: 'faq' },
    { nameKey: 'footer.contactUs', to: '/contact' },
    { nameKey: 'footer.termsAndPrivacy', to: '/terms-and-privacy' },
    { nameKey: 'footer.dataDeletion', to: '/data-deletion' },
  ]

  return (
    <footer className="relative overflow-hidden bg-[#0B0F19] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(133,227,7,0.08),transparent_60%)]" />

      {/* CTA band */}
      <div className="relative border-b border-white/10">
        <div className="page-shell py-[var(--space-section-y-top)] text-center sm:py-[var(--space-section-y-bottom)]">
          <h2 className="type-section-title mx-auto max-w-2xl text-white sm:text-3xl md:text-4xl">
            {t('footer.ctaTitle')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
            {t('footer.ctaSubtitle')}
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to="/products"
              className="ds-btn-accent inline-flex items-center justify-center gap-2 px-8 py-3.5 text-base"
            >
              {t('footer.ctaBuyGold')}
              <ArrowRight className="h-5 w-5 shrink-0 rtl:rotate-180" />
            </Link>
            <Link
              to="/prices"
              className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-transparent px-8 py-3.5 text-base font-semibold text-white transition-colors hover:border-white/35 hover:bg-white/5"
            >
              {t('footer.ctaPriceAlert')}
            </Link>
          </div>
        </div>
      </div>

      {/* Link columns */}
      <div className="relative">
        <div className="page-shell grid grid-cols-2 gap-x-4 gap-y-8 py-[var(--space-section-compact-bottom)] sm:grid-cols-2 sm:gap-8 lg:grid-cols-12 lg:gap-x-8 lg:gap-y-10 lg:py-[var(--space-section-y-top)]">
          <div className="min-w-0 col-span-2 sm:col-span-2 lg:col-span-3">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img
                src={logo}
                alt={t('common.logoAlt')}
                className="h-10 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/55">{t('footer.tagline')}</p>

            <div className="mt-5 flex flex-col gap-2.5">
              <a
                href={`tel:${GS_CONTACT.phoneTel}`}
                className="inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"
              >
                <Phone className="h-4 w-4 shrink-0 text-[#85E307]" aria-hidden />
                <span dir="ltr">{GS_CONTACT.phone}</span>
              </a>
              <a
                href={GS_INSTAGRAM.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/55 transition-colors hover:text-white"
              >
                <Instagram className="h-4 w-4 shrink-0 text-[#85E307]" aria-hidden />
                <span dir="ltr">{t('footer.instagramHandle')}</span>
              </a>
              <p className="text-xs leading-relaxed text-white/40">
                <span className="block">{t('footer.hoursWeekday')}</span>
                <span className="block">{t('footer.hoursFriday')}</span>
              </p>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2">
            <FooterProductsSitemap />
          </div>

          <div className="col-span-1 lg:col-span-2">
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#85E307]">
              {t('footer.shop')}
            </h4>
            <ul className="space-y-2.5">
              {shopLinks.map((link) => (
                <li key={link.nameKey}>
                  <Link
                    to={link.to}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {t(link.nameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-2 lg:col-span-3">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#85E307]">
              {t('footer.company')}
            </p>
            <nav className="flex flex-col gap-2" aria-label={t('footer.company')}>
              {companyLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.nameKey}
                    to={link.to}
                    className="group flex items-center gap-3.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 transition-all duration-200 hover:border-[#85E307]/30 hover:bg-white/[0.07] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#85E307]/50"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#85E307]/12 text-[#85E307] transition-colors group-hover:bg-[#85E307]/18">
                      <Icon className="h-4 w-4" strokeWidth={2.25} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-snug text-white">
                        {t(link.nameKey)}
                      </span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-white/50">
                        {t(link.descKey)}
                      </span>
                    </span>
                    <ArrowRight
                      className="h-4 w-4 shrink-0 text-white/25 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-[#85E307] rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
                      aria-hidden
                    />
                  </Link>
                )
              })}
            </nav>
          </div>

          <div className="col-span-2 lg:col-span-2 mt-4 lg:mt-0">
            <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.22em] text-[#85E307]">
              {t('footer.customerService')}
            </h4>
            <ul className="space-y-2.5">
              {helpLinks.map((link) => (
                <li key={link.nameKey}>
                  <Link
                    to={link.to}
                    onClick={
                      link.hashTarget
                        ? () => {
                            window.setTimeout(() => scrollToHash(link.hashTarget!), 0)
                          }
                        : undefined
                    }
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {t(link.nameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="page-shell flex flex-col items-center justify-between gap-3 py-5 sm:flex-row">
          <p className="text-xs text-white/40">
            © {currentYear} {t('common.brandName')}. {t('footer.allRightsReserved')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            <a
              href={`tel:${GS_CONTACT.phoneTel}`}
              className="text-white/40 transition-colors hover:text-[#85E307]"
              dir="ltr"
            >
              {GS_CONTACT.phone}
            </a>
            <a
              href={`mailto:${GS_CONTACT.email}`}
              className="text-white/40 transition-colors hover:text-[#85E307]"
              dir="ltr"
            >
              {GS_CONTACT.email}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
