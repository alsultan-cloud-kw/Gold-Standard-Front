import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Award,
  Shield,
  TrendingUp,
  Truck,
  Users,
  Scale,
} from 'lucide-react'

const PILLARS = [
  { id: 'transparency', icon: Scale },
  { id: 'quality', icon: Award },
  { id: 'service', icon: Users },
  { id: 'delivery', icon: Truck },
] as const

const FOCUS = [
  { id: 'coins', icon: Shield },
  { id: 'prices', icon: TrendingUp },
  { id: 'clubs', icon: Users },
] as const

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-[#F9F9FA]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/5 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/40 via-white to-white" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(133,227,7,0.12),transparent_55%)]" />
        </div>

        <div className="relative page-shell py-12 sm:py-16 lg:py-20">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
            {t('aboutPage.kicker')}
          </p>
          <h1 className="store-display-title max-w-4xl text-[#0B0F19]">
            {t('aboutPage.title')}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#64748B] sm:text-lg">
            {t('aboutPage.hero')}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/products"
              className="gold-button inline-flex items-center justify-center gap-2 shadow-md"
            >
              {t('aboutPage.ctaShop')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-black/10 bg-white px-6 py-3 font-semibold text-[#0B0F19] transition-colors hover:bg-[#F4F4F5]"
            >
              {t('aboutPage.ctaContact')}
            </Link>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="border-b border-black/5 bg-white">
        <div className="page-shell py-12 sm:py-16">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
                {t('aboutPage.storyKicker')}
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-[#0B0F19] sm:text-3xl">
                {t('aboutPage.storyTitle')}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#64748B] sm:text-base">
                {t('aboutPage.storyBody')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:col-span-7">
              {FOCUS.map((item, index) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-black/10 bg-[#F9F9FA] p-5"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307]">
                        <Icon className="h-5 w-5" strokeWidth={1.75} />
                      </span>
                      <span className="font-mono text-[11px] font-semibold tabular-nums text-[#94A3B8]">
                        0{index + 1}
                      </span>
                    </div>
                    <h3 className="mb-1.5 text-base font-semibold text-[#0B0F19]">
                      {t(`aboutPage.focus.${item.id}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#64748B]">
                      {t(`aboutPage.focus.${item.id}.description`)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="bg-[#F9F9FA]">
        <div className="page-shell py-12 sm:py-16">
          <div className="mb-8 max-w-2xl">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
              {t('aboutPage.valuesKicker')}
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-[#0B0F19] sm:text-3xl">
              {t('aboutPage.valuesTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#64748B] sm:text-base">
              {t('aboutPage.valuesIntro')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10 sm:grid-cols-2">
            {PILLARS.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.id} className="bg-white p-6 sm:p-8">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-mono text-[11px] font-semibold tabular-nums tracking-wider text-[#94A3B8]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight text-[#0B0F19]">
                    {t(`aboutPage.v.${item.id}.title`)}
                  </h3>
                  <p className="max-w-md text-sm leading-relaxed text-[#64748B]">
                    {t(`aboutPage.v.${item.id}.description`)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="border-t border-black/5 bg-white">
        <div className="page-shell py-12 sm:py-16">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] p-7 text-white sm:p-8">
              <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-[#85E307]/15 blur-3xl" />
              <p className="relative mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#85E307]">
                {t('aboutPage.missionKicker')}
              </p>
              <h3 className="relative mb-3 text-xl font-bold tracking-tight sm:text-2xl">
                {t('aboutPage.missionTitle')}
              </h3>
              <p className="relative text-sm leading-relaxed text-white/70 sm:text-base">
                {t('aboutPage.missionBody')}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#F9F9FA] p-7 sm:p-8">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#3F6F00]">
                {t('aboutPage.visionKicker')}
              </p>
              <h3 className="mb-3 text-xl font-bold tracking-tight text-[#0B0F19] sm:text-2xl">
                {t('aboutPage.visionTitle')}
              </h3>
              <p className="text-sm leading-relaxed text-[#64748B] sm:text-base">
                {t('aboutPage.visionBody')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-14 sm:pb-16">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] px-6 py-10 sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_100%_0%,rgba(133,227,7,0.16),transparent_55%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-[#85E307]">
                  {t('aboutPage.ctaKicker')}
                </p>
                <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                  {t('aboutPage.ctaTitle')}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
                  {t('aboutPage.ctaBody')}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/prices" className="gold-button inline-flex items-center justify-center gap-2">
                  {t('aboutPage.ctaPrices')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link
                  to="/branches"
                  className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
                >
                  {t('aboutPage.ctaBranches')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
