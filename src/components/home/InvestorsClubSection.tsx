import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Check,
  Crown,
  Eye,
  Headphones,
  Lock,
  Mail,
  Percent,
  Plus,
  RefreshCw,
  Shield,
  Target,
  UserPlus,
  Users,
} from 'lucide-react'
import clubBullionUrl from '@/assets/home/club/club-example-bullion.png'
import testimonialsShowcaseUrl from '@/assets/home/club/testimonials-showcase.png'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

const CLUB_DASHBOARD = '/dashboard?tab=club'

function clubLoginHref() {
  return `/login?next=${encodeURIComponent(CLUB_DASHBOARD)}`
}

/** Clean social-proof club card — invite-only, not a live metrics feed. */
function ClubProfileCard() {
  const { t } = useTranslation()

  return (
    <article className="investors-club__profile-card">
      <div className="investors-club__profile-head">
        <div className="investors-club__profile-mark" aria-hidden>
          <Shield className="h-7 w-7 text-[#3F2A00]" strokeWidth={1.5} />
          <Crown className="investors-club__profile-crown" strokeWidth={2.5} />
        </div>
        <p className="investors-club__profile-title">{t('home.investorsClub.demoClubName')}</p>
        <p className="investors-club__profile-by">{t('home.investorsClub.demoClubBy')}</p>
      </div>

      <div className="investors-club__profile-stats">
        {[
          { value: '42', label: t('home.investorsClub.statMembers') },
          { value: '3', label: t('home.investorsClub.statOffers') },
          { value: '2025', label: t('home.investorsClub.statSince') },
        ].map((stat) => (
          <div key={stat.label} className="investors-club__profile-stat min-w-0">
            <p className="investors-club__profile-stat-value">{stat.value}</p>
            <p className="investors-club__profile-stat-label">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="investors-club__profile-members">
        <img
          src={testimonialsShowcaseUrl}
          alt=""
          className="investors-club__profile-avatars"
          loading="lazy"
          decoding="async"
          draggable={false}
        />
        <span className="investors-club__profile-extra">{t('home.investorsClub.membersExtra')}</span>
      </div>

      <div className="investors-club__profile-invite">
        <Lock className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
        <span>{t('home.investorsClub.inviteOnly')}</span>
      </div>
    </article>
  )
}

/**
 * Homepage Investors Club — social circle + making-charge benefits.
 * Not a pooled investment product; not a different gold spot price.
 */
export function InvestorsClubSection() {
  const { t } = useTranslation()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  const openHref = isAuthenticated ? CLUB_DASHBOARD : clubLoginHref()
  const inviteHref = isAuthenticated ? CLUB_DASHBOARD : clubLoginHref()

  const pillars = [
    { icon: UserPlus, titleKey: 'home.investorsClub.pillar1Title', descKey: 'home.investorsClub.pillar1Desc' },
    { icon: Target, titleKey: 'home.investorsClub.pillar2Title', descKey: 'home.investorsClub.pillar2Desc' },
    { icon: Users, titleKey: 'home.investorsClub.pillar3Title', descKey: 'home.investorsClub.pillar3Desc' },
  ] as const

  const gsBenefits = [
    t('home.investorsClub.gsBenefit1'),
    t('home.investorsClub.gsBenefit2'),
    t('home.investorsClub.gsBenefit3'),
    t('home.investorsClub.gsBenefit4'),
  ]
  const clubBenefits = [
    t('home.investorsClub.clubBenefit1'),
    t('home.investorsClub.clubBenefit2'),
    t('home.investorsClub.clubBenefit3'),
    t('home.investorsClub.clubBenefit4'),
  ]

  const compareRows = [
    {
      regular: t('home.investorsClub.compareRow1'),
      member: t('home.investorsClub.compareRow1'),
      highlight: false,
    },
    {
      regular: t('home.investorsClub.compareRow2'),
      member: t('home.investorsClub.compareRow2'),
      highlight: false,
    },
    {
      regular: t('home.investorsClub.compareRow3Regular'),
      member: t('home.investorsClub.compareRow3Member'),
      highlight: true,
    },
    {
      regular: t('home.investorsClub.compareRow4Regular'),
      member: t('home.investorsClub.compareRow4Member'),
      highlight: true,
    },
    {
      regular: t('home.investorsClub.compareRow5Regular'),
      member: t('home.investorsClub.compareRow5Member'),
      highlight: true,
    },
  ]

  const trust = [
    { icon: Eye, label: t('home.investorsClub.trust1') },
    { icon: Shield, label: t('home.investorsClub.trust2') },
    { icon: Headphones, label: t('home.investorsClub.trust3') },
    { icon: RefreshCw, label: t('home.investorsClub.trust4') },
  ]

  return (
    <section
      className="home-section home-section--compact investors-club relative overflow-x-clip"
      id="investors-club"
    >
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-[#F4F7F1] via-[var(--site-bg)] to-[var(--site-bg)]" />
        <div className="absolute start-1/2 top-0 h-[22rem] w-[min(100%,36rem)] -translate-x-1/2 rounded-full bg-[#ECFCCB]/30 blur-3xl" />
      </div>

      <div className="home-section-inner investors-club__inner min-w-0">
        {/* Text-first hero — no large media (avoids CLS / duplicate network art) */}
        <header className="investors-club__hero">
          <div className="investors-club__hero-copy min-w-0">
            <p className="page-kicker mb-2 text-[#3F6F00]">{t('home.investorsClub.kicker')}</p>
            <h2 className="type-section-title mb-3 text-[#1A2E1C] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {t('home.investorsClub.title')}
            </h2>
            <p className="investors-club__hero-tagline">
              {t('home.investorsClub.tagline')}
            </p>
            <p className="investors-club__hero-desc">
              {t('home.investorsClub.desc')}
            </p>

            <div className="investors-club__cta-row">
              <Link
                to={openHref}
                aria-disabled={authLoading || undefined}
                className={cn(
                  'investors-club__cta investors-club__cta--primary',
                  authLoading && 'pointer-events-none opacity-60',
                )}
              >
                <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {isAuthenticated ? t('home.investorsClub.ctaOpen') : t('home.investorsClub.ctaOpenLogin')}
                </span>
              </Link>
              <Link
                to={inviteHref}
                aria-disabled={authLoading || undefined}
                className={cn(
                  'investors-club__cta investors-club__cta--secondary',
                  authLoading && 'pointer-events-none opacity-60',
                )}
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {isAuthenticated ? t('home.investorsClub.ctaInvite') : t('home.investorsClub.ctaInviteLogin')}
                </span>
              </Link>
            </div>
            {!isAuthenticated && !authLoading ? (
              <p className="investors-club__login-hint">
                <Check className="h-3.5 w-3.5 shrink-0 text-[#3F6F00]" strokeWidth={2.5} aria-hidden />
                <span className="min-w-0">{t('home.investorsClub.loginRequiredHint')}</span>
              </p>
            ) : null}
          </div>
        </header>

        {/* 01 — Social concept + profile card */}
        <div className="investors-club__block">
          <p className="page-kicker mb-2 text-center text-[#3F6F00]">
            {t('home.investorsClub.section01Eyebrow')}
          </p>
          <h3 className="investors-club__block-title">{t('home.investorsClub.section01Title')}</h3>
          <p className="investors-club__block-body">{t('home.investorsClub.section01Body')}</p>
          <p className="investors-club__block-highlight">{t('home.investorsClub.section01Highlight')}</p>
          <p className="investors-club__flow">{t('home.investorsClub.flowLine')}</p>

          <div className="investors-club__social-grid investors-club__social-grid--card-only">
            <div className="investors-club__profile-wrap min-w-0">
              <ClubProfileCard />
            </div>
          </div>

          <ul className="investors-club__pillars">
            {pillars.map(({ icon: Icon, titleKey, descKey }) => (
              <li key={titleKey} className="investors-club__pillar min-w-0">
                <span className="investors-club__pillar-icon">
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <p className="text-sm font-bold text-[#0B0F19]">{t(titleKey)}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-[#64748B]">{t(descKey)}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* 02 — Benefits */}
        <div className="investors-club__block">
          <p className="page-kicker mb-2 text-center text-[#3F6F00]">
            {t('home.investorsClub.section02Eyebrow')}
          </p>
          <h3 className="investors-club__block-title">{t('home.investorsClub.section02Title')}</h3>
          <p className="mb-3 text-center text-base font-semibold text-[#1A2E1C]">
            {t('home.investorsClub.section02Tagline')}
          </p>
          <p className="investors-club__block-body mb-10">{t('home.investorsClub.section02Body')}</p>

          <div className="investors-club__benefits">
            <div className="investors-club__benefit-card min-w-0">
              <p className="text-sm font-bold text-[#8A6A1A]">{t('home.investorsClub.gsBenefitsTitle')}</p>
              <p className="mt-1 text-xs text-[#94A3B8]">{t('home.investorsClub.gsBenefitsSub')}</p>
              <ul className="mt-4 space-y-2.5">
                {gsBenefits.map((label) => (
                  <li key={label} className="flex gap-2.5 text-sm text-[#334155]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#A16207]" strokeWidth={2.5} aria-hidden />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="investors-club__plus" aria-label={t('home.investorsClub.plusLabel')}>
              +
            </div>

            <div className="investors-club__benefit-card investors-club__benefit-card--club min-w-0">
              <p className="text-sm font-bold text-[#3F6F00]">{t('home.investorsClub.clubBenefitsTitle')}</p>
              <p className="mt-1 text-xs text-[#64748B]">{t('home.investorsClub.clubBenefitsSub')}</p>
              <ul className="mt-4 space-y-2.5">
                {clubBenefits.map((label) => (
                  <li key={label} className="flex gap-2.5 text-sm font-medium text-[#1A2E1C]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3F6F00]" strokeWidth={2.5} aria-hidden />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <article className="investors-club__example">
            <div className="investors-club__example-grid">
              <div className="investors-club__example-media">
                <img
                  src={clubBullionUrl}
                  alt={t('home.investorsClub.bullionAlt')}
                  className="h-auto w-full max-w-[14rem] object-contain sm:max-w-[16rem]"
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </div>
              <div className="investors-club__example-body min-w-0">
                <p className="page-kicker text-[#3F6F00]">{t('home.investorsClub.exampleTitle')}</p>
                <p className="mt-1 text-sm font-semibold text-[#0B0F19]">
                  {t('home.investorsClub.exampleProduct')}
                </p>
                <dl className="investors-club__example-rows">
                  <div className="investors-club__example-row">
                    <dt>{t('home.investorsClub.exampleMarket')}</dt>
                    <dd>{t('home.investorsClub.exampleMarketValue')}</dd>
                  </div>
                  <div className="investors-club__example-row">
                    <dt>{t('home.investorsClub.exampleMaking')}</dt>
                    <dd>{t('home.investorsClub.exampleMakingValue')}</dd>
                  </div>
                  <div className="investors-club__example-row investors-club__example-row--discount">
                    <dt>{t('home.investorsClub.exampleClubDiscount')}</dt>
                    <dd>{t('home.investorsClub.exampleClubDiscountValue')}</dd>
                  </div>
                  <div className="investors-club__example-row investors-club__example-row--final">
                    <dt>{t('home.investorsClub.exampleFinal')}</dt>
                    <dd>{t('home.investorsClub.exampleFinalValue')}</dd>
                  </div>
                </dl>
                <p className="investors-club__save-badge">
                  <Percent className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span className="min-w-0">{t('home.investorsClub.exampleSaveBadge')}</span>
                </p>
                <p className="mt-4 text-sm font-medium leading-relaxed text-[#1A2E1C]">
                  {t('home.investorsClub.exampleNote')}
                </p>
              </div>
            </div>
          </article>

          <div className="investors-club__compare">
            <div className="investors-club__compare-head">
              <div>{t('home.investorsClub.compareRegular')}</div>
              <div className="investors-club__compare-head-member">
                {t('home.investorsClub.compareMember')}
              </div>
            </div>
            {compareRows.map((row) => (
              <div
                key={`${row.regular}-${row.member}`}
                className="investors-club__compare-row"
              >
                <div className="investors-club__compare-cell">{row.regular}</div>
                <div
                  className={cn(
                    'investors-club__compare-cell investors-club__compare-cell--member',
                    row.highlight && 'investors-club__compare-cell--hot',
                  )}
                >
                  {row.member}
                </div>
              </div>
            ))}
          </div>

          <div className="investors-club__bottom-cta">
            <p className="text-lg font-bold sm:text-xl">{t('home.investorsClub.bottomTagline')}</p>
            <div className="investors-club__cta-row investors-club__cta-row--center">
              <Link
                to={openHref}
                aria-disabled={authLoading || undefined}
                className={cn(
                  'investors-club__cta investors-club__cta--accent',
                  authLoading && 'pointer-events-none opacity-60',
                )}
              >
                <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />
                <span className="min-w-0 [overflow-wrap:anywhere]">{t('home.investorsClub.ctaFinal')}</span>
              </Link>
              <Link
                to={inviteHref}
                aria-disabled={authLoading || undefined}
                className={cn(
                  'investors-club__cta investors-club__cta--ghost',
                  authLoading && 'pointer-events-none opacity-60',
                )}
              >
                <Mail className="h-4 w-4 shrink-0" aria-hidden />
                <span className="min-w-0 [overflow-wrap:anywhere]">
                  {isAuthenticated ? t('home.investorsClub.ctaInvite') : t('home.investorsClub.ctaInviteLogin')}
                </span>
              </Link>
            </div>
          </div>

          <ul className="investors-club__trust">
            {trust.map(({ icon: Icon, label }) => (
              <li key={label} className="investors-club__trust-item min-w-0">
                <span className="investors-club__trust-icon">
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="[overflow-wrap:anywhere] text-xs font-medium text-[#64748B]">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
