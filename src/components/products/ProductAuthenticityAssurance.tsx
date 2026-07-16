import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowRight,
  Blocks,
  FileCheck2,
  QrCode,
  ScanLine,
  Shield,
  Stamp,
  BadgeCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const METHODS: ReadonlyArray<{
  id: 'blockchain' | 'qr' | 'companyStamp' | 'ministry' | 'hologram' | 'receipt'
  icon: typeof Blocks
  badge?: boolean
}> = [
  { id: 'blockchain', icon: Blocks, badge: true },
  { id: 'qr', icon: QrCode },
  { id: 'companyStamp', icon: BadgeCheck },
  { id: 'ministry', icon: Stamp },
  { id: 'hologram', icon: Shield },
  { id: 'receipt', icon: FileCheck2 },
]

type Props = {
  verifyCode?: string | null
  className?: string
  /** `full` = PDP / verify page; `compact` = titled list without long intro */
  variant?: 'full' | 'compact'
}

/**
 * Multi-layer authenticity assurance for a single product —
 * same terminology as the landing “ضمان الأصالة والأمان” section.
 */
export function ProductAuthenticityAssurance({
  verifyCode,
  className,
  variant = 'full',
}: Props) {
  const { t } = useTranslation()
  const verifyHref = verifyCode
    ? `/verify?code=${encodeURIComponent(verifyCode)}`
    : '/verify'

  return (
    <section
      id="product-authenticity"
      className={cn(
        'scroll-mt-28 rounded-2xl border border-black/10 bg-white p-4 sm:p-5',
        className,
      )}
      aria-labelledby="product-authenticity-heading"
    >
      {variant === 'full' ? (
        <header className="mb-4 sm:mb-5">
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#3F6F00]">
            {t('home.securityTrust.kicker')}
          </p>
          <h2
            id="product-authenticity-heading"
            className="text-base font-bold text-[#0B0F19] sm:text-lg"
          >
            {t('home.securityTrust.title')}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#64748B]">
            {t('home.securityTrust.body')}
          </p>
        </header>
      ) : (
        <h2
          id="product-authenticity-heading"
          className="mb-3 text-sm font-bold text-[#0B0F19]"
        >
          {t('home.securityTrust.title')}
        </h2>
      )}

      <ul className="grid gap-2.5 sm:gap-3">
        {METHODS.map(({ id, icon: Icon, badge }) => (
          <li
            key={id}
            className="rounded-xl border border-black/8 bg-[#F7F9F5]/80 px-3.5 py-3 sm:px-4 sm:py-3.5"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#0B0F19] text-[#85E307]">
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-[#0B0F19]">
                    {t(`home.securityTrust.methods.${id}.title`)}
                  </h3>
                  {badge ? (
                    <span className="inline-flex rounded-full border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 px-2 py-0.5 text-[9px] font-bold tracking-wide text-[#0F766E]">
                      {t('home.securityTrust.methods.blockchain.badge')}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-[#64748B] sm:text-[13px]">
                  {t(`home.securityTrust.methods.${id}.description`)}
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Link
        to={verifyHref}
        className="group mt-4 flex items-center gap-3 rounded-xl border border-[#3F6F00]/20 bg-[#ECFCCB]/45 px-4 py-3 transition-colors hover:border-[#3F6F00]/35 hover:bg-[#ECFCCB]/75 sm:gap-4"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#3F6F00] ring-1 ring-[#3F6F00]/15">
          <ScanLine className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold text-[#0C1512]">
            {t('home.securityTrust.verifyCta')}
          </span>
          <span className="mt-0.5 block text-xs leading-relaxed text-[#64748B]">
            {t('home.securityTrust.verifyCtaBody')}
          </span>
        </span>
        <ArrowRight
          className="h-4 w-4 shrink-0 text-[#3F6F00] transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
          aria-hidden
        />
      </Link>
    </section>
  )
}
