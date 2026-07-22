import { ExternalLink, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { BullionFrame } from './BullionFrame'
import type { DigitalPassportResponse } from '@/services/api'
import { resolveGsw3RegistryUrl } from '@/lib/gsw3RegistryUrl'

function qrImageUrl(url: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(url)}&margin=8`
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' })
}

type Props = {
  data: DigitalPassportResponse
  lang: 'en' | 'ar'
  verifyUrl?: string | null
}

export function CertificateOfOwnership({ data, lang, verifyUrl }: Props) {
  const { t } = useTranslation()
  const rtl = lang === 'ar'
  const bar = data.bar
  const owner = data.ownership
  const chain = data.blockchain
  const registryUrl = resolveGsw3RegistryUrl(chain.gsw3_verify_url, chain.gsw3_bar_id)
  const scanUrl = verifyUrl || registryUrl || (typeof window !== 'undefined' ? window.location.href : '')

  const issueDate = formatDate(owner.owner_since || bar.production_date, lang === 'ar' ? 'ar-KW' : 'en-GB')

  return (
    <article
      className="certificate-of-ownership overflow-hidden rounded-2xl border border-[#C9B87A]/50 bg-[#FFFBF5] shadow-xl"
      dir={rtl ? 'rtl' : 'ltr'}
    >
      <header className="border-b border-[#C9B87A]/40 bg-[#0B0F19] px-4 py-4 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/brand/gold-standard-logo.svg" alt="Gold Standard" className="h-10 w-auto" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#85E307]">
                {t('passport.trustTagline')}
              </p>
            </div>
          </div>
          <div className="text-end">
            <p className="text-[10px] uppercase tracking-wide text-stone-400">{t('passport.certificateNo')}</p>
            <p className="font-mono text-sm font-bold text-white">{data.certificate_number}</p>
          </div>
        </div>
      </header>

      <div className="relative px-4 py-6 sm:px-8">
        <div className="absolute end-4 top-4 hidden sm:block">
          <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-[#85E307] bg-lime-50 text-center shadow-md">
            <ShieldCheck className="h-6 w-6 text-[#3F6F00]" />
            <span className="mt-1 px-1 text-[7px] font-bold uppercase leading-tight text-[#3F6F00]">
              {t('passport.registeredBadge')}
            </span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-xl font-bold text-[#0B0F19] sm:text-2xl">{data.passport_title_ar}</h1>
          <h2 className="mt-0.5 text-lg font-semibold uppercase tracking-wide text-[#8B6914]">
            {data.passport_title_en}
          </h2>
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-center text-sm leading-relaxed text-stone-600">
          {lang === 'ar' ? t('passport.introAr') : t('passport.introEn')}
        </p>
        <p className="mx-auto mt-2 max-w-2xl text-center text-xs leading-relaxed text-stone-500">
          {lang === 'ar' ? t('passport.introEn') : t('passport.introAr')}
        </p>

        <section className="mt-6 rounded-xl border border-[#C9B87A]/30 bg-white/80 p-4">
          <p className="text-center text-[10px] font-bold uppercase tracking-wider text-stone-500">
            {t('passport.ownerLabel')} · {lang === 'ar' ? 'OWNER NAME' : 'اسم المالك'}
          </p>
          <p className="mt-2 text-center text-lg font-bold text-[#0B0F19]">
            {owner.current_owner_name || '—'}
          </p>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              {t('passport.serialLabel')}
            </p>
            <p className="font-mono text-base font-bold text-[#0B0F19]">{bar.serial_number}</p>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { en: 'WEIGHT', ar: 'الوزن', val: lang === 'ar' ? bar.weight_display_ar : bar.weight_display_en },
                { en: 'PURITY', ar: 'النقاوة', val: bar.purity_display },
                { en: 'GOLD TYPE', ar: 'نوع الذهب', val: lang === 'ar' ? bar.gold_type_ar : bar.gold_type_en },
                { en: 'DATE OF ISSUE', ar: 'تاريخ الإصدار', val: issueDate },
              ].map((row) => (
                <div key={row.en} className="rounded-lg border border-stone-200 bg-white p-2.5 text-center">
                  <p className="text-[9px] font-bold uppercase text-stone-400">{row.en}</p>
                  <p className="text-[9px] text-stone-400">{row.ar}</p>
                  <p className="mt-1 text-xs font-semibold text-stone-900">{row.val}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 py-2">
                <span className="text-stone-500">{t('passport.recordId')}</span>
                <span className="font-mono font-semibold">{data.ownership_record_id}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 py-2">
                <span className="text-stone-500">{t('passport.packaging')}</span>
                <span>{lang === 'ar' ? bar.packaging_condition.label_ar : bar.packaging_condition.label_en}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2 border-b border-stone-100 py-2">
                <span className="text-stone-500">{t('passport.barStatus')}</span>
                <span>{lang === 'ar' ? bar.bar_condition.label_ar : bar.bar_condition.label_en}</span>
              </div>
              <div className="flex flex-wrap justify-between gap-2 py-2">
                <span className="text-stone-500">{t('passport.inspection')}</span>
                <span>{lang === 'ar' ? bar.inspection_cert.label_ar : bar.inspection_cert.label_en}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center gap-4">
            <BullionFrame
              productImageUrl={bar.product_image_url}
              serialNumber={bar.serial_number}
              weightGrams={bar.weight_grams}
              purityDisplay={bar.purity_display}
              altEn={`Gold bullion ${bar.serial_number}`}
              altAr={`سبيكة ذهب ${bar.serial_number}`}
              lang={lang}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center gap-4 border-t border-[#C9B87A]/30 pt-6 sm:flex-row sm:justify-center">
          <div className="text-center">
            <img src={qrImageUrl(scanUrl)} alt="QR" className="mx-auto h-36 w-36 rounded-lg border border-stone-200 bg-white p-1" />
            <p className="mt-2 text-xs font-bold uppercase text-stone-700">{t('passport.scanVerify')}</p>
            <p className="text-xs text-stone-500">{t('passport.scanVerifyAr')}</p>
          </div>
          <div className="text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-[#3F6F00]" />
            <p className="mt-2 text-sm font-bold text-[#3F6F00]">{t('passport.verifiedSecured')}</p>
            <p className="text-xs text-stone-600">{t('passport.verifiedSecuredAr')}</p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-stone-500">{t('passport.verifyFootnote')}</p>
        <p className="mt-1 text-center text-xs text-stone-400">{t('passport.verifyFootnoteAr')}</p>

        {registryUrl && (
          <a
            href={registryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-1 text-sm font-medium text-[#3F6F00] hover:underline"
          >
            {t('passport.blockchainLink')}
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>

      <footer className="flex flex-wrap items-end justify-between gap-4 border-t border-[#C9B87A]/40 bg-stone-50 px-4 py-5 sm:px-8">
        <div className="text-center sm:text-start">
          <p className="text-[10px] font-bold uppercase text-stone-500">{t('passport.authorizedSignature')}</p>
          <p className="mt-4 font-serif text-lg italic text-stone-700">Gold Standard</p>
        </div>
        <div className="flex flex-col items-center">
          <img
            src="/brand/gold-standard-stamp.png"
            alt={t('passport.companySeal')}
            className="h-20 w-20 object-contain sm:h-24 sm:w-24"
          />
          <p className="mt-1 text-[10px] font-bold uppercase text-stone-500">{t('passport.companySeal')}</p>
        </div>
        <div className="flex flex-col items-center gap-1 sm:items-end">
          <img src="/brand/w3c.svg" alt="W3C" className="h-8 w-8 opacity-90" />
          <p className="max-w-[180px] text-center text-[9px] leading-snug text-stone-500 sm:text-end">
            {t('passport.w3cNote')}
          </p>
        </div>
      </footer>

      <p className="bg-[#0B0F19] py-2 text-center text-[10px] font-bold uppercase tracking-[0.25em] text-[#C9B87A]">
        {t('passport.footerBrand')}
      </p>
    </article>
  )
}
