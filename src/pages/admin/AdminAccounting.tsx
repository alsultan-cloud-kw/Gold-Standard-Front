import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, FileText, ShoppingBag, Receipt, ShoppingCart, Scale } from 'lucide-react'
import AdminNav from '../../components/admin/AdminNav'
import { accountingApi } from '../../services/api'

const linkKeys: { to: string; labelKey: string; icon: typeof BookOpen; key: 'accounts' | 'journal' | 'sales' | 'buybacks' | 'purchases' | 'expenses' | 'reports' }[] = [
  { to: '/admin/accounting/accounts', labelKey: 'admin.chartOfAccounts', icon: BookOpen, key: 'accounts' },
  { to: '/admin/accounting/journal', labelKey: 'admin.journalEntries', icon: FileText, key: 'journal' },
  { to: '/admin/orders', labelKey: 'admin.salesOrders', icon: ShoppingCart, key: 'sales' },
  { to: '/admin/trading/buybacks', labelKey: 'admin.tradingBuybacks', icon: Scale, key: 'buybacks' },
  { to: '/admin/accounting/purchases', labelKey: 'admin.purchases', icon: ShoppingBag, key: 'purchases' },
  { to: '/admin/accounting/expenses', labelKey: 'admin.expenses', icon: Receipt, key: 'expenses' },
  // { to: '/admin/accounting/reports', labelKey: 'admin.financialReports', icon: BarChart3, key: 'reports' },
]

function countFromResponse(data: unknown): number {
  if (Array.isArray(data)) return data.length
  const p = data as { count?: number; results?: unknown[] }
  if (typeof p?.count === 'number') return p.count
  if (Array.isArray(p?.results)) return p.results.length
  return 0
}

export default function AdminAccounting() {
  const { data: chartData } = useQuery({
    queryKey: ['chartOfAccounts'],
    queryFn: () => accountingApi.getChartOfAccounts(),
  })

  const { data: journalData } = useQuery({
    queryKey: ['journalEntries'],
    queryFn: () => accountingApi.getJournalEntries({ page_size: '1' }),
  })

  const { data: purchasesData } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => accountingApi.getPurchases({ page_size: '1' }),
  })

  const { data: expensesData } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => accountingApi.getExpenses({ page_size: '1' }),
  })

  const counts = useMemo(() => ({
    accounts: Array.isArray(chartData) ? chartData.length : countFromResponse(chartData),
    journal: countFromResponse(journalData),
    sales: 0,
    buybacks: 0,
    purchases: countFromResponse(purchasesData),
    expenses: countFromResponse(expensesData),
  }), [chartData, journalData, purchasesData, expensesData])

  const { t } = useTranslation()
  const getCount = (key: keyof typeof counts) => counts[key] ?? 0
  const getLabel = (key: string) => (key === 'sales' || key === 'buybacks') ? t('admin.view') : `${getCount(key as keyof typeof counts)} ${t('admin.inDatabase')}`

  return (
    <div className="min-h-screen py-8 bg-[var(--site-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="mb-8">
          <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.accountingTitle')}</h1>
          <p className="text-stone-700 mt-1">{t('admin.accountingSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {linkKeys.map(({ to, labelKey, icon: Icon, key }) => (
            <Link
              key={to}
              to={to}
              className="gold-card flex items-center gap-4 p-6 hover:border-lime-400/50 transition-all group"
            >
              <div className="w-12 h-12 rounded-lg bg-lime-100/80 flex items-center justify-center group-hover:bg-lime-200/60 transition-colors">
                <Icon className="w-6 h-6 text-lime-800" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-medium text-black block">{t(labelKey)}</span>
                <span className="text-sm text-stone-700">
                  {key === 'reports' ? t('admin.viewReports') : getLabel(key)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
