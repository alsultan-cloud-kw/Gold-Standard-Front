import type { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import StaffPreviewBar from '@/components/layout/StaffPreviewBar'
import FloatingPriceReminder from '@/components/reminders/FloatingPriceReminder'

function isAdminPath(pathname: string): boolean {
  return pathname === '/admin' || pathname.startsWith('/admin/')
}

export default function AppChrome({ children }: { children: ReactNode }) {
  const { pathname } = useLocation()
  const adminRoute = isAdminPath(pathname)

  if (adminRoute) {
    return <div className="min-h-screen bg-siteBg admin-route-root">{children}</div>
  }

  return (
    <div className="min-h-screen bg-siteBg">
      <StaffPreviewBar />
      <Navbar />
      {children}
      <Footer />
      <FloatingPriceReminder />
    </div>
  )
}
