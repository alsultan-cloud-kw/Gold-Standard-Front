import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Mail, ArrowRight, Shield } from 'lucide-react'
import { GS_CONTACT } from '@/constants/contact'

export default function DataDeletionPage() {
  const { t } = useTranslation()

  const sections = [
    'how',
    'verify',
    'timeline',
    'deleted',
    'retained',
    'meta',
    'contact',
  ] as const

  return (
    <div className="min-h-screen bg-[#F9F9FA]">
      <section className="border-b border-black/5 bg-white">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
            {t('dataDeletionPage.kicker')}
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#0B0F19] sm:text-4xl">
            {t('dataDeletionPage.title')}
          </h1>
          <p className="mt-3 text-sm text-[#64748B]">{t('dataDeletionPage.effective')}</p>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-[#64748B]">
            {t('dataDeletionPage.intro')}
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="space-y-4">
          {sections.map((id, index) => (
            <section
              key={id}
              className="rounded-2xl border border-black/10 bg-white p-5 sm:p-6"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0B0F19] font-mono text-xs font-bold text-[#85E307]">
                  {index + 1}
                </span>
                <h2 className="text-base font-bold text-[#0B0F19] sm:text-lg">
                  {t(`dataDeletionPage.${id}.title`)}
                </h2>
              </div>
              <div className="ps-11 text-sm leading-relaxed text-[#475569] whitespace-pre-line">
                {t(`dataDeletionPage.${id}.body`, { email: GS_CONTACT.email })}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 rounded-2xl bg-[#0B0F19] p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-white">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-[#85E307]" />
            <div>
              <p className="font-semibold">{t('dataDeletionPage.ctaTitle')}</p>
              <p className="mt-1 text-sm text-white/65">{t('dataDeletionPage.ctaBody')}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <a
              href={`mailto:${GS_CONTACT.email}?subject=${encodeURIComponent(t('dataDeletionPage.emailSubject'))}`}
              className="gold-button inline-flex items-center justify-center gap-2"
            >
              <Mail className="h-4 w-4" />
              {t('dataDeletionPage.emailUs')}
            </a>
            <Link
              to="/terms-and-privacy"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              {t('dataDeletionPage.viewTerms')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
