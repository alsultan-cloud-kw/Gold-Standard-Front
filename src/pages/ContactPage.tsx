import { useCallback, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Instagram,
  ArrowRight,
  MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import TurnstileWidget, { type TurnstileWidgetHandle } from '@/components/auth/TurnstileWidget'
import { GS_CONTACT } from '@/constants/contact'
import { GS_INSTAGRAM } from '@/constants/social'
import { isTurnstileConfigured } from '@/lib/turnstile'
import { contactApi } from '@/services/api'
import { RevealSection } from '@/components/motion/RevealSection'
import { usePageEnter } from '@/motion/usePageEnter'

const fieldClass =
  'contact-form-field w-full rounded-xl border border-black/10 bg-[var(--site-bg-muted)] px-4 py-3 text-sm font-medium text-[#0B0F19] outline-none transition placeholder:text-[#94A3B8] focus:border-[#85E307] focus:bg-white focus:ring-2 focus:ring-[#85E307]/25'

const fieldErrorClass =
  'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-500/20'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type ContactFormData = {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

type ContactField = keyof ContactFormData

type ContactFieldErrors = Partial<Record<ContactField, string>>

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function validateContactForm(
  data: ContactFormData,
  t: (key: string) => string,
): ContactFieldErrors {
  const errors: ContactFieldErrors = {}
  const name = data.name.trim()
  const email = data.email.trim()
  const phone = data.phone.trim()
  const subject = data.subject.trim()
  const message = data.message.trim()

  if (!name) {
    errors.name = t('contactPage.validation.nameRequired')
  } else if (name.length < 2) {
    errors.name = t('contactPage.validation.nameMin')
  } else if (name.length > 120) {
    errors.name = t('contactPage.validation.nameMax')
  }

  if (!email) {
    errors.email = t('contactPage.validation.emailRequired')
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = t('contactPage.validation.emailInvalid')
  }

  if (phone && digitsOnly(phone).length < 7) {
    errors.phone = t('contactPage.validation.phoneInvalid')
  }

  if (!subject) {
    errors.subject = t('contactPage.validation.subjectRequired')
  } else if (subject.length < 3) {
    errors.subject = t('contactPage.validation.subjectMin')
  } else if (subject.length > 200) {
    errors.subject = t('contactPage.validation.subjectMax')
  }

  if (!message) {
    errors.message = t('contactPage.validation.messageRequired')
  } else if (message.length < 10) {
    errors.message = t('contactPage.validation.messageMin')
  } else if (message.length > 5000) {
    errors.message = t('contactPage.validation.messageMax')
  }

  return errors
}

function mapApiFieldErrors(data: Record<string, unknown>): ContactFieldErrors {
  const errors: ContactFieldErrors = {}
  for (const [field, value] of Object.entries(data)) {
    if (field === 'error' || field === 'detail' || field === 'non_field_errors') continue
    if (!['name', 'email', 'phone', 'subject', 'message'].includes(field)) continue
    const message = Array.isArray(value) ? value[0] : value
    if (typeof message === 'string' && message.trim()) {
      errors[field as ContactField] = message
    }
  }
  return errors
}

export default function ContactPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const heroRef = usePageEnter()
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [turnstileToken, setTurnstileToken] = useState('')
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)

  const clearTurnstile = useCallback(() => {
    setTurnstileToken('')
    turnstileRef.current?.reset()
  }, [])

  const handleTurnstileError = useCallback(() => {
    clearTurnstile()
    toast.error(t('auth.captchaFailed'))
  }, [clearTurnstile, t])

  const address = isAr ? GS_CONTACT.addressAr : GS_CONTACT.addressEn

  const contactCards = useMemo(
    () => [
      {
        icon: MapPin,
        titleKey: 'contactPage.address' as const,
        content: address,
        href: GS_CONTACT.googleMapsDirectionsUrl,
      },
      {
        icon: Phone,
        titleKey: 'contactPage.phone' as const,
        content: GS_CONTACT.phone,
        href: `tel:${GS_CONTACT.phoneTel}`,
      },
      {
        icon: Mail,
        titleKey: 'contactPage.email' as const,
        content: GS_CONTACT.email,
        href: `mailto:${GS_CONTACT.email}`,
      },
      {
        icon: Clock,
        titleKey: 'contactPage.hours' as const,
        content: null,
        href: null,
      },
    ],
    [address],
  )

  const updateField = (field: ContactField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const errors = validateContactForm(formData, t)
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      toast.error(t('contactPage.validation.formInvalid'))
      return
    }

    if (isTurnstileConfigured && !turnstileToken) {
      toast.error(t('auth.captchaRequired'))
      return
    }

    setSubmitting(true)

    try {
      await contactApi.sendMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        turnstile_token: turnstileToken || undefined,
      })

      toast.success(t('contactPage.toastSuccess'), {
        description: t('contactPage.toastSuccessDesc'),
        duration: 3500,
      })

      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setFieldErrors({})
      clearTurnstile()
    } catch (err: unknown) {
      clearTurnstile()
      const res = (err as { response?: { status?: number; data?: Record<string, unknown> } })
        ?.response
      const data = res?.data

      if (res?.status === 400 && data?.error === 'captcha_failed') {
        toast.error(t('auth.captchaFailed'))
        return
      }

      if (res?.status === 400 && data) {
        const apiErrors = mapApiFieldErrors(data)
        if (Object.keys(apiErrors).length > 0) {
          setFieldErrors(apiErrors)
          toast.error(t('contactPage.validation.formInvalid'))
          return
        }
      }

      if (res?.status === 429) {
        toast.error(t('contactPage.toastRateLimited'))
        return
      }

      if (
        res?.status === 503 &&
        (data?.error === 'email_unavailable' || data?.error === 'email_send_failed')
      ) {
        toast.error(t('contactPage.toastEmailUnavailable'))
        return
      }

      toast.error(t('contactPage.toastSendFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  const submitDisabled =
    submitting || (isTurnstileConfigured && !turnstileToken)

  const fieldInputClass = (field: ContactField) =>
    `${fieldClass}${fieldErrors[field] ? ` ${fieldErrorClass}` : ''}`

  return (
    <div className="storefront-static-page min-h-screen">
      {/* Hero */}
      <section
        ref={heroRef as React.RefObject<HTMLElement>}
        className="relative overflow-hidden border-b border-black/5 bg-white"
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/35 via-white to-white" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_0%_0%,rgba(133,227,7,0.1),transparent_55%)]" />
        </div>

        <div className="page-shell relative page-section--roomy">
          <p className="page-kicker" data-motion="enter">{t('contactPage.kicker')}</p>
          <h1 className="type-page-title max-w-2xl text-[#0B0F19]" data-motion="enter">
            {t('contactPage.title')}
          </h1>
          <p className="type-lead mt-4 max-w-xl text-[#64748B]" data-motion="enter">
            {t('contactPage.subtitle')}
          </p>
        </div>
      </section>

      <RevealSection as="div" className="page-shell page-section--roomy storefront-static-page__tail" y="md">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Sidebar info */}
          <aside className="space-y-4 lg:col-span-4">
            {contactCards.map((info) => {
              const Icon = info.icon
              const body =
                info.titleKey === 'contactPage.hours' ? (
                  <span className="block space-y-1">
                    <span className="block">{t('footer.hoursWeekday')}</span>
                    <span className="block text-[#64748B]">{t('footer.hoursFriday')}</span>
                  </span>
                ) : (
                  info.content
                )

              const inner = (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B0F19] text-[#85E307]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="page-kicker !mb-0 !text-[10px]">
                      {t(info.titleKey)}
                    </h3>
                    <p className="mt-1 text-sm font-medium leading-relaxed text-[#0B0F19]">
                      {body}
                    </p>
                  </div>
                </>
              )

              if (info.href) {
                return (
                  <a
                    key={info.titleKey}
                    href={info.href}
                    className="motion-card flex items-start gap-4 rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-[#85E307]/40 hover:bg-[#ECFCCB]/25"
                  >
                    {inner}
                  </a>
                )
              }

              return (
                <div
                  key={info.titleKey}
                  className="motion-card flex items-start gap-4 rounded-2xl border border-black/10 bg-white p-5"
                >
                  {inner}
                </div>
              )
            })}

            <a
              href={GS_INSTAGRAM.url}
              target="_blank"
              rel="noopener noreferrer"
              className="motion-card group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-[#85E307]/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white">
                <Instagram className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="page-kicker !mb-0 !text-[10px]">
                  {t('contactPage.social')}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#0B0F19] group-hover:text-[#3F6F00]">
                  {GS_INSTAGRAM.handle}
                </p>
              </div>
            </a>

            <div className="rounded-2xl bg-[#0B0F19] p-5 text-white">
                <p className="page-kicker text-[#85E307]">{t('contactPage.visitKicker')}</p>
              <p className="text-sm leading-relaxed text-white/70">
                {t('contactPage.visitBody')}
              </p>
              <Link
                to="/branches"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#85E307] hover:text-[#ECFCCB]"
              >
                {t('contactPage.viewBranches')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
            </div>
          </aside>

          {/* Form */}
          <div className="lg:col-span-8">
            <div className="motion-card rounded-2xl border border-black/10 bg-white p-4 shadow-sm sm:p-8">
              <div className="mb-6 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ECFCCB] text-[#3F6F00]">
                  <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h2 className="type-section-title text-[#0B0F19]">
                    {t('contactPage.formTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-[#64748B]">{t('contactPage.formHint')}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-1.5 block text-sm font-semibold text-[#0B0F19]"
                    >
                      {t('contactPage.name')}
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      className={fieldInputClass('name')}
                      autoComplete="name"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? 'contact-name-error' : undefined}
                    />
                    {fieldErrors.name ? (
                      <p id="contact-name-error" className="mt-1.5 text-xs font-medium text-red-600">
                        {fieldErrors.name}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-1.5 block text-sm font-semibold text-[#0B0F19]"
                    >
                      {t('contactPage.emailLabel')}
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      className={fieldInputClass('email')}
                      autoComplete="email"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={fieldErrors.email ? 'contact-email-error' : undefined}
                    />
                    {fieldErrors.email ? (
                      <p id="contact-email-error" className="mt-1.5 text-xs font-medium text-red-600">
                        {fieldErrors.email}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-phone"
                      className="mb-1.5 block text-sm font-semibold text-[#0B0F19]"
                    >
                      {t('contactPage.phoneLabel')}
                      <span className="ms-1 font-normal text-[#94A3B8]">
                        ({t('contactPage.optional')})
                      </span>
                    </label>
                    <input
                      id="contact-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                      className={fieldInputClass('phone')}
                      autoComplete="tel"
                      placeholder="+965 …"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={fieldErrors.phone ? 'contact-phone-error' : undefined}
                    />
                    {fieldErrors.phone ? (
                      <p id="contact-phone-error" className="mt-1.5 text-xs font-medium text-red-600">
                        {fieldErrors.phone}
                      </p>
                    ) : null}
                  </div>
                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="mb-1.5 block text-sm font-semibold text-[#0B0F19]"
                    >
                      {t('contactPage.subject')}
                    </label>
                    <input
                      id="contact-subject"
                      type="text"
                      value={formData.subject}
                      onChange={(e) => updateField('subject', e.target.value)}
                      className={fieldInputClass('subject')}
                      aria-invalid={Boolean(fieldErrors.subject)}
                      aria-describedby={fieldErrors.subject ? 'contact-subject-error' : undefined}
                    />
                    {fieldErrors.subject ? (
                      <p
                        id="contact-subject-error"
                        className="mt-1.5 text-xs font-medium text-red-600"
                      >
                        {fieldErrors.subject}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-1.5 block text-sm font-semibold text-[#0B0F19]"
                  >
                    {t('contactPage.message')}
                  </label>
                  <textarea
                    id="contact-message"
                    value={formData.message}
                    onChange={(e) => updateField('message', e.target.value)}
                    rows={6}
                    className={`${fieldInputClass('message')} resize-y min-h-[140px]`}
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? 'contact-message-error' : undefined}
                  />
                  {fieldErrors.message ? (
                    <p id="contact-message-error" className="mt-1.5 text-xs font-medium text-red-600">
                      {fieldErrors.message}
                    </p>
                  ) : null}
                </div>

                <TurnstileWidget
                  ref={turnstileRef}
                  onToken={setTurnstileToken}
                  onExpire={clearTurnstile}
                  onError={handleTurnstileError}
                />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-[#64748B]">
                    {t('contactPage.privacyNote')}
                  </p>
                  <button
                    type="submit"
                    disabled={submitDisabled}
                    className="gold-button inline-flex w-full shrink-0 items-center justify-center gap-2 shadow-md disabled:opacity-70 sm:w-auto"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? t('contactPage.sending') : t('contactPage.sendMessage')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </RevealSection>
    </div>
  )
}
