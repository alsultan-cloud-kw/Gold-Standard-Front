import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const SECURITY_ITEMS = [
  'insuredShipping',
  'mociHallmark',
  'knetCheckout',
  'licensedDealer',
  'serialCatalog',
  'livePricing',
] as const

export function SecurityTrustSection() {
  const { t } = useTranslation()

  return (
    <section className="home-section" id="security-trust">
      <div className="home-section-inner">
        <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] px-6 py-[var(--space-block)] sm:px-8 sm:py-[var(--space-8)] lg:px-10 lg:py-[var(--space-10)]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_100%_0%,rgba(133,227,7,0.12),transparent_55%)]" />

          <div className="relative grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-14">
            <div className="lg:col-span-5 xl:col-span-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#85E307]">
                {t('home.securityTrust.kicker')}
              </p>
              <h2 className="type-section-title mb-4 text-white sm:text-3xl">
                {t('home.securityTrust.title')}
              </h2>
              <p className="type-lead max-w-md text-white/65 sm:text-base">
                {t('home.securityTrust.body')}
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7 xl:col-span-8">
              {SECURITY_ITEMS.map((id) => (
                <li
                  key={id}
                  className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#85E307]/15">
                    <Check className="h-3.5 w-3.5 text-[#85E307]" strokeWidth={3} aria-hidden />
                  </span>
                  <span className="text-sm font-semibold leading-snug text-white">
                    {t(`home.securityTrust.items.${id}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
