import { useMemo, useState, useCallback, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Users,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Scale,
} from 'lucide-react'
import { ordersApi, inventoryApi } from '../../services/api'
import AdminPaginationBar from '../../components/admin/AdminPaginationBar'

type OrderRow = {
  id: string
  invoice_number: string
  customer_name: string
  total_amount: string
  status: string
  status_display?: string
  sale_date: string
}

type LowStockRow = {
  id: string
  product_name: string
  product_sku: string
  product_serial_number?: string
  branch_name: string
  available_quantity: number
  low_stock_threshold: number
}

function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const p = data as { results?: T[] } | undefined
  return p?.results ?? []
}

function localISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function todayDate(): Date {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const [allTime, setAllTime] = useState(true)
  const [startDate, setStartDate] = useState(() => {
    const end = todayDate()
    const start = new Date(end)
    start.setDate(start.getDate() - 29)
    return localISODate(start)
  })
  const [endDate, setEndDate] = useState(() => localISODate(todayDate()))

  const rangeValid = allTime || startDate <= endDate

  const statsParams = useMemo(
    () => (allTime ? ({ all: '1' as const } as const) : { start_date: startDate, end_date: endDate }),
    [allTime, startDate, endDate],
  )

  const { data: statsRaw, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['adminDashboardStats', statsParams],
    queryFn: () => ordersApi.getDashboardStats(statsParams),
    enabled: rangeValid,
  })

  const { data: recentOrdersRaw, isLoading: ordersLoading } = useQuery({
    queryKey: ['adminRecentOrders', allTime, startDate, endDate],
    queryFn: () =>
      allTime
        ? ordersApi.getOrders({ page_size: '200', ordering: '-sale_date' })
        : ordersApi.getOrders({
            start_date: startDate,
            end_date: endDate,
            page_size: '200',
            ordering: '-sale_date',
          }),
    enabled: rangeValid,
  })

  const { data: lowStockRaw, isLoading: lowStockLoading } = useQuery({
    queryKey: ['adminLowStock'],
    queryFn: () => inventoryApi.getLowStock(),
  })

  const recentOrders = useMemo(() => asList<OrderRow>(recentOrdersRaw), [recentOrdersRaw])

  const recentOrderPageSize = 10
  const [recentOrderPage, setRecentOrderPage] = useState(1)
  const recentOrderTotal = recentOrders.length
  const recentOrderTotalPages = Math.max(1, Math.ceil(recentOrderTotal / recentOrderPageSize))
  const recentOrderPageRows = useMemo(
    () =>
      recentOrders.slice(
        (recentOrderPage - 1) * recentOrderPageSize,
        recentOrderPage * recentOrderPageSize,
      ),
    [recentOrders, recentOrderPage],
  )

  useEffect(() => {
    setRecentOrderPage(1)
  }, [allTime, startDate, endDate, recentOrdersRaw])

  useEffect(() => {
    if (recentOrderPage > recentOrderTotalPages) setRecentOrderPage(recentOrderTotalPages)
  }, [recentOrderPage, recentOrderTotalPages])

  const lowStockItems = useMemo(() => asList<LowStockRow>(lowStockRaw), [lowStockRaw])

  const salesSummary = useMemo(() => {
    if (!statsRaw || typeof statsRaw !== 'object') {
      return { total: 0, count: 0, newCustomers: 0 }
    }
    const obj = statsRaw as {
      total_amount?: string | number
      order_count?: number
      new_customers_count?: number
    }
    return {
      total: obj.total_amount ?? 0,
      count: obj.order_count ?? 0,
      newCustomers: obj.new_customers_count ?? 0,
    }
  }, [statsRaw])

  const applyPreset = useCallback((preset: 'today' | 'last30' | 'month' | 'ytd' | 'all') => {
    const end = todayDate()
    if (preset === 'all') {
      setAllTime(true)
      setEndDate(localISODate(end))
      return
    }
    setAllTime(false)
    setEndDate(localISODate(end))
    if (preset === 'today') {
      const s = localISODate(end)
      setStartDate(s)
      setEndDate(s)
      return
    }
    if (preset === 'last30') {
      const s = new Date(end)
      s.setDate(s.getDate() - 29)
      setStartDate(localISODate(s))
      return
    }
    if (preset === 'month') {
      setStartDate(localISODate(new Date(end.getFullYear(), end.getMonth(), 1)))
      return
    }
    if (preset === 'ytd') {
      setStartDate(localISODate(new Date(end.getFullYear(), 0, 1)))
    }
  }, [])

  const formatNumber = (value: string | number | undefined, fractionDigits = 0) => {
    if (value == null) return '0'
    const num = typeof value === 'number' ? value : Number(value)
    if (Number.isNaN(num)) return '0'
    return num.toLocaleString(undefined, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
  }

  const periodDescription = allTime
    ? `${t('admin.presetAllTime')} · ${t('admin.dashboardThroughToday')}`
    : `${startDate} → ${endDate}`

  const kpiCards: {
    titleKey: string
    value: string
    change: string | null
    trend: 'up' | 'down' | 'neutral'
    icon: typeof DollarSign
  }[] = [
    {
      titleKey: 'admin.totalSales',
      value: statsLoading ? '…' : `${formatNumber(salesSummary.total, 3)} KWD`,
      change: null,
      trend: 'neutral' as const,
      icon: DollarSign,
    },
    {
      titleKey: 'admin.orders',
      value: statsLoading ? '…' : formatNumber(salesSummary.count),
      change: null,
      trend: 'neutral' as const,
      icon: ShoppingBag,
    },
    {
      titleKey: allTime ? 'admin.registeredCustomers' : 'admin.newCustomers',
      value: statsLoading ? '…' : formatNumber(salesSummary.newCustomers),
      change: null,
      trend: 'neutral' as const,
      icon: Users,
    },
    {
      titleKey: 'admin.lowStockItems',
      value: formatNumber(lowStockItems.length),
      change: null,
      trend: 'neutral' as const,
      icon: AlertTriangle,
    },
  ]

  const accountingShortcutClass =
    'inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-xl border border-black/10 text-[#0B0F19] bg-white hover:bg-[rgba(236,252,203,0.55)] hover:border-[rgba(133,227,7,0.4)] transition-colors'

  return (
    <div className="admin-page-inner">
      <div className="admin-page-body">
        <header className="admin-page-header">
          <div>
            <h1 className="admin-page-title">{t('admin.adminDashboard')}</h1>
            <p className="admin-page-subtitle">{t('admin.welcomeBack')}</p>
          </div>
          <p className="text-sm text-[#64748B] tabular-nums">{new Date().toLocaleDateString()}</p>
        </header>

        <div className="dashboard-panel mb-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="dashboard-panel__title !mb-0 !text-base">{t('admin.dashboardPeriod')}</p>
              <p className="text-sm text-[#3F6F00] font-mono tabular-nums">{periodDescription}</p>
            </div>
            <div className="admin-segment">
              {(
                [
                  ['today', 'admin.presetToday'],
                  ['last30', 'admin.presetLast30Days'],
                  ['month', 'admin.presetThisMonth'],
                  ['ytd', 'admin.presetYearToDate'],
                  ['all', 'admin.presetAllTime'],
                ] as const
              ).map(([id, key]) => (
                <button
                  key={id}
                  type="button"
                  className={`admin-segment__btn${id === 'all' && allTime ? ' admin-segment__btn--active' : ''}`}
                  onClick={() => applyPreset(id)}
                >
                  {t(key)}
                </button>
              ))}
            </div>
            <div
              className={`flex flex-col md:flex-row md:items-end gap-4 ${allTime ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <label className="flex flex-col gap-1 text-sm text-[#334155]">
                {t('admin.from')}
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setAllTime(false)
                    setStartDate(e.target.value)
                  }}
                  className="dashboard-field"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-[#334155]">
                {t('admin.to')}
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setAllTime(false)
                    setEndDate(e.target.value)
                  }}
                  className="dashboard-field"
                />
              </label>
            </div>
            {allTime && (
              <p className="text-xs text-[#64748B]">
                {t('admin.dashboardThroughToday')} — {localISODate(todayDate())}
              </p>
            )}
            {!rangeValid && <p className="text-sm text-red-600">{t('admin.invalidDateRange')}</p>}
            {statsError && <p className="text-sm text-red-600">{t('common.error')}</p>}

            <div className="pt-4 mt-1 border-t border-black/[0.06]">
              <p className="text-xs font-semibold text-[#64748B] mb-2">{t('admin.accountingShortcuts')}</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/accounting/accounts#chart-of-accounts" className={accountingShortcutClass}>
                  <BookOpen className="w-4 h-4 text-[#3F6F00] shrink-0" aria-hidden />
                  <span>{t('admin.chartOfAccountsTitle')}</span>
                </Link>
                <Link to="/admin/accounting/accounts#trial-balance" className={accountingShortcutClass}>
                  <Scale className="w-4 h-4 text-[#3F6F00] shrink-0" aria-hidden />
                  <span>{t('admin.trialBalance')}</span>
                </Link>
                <Link to="/admin/accounting/purchases" className={accountingShortcutClass}>
                  <ShoppingBag className="w-4 h-4 text-[#3F6F00] shrink-0" aria-hidden />
                  <span>{t('admin.purchases')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="admin-kpi-grid">
          {kpiCards.map((card, index) => (
            <div key={index} className="admin-kpi-card">
              <div className="flex items-start justify-between gap-3">
                <div className="admin-kpi-card__icon">
                  <card.icon className="w-5 h-5" aria-hidden />
                </div>
                {card.change ? (
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      card.trend === 'up'
                        ? 'text-emerald-600'
                        : card.trend === 'down'
                          ? 'text-red-600'
                          : 'text-[#64748B]'
                    }`}
                  >
                    {card.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                    {card.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                    {card.change}
                  </div>
                ) : null}
              </div>
              <p className="admin-kpi-card__value">{card.value}</p>
              <p className="admin-kpi-card__label">{t(card.titleKey)}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="dashboard-panel">
            <h2 className="dashboard-panel__title">{t('admin.recentOrdersInRange')}</h2>
            {ordersLoading ? (
              <p className="dashboard-empty !py-6">{t('common.loading')}</p>
            ) : recentOrders.length === 0 ? (
              <p className="dashboard-empty !py-6">{t('admin.noOrdersFound')}</p>
            ) : (
              <>
                <div className="space-y-2">
                  {recentOrderPageRows.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-[#F9F9FA] p-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#0B0F19]">
                          {t('admin.orderNumber')} #{order.invoice_number}
                        </p>
                        <p className="text-xs text-[#64748B] truncate">
                          {order.customer_name || t('admin.customer')} ·{' '}
                          {new Date(order.sale_date).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-end shrink-0">
                        <p className="text-sm font-semibold text-[#3F6F00] tabular-nums">
                          {formatNumber(order.total_amount, 3)} KWD
                        </p>
                        <p className="text-xs text-emerald-700">
                          {order.status_display || order.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {!ordersLoading && recentOrderTotal > recentOrderPageSize ? (
                  <AdminPaginationBar
                    page={recentOrderPage}
                    totalPages={recentOrderTotalPages}
                    total={recentOrderTotal}
                    pageSize={recentOrderPageSize}
                    onPageChange={setRecentOrderPage}
                    itemLabel="orders"
                  />
                ) : null}
              </>
            )}
          </div>

          <div className="dashboard-panel">
            <h2 className="dashboard-panel__title">{t('admin.lowStockAlerts')}</h2>
            <p className="dashboard-panel__subtitle">{t('admin.lowStockSnapshotNote')}</p>
            {lowStockLoading ? (
              <p className="dashboard-empty !py-6">{t('common.loading')}</p>
            ) : lowStockItems.length === 0 ? (
              <p className="dashboard-empty !py-6">{t('admin.noLowStockItems')}</p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-black/[0.06] bg-[#F9F9FA] p-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0B0F19] truncate">{item.product_name}</p>
                      <p className="text-xs text-[#64748B]">
                        {t('admin.sku')}: {item.product_sku}
                        {item.product_serial_number
                          ? ` · ${t('admin.serial')}: ${item.product_serial_number}`
                          : ''}
                      </p>
                      <p className="text-xs text-[#64748B]">{item.branch_name}</p>
                    </div>
                    <div className="text-end shrink-0">
                      <p className="text-sm font-semibold text-red-600 tabular-nums">
                        {item.available_quantity} {t('admin.left')}
                      </p>
                      <p className="text-xs text-[#64748B]">
                        {t('admin.min')}: {item.low_stock_threshold}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
