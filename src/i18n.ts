import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import ar from './locales/ar.json'

const resources = {
  en: { translation: en },
  ar: { translation: ar },
}

const DEFAULT_LANG = 'en'
const ARABIC_CODE = 'ar'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANG,
    supportedLngs: ['en', 'ar'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'app_lang',
    },
  })

/** Set document dir and lang for RTL (Arabic). Call when language changes. */
export function applyLanguageToDocument(lng: string) {
  const isRtl = lng === ARABIC_CODE
  const html = document.documentElement
  html.setAttribute('lang', isRtl ? 'ar' : 'en')
  html.setAttribute('dir', isRtl ? 'rtl' : 'ltr')
}

i18n.on('languageChanged', applyLanguageToDocument)
applyLanguageToDocument(i18n.language || DEFAULT_LANG)

export const isRtl = () => (i18n.language || '').startsWith('ar')
export default i18n
