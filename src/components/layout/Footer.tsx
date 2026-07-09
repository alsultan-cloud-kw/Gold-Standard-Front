import { Link } from 'react-router-dom'
import { GS_CONTACT } from '@/constants/contact'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Mail, Clock, Instagram } from 'lucide-react'
import logo from '../../assets/logo.png'

const INSTAGRAM_URL = 'https://instagram.com/goldstandardkw'

function AndroidIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.523 15.341a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm-9.546 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM15.98 8.12l1.39-2.41a.4.4 0 0 0-.15-.55.4.4 0 0 0-.55.15l-1.41 2.44A8.3 8.3 0 0 0 12 7.2c-1.1 0-2.14.22-3.08.63L7.5 5.39a.4.4 0 0 0-.55-.15.4.4 0 0 0-.15.55l1.39 2.41C5.9 9.4 4.2 11.7 4 14.4h16c-.2-2.7-1.9-5-4.02-6.28ZM4.5 15.6c0 .55.45 1 1 1h.5v3.15a1.25 1.25 0 0 0 2.5 0V16.6h7v3.15a1.25 1.25 0 0 0 2.5 0V16.6h.5c.55 0 1-.45 1-1v-.6H4.5v.6Z" />
    </svg>
  )
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83ZM13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11Z" />
    </svg>
  )
}

export default function Footer() {
  const { t, i18n } = useTranslation()
  const currentYear = new Date().getFullYear()
  const isAr = i18n.language?.startsWith('ar')
  const address = isAr ? GS_CONTACT.addressAr : GS_CONTACT.addressEn

  const shopLinks = [
    { nameKey: 'footer.products', href: '/products' },
    { nameKey: 'footer.prices', href: '/prices' },
    { nameKey: 'footer.ourBranches', href: '/branches' },
  ]

  const companyLinks = [
    { nameKey: 'footer.aboutUs', href: '/about' },
    { nameKey: 'footer.contactUs', href: '/contact' },
  ]

  const helpLinks = [
    { nameKey: 'footer.termsAndPrivacy', href: '/terms-and-privacy' },
    { nameKey: 'footer.dataDeletion', href: '/data-deletion' },
  ]

  return (
    <footer className="relative overflow-hidden bg-[#0B0F19] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_0%_0%,rgba(133,227,7,0.12),transparent_55%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#85E307]/50 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
          {/* Brand + social + apps */}
          <div className="space-y-6 lg:col-span-5">
            <Link to="/" className="inline-flex items-center gap-2">
              <img
                src={logo}
                alt="Gold Standard"
                className="h-11 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-white/60">{t('footer.tagline')}</p>

            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-[#85E307]">
                {t('footer.followUs')}
              </p>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 transition-colors hover:border-[#85E307]/40 hover:bg-white/[0.07]"
                aria-label="Instagram @goldstandardkw"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white shadow-md">
                  <Instagram className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span className="text-start">
                  <span className="block text-sm font-semibold text-white group-hover:text-[#ECFCCB]">
                    {t('footer.instagramHandle')}
                  </span>
                  <span className="block text-xs text-white/45">{t('common.instagram')}</span>
                </span>
              </a>
            </div>

            <div>
              <div className="mb-3 flex items-baseline gap-2">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#85E307]">
                  {t('footer.getTheApp')}
                </p>
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
                  {t('footer.appComingSoon')}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5" aria-disabled="true">
                <div
                  className="inline-flex cursor-default items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 opacity-70"
                  title={t('footer.appComingSoon')}
                >
                  <AndroidIcon className="h-5 w-5 text-white/80" />
                  <span className="text-start">
                    <span className="block text-[10px] uppercase tracking-wide text-white/40">
                      {t('footer.appComingSoon')}
                    </span>
                    <span className="block text-sm font-semibold text-white/85">
                      {t('footer.androidApp')}
                    </span>
                  </span>
                </div>
                <div
                  className="inline-flex cursor-default items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 opacity-70"
                  title={t('footer.appComingSoon')}
                >
                  <AppleIcon className="h-5 w-5 text-white/80" />
                  <span className="text-start">
                    <span className="block text-[10px] uppercase tracking-wide text-white/40">
                      {t('footer.appComingSoon')}
                    </span>
                    <span className="block text-sm font-semibold text-white/85">
                      {t('footer.iosApp')}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7 lg:gap-6">
            <div>
              <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#85E307]">
                {t('footer.shop')}
              </h4>
              <ul className="space-y-2.5">
                {shopLinks.map((link) => (
                  <li key={link.nameKey}>
                    <Link
                      to={link.href}
                      className="text-sm text-white/65 transition-colors hover:text-[#85E307]"
                    >
                      {t(link.nameKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#85E307]">
                {t('footer.company')}
              </h4>
              <ul className="space-y-2.5">
                {companyLinks.map((link) => (
                  <li key={link.nameKey}>
                    {link.href === '#' ? (
                      <span className="text-sm text-white/40">{t(link.nameKey)}</span>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-white/65 transition-colors hover:text-[#85E307]"
                      >
                        {t(link.nameKey)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <h4 className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-[#85E307]">
                {t('footer.customerService')}
              </h4>
              <ul className="space-y-2.5">
                {helpLinks.map((link) => (
                  <li key={link.nameKey}>
                    {link.href === '#' ? (
                      <span className="text-sm text-white/40">{t(link.nameKey)}</span>
                    ) : (
                      <Link
                        to={link.href}
                        className="text-sm text-white/65 transition-colors hover:text-[#85E307]"
                      >
                        {t(link.nameKey)}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact strip */}
        <div className="mt-12 grid grid-cols-1 gap-4 border-t border-white/10 pt-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#85E307]" />
            <span className="text-sm leading-relaxed text-white/65">{address}</span>
          </div>
          <a
            href={`tel:${GS_CONTACT.phoneTel}`}
            className="flex items-center gap-3 text-sm text-white/65 transition-colors hover:text-[#85E307]"
          >
            <Phone className="h-4 w-4 shrink-0 text-[#85E307]" />
            {GS_CONTACT.phone}
          </a>
          <a
            href={`mailto:${GS_CONTACT.email}`}
            className="flex items-center gap-3 text-sm text-white/65 transition-colors hover:text-[#85E307]"
          >
            <Mail className="h-4 w-4 shrink-0 text-[#85E307]" />
            {GS_CONTACT.email}
          </a>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#85E307]" />
            <span className="text-sm leading-relaxed text-white/65">
              <span className="block">{t('footer.hoursWeekday')}</span>
              <span className="block text-white/45">{t('footer.hoursFriday')}</span>
            </span>
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-xs text-white/40">
            © {currentYear} Gold Standard. {t('footer.allRightsReserved')}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            <Link
              to="/terms-and-privacy"
              className="text-xs text-white/40 transition-colors hover:text-[#85E307]"
            >
              {t('footer.termsAndPrivacy')}
            </Link>
            <Link
              to="/data-deletion"
              className="text-xs text-white/40 transition-colors hover:text-[#85E307]"
            >
              {t('footer.dataDeletion')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
