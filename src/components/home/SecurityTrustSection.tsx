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
import goldBarImg from '@/assets/home/gold-bullion.png'
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
          {/* Blockchain — smaller */}
          <article className="security-trust-bento__blockchain group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219] p-5 sm:p-6">
            <span className="mb-4 inline-flex rounded-full border border-[#85E307]/35 bg-[#85E307]/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-[#85E307]">
              {t('home.securityTrust.methods.blockchain.badge')}
            </span>
            <MethodIcon accent="lime">
              <Blocks className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </MethodIcon>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-[#E8C547] sm:text-lg">
              {t('home.securityTrust.methods.blockchain.title')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              {t('home.securityTrust.methods.blockchain.description')}
            </p>
          </article>

          {/* QR — wider featured */}
          <article className="security-trust-bento__qr group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219] p-5 sm:p-6">
            <div className="pointer-events-none absolute -end-8 -top-8 h-32 w-32 rounded-full bg-[#C9A227]/8 blur-2xl" aria-hidden />
            <MethodIcon>
              <QrCode className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </MethodIcon>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-[#E8C547] sm:text-lg">
              {t('home.securityTrust.methods.qr.title')}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/50">
              {t('home.securityTrust.methods.qr.description')}
            </p>
          </article>

          {/* Ministry — with bullion visual */}
          <article className="security-trust-bento__ministry group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219]">
            <div className="relative h-36 overflow-hidden sm:h-40">
              <img
                src={goldBarImg}
                alt={t('home.heroTrust.iconAlt.authentic')}
                className="h-full w-full object-cover object-center opacity-90 transition-transform duration-500 group-hover:scale-[1.03]"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E1219] via-[#0E1219]/40 to-transparent" />
            </div>
            <div className="relative -mt-6 px-5 pb-5 sm:px-6 sm:pb-6">
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

          {/* Hologram */}
          <article className="security-trust-bento__hologram group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219] p-5 sm:p-6">
            <MethodIcon>
              <Shield className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </MethodIcon>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-[#E8C547] sm:text-lg">
              {t('home.securityTrust.methods.hologram.title')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              {t('home.securityTrust.methods.hologram.description')}
            </p>
          </article>

          {/* Company stamp */}
          <article className="security-trust-bento__company-stamp group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219] p-5 sm:p-6">
            <MethodIcon>
              <BadgeCheck className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </MethodIcon>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-[#E8C547] sm:text-lg">
              {t('home.securityTrust.methods.companyStamp.title')}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/50">
              {t('home.securityTrust.methods.companyStamp.description')}
            </p>
          </article>

          {/* Receipt — full width */}
          <article className="security-trust-bento__receipt group relative overflow-hidden rounded-2xl border border-white/10 bg-[#0E1219] p-5 sm:flex sm:items-start sm:gap-5 sm:p-6">
            <MethodIcon>
              <FileCheck2 className="h-5 w-5" strokeWidth={1.75} aria-hidden />
            </MethodIcon>
            <div className="mt-4 min-w-0 flex-1 sm:mt-0">
              <h3 className="text-base font-semibold tracking-tight text-[#E8C547] sm:text-lg">
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
