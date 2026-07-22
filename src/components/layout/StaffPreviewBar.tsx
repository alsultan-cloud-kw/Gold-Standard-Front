import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { isStaffRole } from '@/utils/authRedirect'

/** Shown when staff browse the public storefront — quick return to /admin. */
export default function StaffPreviewBar() {
  const { t } = useTranslation()
  const { user, isAuthenticated, isLoading } = useAuth()

  if (isLoading || !isAuthenticated || !isStaffRole(user?.role)) {
    return null
  }

  return (
    <div className="staff-preview-bar" role="status">
      <div className="staff-preview-bar__inner page-shell">
        <p className="staff-preview-bar__text">{t('nav.staffPreviewHint')}</p>
        <Link to="/admin" className="staff-preview-bar__link">
          <LayoutDashboard className="h-4 w-4 shrink-0" aria-hidden />
          {t('nav.backToAdmin')}
        </Link>
      </div>
    </div>
  )
}
