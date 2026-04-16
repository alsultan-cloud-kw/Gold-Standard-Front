import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

const fieldClass =
  'w-full px-4 py-3 bg-white border-2 border-black/15 rounded-lg text-black placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-lime-500 focus:border-black/30'

export default function ContactPage() {
  const { t } = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    toast.success(t('contactPage.toastSuccess'))
    setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
  }

  const contactInfo = [
    { icon: MapPin, titleKey: 'contactPage.address' as const, contentKey: 'contactPage.addressLine' as const },
    { icon: Phone, titleKey: 'contactPage.phone' as const, contentKey: 'contactPage.phoneLine' as const },
    { icon: Mail, titleKey: 'contactPage.email' as const, contentKey: 'contactPage.emailLine' as const },
    { icon: Clock, titleKey: 'contactPage.hours' as const, contentKey: 'contactPage.hoursLine' as const },
  ]

  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-lime-50/50 via-white to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">{t('contactPage.title')}</h1>
          <p className="text-stone-800 font-medium max-w-2xl mx-auto">{t('contactPage.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            {contactInfo.map((info, index) => (
              <div key={index} className="product-card-lime flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-yellow-300 border border-black/15 flex items-center justify-center shrink-0">
                  <info.icon className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black mb-1">{t(info.titleKey)}</h3>
                  <p className="text-sm text-black/80 leading-relaxed">{t(info.contentKey)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="product-card-lime">
              <h2 className="text-xl font-bold text-black mb-6">{t('contactPage.formTitle')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">{t('contactPage.name')}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className={fieldClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      {t('contactPage.emailLabel')}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">
                      {t('contactPage.phoneLabel')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={fieldClass}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2">{t('contactPage.subject')}</label>
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
                  <label className="block text-sm font-semibold text-black mb-2">{t('contactPage.message')}</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className={`${fieldClass} resize-none`}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="gold-button inline-flex items-center justify-center gap-2 border-2 border-black/10 shadow-md"
                >
                  <Send className="w-5 h-5" />
                  {t('contactPage.sendMessage')}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
