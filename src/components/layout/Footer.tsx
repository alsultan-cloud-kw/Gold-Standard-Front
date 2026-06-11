import { Link } from 'react-router-dom'
import { GS_CONTACT } from '@/constants/contact'
import { useTranslation } from 'react-i18next'
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Youtube
} from 'lucide-react'
import logo from '../../assets/logo.png'

export default function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    company: [
      { nameKey: 'footer.aboutUs', href: '/about' },
      { nameKey: 'footer.ourBranches', href: '/branches' },
      { nameKey: 'footer.careers', href: '#' },
      { nameKey: 'footer.newsUpdates', href: '#' },
    ],
    customerService: [
      { nameKey: 'footer.contactUs', href: '/contact' },
      { nameKey: 'footer.faqs', href: '#' },
      { nameKey: 'footer.shippingInfo', href: '#' },
      { nameKey: 'footer.returnPolicy', href: '/terms-and-privacy' },
    ],
    legal: [
      { nameKey: 'footer.termsAndPrivacy', href: '/terms-and-privacy' },
      { nameKey: 'footer.dataDeletion', href: '/data-deletion' },
    ],
  }

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'YouTube', icon: Youtube, href: '#' },
  ]

  return (
    <footer className="bg-white border-t border-stone-200">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="Gold & Jewelry Trading Co. logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('footer.tagline')}
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="w-9 h-9 rounded-full bg-sky-200 border border-gold-500/30 flex items-center justify-center text-gold-400 hover:bg-gold-500 hover:text-charcoal-950 transition-all"
                  aria-label={social.name}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">{t('footer.company')}</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.nameKey}>
                  <Link
                    to={link.href}
                    className="text-sm text-slate-700 hover:text-gold-600 transition-colors"
                  >
                    {t(link.nameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">{t('footer.customerService')}</h4>
            <ul className="space-y-2">
              {footerLinks.customerService.map((link) => (
                <li key={link.nameKey}>
                  <Link
                    to={link.href}
                    className="text-sm text-slate-700 hover:text-gold-600 transition-colors"
                  >
                    {t(link.nameKey)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-4">{t('footer.contactUs')}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">{GS_CONTACT.addressEn}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gold-400 flex-shrink-0" />
                <a href={`tel:${GS_CONTACT.phoneTel}`} className="text-sm text-slate-700 hover:text-gold-600">
                  {GS_CONTACT.phone}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gold-400 flex-shrink-0" />
                <a href={`mailto:${GS_CONTACT.email}`} className="text-sm text-slate-700 hover:text-gold-600">
                  {GS_CONTACT.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gold-400 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-slate-700">
                  Sat - Thu: 9:00 AM - 9:00 PM<br />
                  Fri: 2:00 PM - 9:00 PM
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Gold Divider */}
      <div className="gold-divider" />

      {/* Bottom Bar */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            {currentYear} Gold & Jewelry Trading Co. {t('footer.allRightsReserved')}
          </p>
          <div className="flex items-center gap-6">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.nameKey}
                to={link.href}
                className="text-sm text-slate-500 hover:text-gold-600 transition-colors"
              >
                {t(link.nameKey)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
