import { Outlet } from 'react-router-dom'
import AdminNav from './AdminNav'
import AdminTopBar from './AdminTopBar'

/**
 * Shared admin shell — dedicated header + tab nav (no storefront navbar/footer).
 */
export default function AdminLayout() {
  return (
    <div className="admin-page">
      <AdminTopBar />
      <div className="page-shell page-section admin-shell">
        <AdminNav />
        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
