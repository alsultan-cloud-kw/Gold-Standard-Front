import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check } from 'lucide-react'
import { HomeSectionHeader } from './HomeSectionHeader'

export function ZakatTeaserSection() {
  const { t } = useTranslation()
  const points = [
    t('home.zakat.liveGold'),
    t('home.zakat.liveSilver'),
    t('home.zakat.kwd'),
    t('home.zakat.instant'),
    t('home.zakat.nisab'),
  ]

  return (
    <section
      className="home-section relative overflow-hidden border-y border-black/5"
      id="zakat-center"
      aria-labelledby="zakat-teaser-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-br from-[#ECFCCB]/40 via-[var(--site-bg)] to-[#f0f4ec]" />
        <div className="absolute -end-20 top-0 h-64 w-64 rounded-full bg-[#85E307]/10 blur-3xl" />
      </div>

      <div className="home-section-inner relative z-10">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
          <div>
            <div className="mb-2 inline-flex items-center gap-2">
              <span className="rounded-md bg-[#85E307] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0B0F19]">
                {t('home.zakat.betaBadge')}
              </span>
            </div>
            <HomeSectionHeader
              kicker={t('home.zakat.kicker')}
              title={t('home.zakat.title')}
              subtitle={t('home.zakat.subtitle')}
            />
            <p className="mt-3 max-w-xl text-sm text-[#64748B]">{t('home.zakat.betaNote')}</p>
            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {points.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-2 text-sm font-medium text-[#0C1512]"
                >
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#85E307]/25 text-[#3F6F00]">
                    <Check className="h-3 w-3" aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Link
                to="/zakat"
                className="ds-btn-accent inline-flex min-h-11 items-center justify-center gap-2 px-5"
              >
                {t('home.zakat.cta')}
                <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="relative rounded-2xl border border-black/8 bg-white/80 p-6 shadow-[0_20px_50px_-28px_rgba(12,21,18,0.35)] backdrop-blur-sm sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#3F6F00]">
              {t('home.zakat.cardKicker')}
            </p>
            <p
              id="zakat-teaser-heading"
              className="mt-2 font-semibold text-2xl leading-snug text-[#0B0F19] sm:text-3xl"
            >
              {t('home.zakat.cardTitle')}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-[#475569]">
              {t('home.zakat.cardBody')}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-[#F7F9F5] px-3 py-4">
                <p className="text-[11px] uppercase tracking-wide text-[#64748B]">
                  {t('home.zakat.statNisab')}
                </p>
                <p className="mt-1 text-lg font-semibold text-[#0B0F19]">85g</p>
              </div>
              <div className="rounded-xl bg-[#F7F9F5] px-3 py-4">
                <p className="text-[11px] uppercase tracking-wide text-[#64748B]">
                  {t('home.zakat.statRate')}
                </p>
                <p className="mt-1 text-lg font-semibold text-[#0B0F19]">2.5%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
