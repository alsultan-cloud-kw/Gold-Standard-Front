import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCombinedLegalClauses } from '../content/legalDocs'
import { GS_CONTACT } from '@/constants/contact'

export default function TermsOfServiceAndPrivacyPolicyPage() {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const clauses = getCombinedLegalClauses(i18n.language)

  return (
    <div className="min-h-screen bg-[#F9F9FA]" dir={isRtl ? 'rtl' : 'ltr'}>
      <section className="border-b border-black/5 bg-white">
        <div className="page-shell page-shell--reading py-12 sm:py-16">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
            {t('legal.combined.kicker')}
          </p>
          <h1 className="type-page-title text-[#0B0F19] sm:text-4xl">
            {t('legal.combined.pageTitle')}
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#64748B]">
            {t('legal.combined.subtitle')}
          </p>
          <p className="mt-4 text-sm text-[#64748B]">
            {t('legal.combined.contactHint')}{' '}
            <a
              href={`mailto:${GS_CONTACT.email}`}
              className="font-semibold text-[#3F6F00] hover:underline"
            >
              {GS_CONTACT.email}
            </a>
          </p>
        </div>
      </section>

      <div className="page-shell page-shell--reading py-10 sm:py-12">
        <ol className="m-0 list-none space-y-3 p-0">
          {clauses.map((clause, index) => (
            <li
              key={index}
              className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6"
            >
              <div className="mb-2 flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0B0F19] font-mono text-xs font-bold text-[#85E307]">
                  {index + 1}
                </span>
                {clause.title ? (
                  <h2 className="pt-1 text-base font-bold leading-snug text-[#0B0F19] sm:text-lg">
                    {clause.title}
                  </h2>
                ) : null}
              </div>
              <p className="m-0 whitespace-pre-line ps-11 text-sm leading-[1.75] text-[#475569]">
                {clause.text}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-8 flex flex-wrap gap-4 border-t border-black/10 pt-6 text-sm">
          <Link
            to="/data-deletion"
            className="font-semibold text-[#3F6F00] hover:underline"
          >
            {t('legal.combined.dataDeletionLink')}
          </Link>
          <Link to="/contact" className="font-semibold text-[#3F6F00] hover:underline">
            {t('legal.combined.contactLink')}
          </Link>
        </div>
      </div>
    </div>
  )
}
