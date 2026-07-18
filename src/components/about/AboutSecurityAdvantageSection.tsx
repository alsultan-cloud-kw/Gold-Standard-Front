import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Blocks } from 'lucide-react'

/**
 * About-page innovation story. Deliberately does NOT repeat the six
 * verification cards — those live on the homepage (SecurityTrustSection)
 * and the /verify page. Here we tell why the stack was built and link out.
 */
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
          <span className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#85E307]/35 bg-[#85E307]/10 text-[#85E307]">
            <Blocks className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </span>
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

        <div className="relative mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/#security-trust"
            className="gold-button inline-flex w-full items-center justify-center gap-2 sm:w-auto"
          >
            {t('aboutPage.securityLandingLink')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
          <Link
            to="/verify"
            className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto"
          >
            {t('home.securityTrust.verifyCta')}
          </Link>
        </div>
      </div>
    </section>
  )
}
