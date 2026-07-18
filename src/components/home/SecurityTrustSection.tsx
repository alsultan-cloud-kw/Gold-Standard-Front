import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  QrCode,
  Blocks,
  Shield,
  Stamp,
  FileCheck2,
  ShieldCheck,
  BadgeCheck,
} from 'lucide-react'
import blockchainImg from '@/assets/home/security/blockchain.webp'
import qrVerifyImg from '@/assets/home/security/qr-verify.webp'
import ministryHallmarkImg from '@/assets/home/security/ministry-hallmark.webp'
import hologramSealImg from '@/assets/home/security/hologram-seal.webp'
import companyStampImg from '@/assets/home/security/company-stamp.webp'
import officialReceiptImg from '@/assets/home/security/official-receipt.webp'
import { cn } from '@/lib/utils'

function MethodIcon({
  children,
  accent = 'gold',
}: {
  children: ReactNode
  accent?: 'gold' | 'lime'
}) {
  return (
    <span
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
        accent === 'gold'
          ? 'border-[#C9A227]/45 bg-[#C9A227]/10 text-[#E8C547]'
          : 'border-[#85E307]/35 bg-[#85E307]/10 text-[#85E307]',
      )}
    >
      {children}
    </span>
  )
}

function MethodImage({
  src,
  alt,
  className,
  imgClassName,
}: {
  src: string
  alt: string
  className?: string
  imgClassName?: string
}) {
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <img
        src={src}
        alt={alt}
        className={cn(
          'h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.04]',
          imgClassName,
        )}
        loading="lazy"
        decoding="async"
      />
      {/* Soft blend only at the very bottom so the photo stays fully readable */}
      <div
        className="absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-[#0E1219] to-transparent"
        aria-hidden
      />
    </div>
  )
}

