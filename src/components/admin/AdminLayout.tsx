import { Outlet } from 'react-router-dom'
import AdminNav from './AdminNav'

/**
 * Shared admin shell — nav stays mounted across tab changes so the page
 * does not remount and jump when switching routes.
 */
export default function AdminLayout() {
  return (
    <div className="admin-page">
      <div className="page-shell page-section admin-shell">
        <AdminNav />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
