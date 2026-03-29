import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Warehouse,
  Tag,
  Users,
  BarChart3,
  Calculator,
  Receipt,
  Scale,
  Crown,
} from 'lucide-react'

const adminSectionKeys: { path: string; labelKey: string; icon: typeof LayoutDashboard }[] = [
  { path: '/admin', labelKey: 'admin.dashboard', icon: LayoutDashboard },
  { path: '/admin/products', labelKey: 'admin.products', icon: Package },
  { path: '/admin/categories', labelKey: 'admin.categories', icon: FolderTree },
  { path: '/admin/orders', labelKey: 'admin.orders', icon: ShoppingCart },
  { path: '/admin/trading/buybacks', labelKey: 'admin.tradingBuybacks', icon: Scale },
  { path: '/admin/trading/virtual-gold', labelKey: 'admin.tradingVirtualGold', icon: Crown },
  { path: '/admin/inventory', labelKey: 'admin.inventory', icon: Warehouse },
  { path: '/admin/prices', labelKey: 'admin.prices', icon: Tag },
  { path: '/admin/customers', labelKey: 'admin.customers', icon: Users },
  { path: '/admin/reports', labelKey: 'admin.reports', icon: BarChart3 },
  { path: '/admin/accounting', labelKey: 'admin.accounting', icon: Calculator },
  { path: '/admin/invoices', labelKey: 'admin.invoices', icon: Receipt },
  { path: '/admin/clubs', labelKey: 'admin.clubsNav', icon: Crown },
]

export default function AdminNav() {
  const { t } = useTranslation()
  const location = useLocation()

  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {adminSectionKeys.map(({ path, labelKey, icon: Icon }) => {
        const isActive = location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path))
        return (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-gold-500/20 text-gold-600 border border-gold-500/40'
                : 'bg-siteBg/90 text-slate-700 hover:bg-amber-100/80 hover:text-amber-900 border border-transparent'
            }`}
          >
            <Icon className="w-4 h-4" />
            {t(labelKey)}
          </Link>
        )
      })}
    </nav>
  )
}
