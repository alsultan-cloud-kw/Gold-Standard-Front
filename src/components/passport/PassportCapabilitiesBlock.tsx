import { useTranslation } from 'react-i18next'

export function PassportCapabilitiesBlock({ className }: { className?: string }) {
  const { t } = useTranslation()
  const items = t('passport.capabilitiesItems', { returnObjects: true }) as string[]

  if (!Array.isArray(items) || items.length === 0) return null

  return (
    <section
      className={
        className ??
        'mt-6 rounded-xl border border-[#C9B87A]/35 bg-white/80 px-4 py-4 sm:px-5'
      }
    >
      <h3 className="text-sm font-bold text-[#0B0F19]">{t('passport.capabilitiesTitle')}</h3>
      <ul className="mt-3 list-disc space-y-2 ps-5 text-sm leading-relaxed text-[#475569]">
        {items.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-relaxed text-[#64748B]">
        {t('passport.capabilitiesDisclaimer')}
      </p>
    </section>
  )
}
