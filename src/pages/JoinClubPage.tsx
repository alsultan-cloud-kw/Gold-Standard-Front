import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { clubsApi } from '../services/api'

export default function JoinClubPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [tried, setTried] = useState(false)
  const [joinErrorDetail, setJoinErrorDetail] = useState('')

  const joinMutation = useMutation({
    mutationFn: () => clubsApi.join(token),
    onSuccess: () => {
      toast.success('You joined the club.')
      navigate('/dashboard', { replace: true })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      const detail = e?.response?.data?.detail || 'Could not join club'
      setJoinErrorDetail(detail)
      toast.error(detail)
    },
  })

  useEffect(() => {
    if (!token || authLoading) return
    if (!isAuthenticated || tried) return
    setTried(true)
    joinMutation.mutate()
  }, [token, isAuthenticated, authLoading, tried])

  if (!token) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="gold-card max-w-md text-center">
          <p className="text-gold-100">Missing invite link. Ask your friend for a valid club invitation.</p>
          <Link to="/" className="inline-block mt-4 text-gold-400 hover:text-gold-300">
            Home
          </Link>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="gold-card max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-gold-100">Join a club</h1>
          <p className="text-gold-100/80 text-sm">Sign in or register to accept this invitation.</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              to={`/login?next=${encodeURIComponent(`/join-club?token=${token}`)}`}
              className="gold-button inline-flex justify-center px-4 py-2"
            >
              Log in
            </Link>
            <Link
              to={`/register?next=${encodeURIComponent(`/join-club?token=${token}`)}`}
              className="inline-flex justify-center px-4 py-2 rounded-lg border border-gold-500/40 text-gold-100 hover:bg-gold-500/10"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="gold-card max-w-md text-center space-y-4">
        {joinMutation.isPending || !tried ? (
          <>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-gold-400" />
            <p className="text-gold-100/80">Joining club…</p>
          </>
        ) : joinMutation.isError ? (
          <>
            <p className="text-gold-100/80">
              {joinErrorDetail || 'Something went wrong. You can try again from your dashboard.'}
            </p>
            <Link to="/dashboard" className="text-gold-400 hover:text-gold-300">
              Go to dashboard
            </Link>
          </>
        ) : null}
      </div>
    </div>
  )
}
