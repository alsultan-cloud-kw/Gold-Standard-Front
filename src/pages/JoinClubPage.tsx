import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import {
  Check,
  Crown,
  Gift,
  Shield,
  Sparkles,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { clubsApi } from '../services/api'
import { formatApiErrorMessage } from '../utils/apiErrors'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { rememberAuthReturnPath } from '@/lib/authReturnIntent'
import { cn } from '@/lib/utils'

const JOIN_NEXT = (token: string) => `/join-club?token=${encodeURIComponent(token)}`

function ClubLevelPips({ level }: { level: number }) {
  const clamped = Math.min(5, Math.max(1, level || 1))
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={cn(
            'h-1.5 w-4 rounded-full transition-colors',
            i < clamped ? 'bg-[#85E307]' : 'bg-black/10',
          )}
        />
      ))}
    </div>
  )
}

function MemberAvatar({ initials, isHead }: { initials: string; isHead: boolean }) {
  return (
    <span
      className={cn(
        'relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold',
        isHead
          ? 'bg-[#0B0F19] text-[#85E307]'
          : 'bg-[#ECFCCB] text-[#3F6F00]',
      )}
    >
      {initials || '?'}
      {isHead ? (
        <Crown className="absolute -end-0.5 -top-0.5 h-3.5 w-3.5 text-amber-500 drop-shadow-sm" aria-hidden />
      ) : null}
    </span>
  )
}