export function SecurityTrustSection() {
  const { t } = useTranslation()

  return (
    <section
      className="relative overflow-hidden bg-[#07090F] text-white"
      id="security-trust"
      aria-labelledby="security-trust-heading"
    >
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_45%_at_50%_-10%,rgba(201,162,39,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_100%_80%,rgba(133,227,7,0.06),transparent_50%)]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=%270 0 256 256%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter id=%27n%27%3E%3CfeTurbulence type=%27fractalNoise%27 baseFrequency=%270.85%27 numOctaves=%274%27 stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect width=%27100%25%27 height=%27100%25%27 filter=%27url(%23n)%27/%3E%3C/svg%3E")',
          }}
        />
      </div>

      <div className="home-section-inner relative z-10 py-[var(--space-section-y-top)] pb-[var(--space-section-y-bottom)]">
        {/* Centered header */}
        <div className="mx-auto mb-10 max-w-2xl text-center sm:mb-12">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9A227]/35 bg-[#C9A227]/10 text-[#E8C547] shadow-[0_0_32px_rgba(201,162,39,0.2)]">
            <ShieldCheck className="h-6 w-6" strokeWidth={1.75} aria-hidden />
          </span>
          <h2
            id="security-trust-heading"
            className="text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl"
          >
            {t('home.securityTrust.title')}
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-pretty text-sm leading-relaxed text-white/55 sm:text-base">
            {t('home.securityTrust.body')}
          </p>
        </div>

        {/* Bento verification grid — matches reference layout */}
        <div className="security-trust-bento mx-auto grid max-w-5xl gap-3 sm:gap-4">
          {/* Blockchain — ownership certificate visual */}
          <article className="security-trust-bento__blockchain group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219]">
            <MethodImage
              src={blockchainImg}
              alt={t('home.securityTrust.methods.blockchain.title')}
              className="aspect-[4/3] w-full"
            />
            <div className="relative flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <div className="flex items-center gap-3">
                <MethodIcon accent="lime">
                  <Blocks className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </MethodIcon>
                <span className="inline-flex rounded-full border border-[#85E307]/35 bg-[#85E307]/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#85E307]">
                  {t('home.securityTrust.methods.blockchain.badge')}
                </span>
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-[#E8C547] sm:text-lg">
                {t('home.securityTrust.methods.blockchain.title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {t('home.securityTrust.methods.blockchain.description')}
              </p>
            </div>
          </article>

          {/* QR — phone verification visual, wider featured */}
          <article className="security-trust-bento__qr group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219]">
            <MethodImage
              src={qrVerifyImg}
              alt={t('home.securityTrust.methods.qr.title')}
              className="aspect-[4/3] w-full"
            />
            <div className="relative flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <MethodIcon>
                <QrCode className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </MethodIcon>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-[#E8C547] sm:text-lg">
                {t('home.securityTrust.methods.qr.title')}
              </h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
                {t('home.securityTrust.methods.qr.description')}
              </p>
            </div>
          </article>

          {/* Ministry — hallmark inspection visual */}
          <article className="security-trust-bento__ministry group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219]">
            <MethodImage
              src={ministryHallmarkImg}
              alt={t('home.securityTrust.methods.ministry.title')}
              className="aspect-[4/3] w-full"
            />
            <div className="relative flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <MethodIcon>
                <Stamp className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </MethodIcon>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-[#E8C547] sm:text-lg">
                {t('home.securityTrust.methods.ministry.title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {t('home.securityTrust.methods.ministry.description')}
              </p>
            </div>
          </article>

          {/* Hologram — seal close-up visual */}
          <article className="security-trust-bento__hologram group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219]">
            <MethodImage
              src={hologramSealImg}
              alt={t('home.securityTrust.methods.hologram.title')}
              className="aspect-[4/3] w-full"
            />
            <div className="relative flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <MethodIcon>
                <Shield className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </MethodIcon>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-[#E8C547] sm:text-lg">
                {t('home.securityTrust.methods.hologram.title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {t('home.securityTrust.methods.hologram.description')}
              </p>
            </div>
          </article>

          {/* Company stamp — packaging engraving visual */}
          <article className="security-trust-bento__company-stamp group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219]">
            <MethodImage
              src={companyStampImg}
              alt={t('home.securityTrust.methods.companyStamp.title')}
              className="aspect-[4/3] w-full"
            />
            <div className="relative flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <MethodIcon>
                <BadgeCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </MethodIcon>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-[#E8C547] sm:text-lg">
                {t('home.securityTrust.methods.companyStamp.title')}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/50">
                {t('home.securityTrust.methods.companyStamp.description')}
              </p>
            </div>
          </article>

          {/* Receipt — full width, image beside text on larger screens */}
          <article className="security-trust-bento__receipt group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219] sm:grid sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
            <MethodImage
              src={officialReceiptImg}
              alt={t('home.securityTrust.methods.receipt.title')}
              className="aspect-[4/3] w-full sm:aspect-auto sm:h-full sm:min-h-[16rem]"
            />
            <div className="relative px-5 pb-5 pt-4 sm:flex sm:flex-col sm:justify-center sm:p-6">
              <MethodIcon>
                <FileCheck2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </MethodIcon>
              <h3 className="mt-4 text-base font-semibold tracking-tight text-[#E8C547] sm:text-lg">
                {t('home.securityTrust.methods.receipt.title')}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
                {t('home.securityTrust.methods.receipt.description')}
              </p>
            </div>
          </article>
        </div>

        {/* CTA */}
        <div className="mx-auto mt-6 flex max-w-5xl flex-col gap-4 rounded-2xl border border-[#C9A227]/25 bg-gradient-to-br from-[#C9A227]/15 via-[#0E1219] to-[#0E1219] px-5 py-5 sm:mt-8 sm:flex-row sm:items-center sm:justify-between sm:px-7 sm:py-6">
          <div className="max-w-xl text-center sm:text-start">
            <p className="text-sm font-semibold text-white sm:text-base">
              {t('home.securityTrust.verifyCtaTitle')}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-white/50">
              {t('home.securityTrust.verifyCtaBody')}
            </p>
          </div>
          <Link
            to="/verify"
            className="gold-button inline-flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto"
          >
            {t('home.securityTrust.verifyCta')}
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  )
}
