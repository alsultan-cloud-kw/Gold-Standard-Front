import { useMemo, useState, type FormEvent } from 'react'
import { Link, Navigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Languages } from 'lucide-react'
import { productsApi } from '@/services/api'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { CertificateOfOwnership } from '@/components/passport/CertificateOfOwnership'
import { OwnershipJourney } from '@/components/passport/OwnershipJourney'
import { usePageEnter } from '@/motion/usePageEnter'

export default function DigitalPassportPage() {
  const { t, i18n } = useTranslation()
  const [searchParams, setSearchParams] = useSearchParams()
  const codeParam = (searchParams.get('code') || searchParams.get('q') || '').trim()
  const [manualCode, setManualCode] = useState(codeParam)
  const [langOverride, setLangOverride] = useState<'en' | 'ar' | null>(null)
  const rootRef = usePageEnter()

  const lang: 'en' | 'ar' = langOverride ?? (i18n.language.startsWith('ar') ? 'ar' : 'en')
  const rtl = lang === 'ar'

  const { data, isLoading, isError } = useQuery({
    queryKey: ['digitalPassport', codeParam],
    queryFn: () => productsApi.getDigitalPassport(codeParam),
    enabled: Boolean(codeParam),
  })

  const verifyUrl = useMemo(() => {
    if (data?.blockchain?.gsw3_verify_url) return data.blockchain.gsw3_verify_url
    if (typeof window !== 'undefined' && codeParam) {
      return `${window.location.origin}/verify/passport?code=${encodeURIComponent(codeParam)}`
    }
    return null
  }, [data, codeParam])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const next = manualCode.trim()
    if (next) setSearchParams({ code: next })
  }

  if (!codeParam) {
    return (
      <div ref={rootRef as React.RefObject<HTMLDivElement>} className="min-h-[70vh] bg-gradient-to-b from-lime-50/60 via-white to-white py-12" dir={rtl ? 'rtl' : 'ltr'}>
        <div className="page-shell max-w-lg">
          <h1 className="text-2xl font-bold text-[#0B0F19]">{t('passport.pageTitle')}</h1>
          <p className="mt-2 text-sm text-stone-600">{t('passport.pageSubtitle')}</p>
          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder={t('passport.codePlaceholder')}
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm"
            />
            <button type="submit" className="w-full rounded-xl bg-[#85E307] py-3 text-sm font-bold text-[#0B0F19]">
              {t('passport.submit')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return <AppLoadingScreen variant="fullscreen" message={t('passport.loading')} />
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-600" />
          <p className="mt-3 text-sm text-stone-600">{t('passport.loadError')}</p>
          <Link to="/verify/passport" className="mt-4 inline-block text-sm font-medium text-[#3F6F00]">
            {t('passport.tryAgain')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div ref={rootRef as React.RefObject<HTMLDivElement>} className="min-h-[70vh] bg-gradient-to-b from-lime-50/40 via-[#FFFBF5] to-white py-8 sm:py-12" dir={rtl ? 'rtl' : 'ltr'}>
      <div className="page-shell max-w-3xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link to="/" className="text-sm text-stone-500 hover:text-[#3F6F00]">
            ← {t('passport.backHome')}
          </Link>
          <button
            type="button"
            onClick={() => setLangOverride(lang === 'ar' ? 'en' : 'ar')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700"
          >
            <Languages className="h-3.5 w-3.5" />
            {lang === 'ar' ? 'English' : 'العربية'}
          </button>
        </div>

        {!data.verified && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {lang === 'ar' ? data.message_ar : data.message_en}
          </div>
        )}

        <CertificateOfOwnership data={data} lang={lang} verifyUrl={verifyUrl} />
        <OwnershipJourney data={data} lang={lang} />
      </div>
    </div>
  )
}

/** Legacy /verify/unit?code= → passport */
export function VerifyUnitRedirect() {
  const [searchParams] = useSearchParams()
  const code = searchParams.get('code') || searchParams.get('q') || ''
  return <Navigate to={`/verify/passport?code=${encodeURIComponent(code)}`} replace />
}
