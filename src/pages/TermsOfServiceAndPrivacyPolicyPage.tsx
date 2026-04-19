import { useTranslation } from 'react-i18next'
import { getCombinedLegalClauses } from '../content/legalDocs'

export default function TermsOfServiceAndPrivacyPolicyPage() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const clauses = getCombinedLegalClauses(i18n.language)

  return (
    <div
      className="min-h-screen py-10 sm:py-14 bg-gradient-to-b from-lime-50/50 via-white to-white"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="product-card-lime mb-8 sm:mb-10 text-center sm:text-start rounded-2xl border-2 border-black/10 shadow-sm">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-black leading-tight">
            {t('legal.combined.pageTitle')}
          </h1>
          <p className="mt-2 text-sm sm:text-base font-semibold text-black/80 max-w-2xl mx-auto sm:mx-0">
            {t('legal.combined.subtitle')}
          </p>
        </header>

        <ol className="list-none space-y-4 sm:space-y-5 m-0 p-0">
          {clauses.map((clause, index) => (
            <li key={index} className="flex gap-3 sm:gap-4 items-start">
              <span
                className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full border-2 border-lime-500/90 bg-black text-xs sm:text-sm font-bold text-lime-300 shadow-sm"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="gold-card flex-1 rounded-2xl border-2 border-black/10 shadow-sm min-w-0">
                {clause.title ? (
                  <h2 className="text-base sm:text-lg font-bold text-black mb-2 leading-snug">{clause.title}</h2>
                ) : null}
                <p className="text-sm sm:text-[15px] text-stone-800 leading-[1.75] font-medium whitespace-pre-line m-0">
                  {clause.text}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
