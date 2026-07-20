import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { PartyPopper, Users, Gift, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { clubsApi } from '../services/api'
import { formatApiErrorMessage } from '../utils/apiErrors'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'

const JOIN_NEXT = (token: string) => `/join-club?token=${encodeURIComponent(token)}`

export default function JoinClubPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(true)

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
  const isAlreadyInOtherClub =
    joinMutation.isError && joinErrorMessage.toLowerCase().includes('already belong')

  const preview = previewQuery.data
  const offers = preview?.active_offers ?? []
  const members = preview?.members ?? []

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

  if (!token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="gold-card max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-gold-100">{t('joinClub.missingTokenTitle')}</h1>
          <p className="text-gold-100/80 text-sm">{t('joinClub.missingTokenBody')}</p>
          <Link to="/" className="inline-block gold-button px-4 py-2">
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
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="gold-card max-w-md text-center space-y-4">
          <p className="text-gold-100/80 text-sm">{t('joinClub.previewLoadError')}</p>
          <Link to="/" className="inline-block text-gold-400 hover:text-gold-300">
            {t('joinClub.goHome')}
          </Link>
        </div>
      </div>
    )
  }

  if (preview && preview.valid === false) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="gold-card max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-gold-100">{t('joinClub.invalidTitle')}</h1>
          <p className="text-gold-100/80 text-sm">{preview.detail || t('joinClub.invalidBody')}</p>
          <Link to="/" className="inline-block gold-button px-4 py-2">
            {t('joinClub.goHome')}
          </Link>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    const next = JOIN_NEXT(token)
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-8">
        <div className="gold-card max-w-lg text-center space-y-5 w-full">
          <h1 className="text-2xl font-semibold text-gold-100">{t('joinClub.title')}</h1>
          {preview?.club_name && (
            <p className="text-gold-200 font-medium text-lg">{preview.club_name}</p>
          )}
          <p className="text-gold-100/80 text-sm leading-relaxed">{t('joinClub.subtitle')}</p>
          {(preview?.invited_by_name || preview?.head_name) && (
            <p className="text-gold-100/60 text-xs">
              {t('joinClub.invitedByLabel', {
                name: preview.invited_by_name || preview.head_name,
              })}
            </p>
          )}
          {offers.length > 0 ? (
            <p className="text-amber-200/90 text-sm">{t('joinClub.offerTeaser', { offer: offerSummary })}</p>
          ) : (
            <p className="text-amber-200/80 text-sm">{t('joinClub.noOfferUrgeAuth')}</p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to={`/login?next=${encodeURIComponent(next)}&returnUrl=${encodeURIComponent(next)}`}
              className="gold-button inline-flex justify-center px-4 py-2.5"
            >
              {t('joinClub.logIn')}
            </Link>
            <Link
              to={`/register?next=${encodeURIComponent(next)}&returnUrl=${encodeURIComponent(next)}`}
              className="inline-flex justify-center px-4 py-2.5 rounded-lg border border-gold-500/40 text-gold-100 hover:bg-gold-500/10"
            >
              {t('joinClub.register')}
            </Link>
          </div>
          <p className="text-gold-100/50 text-xs pt-2">{t('joinClub.afterAuthHint')}</p>
        </div>
      </div>
    )
  }

  if (isAlreadyInOtherClub) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="gold-card max-w-md text-center space-y-4">
          <p className="text-gold-100/80 text-sm">{t('joinClub.toasts.alreadyMember')}</p>
          <Link to="/dashboard?tab=club" className="gold-button inline-block px-4 py-2">
            {t('joinClub.goDashboard')}
          </Link>
        </div>
      </div>
    )
  }

  if (joinMutation.isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="gold-card max-w-md text-center space-y-4">
          <p className="text-gold-100/80 text-sm">{joinErrorMessage}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button type="button" onClick={() => joinMutation.mutate()} className="gold-button px-4 py-2">
              {t('joinClub.tryAgain')}
            </button>
            <Link
              to="/dashboard?tab=club"
              className="inline-flex justify-center px-4 py-2 text-gold-400 hover:text-gold-300"
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
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="gold-card max-w-md text-center space-y-4">
          <p className="text-gold-100/80 text-sm">{t('joinClub.cancelledBody')}</p>
          <button type="button" onClick={() => setModalOpen(true)} className="gold-button px-4 py-2">
            {t('joinClub.reopenInvite')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="club-join-celebrate-title"
        className="gold-card relative w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl border border-amber-500/30"
      >
        <button
          type="button"
          onClick={cancelJoin}
          className="absolute top-3 end-3 p-1.5 rounded-full text-gold-100/60 hover:bg-gold-500/10"
          aria-label={t('joinClub.cancel')}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2 pt-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/20 text-amber-300 mx-auto">
            <PartyPopper className="w-7 h-7" />
          </div>
          <h1 id="club-join-celebrate-title" className="text-2xl font-semibold text-gold-100">
            {t('joinClub.celebrateTitle')}
          </h1>
          <p className="text-gold-100/70 text-sm">{t('joinClub.celebrateSubtitle')}</p>
        </div>

        <div className="rounded-xl bg-black/25 border border-gold-500/20 p-4 space-y-3 text-start">
          <p className="text-lg font-medium text-amber-200">{preview?.club_name}</p>
          {(preview?.invited_by_name || preview?.head_name) && (
            <p className="text-sm text-gold-100/80">
              {t('joinClub.invitedByLabel', {
                name: preview?.invited_by_name || preview?.head_name,
              })}
            </p>
          )}
          <div className="flex items-start gap-2 text-sm text-gold-100/80">
            <Users className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
            <div>
              <p className="font-medium">
                {t('joinClub.membersHeading', { count: preview?.member_count ?? members.length })}
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-gold-100/60">
                {members.slice(0, 8).map((m, i) => (
                  <li key={`${m.full_name}-${i}`}>
                    {m.full_name || '—'}
                    {m.role === 'head' ? ` (${t('joinClub.roleHead')})` : ''}
                  </li>
                ))}
                {(preview?.member_count ?? 0) > 8 && (
                  <li>{t('joinClub.moreMembers', { n: (preview?.member_count ?? 0) - 8 })}</li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <Gift className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
            {offers.length > 0 ? (
              <div className="text-emerald-200/90">
                <p className="font-medium">{t('joinClub.activeOfferHeading')}</p>
                <p className="text-xs mt-1 text-gold-100/80">{offerSummary}</p>
              </div>
            ) : (
              <div className="text-amber-100/90 space-y-2">
                <p className="font-medium">{t('joinClub.noOfferTitle')}</p>
                <p className="text-xs text-gold-100/70">{t('joinClub.noOfferUrge')}</p>
                <ul className="text-xs text-gold-100/60 list-disc ps-4 space-y-1">
                  {[
                    t('joinClub.benefitDefault1'),
                    t('joinClub.benefitDefault2'),
                    t('joinClub.benefitDefault3'),
                  ].map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
            className="gold-button flex-1 px-4 py-3 text-sm font-semibold disabled:opacity-50"
          >
            {t('joinClub.joinCta')}
          </button>
          <button
            type="button"
            onClick={cancelJoin}
            className="flex-1 px-4 py-3 text-sm rounded-lg border border-gold-500/40 text-gold-100/80 hover:bg-gold-500/10"
          >
            {t('joinClub.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
