import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

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
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold gold-gradient-text mb-4">{t('contactPage.title')}</h1>
          <p className="text-gold-100/70 max-w-2xl mx-auto">{t('contactPage.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="space-y-4">
            {contactInfo.map((info, index) => (
              <div key={index} className="gold-card flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-gold-500/10 flex items-center justify-center shrink-0">
                  <info.icon className="w-6 h-6 text-gold-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gold-100 mb-1">{t(info.titleKey)}</h3>
                  <p className="text-sm text-gold-100/60">{t(info.contentKey)}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="gold-card">
              <h2 className="text-xl font-bold text-gold-100 mb-6">{t('contactPage.formTitle')}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gold-100 mb-2">{t('contactPage.name')}</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gold-100 mb-2">
                      {t('contactPage.emailLabel')}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gold-100 mb-2">
                      {t('contactPage.phoneLabel')}
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gold-100 mb-2">{t('contactPage.subject')}</label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gold-100 mb-2">{t('contactPage.message')}</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 resize-none"
                    required
                  />
                </div>
                <button type="submit" className="gold-button flex items-center justify-center gap-2">
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
