import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  QrCode,
  Blocks,
  Shield,
  Stamp,
  FileCheck2,
  ShieldCheck,
  BadgeCheck,
  SearchCheck,
  type LucideIcon,
} from 'lucide-react'
import blockchainImg from '@/assets/home/security/blockchain.webp'
import qrVerifyImg from '@/assets/home/security/qr-verify.webp'
import ministryHallmarkImg from '@/assets/home/security/ministry-hallmark.webp'
import hologramSealImg from '@/assets/home/security/hologram-seal.webp'
import companyStampImg from '@/assets/home/security/company-stamp.webp'
import officialReceiptImg from '@/assets/home/security/official-receipt.webp'
import { websiteVerificationApi } from '@/services/api'

export type SecurityTrustMethodId =
  | 'qr'
  | 'blockchain'
  | 'hologram'
  | 'companyStamp'
  | 'receipt'
  | 'ministry'

const METHODS: { id: SecurityTrustMethodId; icon: LucideIcon; fallbackImage: string }[] = [
  { id: 'qr', icon: QrCode, fallbackImage: qrVerifyImg },
  { id: 'blockchain', icon: Blocks, fallbackImage: blockchainImg },
  { id: 'hologram', icon: Shield, fallbackImage: hologramSealImg },
  { id: 'companyStamp', icon: BadgeCheck, fallbackImage: companyStampImg },
  { id: 'receipt', icon: FileCheck2, fallbackImage: officialReceiptImg },
  { id: 'ministry', icon: SearchCheck, fallbackImage: ministryHallmarkImg },
]

function MethodCard({
  id,
  icon: Icon,
  image,
}: {
  id: SecurityTrustMethodId
  icon: LucideIcon
  image: string
}) {
  const { t } = useTranslation()
  const title = t(`home.securityTrust.methods.${id}.title`)
  const description = t(`home.securityTrust.methods.${id}.description`)

  return (
    <article className="security-trust-card group">
      <div className="security-trust-card__layout">
        <div className="security-trust-card__media">
          <img
            src={image}
            alt={title}
            className="security-trust-card__img"
            loading="lazy"
            decoding="async"
          />
          <div className="security-trust-card__fade" aria-hidden />
        </div>

        <div className="security-trust-card__body">
          <span className="security-trust-card__icon" aria-hidden>
            <Icon className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem]" strokeWidth={1.75} />
          </span>
          <div className="min-w-0">
            <h3 className="security-trust-card__title">{title}</h3>
            <p className="security-trust-card__desc">{description}</p>
          </div>
        </div>
      </div>
    </article>
  )
}

export function SecurityTrustSection() {
  const { t } = useTranslation()
  const titleSuffix = t('home.securityTrust.titleSuffix')

  const { data } = useQuery({
    queryKey: ['websiteVerificationPublic'],
    queryFn: () => websiteVerificationApi.getPublic(),
    staleTime: 60_000,
    retry: 1,
  })

  // Fail-open: missing/failed CMS → show bundled defaults. enabled=false → hide section.
  if (data?.enabled === false) {
    return null
  }

  const cmsImages = data?.images

  return (
    <section
      className="security-trust-section relative bg-[#07090F] text-white"
      id="security-trust"
      aria-labelledby="security-trust-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(133,227,7,0.1),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_45%_35%_at_90%_85%,rgba(133,227,7,0.05),transparent_50%)]" />
      </div>

      <div className="home-section-inner security-trust-section__inner relative z-10">
        <div className="security-trust-section__header">
          <span className="security-trust-section__badge" aria-hidden>
            <ShieldCheck className="h-5 w-5" strokeWidth={1.85} />
          </span>
          <h2 id="security-trust-heading" className="security-trust-section__title">
            <span className="text-white">{t('home.securityTrust.titlePrefix')}</span>
            <span className="text-[#85E307]">{t('home.securityTrust.titleAccent')}</span>
            {titleSuffix ? <span className="text-white">{titleSuffix}</span> : null}
          </h2>
          <p className="security-trust-section__body">{t('home.securityTrust.body')}</p>
          <div className="security-trust-section__rule" aria-hidden />
        </div>

        <div className="security-trust-grid">
          {METHODS.map((method) => {
            const cmsUrl = (cmsImages?.[method.id] || '').trim()
            const image = cmsUrl || method.fallbackImage
            return <MethodCard key={method.id} id={method.id} icon={method.icon} image={image} />
          })}
        </div>

        <div className="security-trust-ribbon">
          <div className="security-trust-ribbon__copy">
            <span className="security-trust-ribbon__shield" aria-hidden>
              <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={1.85} />
            </span>
            <div className="min-w-0">
              <p className="security-trust-ribbon__title">
                <span className="text-white">{t('home.securityTrust.ribbonTitleLead')}</span>
                <span className="text-[#85E307]">{t('home.securityTrust.ribbonTitleAccent')}</span>
              </p>
              <p className="security-trust-ribbon__sub">{t('home.securityTrust.ribbonBody')}</p>
            </div>
          </div>

          <div className="security-trust-ribbon__actions">
            <Link to="/products" className="security-trust-ribbon__cta-primary">
              {t('home.securityTrust.productsCta')}
              <ArrowRight className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden />
            </Link>
            <Link to="/verify" className="security-trust-ribbon__cta-secondary">
              <Stamp className="h-4 w-4 shrink-0 text-[#85E307]" aria-hidden />
              {t('home.securityTrust.verifyCta')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
