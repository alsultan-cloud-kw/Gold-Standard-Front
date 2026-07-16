import { useTranslation } from 'react-i18next'
import { ArrowUpRight, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { ABOUT_PARTNERS } from '@/constants/aboutPartners'
import { useHorizontalScrollRail } from '@/components/home/useHorizontalScrollRail'
import { cn } from '@/lib/utils'

const PARTNER_CARD_COUNT = ABOUT_PARTNERS.length + 1

export function AboutPartnersSection() {
  const { t } = useTranslation()
  const { railRef, canScrollBack, canScrollForward, scrollBack, scrollForward } =
    useHorizontalScrollRail(PARTNER_CARD_COUNT)

  const showControls = canScrollBack || canScrollForward

  return (
    <section className="border-b border-black/5 bg-[#F9F9FA]" aria-labelledby="about-partners-heading">
      <div className="page-shell page-section--roomy">
        <div className="mb-8 flex flex-col gap-4 sm:mb-10 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="page-kicker">{t('aboutPage.partnersKicker')}</p>
            <h2 id="about-partners-heading" className="type-section-title text-[#0B0F19] sm:text-3xl">
              {t('aboutPage.partnersTitle')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-[#64748B] sm:text-base">
              {t('aboutPage.partnersIntro')}
            </p>
          </div>
          <p className="max-w-sm text-xs leading-relaxed text-[#94A3B8] sm:text-sm lg:text-end">
            {t('aboutPage.partnersNote')}
          </p>
        </div>

        <div className="relative">
          {showControls ? (
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium text-[#94A3B8] sm:text-xs">
                {t('aboutPage.partnersScrollHint')}
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  onClick={scrollBack}
                  disabled={!canScrollBack}
                  aria-label={t('home.scrollBack')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#0B0F19] shadow-sm transition disabled:cursor-not-allowed disabled:opacity-35 enabled:hover:border-[#85E307]/40 enabled:hover:bg-[#ECFCCB]/50 enabled:focus-visible:outline enabled:focus-visible:outline-2 enabled:focus-visible:outline-offset-2 enabled:focus-visible:outline-[#85E307]"
                >
                  <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={scrollForward}
                  disabled={!canScrollForward}
                  aria-label={t('home.scrollForward')}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white text-[#0B0F19] shadow-sm transition disabled:cursor-not-allowed disabled:opacity-35 enabled:hover:border-[#85E307]/40 enabled:hover:bg-[#ECFCCB]/50 enabled:focus-visible:outline enabled:focus-visible:outline-2 enabled:focus-visible:outline-offset-2 enabled:focus-visible:outline-[#85E307]"
                >
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
                </button>
              </div>
            </div>
          ) : null}

          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 start-0 z-[1] w-8 bg-gradient-to-r from-[#F9F9FA] to-transparent transition-opacity',
              canScrollBack ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden
          />
          <div
            className={cn(
              'pointer-events-none absolute inset-y-0 end-0 z-[1] w-8 bg-gradient-to-l from-[#F9F9FA] to-transparent transition-opacity',
              canScrollForward ? 'opacity-100' : 'opacity-0',
            )}
            aria-hidden
          />

          <div
            ref={railRef}
            role="list"
            aria-label={t('aboutPage.partnersRailLabel')}
            tabIndex={0}
            className="about-partners-rail flex gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 pt-0.5 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:thin] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#85E307] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-track]:bg-transparent"
          >
            {ABOUT_PARTNERS.map((partner) => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
            <MorePartnerCard />
          </div>
        </div>
      </div>
    </section>
  )
}

type PartnerCardProps = {
  partner: (typeof ABOUT_PARTNERS)[number]
}

function PartnerCard({ partner }: PartnerCardProps) {
  const { t } = useTranslation()
  const name = t(`aboutPage.partners.${partner.id}.name`)
  const isAccent = partner.id === 'wathaq'

  return (
    <article
      role="listitem"
      className={cn(
        'group flex w-[min(88vw,19.5rem)] shrink-0 snap-center flex-col sm:w-[19.5rem]',
        'rounded-2xl border bg-white p-5 shadow-[0_12px_40px_-24px_rgba(15,23,42,0.2)] transition',
        'hover:border-[#85E307]/35 hover:shadow-[0_18px_48px_-22px_rgba(63,111,0,0.18)]',
        'focus-within:border-[#85E307]/45 focus-within:ring-2 focus-within:ring-[#85E307]/25',
        isAccent
          ? 'border-[#0B0F19]/15 ring-1 ring-inset ring-[#85E307]/20'
          : 'border-black/10',
      )}
    >
      <div
        className={cn(
          'mb-4 flex h-[4.75rem] items-center justify-center rounded-xl border px-4',
          partner.logoBgClassName ?? 'bg-[#F9F9FA]',
          isAccent ? 'border-[#85E307]/20' : 'border-black/5',
        )}
      >
        <img
          src={partner.logoSrc}
          alt=""
          className={cn('max-h-full w-auto max-w-full object-contain', partner.logoClassName)}
          loading="lazy"
          decoding="async"
        />
      </div>

      <span
        className={cn(
          'inline-flex w-fit rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]',
          isAccent
            ? 'border border-[#85E307]/30 bg-[#ECFCCB] text-[#3F6F00]'
            : 'bg-[#F9F9FA] text-[#3F6F00]',
        )}
      >
        {t(`aboutPage.partners.${partner.id}.role`)}
      </span>

      <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-[#0B0F19]">{name}</h3>

      <p className="mt-2 flex-1 line-clamp-4 text-sm leading-relaxed text-[#64748B]">
        {t(`aboutPage.partners.${partner.id}.body`)}
      </p>

      <a
        href={partner.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-1.5 rounded-lg text-sm font-semibold text-[#0B0F19] underline-offset-4 transition group-hover:text-[#3F6F00] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#85E307]"
        aria-label={t('aboutPage.partnersVisitExternal', { name })}
      >
        {t('aboutPage.partnersVisit')}
        <ArrowUpRight
          className="h-4 w-4 shrink-0 text-[#3F6F00] transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:rotate-180"
          aria-hidden
        />
      </a>
    </article>
  )
}

function MorePartnerCard() {
  const { t } = useTranslation()

  return (
    <article
      role="listitem"
      aria-label={t('aboutPage.partnersMoreTitle')}
      className="flex w-[min(88vw,19.5rem)] shrink-0 snap-center flex-col rounded-2xl border border-dashed border-black/15 bg-white/80 p-5 sm:w-[19.5rem]"
    >
      <div className="mb-4 flex h-[4.75rem] items-center justify-center rounded-xl border border-dashed border-black/10 bg-[#F9F9FA]">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-black/10 bg-white text-[#3F6F00]">
          <Plus className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
      </div>

      <span className="inline-flex w-fit rounded-full bg-[#F9F9FA] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#94A3B8]">
        {t('aboutPage.partnersMoreKicker')}
      </span>

      <h3 className="mt-3 text-base font-bold text-[#0B0F19]">{t('aboutPage.partnersMoreTitle')}</h3>

      <p className="mt-2 flex-1 text-sm leading-relaxed text-[#64748B]">
        {t('aboutPage.partnersMoreBody')}
      </p>

      <p className="mt-5 text-xs font-medium text-[#94A3B8]">{t('aboutPage.partnersMoreFoot')}</p>
    </article>
  )
}
