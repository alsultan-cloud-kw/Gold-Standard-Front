import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import StaffPreviewBar from '@/components/layout/StaffPreviewBar'
import FloatingPriceReminder from '@/components/reminders/FloatingPriceReminder'
import WebPushBootstrap from '@/components/notifications/WebPushBootstrap'
import { PendingKnetPaymentGuard } from '@/components/checkout/PendingKnetPaymentGuard'
import { useAuth } from '@/contexts/AuthContext'
import { isCompanyDeskUser } from '@/lib/companyDeskScope'
import { isStaffRole } from '@/utils/authRedirect'

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

/** Company shop TV / kiosk: `/company-prices?display=1` hides chrome footer. */
function isCompanyDisplayKiosk(pathname: string, search: string): boolean {
  const path = pathname.split('?')[0] || '/'
  if (path !== '/company-prices' && !path.startsWith('/company-prices/')) return false
  return new URLSearchParams(search).get('display') === '1'
}

export default function AppChrome({ children }: { children: ReactNode }) {
  const { pathname, search } = useLocation()
  const { user } = useAuth()
  const adminRoute = isAdminPath(pathname)
  const companyDesk =
    isCompanyDeskUser(user) && !isStaffRole(user?.role)
  const displayKiosk = isCompanyDisplayKiosk(pathname, search)

  if (adminRoute) {
    return (
      <div className="min-h-screen bg-siteBg admin-route-root">
        <WebPushBootstrap />
        {children}
      </div>
    )
  }

  return (
    <div className={displayKiosk ? 'min-h-dvh overflow-x-clip bg-[#0B0F19]' : 'min-h-screen bg-siteBg'}>
      <WebPushBootstrap />
      {!companyDesk && !displayKiosk ? <StaffPreviewBar /> : null}
      {!displayKiosk ? <Navbar /> : null}
      {!companyDesk && !displayKiosk ? <PendingKnetPaymentGuard /> : null}
      {children}
      {!displayKiosk ? <Footer /> : null}
      {!companyDesk && !displayKiosk ? <FloatingPriceReminder /> : null}
    </div>
  )
}
