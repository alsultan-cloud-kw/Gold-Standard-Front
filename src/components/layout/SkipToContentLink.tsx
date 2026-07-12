import { useTranslation } from 'react-i18next'

/** First focusable control for keyboard / screen-reader users (WCAG 2.4.1). */
export default function SkipToContentLink() {
  const { t } = useTranslation()
  return (
    <a href="#main-content" className="skip-to-content">
      {t('common.skipToContent')}
    </a>
  )
}