export default function JoinClubPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(true)

  useEffect(() => {
    if (token && !isAuthenticated) rememberAuthReturnPath(JOIN_NEXT(token))
  }, [isAuthenticated, token])

  const previewQuery = useQuery({
    queryKey: ['clubInvitePreview', token],
    queryFn: () => clubsApi.invitePreview(token),
    enabled: Boolean(token),
    retry: 1,
  })

  const joinMutation = useMutation({
    mutationFn: () => clubsApi.join(token),
    onSuccess: () => {
      toast.success(t('joinClub.toasts.joined'))
      void queryClient.invalidateQueries({ queryKey: ['clubMembership'] })
      void queryClient.invalidateQueries({ queryKey: ['clubOffers'] })
      navigate('/dashboard?tab=club', { replace: true })
    },
  })

  const joinErrorMessage = joinMutation.isError
    ? formatApiErrorMessage(joinMutation.error, t('joinClub.toasts.joinFailed'))
    : ''
  const joinErrorCode =
    joinMutation.isError &&
    joinMutation.error &&
    typeof joinMutation.error === 'object' &&
    'response' in joinMutation.error
      ? (joinMutation.error as { response?: { data?: { code?: string } } }).response?.data?.code
      : undefined
  const isAlreadyInOtherClub =
    joinMutation.isError &&
    (joinErrorCode === 'already_in_club' ||
      joinErrorMessage.toLowerCase().includes('already belong'))

  const preview = previewQuery.data
  const offers = preview?.active_offers ?? []
  const members = preview?.members ?? []
  const roles = preview?.roles ?? []
  const benefitKeys =
    preview?.benefit_keys?.length
      ? preview.benefit_keys
      : (['shared_discounts', 'member_pricing', 'trusted_circle'] as const)
  const clubLevel = preview?.club_level ?? 1

  const offerSummary = useMemo(() => {
    if (!offers.length) return null
    return offers
      .map((o) => {
        if (o.discount_percent) return `${o.title} (${o.discount_percent}%)`
        if (o.discount_amount_kwd) return `${o.title} (${o.discount_amount_kwd} KWD)`
        return o.title
      })
      .join(' · ')
  }, [offers])

  const cancelJoin = () => {
    setModalOpen(false)
    navigate('/', { replace: true })
  }

  const roleLabel = (role: string) => {
    if (role === 'head') return t('joinClub.roleHead')
    if (role === 'member') return t('joinClub.roleMember')
    return role
  }

  if (!token) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F4F5F1] px-4">
        <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#0B0F19]">{t('joinClub.missingTokenTitle')}</h1>
          <p className="mt-2 text-sm text-[#64748B]">{t('joinClub.missingTokenBody')}</p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-[#0B0F19] px-5 py-2.5 text-sm font-semibold text-[#85E307]"
          >
            {t('joinClub.goHome')}
          </Link>
        </div>
      </div>
    )
  }

  if (previewQuery.isLoading || authLoading) {
    return <AppLoadingScreen message={t('joinClub.loadingInvite')} />
  }

  if (previewQuery.isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F4F5F1] px-4">
        <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-[#64748B]">{t('joinClub.previewLoadError')}</p>
          <Link to="/" className="mt-4 inline-block text-sm font-semibold text-[#3F6F00]">
            {t('joinClub.goHome')}
          </Link>
        </div>
      </div>
    )
  }

  if (preview && preview.valid === false) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F4F5F1] px-4">
        <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#0B0F19]">{t('joinClub.invalidTitle')}</h1>
          <p className="mt-2 text-sm text-[#64748B]">
            {preview.detail || t('joinClub.invalidBody')}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-[#0B0F19] px-5 py-2.5 text-sm font-semibold text-[#85E307]"
          >
            {t('joinClub.goHome')}
          </Link>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const next = JOIN_NEXT(token)
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-[#F4F5F1] px-4 py-10">
        <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
          <div className="border-b border-black/5 bg-[#0B0F19] px-6 py-8 text-center text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#85E307]">
              {t('joinClub.kicker')}
            </p>
            <h1 className="mt-3 text-2xl font-bold tracking-tight">{t('joinClub.title')}</h1>
            {preview?.club_name ? (
              <p className="mt-2 text-lg font-medium text-white/90">{preview.club_name}</p>
            ) : null}
            <div className="mt-4 flex flex-col items-center gap-2">
              <span className="rounded-full bg-[#85E307]/15 px-3 py-1 text-xs font-bold text-[#85E307]">
                {t('joinClub.levelBadge', { level: clubLevel })}
              </span>
              <ClubLevelPips level={clubLevel} />
            </div>
          </div>
          <div className="space-y-5 px-6 py-6 text-center">
            <p className="text-sm leading-relaxed text-[#475569]">{t('joinClub.subtitle')}</p>
            {(preview?.invited_by_name || preview?.head_name) && (
              <p className="text-xs text-[#64748B]">
                {t('joinClub.invitedByLabel', {
                  name: preview.invited_by_name || preview.head_name,
                })}
              </p>
            )}
            {offers.length > 0 ? (
              <p className="rounded-xl border border-[#85E307]/30 bg-[#F4FBEF] px-4 py-3 text-sm font-medium text-[#3F6F00]">
                {t('joinClub.offerTeaser', { offer: offerSummary })}
              </p>
            ) : (
              <p className="rounded-xl border border-black/5 bg-[#F8FAFC] px-4 py-3 text-sm text-[#475569]">
                {t('joinClub.noOfferUrgeAuth')}
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                to={`/login?next=${encodeURIComponent(next)}&returnUrl=${encodeURIComponent(next)}`}
                className="inline-flex justify-center rounded-xl bg-[#85E307] px-5 py-3 text-sm font-bold text-[#0B0F19] transition hover:bg-[#9af01a]"
              >
                {t('joinClub.logIn')}
              </Link>
              <Link
                to={`/register?next=${encodeURIComponent(next)}&returnUrl=${encodeURIComponent(next)}`}
                className="inline-flex justify-center rounded-xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[#0B0F19] transition hover:bg-[#F4F5F1]"
              >
                {t('joinClub.register')}
              </Link>
            </div>
            <p className="text-xs text-[#94A3B8]">{t('joinClub.afterAuthHint')}</p>
          </div>
        </div>
      </div>
    )
  }

  if (isAlreadyInOtherClub) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F4F5F1] px-4">
        <div className="w-full max-w-md rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-[#475569]">{t('joinClub.toasts.alreadyMember')}</p>
          <Link
            to="/dashboard?tab=club"
            className="mt-6 inline-flex rounded-xl bg-[#0B0F19] px-5 py-2.5 text-sm font-semibold text-[#85E307]"
          >
            {t('joinClub.goDashboard')}
          </Link>
        </div>
      </div>
    )
  }

  if (joinMutation.isError) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F4F5F1] px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-[#475569]">{joinErrorMessage}</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => joinMutation.mutate()}
              className="rounded-xl bg-[#85E307] px-4 py-2.5 text-sm font-bold text-[#0B0F19]"
            >
              {t('joinClub.tryAgain')}
            </button>
            <Link
              to="/dashboard?tab=club"
              className="inline-flex justify-center rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-[#0B0F19]"
            >
              {t('joinClub.goDashboard')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (joinMutation.isPending) {
    return <AppLoadingScreen message={t('joinClub.joining')} />
  }

  if (!modalOpen) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#F4F5F1] px-4">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-black/5 bg-white p-8 text-center shadow-sm">
          <p className="text-sm text-[#475569]">{t('joinClub.cancelledBody')}</p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-xl bg-[#0B0F19] px-5 py-2.5 text-sm font-semibold text-[#85E307]"
          >
            {t('joinClub.reopenInvite')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F19]/55 p-4 backdrop-blur-[6px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="club-join-celebrate-title"
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black/5 bg-white shadow-[0_24px_64px_-20px_rgba(11,15,25,0.55)]"
      >
        <button
          type="button"
          onClick={cancelJoin}
          className="absolute start-3 top-3 z-10 rounded-full p-2 text-[#64748B] transition hover:bg-black/[0.04] hover:text-[#0B0F19]"
          aria-label={t('joinClub.cancel')}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden border-b border-black/5 bg-[#0B0F19] px-6 pb-8 pt-10 text-center text-white">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_0%,rgba(133,227,7,0.22),transparent_55%)]"
            aria-hidden
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#85E307]/35 bg-[#85E307]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#85E307]">
              <Sparkles className="h-3 w-3" aria-hidden />
              {t('joinClub.kicker')}
            </span>
            <h1
              id="club-join-celebrate-title"
              className="mt-4 text-2xl font-bold tracking-tight sm:text-[1.75rem]"
            >
              {t('joinClub.celebrateTitle')}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/65">
              {t('joinClub.celebrateSubtitle')}
            </p>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
          {/* Club card */}
          <div className="rounded-2xl border border-black/[0.06] bg-[#F8FAF8] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 text-start">
                <p className="text-lg font-bold tracking-tight text-[#0B0F19]">
                  {preview?.club_name || '—'}
                </p>
                {(preview?.invited_by_name || preview?.head_name) && (
                  <p className="mt-1 text-sm text-[#475569]">
                    {t('joinClub.invitedByLabel', {
                      name: preview?.invited_by_name || preview?.head_name,
                    })}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#85E307]/40 bg-[#ECFCCB] px-2.5 py-1 text-xs font-bold text-[#3F6F00]">
                  <Shield className="h-3.5 w-3.5" aria-hidden />
                  {t('joinClub.levelBadge', { level: clubLevel })}
                </span>
                <ClubLevelPips level={clubLevel} />
              </div>
            </div>

            {/* Members */}
            <div className="mt-4 border-t border-black/[0.06] pt-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#0B0F19]">
                <Users className="h-4 w-4 text-[#3F6F00]" aria-hidden />
                {t('joinClub.membersHeading', {
                  count: preview?.member_count ?? members.length,
                })}
              </div>
              <ul className="space-y-2">
                {members.slice(0, 6).map((m, i) => {
                  const isHead = m.role === 'head'
                  const initials =
                    m.initials ||
                    (m.full_name || '?')
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((p) => p[0])
                      .join('')
                      .toUpperCase()
                  return (
                    <li key={`${m.full_name}-${i}`} className="flex items-center gap-3">
                      <MemberAvatar initials={initials} isHead={isHead} />
                      <div className="min-w-0 flex-1 text-start">
                        <p className="truncate text-sm font-semibold text-[#0B0F19]">
                          {m.full_name || '—'}
                        </p>
                        <p className="text-[11px] font-medium text-[#64748B]">
                          {roleLabel(m.role)}
                        </p>
                      </div>
                    </li>
                  )
                })}
                {(preview?.member_count ?? 0) > 6 ? (
                  <li className="ps-12 text-xs text-[#64748B]">
                    {t('joinClub.moreMembers', { n: (preview?.member_count ?? 0) - 6 })}
                  </li>
                ) : null}
              </ul>
            </div>
          </div>

          {/* Roles from Django toggles */}
          {roles.length > 0 ? (
            <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#64748B]">
                {t('joinClub.rolesHeading')}
              </p>
              <ul className="mt-3 space-y-2.5">
                {roles.map((r) => (
                  <li key={r.key} className="flex gap-3 text-start">
                    <span
                      className={cn(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                        r.key === 'head' ? 'bg-[#0B0F19] text-[#85E307]' : 'bg-[#ECFCCB] text-[#3F6F00]',
                      )}
                    >
                      {r.key === 'head' ? (
                        <Crown className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <Users className="h-3.5 w-3.5" aria-hidden />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0B0F19]">
                        {t(`joinClub.roleMeta.${r.key}.label`, {
                          defaultValue: r.label,
                        })}
                      </p>
                      <p className="text-xs leading-relaxed text-[#64748B]">
                        {t(`joinClub.roleMeta.${r.key}.description`, {
                          defaultValue: r.description,
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* Offer / benefits */}
          <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ECFCCB] text-[#3F6F00]">
                <Gift className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 text-start">
                {offers.length > 0 ? (
                  <>
                    <p className="text-sm font-bold text-[#0B0F19]">
                      {t('joinClub.activeOfferHeading')}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-[#3F6F00]">{offerSummary}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-[#0B0F19]">{t('joinClub.noOfferTitle')}</p>
                    <p className="mt-1 text-sm leading-relaxed text-[#475569]">
                      {t('joinClub.noOfferUrge')}
                    </p>
                  </>
                )}
                <ul className="mt-3 space-y-2">
                  {benefitKeys.map((key) => (
                    <li key={key} className="flex gap-2 text-sm text-[#334155]">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#3F6F00]" aria-hidden />
                      <span>
                        {t(`joinClub.benefitKeys.${key}`, {
                          defaultValue:
                            key === 'shared_discounts'
                              ? t('joinClub.benefitDefault1')
                              : key === 'member_pricing'
                                ? t('joinClub.benefitDefault2')
                                : t('joinClub.benefitDefault3'),
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {preview?.allow_join_while_in_club ? (
            <p className="rounded-xl border border-black/5 bg-[#F8FAFC] px-3 py-2 text-center text-[11px] leading-relaxed text-[#64748B]">
              {t('joinClub.switchHint')}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2.5 sm:flex-row sm:gap-3">
            <button
              type="button"
              onClick={cancelJoin}
              className="flex-1 rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-semibold text-[#0B0F19] transition hover:bg-[#F4F5F1]"
            >
              {t('joinClub.cancel')}
            </button>
            <button
              type="button"
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="flex-1 rounded-xl bg-[#85E307] px-4 py-3 text-sm font-bold text-[#0B0F19] shadow-[0_8px_24px_-12px_rgba(133,227,7,0.8)] transition hover:bg-[#9af01a] disabled:opacity-50"
            >
              {t('joinClub.joinCta')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
