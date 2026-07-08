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
  CreditCard,
  Database,
  Wallet,
} from 'lucide-react'
import { TRADING_AND_VIRTUAL_WALLET_ENABLED, BANK_CHANGE_REQUESTS_ENABLED } from '@/featureFlags'
import { useAuth } from '@/contexts/AuthContext'

const CATALOG_MANAGER_ROLES = new Set(['admin', 'general_manager', 'branch_manager'])

const adminSectionKeys: { path: string; labelKey: string; icon: typeof LayoutDashboard }[] = [
  { path: '/admin', labelKey: 'admin.dashboard', icon: LayoutDashboard },
  { path: '/admin/products', labelKey: 'admin.products', icon: Package },
  { path: '/admin/categories', labelKey: 'admin.categories', icon: FolderTree },
  { path: '/admin/orders', labelKey: 'admin.orders', icon: ShoppingCart },
  { path: '/admin/checkout-payment', labelKey: 'admin.checkoutPaymentNav', icon: Wallet },
  ...(TRADING_AND_VIRTUAL_WALLET_ENABLED
    ? [
        { path: '/admin/trading/buybacks', labelKey: 'admin.tradingBuybacks', icon: Scale },
        { path: '/admin/trading/virtual-gold', labelKey: 'admin.tradingVirtualGold', icon: Crown },
      ]
    : []),
  { path: '/admin/inventory', labelKey: 'admin.inventory', icon: Warehouse },
  { path: '/admin/prices', labelKey: 'admin.prices', icon: Tag },
  { path: '/admin/scrapped-data', labelKey: 'admin.scrappedData', icon: Database },
  ...(BANK_CHANGE_REQUESTS_ENABLED
    ? [{ path: '/admin/bank-requests', labelKey: 'admin.bankRequestsNav', icon: CreditCard }]
    : []),
  { path: '/admin/customers', labelKey: 'admin.customers', icon: Users },
  { path: '/admin/reports', labelKey: 'admin.reports', icon: BarChart3 },
  { path: '/admin/accounting', labelKey: 'admin.accounting', icon: Calculator },
  { path: '/admin/invoices', labelKey: 'admin.invoices', icon: Receipt },
  { path: '/admin/clubs', labelKey: 'admin.clubsNav', icon: Crown },
]

export default function AdminNav() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user } = useAuth()
  const canManageCatalog = Boolean(user?.role && CATALOG_MANAGER_ROLES.has(user.role))

  const visibleSections = adminSectionKeys.filter((section) => {
    if (section.path === '/admin/products' || section.path === '/admin/categories') {
      return canManageCatalog
    }
    return true
  })

  return (
    <nav className="flex flex-wrap gap-2 mb-6">
      {visibleSections.map(({ path, labelKey, icon: Icon }) => {
        const isActive = location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path))
        return (
          <Link
            key={path}
            to={path}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-lime-200/60 text-lime-900 border border-lime-300/50'
                : 'bg-siteBg/90 text-slate-700 hover:bg-lime-100/90 hover:text-black border border-transparent'
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
