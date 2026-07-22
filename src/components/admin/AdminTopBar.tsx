import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ExternalLink, LogOut } from 'lucide-react'
import { useAuth as useClerkAuth } from '@clerk/react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import logo from '@/assets/logo.png'
import { cn } from '@/lib/utils'

export default function AdminTopBar() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { isSignedIn: clerkSignedIn, signOut: clerkSignOut } = useClerkAuth()

  const handleLogout = () => {
    void (async () => {
      if (clerkSignedIn) {
        try {
          await clerkSignOut()
        } catch (e) {
          console.error('Clerk signOut failed:', e)
        }
      }
      await logout()
      navigate('/login', { replace: true })
    })()
  }

  return (
    <header className="admin-top-bar" aria-label={t('admin.adminDashboard')}>
      <div className="admin-top-bar__inner page-shell">
        <Link to="/admin" className="admin-top-bar__brand">
          <img src={logo} alt="" className="admin-top-bar__logo" />
          <span className="admin-top-bar__title">{t('admin.consoleTitle')}</span>
        </Link>

        <div className="admin-top-bar__actions">
          <Link to="/" className={cn('admin-top-bar__link', 'admin-top-bar__link--primary')}>
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            {t('nav.viewWebsite')}
          </Link>
          {user ? (
            <span className="admin-top-bar__user hidden sm:inline">{user.full_name}</span>
          ) : null}
          <button type="button" onClick={handleLogout} className="admin-top-bar__logout">
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">{t('nav.logout')}</span>
          </button>
        </div>
      </div>
    </header>
  )
}
