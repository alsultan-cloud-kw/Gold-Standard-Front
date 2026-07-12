import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, Download, Calendar, DollarSign, ShoppingBag, Users, Eye, FileSpreadsheet } from 'lucide-react'
import AdminPaginationBar from '../../components/admin/AdminPaginationBar'
import { accountingApi, adminApi, ordersApi } from '../../services/api'
import { TRADING_AND_VIRTUAL_WALLET_ENABLED } from '@/featureFlags'
import { downloadCsv } from '../../utils/reportExport'

type SaleRow = {
  id: string
  invoice_number?: string
  order_number?: string
  invoice_no?: string
  customer_name: string
  sale_date: string
  status: string
  status_display?: string
  payment_method?: string
  payment_method_display?: string
  subtotal?: string
  discount_amount?: string
  total_cost?: string
  profit?: string
  total_amount: string
  items?: Array<{
    id?: string
    product_sku?: string
    product_name?: string
    carat_display?: string
    quantity?: number
    weight_grams_locked?: string | number
    weight_grams_total?: string | number
    making_charge?: string | number
    total_price?: string | number
    total_cost?: string | number
  }>
}

type SalesSummary = {
  start_date: string | null
  end_date: string | null
  all_time?: boolean
  total_sales: number
  total_profit: number
  transaction_count: number
}

type PurchaseRow = {
  id: string
  purchase_number?: string
  purchase_date: string
  seller_name?: string
  total_weight?: string | number
  total_amount: string | number
  price_per_gram?: string | number
}

function asResults<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const p = data as { results?: T[] } | undefined
  return p?.results ?? []
}

function toNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function fmtKwd(v: number): string {
  return `${v.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} KWD`
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getPresetDateWindow(preset: string): { start: string; end: string } {
  const end = new Date()
  end.setHours(0, 0, 0, 0)
  const start = new Date(end)
  if (preset === '30d') start.setDate(start.getDate() - 29)
  else if (preset === '90d') start.setDate(start.getDate() - 89)
  else if (preset === '1y') start.setDate(start.getDate() - 364)
  else start.setDate(start.getDate() - 6)
  return { start: isoDate(start), end: isoDate(end) }
}

function dbOrderNumber(sale: SaleRow): string {
  const raw = sale.invoice_number ?? sale.order_number ?? sale.invoice_no ?? ''
  const val = String(raw).trim()
  return val || '-'
}

type ReportView = 'overview' | 'sales_detail' | 'profit_loss' | 'gold_flow'

type PLData = {
  revenue?: number
  cost_of_goods_sold?: number
  purchases?: number
  gross_profit?: number
  gross_margin?: number
  buyback_cost?: number
  operating_expenses?: number
  net_profit?: number
  net_margin?: number
  expense_breakdown?: { category_display?: string; category: string; total: number }[]
}

export default function AdminReports() {
  const [dateRange, setDateRange] = useState('7d')
  const [dateWindow, setDateWindow] = useState<{ start: string; end: string }>(() => getPresetDateWindow('7d'))
  const [draftStart, setDraftStart] = useState(dateWindow.start)
  const [draftEnd, setDraftEnd] = useState(dateWindow.end)
  const [activeView, setActiveView] = useState<ReportView>('overview')
  const [previewOrderId, setPreviewOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (dateRange === 'custom' || dateRange === 'all') return
    const next = getPresetDateWindow(dateRange)
    setDateWindow(next)
    setDraftStart(next.start)
    setDraftEnd(next.end)
  }, [dateRange])

  const { data: salesRaw, isLoading } = useQuery({
    queryKey:
      dateRange === 'all'
        ? ['adminReportsSales', 'all']
        : ['adminReportsSales', dateWindow.start, dateWindow.end],
    queryFn: () =>
      ordersApi.getOrders(
        dateRange === 'all'
          ? {
              page_size: '2000',
              ordering: '-sale_date',
            }
          : {
              page_size: '2000',
              ordering: '-sale_date',
              start_date: dateWindow.start,
              end_date: dateWindow.end,
            },
      ) as Promise<unknown>,
  })

  const { data: summaryRaw } = useQuery({
    queryKey:
      dateRange === 'all'
        ? ['adminReportsSummary', 'all']
        : ['adminReportsSummary', dateWindow.start, dateWindow.end],
    queryFn: () =>
      ordersApi.getSalesSummary(
        dateRange === 'all' ? { all: '1' } : { start_date: dateWindow.start, end_date: dateWindow.end },
      ) as Promise<SalesSummary>,
  })

  const { data: customersRaw } = useQuery({
    queryKey: ['adminReportsCustomers'],
    queryFn: () => adminApi.getCustomers({ page_size: 500 }),
  })

  const { data: purchasesRaw, isLoading: purchasesLoading } = useQuery({
    queryKey:
      dateRange === 'all'
        ? ['adminReportsPurchases', 'all']
        : ['adminReportsPurchases', dateWindow.start, dateWindow.end],
    queryFn: () =>
      accountingApi.getPurchases(
        dateRange === 'all'
          ? { page_size: '2000', ordering: '-purchase_date' }
          : { page_size: '2000', ordering: '-purchase_date', start_date: dateWindow.start, end_date: dateWindow.end },
      ) as Promise<unknown>,
  })

  const canUseGoldSummary = dateRange !== 'all' && !!dateWindow.start && !!dateWindow.end
  const { data: goldSummaryRaw } = useQuery({
    queryKey: ['adminReportsGoldSummary', dateWindow.start, dateWindow.end],
    queryFn: () => accountingApi.getGoldSummary(dateWindow.start, dateWindow.end) as Promise<unknown>,
    enabled: canUseGoldSummary,
  })

  // Anchor "Opening balance" to a stable base date.
  // AdminAccounts defaults `startDate` to the first day of the month, so we mirror that here.
  // This prevents mismatch when admins compare overlapping ranges.
  const openingBalanceBaseStartISO = useMemo(() => {
    if (!dateWindow.start) return null
    const d = new Date(`${dateWindow.start}T00:00:00`)
    if (Number.isNaN(d.getTime())) return dateWindow.start
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  }, [dateWindow.start])

  const plEnabled = dateRange !== 'all' && !!dateWindow.start && !!dateWindow.end
  const { data: plRaw } = useQuery({
    queryKey: ['adminReportsPL', dateWindow.start, dateWindow.end],
    queryFn: () => accountingApi.getProfitLoss(dateWindow.start, dateWindow.end) as Promise<PLData>,
    enabled: plEnabled,
  })
  const pl = plRaw as PLData | undefined

  const canUseGoldSummaryExtended =
    dateRange !== 'all' &&
    !!openingBalanceBaseStartISO &&
    !!dateWindow.end &&
    openingBalanceBaseStartISO <= dateWindow.end

  const { data: goldSummaryExtendedRaw } = useQuery({
    queryKey: ['adminReportsGoldSummaryExtended', openingBalanceBaseStartISO, dateWindow.end],
    queryFn: () =>
      accountingApi.getGoldSummary(openingBalanceBaseStartISO as string, dateWindow.end) as Promise<unknown>,
    enabled: canUseGoldSummaryExtended,
  })

  const allSales = useMemo(() => asResults<SaleRow>(salesRaw), [salesRaw])
  const salesInRange = allSales
  const listedOrders = useMemo(
    () => [...salesInRange].sort((a, b) => (a.sale_date < b.sale_date ? 1 : -1)),
    [salesInRange],
  )

  const ordersListPageSize = 10
  const [ordersListPage, setOrdersListPage] = useState(1)
  const ordersListTotal = listedOrders.length
  const ordersListTotalPages = Math.max(1, Math.ceil(ordersListTotal / ordersListPageSize))
  const displayedListedOrders = useMemo(
    () =>
      listedOrders.slice(
        (ordersListPage - 1) * ordersListPageSize,
        ordersListPage * ordersListPageSize,
      ),
    [listedOrders, ordersListPage],
  )

  useEffect(() => {
    setOrdersListPage(1)
  }, [dateRange, dateWindow.start, dateWindow.end, salesRaw])

  useEffect(() => {
    if (ordersListPage > ordersListTotalPages) setOrdersListPage(ordersListTotalPages)
  }, [ordersListPage, ordersListTotalPages])

  const summary = useMemo(() => {
    const s = (summaryRaw ?? {}) as Partial<SalesSummary>
    return {
      totalSales: toNumber(s.total_sales),
      totalProfit: toNumber(s.total_profit),
      txCount: toNumber(s.transaction_count),
    }
  }, [summaryRaw])

  const purchasesInRange = useMemo(() => asResults<PurchaseRow>(purchasesRaw), [purchasesRaw])
  const purchaseTotals = useMemo(() => {
    const gs = goldSummaryRaw as any
    const buyingRows = gs?.buying?.rows
    const buyingTotalWeight = gs?.buying?.total_weight_grams
    const buyingTotalAmount = gs?.buying?.total_amount

    if (Array.isArray(buyingRows) && buyingTotalWeight != null && buyingTotalAmount != null) {
      const tw = toNumber(buyingTotalWeight)
      const ta = toNumber(buyingTotalAmount)
      return {
        totalWeight: tw,
        totalAmount: ta,
        avgPricePerGram: tw > 0 ? ta / tw : 0,
        count: buyingRows.length,
      }
    }

    // Fallback: only merchant purchases (no buybacks) if gold_summary isn't available.
    let totalWeight = 0
    let totalAmount = 0
    for (const p of purchasesInRange) {
      totalWeight += toNumber(p.total_weight)
      totalAmount += toNumber(p.total_amount)
    }
    return {
      totalWeight,
      totalAmount,
      avgPricePerGram: totalWeight > 0 ? totalAmount / totalWeight : 0,
      count: purchasesInRange.length,
    }
  }, [goldSummaryRaw, purchasesInRange])

  const rangeLabel = useMemo(() => {
    if (dateRange === 'all') return 'All time'
    return `${dateWindow.start} → ${dateWindow.end}`
  }, [dateRange, dateWindow.start, dateWindow.end])

  const exportRangeLine = useMemo(() => {
    if (dateRange === 'all') {
      const s = (summaryRaw ?? {}) as Partial<SalesSummary>
      if (s.start_date && s.end_date) return `All orders (reportable): ${s.start_date} to ${s.end_date}`
      return 'All orders (no reportable sales yet)'
    }
    return `Date From: ${dateWindow.start} &nbsp; To: ${dateWindow.end}`
  }, [dateRange, dateWindow.start, dateWindow.end, summaryRaw])

  const customers = useMemo(() => asResults<{ id: string; date_joined?: string }>(customersRaw), [customersRaw])
  const totalCustomers = customers.length
  const totalOrdersAllStatuses = salesInRange.length
  const avgOrderValue = summary.txCount > 0 ? summary.totalSales / summary.txCount : 0

  const stats = [
    { title: 'Total Revenue', value: fmtKwd(summary.totalSales), icon: DollarSign },
    { title: 'Total Orders', value: totalOrdersAllStatuses.toLocaleString(), icon: ShoppingBag },
    { title: 'Total Customers', value: totalCustomers.toLocaleString(), icon: Users },
    { title: 'Avg Order Value', value: fmtKwd(avgOrderValue), icon: TrendingUp },
  ]

  const activity = useMemo(() => {
    const byStatus = new Map<string, number>()
    const byPayment = new Map<string, number>()
    let subtotal = 0
    let discount = 0
    let total = 0
    let totalCost = 0
    let totalProfit = 0
    let cashReceived = 0
    let cardReceived = 0
    let bankReceived = 0
    for (const s of salesInRange) {
      const status = s.status_display || s.status || 'Unknown'
      byStatus.set(status, (byStatus.get(status) || 0) + 1)
      const payment = s.payment_method_display || s.payment_method || 'Unknown'
      byPayment.set(payment, (byPayment.get(payment) || 0) + 1)
      subtotal += toNumber(s.subtotal)
      discount += toNumber(s.discount_amount)
      total += toNumber(s.total_amount)
      totalCost += toNumber(s.total_cost)
      totalProfit += toNumber(s.profit)
      const pm = (s.payment_method || '').toLowerCase()
      if (pm.includes('cash')) cashReceived += toNumber(s.total_amount)
      else if (pm.includes('card')) cardReceived += toNumber(s.total_amount)
      else if (pm.includes('bank') || pm.includes('transfer')) bankReceived += toNumber(s.total_amount)
    }
    return {
      byStatus: Array.from(byStatus.entries()).map(([label, count]) => ({ label, count })),
      byPayment: Array.from(byPayment.entries()).map(([label, count]) => ({ label, count })),
      subtotal,
      discount,
      total,
      totalCost,
      totalProfit,
      cashReceived,
      cardReceived,
      bankReceived,
    }
  }, [salesInRange])

  const maxStatusCount = Math.max(1, ...activity.byStatus.map((x) => x.count))

  const applyCustomRange = () => {
    if (!draftStart || !draftEnd) return
    const start = draftStart <= draftEnd ? draftStart : draftEnd
    const end = draftStart <= draftEnd ? draftEnd : draftStart
    setDateWindow({ start, end })
    setDraftStart(start)
    setDraftEnd(end)
  }

  const exportOrdersCsv = () => {
    const headers = ['Invoice', 'Date', 'Customer', 'Status', 'Payment', 'Subtotal', 'Discount', 'Total', 'Profit']
    const rows = salesInRange.map((s) => [
      dbOrderNumber(s),
      (s.sale_date || '').slice(0, 10),
      s.customer_name || '',
      s.status_display || s.status || '',
      s.payment_method_display || s.payment_method || '',
      toNumber(s.subtotal),
      toNumber(s.discount_amount),
      toNumber(s.total_amount),
      toNumber(s.profit),
    ])
    const suffix = dateRange === 'all' ? 'all' : `${dateWindow.start}_${dateWindow.end}`
    downloadCsv(`orders_${suffix}`, headers, rows)
  }

  const exportProfitLossCsv = () => {
    if (!pl) return
    downloadCsv(`profit_loss_${dateWindow.start}_${dateWindow.end}`, ['Line', 'KWD'], [
      ['Revenue', pl.revenue ?? 0],
      ['COGS', pl.cost_of_goods_sold ?? 0],
      ['Purchases', pl.purchases ?? 0],
      ['Gross profit', pl.gross_profit ?? 0],
      ...(TRADING_AND_VIRTUAL_WALLET_ENABLED ? [['Buybacks', pl.buyback_cost ?? 0] as [string, number]] : []),
      ['Operating expenses', pl.operating_expenses ?? 0],
      ['Net profit', pl.net_profit ?? 0],
    ])
  }

  const exportGoldFlowCsv = () => {
    const gs = goldSummaryRaw as { buying?: { rows?: unknown[] }; selling?: { rows?: unknown[] } } | undefined
    const buy = (gs?.buying?.rows ?? []) as Array<Record<string, unknown>>
    const sell = (gs?.selling?.rows ?? []) as Array<Record<string, unknown>>
    const headers = ['Side', 'Date', 'Detail', 'Carat', 'Weight g', 'Amount KWD']
    const rows: (string | number)[][] = []
    for (const r of buy) {
      rows.push([
        'BUY',
        String(r.date || '').slice(0, 10),
        String(r.detail || ''),
        String(r.carat ?? ''),
        toNumber(r.weight_grams),
        toNumber(r.total_amount),
      ])
    }
    for (const r of sell) {
      rows.push([
        'SELL',
        String(r.date || '').slice(0, 10),
        String(r.detail || ''),
        String(r.carat ?? ''),
        toNumber(r.weight_grams ?? r.gross_weight),
        toNumber(r.gross_amount ?? r.total_amount),
      ])
    }
    downloadCsv(`gold_flow_${dateWindow.start}_${dateWindow.end}`, headers, rows)
  }

  const exportDailyReportFormat = () => {
    // Opening balance is set on `/admin/accounting/accounts` (AdminAccounts page)
    // and stored in localStorage.
    const openingBalanceBank = (() => {
      try {
        const v = localStorage.getItem('admin_bank_opening_balance_kwd')
        const n = v == null ? 0 : Number(v)
        return Number.isFinite(n) ? n : 0
      } catch {
        return 0
      }
    })()

    const toDay = (value: unknown) => {
      const s = typeof value === 'string' ? value : ''
      if (!s) return null
      return s.slice(0, 10)
    }

    const dailyClosingRowsHtml = (() => {
      // Match `/admin/accounting/accounts` by using the same `gold_summary` filters.
      if (dateRange === 'all') return ''
      // Use an extended range anchored to the same base date as AdminAccounts,
      // so overlapping date ranges produce consistent closing balances.
      const gs = (goldSummaryExtendedRaw ?? goldSummaryRaw) as any
      const buyingRows = gs?.buying?.rows ?? []
      const sellingRows = gs?.selling?.rows ?? []

      if (!Array.isArray(buyingRows) || !Array.isArray(sellingRows)) return ''

      const outputStartISO = dateWindow.start
      const endISO = dateWindow.end
      const baseStartISO = openingBalanceBaseStartISO ?? dateWindow.start
      if (!outputStartISO || !endISO || !baseStartISO) return ''

      const salesByDay = new Map<string, number>()
      for (const row of sellingRows) {
        const d = toDay(row?.date)
        if (!d) continue
        const amt = toNumber(row?.gross_amount)
        salesByDay.set(d, (salesByDay.get(d) || 0) + amt)
      }

      const purchasesByDay = new Map<string, number>()
      for (const row of buyingRows) {
        const d = toDay(row?.date)
        if (!d) continue
        const amt = toNumber(row?.total_amount)
        purchasesByDay.set(d, (purchasesByDay.get(d) || 0) + amt)
      }

      const startDate = new Date(`${baseStartISO}T00:00:00`)
      const endDate = new Date(`${endISO}T00:00:00`)
      if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return ''

      const pad2 = (n: number) => String(n).padStart(2, '0')
      let cur = new Date(startDate)
      let cumulativeNet = 0
      const out: string[] = []
      while (cur.getTime() <= endDate.getTime()) {
        const day = `${cur.getFullYear()}-${pad2(cur.getMonth() + 1)}-${pad2(cur.getDate())}`
        const salesAmt = salesByDay.get(day) || 0
        const purchasesAmt = purchasesByDay.get(day) || 0
        const net = salesAmt - purchasesAmt
        cumulativeNet += net
        const closing = openingBalanceBank + cumulativeNet

        // Only output rows within the selected date window.
        if (day >= outputStartISO) {
          out.push(`
            <tr>
              <td>${day}</td>
              <td class="num">${closing.toFixed(3)}</td>
              <td class="num">${salesAmt.toFixed(3)}</td>
              <td class="num">${purchasesAmt.toFixed(3)}</td>
            </tr>
          `)
        }
        cur.setDate(cur.getDate() + 1)
      }
      return out.join('')
    })()

    let makingChargeTotal = 0
    const rowsHtml = salesInRange.length
      ? salesInRange
          .flatMap((s) => {
            const discountVal = toNumber(s.discount_amount)
            const saleTotalVal = toNumber(s.total_amount)
            const items = Array.isArray(s.items) ? s.items : []

            if (items.length === 0) {
              // Fallback if API doesn't return line items.
              const totalVal = saleTotalVal
              const totalCostVal = toNumber(s.total_cost)
              const profitVal = toNumber(s.profit)
              const mcSales = Math.max(0, totalVal - discountVal)
              return [
                `
                  <tr>
                    <td>${dbOrderNumber(s)}</td>
                    <td>${(s.sale_date || '').slice(0, 10)}</td>
                    <td>-</td>
                    <td>${s.customer_name || '-'}</td>
                    <td class="num">-</td>
                    <td class="num">0.000</td>
                    <td class="num">0.000</td>
                    <td class="num">0.000</td>
                    <td class="num">${profitVal.toFixed(3)}</td>
                    <td class="num">${Math.max(0, totalCostVal).toFixed(3)}</td>
                    <td class="num">${mcSales.toFixed(3)}</td>
                    <td class="num">${profitVal.toFixed(3)}</td>
                    <td class="num">${totalVal.toFixed(3)}</td>
                  </tr>
                `,
              ]
            }

            return items.map((item) => {
              const itemTotalPrice = toNumber(item.total_price)
              const itemTotalCost = toNumber(item.total_cost)
              const itemMakingCharge = toNumber(item.making_charge)
              makingChargeTotal += itemMakingCharge

              // Allocate sale-level discount across items proportionally to each line's total_price.
              const discountShare = saleTotalVal > 0 ? (itemTotalPrice / saleTotalVal) * discountVal : 0
              const mcSales = Math.max(0, itemTotalPrice - discountShare)
              // Export requires weight for both delivery types.
              // backend: `weight_grams_locked` is only set for delivery_type='locked'.
              const weight = toNumber(item.weight_grams_total ?? item.weight_grams_locked)
              const purity = item.carat_display || '-'

              return `
                <tr>
                  <td>${dbOrderNumber(s)}</td>
                  <td>${(s.sale_date || '').slice(0, 10)}</td>
                  <td>${item.product_sku || '-'}</td>
                  <td>${item.product_name || s.customer_name || '-'}</td>
                  <td class="num">${purity}</td>
                  <td class="num">${weight.toFixed(3)}</td>
                  <td class="num">0.000</td>
                  <td class="num">${weight.toFixed(3)}</td>
                  <td class="num">${itemMakingCharge.toFixed(3)}</td>
                  <td class="num">${Math.max(0, itemTotalCost).toFixed(3)}</td>
                  <td class="num">${mcSales.toFixed(3)}</td>
                  <td class="num">${itemMakingCharge.toFixed(3)}</td>
                  <td class="num">${itemTotalPrice.toFixed(3)}</td>
                </tr>
              `
            })
          })
          .join('')
      : `<tr><td colspan="13" style="text-align:center;">No activity for selected range.</td></tr>`

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Sales Activity Report - ${dateRange === 'all' ? 'All time' : `${dateWindow.start} to ${dateWindow.end}`}</title>
  <style>
    body { font-family: 'The Year of The Camel', Arial, sans-serif; background:#fff; color:#111; }
    .page { width: 1000px; margin: 12px auto; border: 1px solid #777; padding: 10px; }
    h1 { font-size: 22px; margin: 4px 0 2px; }
    .sub { font-size: 12px; margin-bottom: 8px; }
    table { width:100%; border-collapse: collapse; font-size: 11px; }
    th, td { border:1px solid #666; padding:4px 5px; vertical-align: top; }
    th { background:#ececec; }
    .num { text-align:right; }
    .header3 td { background:#f6f6f6; font-weight:600; }
    .section { margin-top: 8px; }
    .grid3 { display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin-top: 6px; }
    .box table { font-size:11px; }
    .box .title { background:#ececec; font-weight:700; }
    @media print { .page { border: none; width:auto; margin:0; } }
  </style>
</head>
<body>
  <div class="page">
    <h1>Sales Activity Report</h1>
    <div class="sub">${exportRangeLine}</div>

    <table class="section">
      <tr class="header3">
        <td colspan="4">Bank Balance Closing (per day)</td>
      </tr>
    </table>

    <table class="section">
      <thead>
        <tr>
          <th>Date</th>
          <th>Closing in Bank</th>
          <th>Sales credited</th>
          <th>Purchases debited</th>
        </tr>
      </thead>
      <tbody>${dailyClosingRowsHtml || '<tr><td colspan="4" style="text-align:center;">No daily bank movement for selected range.</td></tr>'}</tbody>
    </table>

    <table class="section">
      <thead>
        <tr>
          <th>Inv.No.</th><th>Date</th><th>Item Code</th><th>Item</th>
          <th>Purity</th><th>Gros Weight</th><th>Stone Wt.</th><th>Net Weight</th>
          <th>Making Charge</th><th>MC Cost</th><th>MC Sales + Stone Amt</th><th>Profit</th><th>Total Amt</th>
        </tr>
      </thead>
      <tbody>${rowsHtml}</tbody>
      <tfoot>
        <tr>
          <td colspan="8"><b>Grand Total</b></td>
          <td class="num"><b>${makingChargeTotal.toFixed(3)}</b></td>
          <td class="num"><b>${activity.totalCost.toFixed(3)}</b></td>
          <td class="num"><b>${Math.max(0, activity.total - activity.discount).toFixed(3)}</b></td>
          <td class="num"><b>${makingChargeTotal.toFixed(3)}</b></td>
          <td class="num"><b>${activity.total.toFixed(3)}</b></td>
        </tr>
      </tfoot>
    </table>

    <div class="grid3 section">
      <div class="box">
        <table><tr><td class="title" colspan="2">Sales / Profit</td></tr>
          <tr><td>Total Gold Sales</td><td class="num">${activity.total.toFixed(3)}</td></tr>
          <tr><td>Total MC Sales</td><td class="num">${Math.max(0, activity.total - activity.discount).toFixed(3)}</td></tr>
          <tr><td>Total MC Cost</td><td class="num">${activity.totalCost.toFixed(3)}</td></tr>
          <tr><td>Total Profit</td><td class="num">${makingChargeTotal.toFixed(3)}</td></tr>
          <tr><td>Net Profit</td><td class="num">${makingChargeTotal.toFixed(3)}</td></tr>
        </table>
      </div>
      <div class="box">
        <table><tr><td class="title" colspan="2">Purchase / Scrap</td></tr>
          <tr><td>Total Purchase (Wt)</td><td class="num">${purchaseTotals.totalWeight.toFixed(3)}</td></tr>
          <tr><td>Avg Price / g</td><td class="num">${purchaseTotals.avgPricePerGram.toFixed(3)}</td></tr>
          <tr><td>Total Purchase (Amt)</td><td class="num">${purchaseTotals.totalAmount.toFixed(3)}</td></tr>
        </table>
      </div>
      <div class="box">
        <table><tr><td class="title" colspan="2">Cash / Bank</td></tr>
          <tr><td>Total Sales</td><td class="num">${activity.total.toFixed(3)}</td></tr>
          <tr><td>Total Cash Received</td><td class="num">${activity.cashReceived.toFixed(3)}</td></tr>
          <tr><td>Card Sales</td><td class="num">${activity.cardReceived.toFixed(3)}</td></tr>
          <tr><td>Discount</td><td class="num">${activity.discount.toFixed(3)}</td></tr>
          <tr><td>Net Cash in Hand</td><td class="num">${(activity.cashReceived + activity.bankReceived).toFixed(3)}</td></tr>
        </table>
      </div>
    </div>
  </div>
  <script>window.print();</script>
</body></html>`

    const w = window.open('', '_blank')
    if (!w) return
    w.document.open()
    w.document.write(html)
    w.document.close()
  }

  return (
    <div className="admin-page-inner">
      <div className="admin-page-body">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">Reports</h1>
            <p className="gold-gradient-text-on-light">All sections below use one shared date range</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <select 
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-white border border-black/15 rounded-lg text-black"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
              <option value="all">All (full history)</option>
              <option value="custom">Custom Range</option>
            </select>
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-lime-800" />
              <input
                type="date"
                value={draftStart}
                disabled={dateRange === 'all'}
                onChange={(e) => {
                  setDateRange('custom')
                  setDraftStart(e.target.value)
                }}
                className="px-2 py-1 bg-white border border-black/15 rounded text-black disabled:opacity-60"
              />
              <span className="text-stone-600">to</span>
              <input
                type="date"
                value={draftEnd}
                disabled={dateRange === 'all'}
                onChange={(e) => {
                  setDateRange('custom')
                  setDraftEnd(e.target.value)
                }}
                className="px-2 py-1 bg-white border border-black/15 rounded text-black disabled:opacity-60"
              />
              <button
                type="button"
                onClick={applyCustomRange}
                disabled={dateRange === 'all'}
                className="px-3 py-1 bg-lime-200/60 border border-lime-300/50 rounded gold-gradient-text-on-light hover:bg-lime-200/80 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
            <button
              type="button"
              onClick={exportOrdersCsv}
              className="px-3 py-2 bg-white border border-black/15 rounded-lg text-black flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              CSV Orders
            </button>
            {plEnabled && (
              <button
                type="button"
                onClick={exportProfitLossCsv}
                disabled={!pl}
                className="px-3 py-2 bg-white border border-black/15 rounded-lg text-black flex items-center gap-2 text-sm disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                CSV P&amp;L
              </button>
            )}
            <button
              onClick={exportDailyReportFormat}
              className="px-4 py-2 bg-lime-100 border border-lime-300/60 rounded-lg text-lime-900 flex items-center gap-2 font-medium"
            >
              <Download className="w-5 h-5" />
              Print / PDF
            </button>
          </div>
        </div>

        <div className="admin-segment mb-6">
          {(
            [
              ['overview', 'Overview'],
              ['sales_detail', 'Sales detail'],
              ['profit_loss', 'Profit & loss'],
              ['gold_flow', 'Gold movement'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveView(id)}
              className={`admin-segment__btn${activeView === id ? ' admin-segment__btn--active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <p className="text-xs text-[#64748B] mb-6 -mt-2">
          Data from Django API (storefront checkout → sales, admin → purchases/buybacks, accounting → P&amp;L).
          Same database as{' '}
          <a href="https://www.goldstandardkw.com" className="text-[#3F6F00] underline" target="_blank" rel="noreferrer">
            goldstandardkw.com
          </a>
          .
        </p>

        <div className="admin-report-views">
        {activeView === 'profit_loss' && plEnabled && (
          <div className="gold-card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Profit &amp; loss ({rangeLabel})</h2>
              <button
                type="button"
                onClick={exportProfitLossCsv}
                disabled={!pl}
                className="text-sm flex items-center gap-1 text-lime-800 disabled:opacity-50"
              >
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            {!pl ? (
              <p className="text-stone-600">Loading P&amp;L…</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {[
                  ['Revenue', pl.revenue],
                  ['COGS', pl.cost_of_goods_sold],
                  ['Purchases', pl.purchases],
                  ['Gross profit', pl.gross_profit, pl.gross_margin],
                  ...(TRADING_AND_VIRTUAL_WALLET_ENABLED ? [['Buyback cost', pl.buyback_cost] as const] : []),
                  ['Operating expenses', pl.operating_expenses],
                  ['Net profit', pl.net_profit, pl.net_margin],
                ].map(([label, val, pct]) => (
                  <div key={String(label)} className="p-3 bg-white rounded-lg flex justify-between">
                    <span className="text-stone-600">{label}</span>
                    <span className="font-semibold text-black">
                      {fmtKwd(toNumber(val))}
                      {pct != null ? ` (${toNumber(pct).toFixed(1)}%)` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeView === 'gold_flow' && canUseGoldSummary && (
          <div className="gold-card mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-black">Gold movement ({rangeLabel})</h2>
              <button type="button" onClick={exportGoldFlowCsv} className="text-sm flex items-center gap-1 text-lime-800">
                <Download className="w-4 h-4" /> Export CSV
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-stone-600">Buy amount</p>
                <p className="font-semibold">{fmtKwd(purchaseTotals.totalAmount)}</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-stone-600">Buy weight (g)</p>
                <p className="font-semibold">{purchaseTotals.totalWeight.toFixed(3)}</p>
              </div>
            </div>
            <p className="text-xs text-stone-500">Source: GET /accounting/accounts/gold_summary/</p>
          </div>
        )}

        {(activeView === 'overview' || activeView === 'sales_detail') && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="gold-card">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-lg bg-lime-100/80 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-lime-800" />
                </div>
                <span className="text-xs text-stone-500">{rangeLabel}</span>
              </div>
              <h3 className="text-2xl font-bold text-black">{stat.value}</h3>
              <p className="text-sm text-stone-600">{stat.title}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="gold-card">
            <h2 className="text-xl font-bold text-black mb-4">
              Activity Summary ({rangeLabel})
            </h2>
            {isLoading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-stone-600">Loading…</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-stone-600">Subtotal</p>
                    <p className="text-sm font-semibold text-black">{fmtKwd(activity.subtotal)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-stone-600">Discount</p>
                    <p className="text-sm font-semibold text-black">{fmtKwd(activity.discount)}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3">
                    <p className="text-xs text-stone-600">Total</p>
                    <p className="text-sm font-semibold text-black">{fmtKwd(activity.total)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-stone-700 mb-2">Orders by status</p>
                  <div className="space-y-2">
                    {activity.byStatus.length === 0 ? (
                      <p className="text-stone-500 text-sm">No activity for selected range.</p>
                    ) : (
                      activity.byStatus.map((row) => (
                        <div key={row.label} className="flex items-center gap-3">
                          <div className="w-28 text-xs text-black/75 truncate">{row.label}</div>
                          <div className="flex-1 h-2 rounded bg-white overflow-hidden">
                            <div
                              className="h-2 bg-lime-600/80"
                              style={{ width: `${(row.count / maxStatusCount) * 100}%` }}
                            />
                          </div>
                          <div className="w-10 text-right text-xs text-lime-900">{row.count}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="gold-card">
            <h2 className="text-xl font-bold text-black mb-4">Orders (All Statuses, Selected Range)</h2>
            <div className="space-y-2 pr-1">
              {listedOrders.length === 0 ? (
                <p className="text-stone-600">No orders in selected range.</p>
              ) : (
                displayedListedOrders.map((s) => (
                  <div key={s.id} className="p-3 bg-white rounded-lg">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-black font-medium">{dbOrderNumber(s)}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewOrderId(s.id)}
                          className="p-1 rounded hover:bg-stone-100 text-stone-600"
                          title="View line items"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <p className="text-lime-800 text-sm">{fmtKwd(toNumber(s.total_amount))}</p>
                      </div>
                    </div>
                    <p className="text-xs text-stone-600">{s.customer_name}</p>
                    <p className="text-xs text-stone-500">
                      {(s.sale_date || '').replace('T', ' ').slice(0, 16)} · {s.status_display || s.status}
                    </p>
                  </div>
                ))
              )}
            </div>
            {ordersListTotal > ordersListPageSize && (
              <AdminPaginationBar
                page={ordersListPage}
                totalPages={ordersListTotalPages}
                total={ordersListTotal}
                pageSize={ordersListPageSize}
                onPageChange={setOrdersListPage}
                itemLabel="orders"
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="gold-card">
            <h2 className="text-xl font-bold text-black mb-4">Payment Mix (Selected Range)</h2>
            <div className="space-y-3">
              {activity.byPayment.length === 0 ? (
                <p className="text-stone-600">No payment activity.</p>
              ) : (
                activity.byPayment.map((p) => (
                  <div key={p.label} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <span className="text-black">{p.label}</span>
                    <span className="text-lime-800">{p.count} orders</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="gold-card">
            <h2 className="text-xl font-bold text-black mb-4">
              Range Summary ({rangeLabel})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-stone-600">Transactions</p>
                <p className="text-black font-semibold">{summary.txCount.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-stone-600">Sales</p>
                <p className="text-black font-semibold">{fmtKwd(summary.totalSales)}</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-stone-600">Profit</p>
                <p className="text-black font-semibold">{fmtKwd(summary.totalProfit)}</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-stone-600">Avg order value</p>
                <p className="text-black font-semibold">{fmtKwd(avgOrderValue)}</p>
              </div>
            </div>
          </div>
        </div>
        </>
        )}

        {(activeView === 'overview' || activeView === 'sales_detail') && (
        <div className="gold-card mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Purchases (Selected Range)</h2>
            <span className="text-xs text-stone-500">{rangeLabel}</span>
          </div>
          {purchasesLoading ? (
            <p className="text-stone-600">Loading…</p>
          ) : purchasesInRange.length === 0 ? (
            <p className="text-stone-600">No purchases in selected range.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-stone-600">Count</p>
                <p className="text-black font-semibold">{purchaseTotals.count.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-stone-600">Total weight (g)</p>
                <p className="text-black font-semibold">{purchaseTotals.totalWeight.toFixed(3)}</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-stone-600">Avg price / g</p>
                <p className="text-black font-semibold">{purchaseTotals.avgPricePerGram.toFixed(3)}</p>
              </div>
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-stone-600">Total amount</p>
                <p className="text-black font-semibold">{fmtKwd(purchaseTotals.totalAmount)}</p>
              </div>
            </div>
          )}
        </div>
        )}

        {previewOrderId && (() => {
          const order = salesInRange.find((s) => s.id === previewOrderId)
          if (!order) return null
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
              onClick={() => setPreviewOrderId(null)}
            >
              <div
                className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-auto p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-black mb-2">{dbOrderNumber(order)}</h3>
                <p className="text-sm text-stone-600 mb-4">
                  {order.customer_name} · {fmtKwd(toNumber(order.total_amount))}
                </p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">SKU</th>
                      <th className="text-right py-2">Qty</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items ?? []).length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-stone-500 text-center">
                          No line items in API response
                        </td>
                      </tr>
                    ) : (
                      (order.items ?? []).map((item, i) => (
                        <tr key={item.id ?? i} className="border-b border-stone-100">
                          <td className="py-2">{item.product_sku || item.product_name || '—'}</td>
                          <td className="text-right py-2">{item.quantity ?? 1}</td>
                          <td className="text-right py-2">{fmtKwd(toNumber(item.total_price))}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={() => setPreviewOrderId(null)}
                  className="mt-4 px-4 py-2 bg-stone-100 rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          )
        })()}
        </div>
      </div>
    </div>
  )
}
