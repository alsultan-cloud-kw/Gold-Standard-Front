import { useTranslation } from 'react-i18next'

const FAQ_KEYS = ['q1', 'q2', 'q3', 'q4'] as const

/** Kuwait PAA-aligned FAQ for /prices — visible copy + FAQPage JSON-LD via RouteSeo. */
export function PricesFaqSection() {
  const { t } = useTranslation()

  return (
    <section
      id="prices-faq"
      className="scroll-mt-[calc(var(--nav-offset)+0.75rem)] rounded-2xl border border-black/5 bg-white px-4 py-6 sm:px-6 sm:py-8"
      aria-labelledby="prices-faq-heading"
    >
      <h2 id="prices-faq-heading" className="text-lg font-bold tracking-tight text-[#0B0F19] sm:text-xl">
        {t('pricesPage.faqTitle')}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#64748B]">{t('pricesPage.faqIntro')}</p>
      <dl className="mt-5 space-y-4">
        {FAQ_KEYS.map((key) => (
          <div key={key} className="border-t border-black/5 pt-4 first:border-t-0 first:pt-0">
            <dt className="text-sm font-semibold text-[#0B0F19] sm:text-base">
              {t(`pricesPage.faq.${key}`)}
            </dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-[#475569]">
              {t(`pricesPage.faq.${key.replace('q', 'a')}`)}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function pricesFaqEntries(t: (key: string) => string) {
  return FAQ_KEYS.map((key) => ({
    question: t(`pricesPage.faq.${key}`),
    answer: t(`pricesPage.faq.${key.replace('q', 'a')}`),
  }))
}
