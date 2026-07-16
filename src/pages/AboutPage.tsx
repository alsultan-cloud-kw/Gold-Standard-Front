import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Award,
  Building2,
  Factory,
  Landmark,
  Package,
  Shield,
  Truck,
  Users,
  Scale,
  Globe,
  BadgeCheck,
  Smartphone,
} from 'lucide-react'
import { GS_BUSINESS } from '@/constants/businessCredentials'
import { HeroTrustIcon } from '@/components/home/HeroTrustIcon'
import { HeroTrustStrip } from '@/components/home/HeroTrustStrip'
import { AboutPartnersSection } from '@/components/about/AboutPartnersSection'
import { AboutSecurityAdvantageSection } from '@/components/about/AboutSecurityAdvantageSection'

const OFFERINGS = [
  'bars',
  'coins',
  'custom',
  'privateLabel',
  'wholesale',
  'certification',
  'packaging',
  'buyback',
] as const

const CLIENTS = [
  'individuals',
  'banks',
  'investment',
  'corporate',
  'dealers',
  'government',
  'familyOffices',
  'partners',
] as const

const PILLARS = [
  { id: 'transparency', icon: Scale },
  { id: 'quality', icon: Award },
  { id: 'service', icon: Users },
  { id: 'delivery', icon: Truck },
] as const

const FOCUS = [
  { id: 'parent', icon: Building2 },
  { id: 'manufacture', icon: Factory },
  { id: 'specialty', icon: Package },
] as const

const MILESTONES = [
  { id: 'kuwait', icon: Building2 },
  { id: 'licence', icon: BadgeCheck },
  { id: 'manufacturing', icon: Factory },
  { id: 'moci', icon: Shield },
  { id: 'digital', icon: Globe },
  { id: 'authenticity', icon: Award },
  { id: 'sharia', icon: Scale },
  { id: 'reach', icon: Users },
] as const

const STORY_PARAS = ['p1', 'p2', 'p3', 'p4'] as const

