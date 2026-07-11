import { useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { clubsApi } from '../services/api'
import { formatApiErrorMessage } from '../utils/apiErrors'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'

const JOIN_NEXT = (token: string) =>
  `/join-club?token=${encodeURIComponent(token)}`

export default function JoinClubPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const joinAttemptedRef = useRef(false)

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

  const alreadyClubRedirectDone = useRef(false)
  useEffect(() => {
    if (!isAlreadyInOtherClub || alreadyClubRedirectDone.current) return
    alreadyClubRedirectDone.current = true
    toast.success(t('joinClub.toasts.alreadyMember'))
    void queryClient.invalidateQueries({ queryKey: ['clubMembership'] })
    void queryClient.invalidateQueries({ queryKey: ['clubOffers'] })
    navigate('/dashboard?tab=club', { replace: true })
  }, [isAlreadyInOtherClub, navigate, queryClient, t])

  useEffect(() => {
    joinAttemptedRef.current = false
    alreadyClubRedirectDone.current = false
  }, [token])

  useEffect(() => {
    if (!token || authLoading || !isAuthenticated) return
    if (!previewQuery.isSuccess || previewQuery.data?.valid !== true) return
    if (joinAttemptedRef.current || joinMutation.isPending || joinMutation.isSuccess) return
    joinAttemptedRef.current = true
    joinMutation.mutate()
  }, [
    token,
    authLoading,
    isAuthenticated,
    previewQuery.isSuccess,
    previewQuery.data?.valid,
    joinMutation.isPending,
    joinMutation.isSuccess,
    joinMutation.mutate,
  ])

  const retryJoin = () => {
    joinAttemptedRef.current = false
    joinMutation.reset()
    joinMutation.mutate()
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

  if (previewQuery.isLoading) {
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

  const preview = previewQuery.data
  if (preview && preview.valid === false) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="gold-card max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-gold-100">{t('joinClub.invalidTitle')}</h1>
          <p className="text-gold-100/80 text-sm">
            {preview.detail || t('joinClub.invalidBody')}
          </p>
          <Link to="/" className="inline-block gold-button px-4 py-2">
            {t('joinClub.goHome')}
          </Link>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return <AppLoadingScreen />
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
          {preview?.head_name && (
            <p className="text-gold-100/60 text-xs">
              {t('joinClub.headLabel', { name: preview.head_name })}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link to={`/login?next=${encodeURIComponent(next)}`} className="gold-button inline-flex justify-center px-4 py-2.5">
              {t('joinClub.logIn')}
            </Link>
            <Link
              to={`/register?next=${encodeURIComponent(next)}`}
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
    return <AppLoadingScreen message={t('joinClub.redirecting')} />
  }

  if (joinMutation.isError) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="gold-card max-w-md text-center space-y-4">
          <p className="text-gold-100/80 text-sm">{joinErrorMessage}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button type="button" onClick={() => retryJoin()} className="gold-button px-4 py-2">
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

  return <AppLoadingScreen message={t('joinClub.joining')} />
}
