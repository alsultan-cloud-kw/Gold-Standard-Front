import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Blocks,
  FileCheck2,
  QrCode,
  Shield,
  Stamp,
  BadgeCheck,
} from 'lucide-react'

const LAYERS = [
  { id: 'blockchain', icon: Blocks },
  { id: 'companyStamp', icon: BadgeCheck },
  { id: 'hologram', icon: Shield },
  { id: 'qr', icon: QrCode },
  { id: 'ministry', icon: Stamp },
  { id: 'receipt', icon: FileCheck2 },
] as const

export function AboutSecurityAdvantageSection() {
  const { t } = useTranslation()

  return (
    <section
      className="relative overflow-hidden border-b border-black/5 bg-[#0B0F19] text-white"
      aria-labelledby="about-security-advantage-heading"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(133,227,7,0.12),transparent_65%)]" aria-hidden />

      <div className="page-shell page-section--roomy relative">
        <div className="mx-auto max-w-3xl text-center">
          <p className="page-kicker text-[#85E307]">{t('aboutPage.securityKicker')}</p>
          <h2
            id="about-security-advantage-heading"
            className="type-section-title text-white sm:text-3xl"
          >
            {t('aboutPage.securityTitle')}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-white/70 sm:text-base">
            {t('aboutPage.securityIntro')}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-white/55 sm:text-base">
            {t('aboutPage.securityLead')}
          </p>
        </div>

        <div className="relative mt-10">
          <p className="mb-4 text-center text-[10px] font-bold uppercase tracking-[0.16em] text-[#E8C547]/85">
            {t('home.securityTrust.methodsTitle')}
          </p>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LAYERS.map(({ id, icon: Icon }) => (
              <li
                key={id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 sm:p-6"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#C9A227]/35 bg-[#C9A227]/10 text-[#E8C547]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  {id === 'blockchain' ? (
                    <span className="inline-flex rounded-full border border-[#85E307]/35 bg-[#85E307]/10 px-2.5 py-1 text-[9px] font-bold tracking-wide text-[#85E307]">
                      {t('home.securityTrust.methods.blockchain.badge')}
                    </span>
                  ) : null}
                </div>
                <h3 className="text-sm font-bold text-[#E8C547] sm:text-base">
                  {t(`home.securityTrust.methods.${id}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {t(`home.securityTrust.methods.${id}.description`)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/verify"
            className="gold-button inline-flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            {t('home.securityTrust.verifyCta')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
          <Link
            to="/#security-trust"
            className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
          >
            {t('aboutPage.securityLandingLink')}
          </Link>
        </div>
      </div>
    </section>
  )
}
