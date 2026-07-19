import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import shariaLogo from '@/assets/trust/sharia-logo.png'

export function ShariaCompliantSection() {
  const { t } = useTranslation()

  return (
    <section
      className="home-section home-section--sharia relative overflow-hidden border-y border-black/5"
      id="sharia-compliant"
      aria-labelledby="sharia-compliant-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/35 via-[var(--site-bg)] to-[var(--site-bg)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_0%_50%,rgba(133,227,7,0.08),transparent_60%)]" />
      </div>

      <div className="home-section-inner relative z-10">
        <div className="sharia-band grid items-center gap-8 sm:gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)] lg:gap-14">
          <div className="sharia-band__seal mx-auto w-full max-w-[16rem] sm:max-w-[18rem] lg:mx-0 lg:max-w-[20rem]">
            <img
              src={shariaLogo}
              alt={t('home.sharia.sealAlt')}
              className="sharia-band__seal-img mx-auto h-auto w-full object-contain drop-shadow-[0_12px_32px_rgba(12,21,18,0.1)]"
              loading="lazy"
              decoding="async"
              width={512}
              height={512}
            />
          </div>

          <div className="sharia-band__copy min-w-0 text-center lg:text-start">
            <h2
              id="sharia-compliant-heading"
              className="type-section-title text-balance text-[#0B0F19] sm:text-3xl"
            >
              {t('home.sharia.title')}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-sm leading-relaxed text-[#475569] sm:text-base lg:mx-0">
              {t('home.sharia.body')}
            </p>

            <div className="mt-7 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <Link
                to="/products"
                className="ds-btn-accent inline-flex min-h-11 items-center justify-center gap-2 px-5"
              >
                {t('home.sharia.ctaShop')}
                <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden />
              </Link>
              <Link
                to="/about"
                className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border border-black/10 bg-white px-5 text-sm font-semibold text-[#0C1512] transition-colors hover:bg-[#F4F4F5]"
              >
                {t('home.sharia.ctaAbout')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
