import { useTranslation } from 'react-i18next'
import { GS_CONTACT } from '@/constants/contact'

/** Help line on auth pages — professional support email + phone. */
export function AuthSupportFooter() {
  const { t } = useTranslation()

  return (
    <p className="text-xs leading-relaxed text-[#94A3B8]">
      {t('auth.supportLine')}{' '}
      <a
        href={`mailto:${GS_CONTACT.email}`}
        className="font-semibold text-[#64748B] hover:text-[#0B0F19]"
      >
        {GS_CONTACT.email}
      </a>
      {' · '}
      <a
        href={`tel:${GS_CONTACT.phoneTel}`}
        className="font-semibold text-[#64748B] hover:text-[#0B0F19]"
        dir="ltr"
      >
        {GS_CONTACT.phone}
      </a>
    </p>
  )
}