export default function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className="storefront-static-page min-h-screen">
      <section className="relative overflow-hidden border-b border-black/5 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/40 via-white to-white" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_100%_0%,rgba(133,227,7,0.12),transparent_55%)]" />
        </div>

        <div className="relative page-shell page-section--roomy">
          <p className="page-kicker">{t('aboutPage.kicker')}</p>
          <h1 className="store-display-title max-w-4xl text-[#0B0F19]">
            {t('aboutPage.title')}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#64748B] sm:text-lg">
            {t('aboutPage.hero')}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/products"
              className="gold-button inline-flex w-full items-center justify-center gap-2 shadow-md sm:w-auto"
            >
              {t('aboutPage.ctaShop')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex w-full items-center justify-center rounded-lg border border-black/10 bg-white px-6 py-3 font-semibold text-[#0B0F19] transition-colors hover:bg-[#F4F4F5] sm:w-auto"
            >
              {t('aboutPage.ctaContact')}
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-black/5 bg-white">
        <div className="page-shell page-section--roomy">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <p className="page-kicker">{t('aboutPage.storyKicker')}</p>
              <h2 className="type-section-title text-[#0B0F19] sm:text-3xl">
                {t('aboutPage.storyTitle')}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#64748B] sm:text-base">
                {t('aboutPage.storyBody')}
              </p>
              <div className="mt-5 space-y-4">
                {STORY_PARAS.map((key) => (
                  <p
                    key={key}
                    className="text-sm leading-[1.85] text-[#475569] sm:text-base"
                  >
                    {t(`aboutPage.story.${key}`)}
                  </p>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7 xl:grid-cols-3">
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

      <section className="border-b border-black/5 bg-[#F9F9FA]">
        <div className="page-shell page-section--roomy">
          <div className="mb-10 max-w-3xl">
            <p className="page-kicker">{t('aboutPage.profileKicker')}</p>
            <h2 className="type-section-title text-[#0B0F19] sm:text-3xl">
              {t('aboutPage.profileTitle')}
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#64748B] sm:text-base">
              {t('aboutPage.profileIntro')}
            </p>
          </div>

          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MILESTONES.map((item, index) => {
              const Icon = item.icon
              return (
                <li
                  key={item.id}
                  className="relative overflow-hidden rounded-2xl border border-black/10 bg-white p-5 sm:p-6"
                >
                  <div className="absolute inset-y-0 start-0 w-1 bg-[#85E307]" aria-hidden />
                  <div className="flex items-start gap-4 ps-2">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <div className="min-w-0">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold tabular-nums text-[#94A3B8]">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-sm font-bold text-[#0B0F19] sm:text-base">
                          {t(`aboutPage.milestones.${item.id}.title`)}
                        </h3>
                      </div>
                      <p className="text-sm leading-relaxed text-[#64748B]">
                        {t(`aboutPage.milestones.${item.id}.body`)}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#ECFCCB] text-[#3F6F00]">
                <Smartphone className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-sm font-bold text-[#0B0F19]">{t('aboutPage.digitalChannelTitle')}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#64748B]">
                  {t('aboutPage.digitalChannelBody')}
                </p>
              </div>
            </div>
            <Link
              to="/products"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-black/10 bg-[#F9F9FA] px-4 py-2.5 text-sm font-semibold text-[#0B0F19] transition hover:bg-[#ECFCCB]"
            >
              {t('aboutPage.ctaShop')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-black/5 bg-white">
        <div className="page-shell page-section--roomy">
          <div className="mb-8 max-w-2xl">
            <p className="page-kicker">{t('aboutPage.offeringsKicker')}</p>
            <h2 className="type-section-title text-[#0B0F19] sm:text-3xl">
              {t('aboutPage.offeringsTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#64748B] sm:text-base">
              {t('aboutPage.offeringsIntro')}
            </p>
          </div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {OFFERINGS.map((id) => (
              <li
                key={id}
                className="rounded-xl border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-[#0B0F19]"
              >
                {t(`aboutPage.offerings.${id}`)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-black/5 bg-white">
        <div className="page-shell page-section--roomy">
          <div className="mb-8 max-w-2xl">
            <p className="page-kicker">{t('aboutPage.clientsKicker')}</p>
            <h2 className="type-section-title text-[#0B0F19] sm:text-3xl">
              {t('aboutPage.clientsTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#64748B] sm:text-base">
              {t('aboutPage.clientsIntro')}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {CLIENTS.map((id) => (
              <div
                key={id}
                className="flex items-start gap-2.5 rounded-xl border border-black/10 bg-[#F9F9FA] px-3.5 py-3"
              >
                <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-[#3F6F00]" strokeWidth={1.75} aria-hidden />
                <span className="text-sm font-medium leading-snug text-[#0B0F19]">
                  {t(`aboutPage.clients.${id}`)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AboutPartnersSection />

      <AboutSecurityAdvantageSection />

      <section className="bg-[#F9F9FA]">
        <div className="page-shell page-section--roomy">
          <div className="mb-8 max-w-2xl">
            <p className="page-kicker">{t('aboutPage.valuesKicker')}</p>
            <h2 className="type-section-title text-[#0B0F19] sm:text-3xl">
              {t('aboutPage.valuesTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#64748B] sm:text-base">
              {t('aboutPage.valuesIntro')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-black/10 bg-black/10">
            {PILLARS.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={item.id} className="bg-white p-4 sm:p-8">
                  <div className="mb-3 flex items-center gap-2 sm:mb-5 sm:gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307] sm:h-10 sm:w-10">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={1.75} />
                    </span>
                    <span className="font-mono text-[10px] font-semibold tabular-nums tracking-wider text-[#94A3B8] sm:text-[11px]">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="type-card-title mb-1.5 text-sm text-[#0B0F19] sm:mb-2.5 sm:text-base">
                    {t(`aboutPage.v.${item.id}.title`)}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#64748B] sm:max-w-md sm:text-sm">
                    {t(`aboutPage.v.${item.id}.description`)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-black/5 bg-white">
        <div className="page-shell page-section--roomy">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] p-7 text-white sm:p-8">
              <div className="pointer-events-none absolute -end-16 -top-16 h-48 w-48 rounded-full bg-[#85E307]/15 blur-3xl" />
              <p className="page-kicker text-[#85E307]">{t('aboutPage.missionKicker')}</p>
              <h3 className="type-section-title relative mb-3 sm:text-2xl">
                {t('aboutPage.missionTitle')}
              </h3>
              <p className="relative text-sm leading-relaxed text-white/70 sm:text-base">
                {t('aboutPage.missionBody')}
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-[#F9F9FA] p-7 sm:p-8">
              <p className="page-kicker">{t('aboutPage.visionKicker')}</p>
              <h3 className="type-section-title mb-3 text-[#0B0F19] sm:text-2xl">
                {t('aboutPage.visionTitle')}
              </h3>
              <p className="text-sm leading-relaxed text-[#64748B] sm:text-base">
                {t('aboutPage.visionBody')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="commercial-licence" className="scroll-mt-28 border-b border-black/5 bg-white">
        <div className="page-shell page-section--roomy">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-5">
              <p className="page-kicker">{t('aboutPage.licenceKicker')}</p>
              <h2 className="type-section-title text-[#0B0F19] sm:text-3xl">
                {t('aboutPage.licenceTitle')}
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#64748B] sm:text-base">
                {t('aboutPage.licenceBody')}
              </p>
              <div className="about-licence-number mt-6 inline-flex max-w-full items-center gap-3 rounded-xl border border-black/10 bg-[var(--site-bg-muted)] px-4 py-3.5">
                <HeroTrustIcon id="licence" size="md" className="mt-0" />
                <p className="text-sm font-semibold leading-snug text-[#0C1512] sm:text-base">
                  {t('home.heroTrust.licenseNo')} {GS_BUSINESS.commercialLicenseNo}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:col-span-7">
              <div className="about-trust-card rounded-2xl border border-black/10 bg-[var(--site-bg-muted)] p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <HeroTrustIcon id="moci" size="md" className="mt-0.5" />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#0B0F19] sm:text-base">
                      {t('aboutPage.licenceMociTitle')}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                      {t('aboutPage.licenceMociBody')}
                    </p>
                  </div>
                </div>
              </div>
              <div className="about-trust-card rounded-2xl border border-black/10 bg-[var(--site-bg-muted)] p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307]">
                    <Shield className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-[#0B0F19] sm:text-base">
                      {t('aboutPage.licenceTradeTitle')}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
                      {t('aboutPage.licenceTradeBody')}
                    </p>
                    <p className="mt-3 text-sm font-semibold text-[#0C1512]">
                      {t('home.heroTrust.licenseNo')} {GS_BUSINESS.commercialLicenseNo}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <HeroTrustStrip />
        </div>
      </section>

      <section className="storefront-static-page__tail pb-14 sm:pb-16">
        <div className="page-shell">
          <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] px-5 py-8 sm:px-10 sm:py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_100%_0%,rgba(133,227,7,0.16),transparent_55%)]" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-xl">
                <p className="page-kicker text-[#85E307]">{t('aboutPage.ctaKicker')}</p>
                <h2 className="type-section-title text-white sm:text-3xl">
                  {t('aboutPage.ctaTitle')}
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/65 sm:text-base">
                  {t('aboutPage.ctaBody')}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link to="/prices" className="gold-button inline-flex w-full items-center justify-center gap-2 sm:w-auto">
                  {t('aboutPage.ctaPrices')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Link>
                <Link
                  to="/branches"
                  className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
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
