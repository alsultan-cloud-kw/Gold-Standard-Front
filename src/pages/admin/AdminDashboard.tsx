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
import AdminNav from '../../components/admin/AdminNav'
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

  const presetBtn =
    'px-3 py-1.5 text-xs font-medium rounded-lg border border-black/15 text-stone-800 hover:bg-lime-100 transition-colors'

  const accountingShortcutClass =
    'inline-flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg border border-black/15 text-black/95 bg-white/80 hover:bg-lime-200/50 hover:border-lime-400/60 transition-colors'

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.adminDashboard')}</h1>
            <p className="gold-gradient-text-on-light">{t('admin.welcomeBack')}</p>
          </div>
          <div className="text-right sm:text-end">
            <p className="text-sm text-stone-600">{new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div className="gold-card mb-8">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <p className="text-sm font-medium text-black">{t('admin.dashboardPeriod')}</p>
              <p className="text-sm text-lime-800 font-mono">{periodDescription}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={presetBtn} onClick={() => applyPreset('today')}>
                {t('admin.presetToday')}
              </button>
              <button type="button" className={presetBtn} onClick={() => applyPreset('last30')}>
                {t('admin.presetLast30Days')}
              </button>
              <button type="button" className={presetBtn} onClick={() => applyPreset('month')}>
                {t('admin.presetThisMonth')}
              </button>
              <button type="button" className={presetBtn} onClick={() => applyPreset('ytd')}>
                {t('admin.presetYearToDate')}
              </button>
              <button type="button" className={presetBtn} onClick={() => applyPreset('all')}>
                {t('admin.presetAllTime')}
              </button>
            </div>
            <div
              className={`flex flex-col md:flex-row md:items-end gap-4 ${allTime ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <label className="flex flex-col gap-1 text-sm text-stone-700">
                {t('admin.from')}
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setAllTime(false)
                    setStartDate(e.target.value)
                  }}
                  className="rounded-lg bg-white border border-stone-200 text-black px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm text-stone-700">
                {t('admin.to')}
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setAllTime(false)
                    setEndDate(e.target.value)
                  }}
                  className="rounded-lg bg-white border border-stone-200 text-black px-3 py-2 text-sm"
                />
              </label>
            </div>
            {allTime && (
              <p className="text-xs text-stone-500">{t('admin.dashboardThroughToday')} — {localISODate(todayDate())}</p>
            )}
            {!rangeValid && <p className="text-sm text-red-400">{t('admin.invalidDateRange')}</p>}
            {statsError && <p className="text-sm text-red-400">{t('common.error')}</p>}

            <div className="pt-4 mt-2 border-t border-stone-200">
              <p className="text-xs font-medium text-stone-700 mb-2">{t('admin.accountingShortcuts')}</p>
              <div className="flex flex-wrap gap-2">
                <Link to="/admin/accounting/accounts#chart-of-accounts" className={accountingShortcutClass}>
                  <BookOpen className="w-4 h-4 text-lime-800 shrink-0" aria-hidden />
                  <span>{t('admin.chartOfAccountsTitle')}</span>
                </Link>
                <Link to="/admin/accounting/accounts#trial-balance" className={accountingShortcutClass}>
                  <Scale className="w-4 h-4 text-lime-800 shrink-0" aria-hidden />
                  <span>{t('admin.trialBalance')}</span>
                </Link>
                <Link to="/admin/accounting/purchases" className={accountingShortcutClass}>
                  <ShoppingBag className="w-4 h-4 text-lime-800 shrink-0" aria-hidden />
                  <span>{t('admin.purchases')}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((card, index) => (
            <div key={index} className="gold-card">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-lime-100/80 flex items-center justify-center">
                  <card.icon className="w-6 h-6 text-lime-800" />
                </div>
                {card.change && (
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      card.trend === 'up'
                        ? 'text-green-400'
                        : card.trend === 'down'
                          ? 'text-red-400'
                          : 'text-stone-600'
                    }`}
                  >
                    {card.trend === 'up' && <ArrowUpRight className="w-4 h-4" />}
                    {card.trend === 'down' && <ArrowDownRight className="w-4 h-4" />}
                    {card.change}
                  </div>
                )}
              </div>
              <h3 className="text-2xl font-bold text-black">{card.value}</h3>
              <p className="text-sm text-stone-600">{t(card.titleKey)}</p>
            </div>
          ))}
        </div>

        {/* Recent Orders & Low Stock */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="gold-card">
            <h2 className="text-xl font-bold text-black mb-4">{t('admin.recentOrdersInRange')}</h2>
            {ordersLoading ? (
              <p className="text-stone-600 text-sm">{t('common.loading')}</p>
            ) : recentOrders.length === 0 ? (
              <p className="text-stone-600 text-sm">{t('admin.noOrdersFound')}</p>
            ) : (
              <>
              <div className="space-y-3">
                {recentOrderPageRows.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-black">
                        {t('admin.orderNumber')} #{order.invoice_number}
                      </p>
                      <p className="text-xs text-stone-600">
                        {order.customer_name || t('admin.customer')} · {new Date(order.sale_date).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-lime-800">
                        {formatNumber(order.total_amount, 3)} KWD
                      </p>
                      <p className="text-xs text-emerald-700">
                        {order.status_display || order.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {!ordersLoading && recentOrderTotal > recentOrderPageSize && (
                <AdminPaginationBar
                  page={recentOrderPage}
                  totalPages={recentOrderTotalPages}
                  total={recentOrderTotal}
                  pageSize={recentOrderPageSize}
                  onPageChange={setRecentOrderPage}
                  itemLabel="orders"
                />
              )}
              </>
            )}
          </div>

          <div className="gold-card">
            <h2 className="text-xl font-bold text-black mb-4">{t('admin.lowStockAlerts')}</h2>
            <p className="text-xs text-stone-500 mb-3">{t('admin.lowStockSnapshotNote')}</p>
            {lowStockLoading ? (
              <p className="text-stone-600 text-sm">{t('common.loading')}</p>
            ) : lowStockItems.length === 0 ? (
              <p className="text-stone-600 text-sm">{t('admin.noLowStockItems')}</p>
            ) : (
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-black">
                        {item.product_name}
                      </p>
                      <p className="text-xs text-stone-600">
                        {t('admin.sku')}: {item.product_sku}{' '}
                        {item.product_serial_number
                          ? `· ${t('admin.serial')}: ${item.product_serial_number}`
                          : ''}
                      </p>
                      <p className="text-xs text-stone-600">
                        {item.branch_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-red-400">
                        {item.available_quantity} {t('admin.left')}
                      </p>
                      <p className="text-xs text-stone-600">
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
