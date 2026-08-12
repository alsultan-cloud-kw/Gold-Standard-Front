import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { isStaffRole } from '@/utils/authRedirect'
import {
  COMPANY_DESK_HOME,
  isCompanyDeskAllowedPath,
  isCompanyDeskUser,
} from '@/lib/companyDeskScope'

/**
 * Approved company-desk users stay on AML / partner tools only.
 * Retail storefront routes redirect to /gs-kyc.
 */
export default function CompanyDeskScopeGuard() {
  const { user, isAuthenticated, isLoading, isClerkSyncing } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (isLoading || isClerkSyncing || !isAuthenticated || !user) return
    if (isStaffRole(user.role)) return
    if (!isCompanyDeskUser(user)) return
    if (isCompanyDeskAllowedPath(pathname)) return
    navigate(COMPANY_DESK_HOME, { replace: true })
  }, [user, isAuthenticated, isLoading, isClerkSyncing, pathname, navigate])

  return null
}
