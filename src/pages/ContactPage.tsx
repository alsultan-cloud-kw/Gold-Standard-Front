import { useMemo, useState } from 'react'
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
import { GS_CONTACT } from '@/constants/contact'
import { GS_INSTAGRAM } from '@/constants/social'

const fieldClass =
  'w-full rounded-xl border border-black/10 bg-[#F9F9FA] px-4 py-3 text-sm font-medium text-[#0B0F19] outline-none transition placeholder:text-[#94A3B8] focus:border-[#85E307] focus:bg-white focus:ring-2 focus:ring-[#85E307]/25'

export default function ContactPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const address = isAr ? GS_CONTACT.addressAr : GS_CONTACT.addressEn

  const contactCards = useMemo(
    () => [
      {
        icon: MapPin,
        titleKey: 'contactPage.address' as const,
        content: address,
        href: null as string | null,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const subject = encodeURIComponent(
      formData.subject.trim() || t('contactPage.defaultSubject'),
    )
    const body = encodeURIComponent(
      [
        `${t('contactPage.name')}: ${formData.name.trim()}`,
        `${t('contactPage.emailLabel')}: ${formData.email.trim()}`,
        formData.phone.trim()
          ? `${t('contactPage.phoneLabel')}: ${formData.phone.trim()}`
          : null,
        '',
        formData.message.trim(),
      ]
        .filter(Boolean)
        .join('\n'),
    )

    window.location.href = `mailto:${GS_CONTACT.email}?subject=${subject}&body=${body}`

    toast.success(t('contactPage.toastSuccess'), {
      description: t('contactPage.toastSuccessDesc'),
      duration: 3500,
    })

    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
    window.setTimeout(() => setSubmitting(false), 600)
  }

  return (
    <div className="min-h-screen bg-[#F9F9FA]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-black/5 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/35 via-white to-white" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_0%_0%,rgba(133,227,7,0.1),transparent_55%)]" />
        </div>

        <div className="page-shell relative py-12 sm:py-16">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
            {t('contactPage.kicker')}
          </p>
          <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-[#0B0F19] sm:text-4xl">
            {t('contactPage.title')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#64748B]">
            {t('contactPage.subtitle')}
          </p>
        </div>
      </section>

      <div className="page-shell py-10 sm:py-14">
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
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#3F6F00]">
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
                    className="flex items-start gap-4 rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-[#85E307]/40 hover:bg-[#ECFCCB]/25"
                  >
                    {inner}
                  </a>
                )
              }

              return (
                <div
                  key={info.titleKey}
                  className="flex items-start gap-4 rounded-2xl border border-black/10 bg-white p-5"
                >
                  {inner}
                </div>
              )
            })}

            <a
              href={GS_INSTAGRAM.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-black/10 bg-white p-5 transition-colors hover:border-[#85E307]/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white">
                <Instagram className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#3F6F00]">
                  {t('contactPage.social')}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#0B0F19] group-hover:text-[#3F6F00]">
                  {GS_INSTAGRAM.handle}
                </p>
              </div>
            </a>

            <div className="rounded-2xl bg-[#0B0F19] p-5 text-white">
              <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#85E307]">
                {t('contactPage.visitKicker')}
              </p>
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
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="mb-6 flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#ECFCCB] text-[#3F6F00]">
                  <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#0B0F19]">
                    {t('contactPage.formTitle')}
                  </h2>
                  <p className="mt-1 text-sm text-[#64748B]">{t('contactPage.formHint')}</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#0B0F19]">
                      {t('contactPage.name')}
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={fieldClass}
                      autoComplete="name"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#0B0F19]">
                      {t('contactPage.emailLabel')}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={fieldClass}
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#0B0F19]">
                      {t('contactPage.phoneLabel')}
                      <span className="ms-1 font-normal text-[#94A3B8]">
                        ({t('contactPage.optional')})
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={fieldClass}
                      autoComplete="tel"
                      placeholder="+965 …"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#0B0F19]">
                      {t('contactPage.subject')}
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#0B0F19]">
                    {t('contactPage.message')}
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    className={`${fieldClass} resize-y min-h-[140px]`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-relaxed text-[#64748B]">
                    {t('contactPage.privacyNote')}
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="gold-button inline-flex shrink-0 items-center justify-center gap-2 shadow-md disabled:opacity-70"
                  >
                    <Send className="h-4 w-4" />
                    {submitting ? t('contactPage.sending') : t('contactPage.sendMessage')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
