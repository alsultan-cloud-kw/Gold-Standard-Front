import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import AdminNav from '../../components/admin/AdminNav'
import { accountingApi, goldTradingApi } from '../../services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const OPENING_BALANCE_KEY = 'admin_bank_opening_balance_kwd'

type TradingReserveRow = {
  carat_value: number
  carat_display: string
  reserve_limit_grams: number | null
  customer_total_grams: number
  available_for_buy_grams: number | null
}

type TradingAdminSummary = {
  trading_reserve_by_carat?: TradingReserveRow[]
}

export default function AdminAccounts() {
  const { t } = useTranslation()
  const [openingBalance, setOpeningBalance] = useState('')
  useEffect(() => {
    const v = localStorage.getItem(OPENING_BALANCE_KEY)
    if (v !== null) setOpeningBalance(v)
  }, [])
  const saveOpening = () => {
    localStorage.setItem(OPENING_BALANCE_KEY, openingBalance || '0')
    toast.success('Opening balance saved')
  }

  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const { isLoading: chartLoading } = useQuery({
    queryKey: ['chartOfAccounts'],
    queryFn: () => accountingApi.getChartOfAccounts(),
  })

  // const { data: trialData, isLoading: trialLoading } = useQuery({
  //   queryKey: ['trialBalance'],
  //   queryFn: () => accountingApi.getTrialBalance(),
  // })

  const isLoading = chartLoading //|| trialLoading

  const { data: goldSummary } = useQuery({
    queryKey: ['goldSummary', startDate, endDate],
    queryFn: () => accountingApi.getGoldSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  }) as { data: { buying?: any; selling?: any } } | { data: undefined }

  const {
    data: tradingAdminSummary,
    isLoading: tradingSummaryLoading,
    isError: tradingSummaryError,
  } = useQuery({
    queryKey: ['goldTradingAdminSummary'],
    queryFn: () => goldTradingApi.getAdminSummary() as Promise<TradingAdminSummary>,
  })
  const tradingReserveRows = tradingAdminSummary?.trading_reserve_by_carat ?? []

  const buying = goldSummary?.buying as
    | {
        rows: {
          date: string
          detail: string
          carat?: number
          weight_grams: number
          weight_9999: number
          rate_per_gram: number
          total_amount: number
        }[]
        total_weight_grams: number
        total_weight_9999: number
        total_amount: number
        average_price_per_gram_9999: number
      }
    | undefined
  const selling = goldSummary?.selling as
    | {
        rows: {
          date: string
          detail: string
          carat?: number
          weight_grams: number
          rate_per_gram: number
          gold_amount_9999: number
          gross_amount: number
        }[]
        total_weight_grams: number
        total_weight_9999: number
        total_amount: number
        total_gold_amount_9999: number
        average_price_per_gram_9999: number
      }
    | undefined

  // Client-side pagination for BUYING and SELLING tables
  const [buyPage, setBuyPage] = useState(1)
  const [sellPage, setSellPage] = useState(1)
  const pageSize = 10 // rows per page

  const [activityDetailsOpen, setActivityDetailsOpen] = useState(false)
  const [activityDetailsKind, setActivityDetailsKind] = useState<'buy' | 'sell'>('buy')
  const [activityDetailsRow, setActivityDetailsRow] = useState<any>(null)

  const buyRows = (buying?.rows || []) as {
    date: string
    detail: string
    carat?: number
    weight_grams: number
    weight_9999: number
    rate_per_gram: number
    total_amount: number
  }[]
  const sellRows = (selling?.rows || []) as {
    date: string
    detail: string
    carat?: number
    weight_grams: number
    rate_per_gram: number
    gold_amount_9999: number
    gross_amount: number
  }[]

  const buyTotal = buyRows.length
  const sellTotal = sellRows.length
  const buyStart = (buyPage - 1) * pageSize
  const buyEnd = buyStart + pageSize
  const sellStart = (sellPage - 1) * pageSize
  const sellEnd = sellStart + pageSize
  const buyPageRows = buyRows.slice(buyStart, buyEnd)
  const sellPageRows = sellRows.slice(sellStart, sellEnd)

  const buyTotalPages = Math.max(1, Math.ceil(buyTotal / pageSize))
  const sellTotalPages = Math.max(1, Math.ceil(sellTotal / pageSize))

  return (
    <div className="min-h-screen py-8 bg-[var(--site-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <Link
          to="/admin/accounting"
          className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('admin.backToAccounting')}
        </Link>
        <div id="chart-of-accounts" className="mb-8 scroll-mt-24">
          <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.chartOfAccountsTitle')}</h1>
          <p className="text-stone-600 mt-1">{t('admin.chartOfAccountsSubtitle')}</p>
        </div>

        {isLoading ? (
          <div className="gold-card p-8 text-center text-stone-800">{t('common.loading')}</div>
        ) : (
          <>
            {/* <div className="gold-card overflow-x-auto mb-8">
              <h2 className="text-xl font-semibold text-black mb-4">{t('admin.accounts')}</h2>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200">
                    <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.code')}</th>
                    <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.nameEn')}</th>
                    <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.type')}</th>
                    <th className="text-right py-3 px-4 text-stone-700 font-medium">{t('admin.balance')}</th>
                  </tr>
                </thead>
                <tbody>
                  {(chartData as { account_code: string; account_name_en: string; account_type?: { name_en: string }; current_balance: number }[] || []).map((acc: { id?: string; account_code: string; account_name_en: string; account_type?: { name_en: string }; current_balance: number }) => (
                    <tr key={acc.id || acc.account_code} className="border-b border-stone-100">
                      <td className="py-3 px-4 text-black font-mono">{acc.account_code}</td>
                      <td className="py-3 px-4 text-black">{acc.account_name_en}</td>
                      <td className="py-3 px-4 text-stone-800">{acc.account_type?.name_en || '—'}</td>
                      <td className="py-3 px-4 text-right text-lime-800 font-medium">
                        {Number(acc.current_balance).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(!chartData || (Array.isArray(chartData) && chartData.length === 0)) && (
                <p className="py-8 text-center text-stone-600">{t('admin.noAccountsFound')}</p>
              )}
            </div> */}

            {/* {trialData && (
              <div className="gold-card overflow-x-auto">
                <h2 className="text-xl font-semibold text-black mb-4">{t('admin.trialBalance')}</h2>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.code')}</th>
                      <th className="text-left py-3 px-4 text-stone-700 font-medium">{t('admin.account')}</th>
                      <th className="text-right py-3 px-4 text-stone-700 font-medium">{t('admin.debit')}</th>
                      <th className="text-right py-3 px-4 text-stone-700 font-medium">{t('admin.credit')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {((trialData as { accounts?: { account_code: string; account_name: string; debit: number; credit: number }[] }).accounts || []).map((row: { account_code: string; account_name: string; debit: number; credit: number }, i: number) => (
                      <tr key={i} className="border-b border-stone-100">
                        <td className="py-3 px-4 font-mono text-black">{row.account_code}</td>
                        <td className="py-3 px-4 text-black">{row.account_name}</td>
                        <td className="py-3 px-4 text-right text-black">
                          {row.debit > 0 ? Number(row.debit).toLocaleString(undefined, { minimumFractionDigits: 3 }) : '—'}
                        </td>
                        <td className="py-3 px-4 text-right text-black">
                          {row.credit > 0 ? Number(row.credit).toLocaleString(undefined, { minimumFractionDigits: 3 }) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex justify-end gap-8 mt-4 pt-4 border-t border-stone-200">
                  <span className="text-stone-800">
                    {t('admin.totalDebits')}: <strong className="text-black">{(trialData as { total_debits?: number }).total_debits?.toLocaleString(undefined, { minimumFractionDigits: 3 }) ?? '0'} KWD</strong>
                  </span>
                  <span className="text-stone-800">
                    {t('admin.totalCredits')}: <strong className="text-black">{(trialData as { total_credits?: number }).total_credits?.toLocaleString(undefined, { minimumFractionDigits: 3 }) ?? '0'} KWD</strong>
                  </span>
                </div>
              </div>
            )} */}

            <div id="gold-trading-pool" className="gold-card mb-8 scroll-mt-24">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                <div>
                  <h2 className="text-lg font-semibold text-black">{t('admin.tradingGoldPoolTitle')}</h2>
                  <p className="text-sm text-stone-700 mt-1 max-w-3xl">{t('admin.tradingGoldPoolIntro')}</p>
                </div>
                <Link
                  to="/admin/trading/virtual-gold"
                  className="inline-flex items-center justify-center shrink-0 text-xs font-medium px-3 py-2 rounded-lg border border-lime-300/50 text-black hover:bg-lime-100 transition-colors"
                >
                  {t('admin.tradingGoldPoolConfigure')}
                </Link>
              </div>
              {tradingSummaryLoading ? (
                <p className="text-sm text-stone-600">{t('common.loading')}</p>
              ) : tradingSummaryError ? (
                <p className="text-sm text-red-400">{t('admin.tradingGoldPoolLoadError')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-stone-700 border-b border-stone-200">
                        <th className="py-2 pr-3">{t('admin.tradingGoldPoolCarat')}</th>
                        <th className="py-2 pr-3 text-right">{t('admin.tradingGoldPoolReserve')}</th>
                        <th className="py-2 pr-3 text-right">{t('admin.tradingGoldPoolHeld')}</th>
                        <th className="py-2 text-right">{t('admin.tradingGoldPoolAvailable')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tradingReserveRows.map((row) => (
                        <tr key={row.carat_value} className="border-b border-stone-100 last:border-0">
                          <td className="py-2 pr-3 text-black">{row.carat_display || `${row.carat_value}K`}</td>
                          <td className="py-2 pr-3 text-right text-black tabular-nums">
                            {row.reserve_limit_grams == null ? (
                              <span className="text-stone-500">{t('admin.tradingGoldPoolNoCap')}</span>
                            ) : (
                              `${row.reserve_limit_grams.toFixed(3)} g`
                            )}
                          </td>
                          <td className="py-2 pr-3 text-right text-black tabular-nums">
                            {row.customer_total_grams.toFixed(3)} g
                          </td>
                          <td className="py-2 text-right tabular-nums">
                            {row.available_for_buy_grams == null ? (
                              <span className="text-stone-500">—</span>
                            ) : (
                              <span
                                className={
                                  row.available_for_buy_grams <= 0 ? 'text-red-400 font-medium' : 'text-emerald-400'
                                }
                              >
                                {row.available_for_buy_grams.toFixed(3)} g
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Bank balance: admin opening, purchases debited, sales credited (for selected date range) */}
            <div id="trial-balance" className="gold-card mb-8 scroll-mt-24">
              <h2 className="text-lg font-semibold text-black mb-3">Bank balance (KWD)</h2>
              <p className="text-sm text-stone-700 mb-3">
                Opening balance is set by admin. Purchases in the period are debited; sales are credited. Period uses the same date range as Buying / Selling detail below.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-stone-700 border-b border-stone-200">
                      <th className="py-2 pr-2">Opening balance</th>
                      <th className="py-2 pr-2">Purchases debited</th>
                      <th className="py-2 pr-2">Sales credited</th>
                      <th className="py-2 pr-2">Net movement</th>
                      <th className="py-2 pr-2">Closing balance</th>
                      <th className="py-2 pr-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-stone-100 last:border-0">
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.001"
                            value={openingBalance}
                            onChange={(e) => setOpeningBalance(e.target.value)}
                            className="w-40 px-3 py-1 rounded bg-white border border-black/15 text-black"
                            placeholder="0.000"
                          />
                          <span className="text-stone-700">KWD</span>
                        </div>
                      </td>
                      <td className="py-2 pr-2 text-red-400">
                        {(buying?.total_amount ?? 0).toFixed(3)}
                      </td>
                      <td className="py-2 pr-2 text-emerald-400">
                        {(selling?.total_amount ?? 0).toFixed(3)}
                      </td>
                      <td className="py-2 pr-2">
                        {(() => {
                          const sales = selling?.total_amount ?? 0
                          const purchases = buying?.total_amount ?? 0
                          const net = sales - purchases
                          return net >= 0 ? (
                            <span className="text-emerald-400">+{net.toFixed(3)}</span>
                          ) : (
                            <span className="text-red-400">{net.toFixed(3)}</span>
                          )
                        })()}
                      </td>
                      <td className="py-2 pr-2 font-semibold text-black">
                        {(
                          Number(openingBalance || 0) -
                          (buying?.total_amount ?? 0) +
                          (selling?.total_amount ?? 0)
                        ).toFixed(3)}{' '}
                        KWD
                      </td>
                      <td className="py-2 pr-2">
                        <button
                          type="button"
                          onClick={saveOpening}
                          className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-lime-400/60 text-black hover:bg-lime-100"
                        >
                          Save opening
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gold buying & selling detail (Excel-style) */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Buying detail */}
              <div className="gold-card overflow-x-auto">
                {/* Section header like Excel "BUYING DETAIL" */}
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 rounded bg-amber-400 text-black text-xs font-semibold tracking-wide">
                    BUYING DETAIL
                  </span>
                </div>
                {/* Summary strip: TOTAL WT / TOTAL AMOUNT / AVERAGE */}
                {buying && (
                  <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-black/15">
                      <div className="text-stone-700 text-xs font-medium mb-1">TOTAL WT /999.9</div>
                      <div className="text-black font-semibold">
                        {buying.total_weight_9999.toFixed(3)}
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-black/15">
                      <div className="text-stone-700 text-xs font-medium mb-1">TOTAL AMOUNT</div>
                      <div className="text-black font-semibold">
                        {buying.total_amount.toFixed(3)} KWD
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-black/15">
                      <div className="text-stone-700 text-xs font-medium mb-1">AVERAGE /g</div>
                      <div className="text-black font-semibold">
                        {buying.average_price_per_gram_9999.toFixed(4)} KWD
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 mb-3 text-sm text-stone-700">
                  <label className="flex items-center gap-2">
                    <span>From</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="px-2 py-1 rounded bg-white border border-black/15 text-sm text-black"
                    />
                  </label>
                  <label className="flex items-center gap-2">
                    <span>To</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="px-2 py-1 rounded bg-white border border-black/15 text-sm text-black"
                    />
                  </label>
                </div>
                <p className="text-stone-600 text-xs mb-2">
                  Period: {startDate} → {endDate}
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-2 px-3 text-stone-700 font-medium">Date</th>
                      <th className="text-left py-2 px-3 text-stone-700 font-medium">Detail</th>
                      <th className="text-left py-2 px-3 text-stone-700 font-medium">Carat</th>
                      <th className="text-right py-2 px-3 text-stone-700 font-medium">Weight (g)</th>
                      <th className="text-right py-2 px-3 text-stone-700 font-medium">Wt (999.9 g)</th>
                      <th className="text-right py-2 px-3 text-stone-700 font-medium">Rate /g</th>
                      <th className="text-right py-2 px-3 text-stone-700 font-medium">Total amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {buyPageRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-stone-100 cursor-pointer hover:bg-lime-50"
                        onClick={() => {
                          setActivityDetailsKind('buy')
                          setActivityDetailsRow(row)
                          setActivityDetailsOpen(true)
                        }}
                      >
                        <td className="py-2 px-3 text-black">{row.date || '—'}</td>
                        <td className="py-2 px-3 text-stone-800">{row.detail}</td>
                        <td className="py-2 px-3 text-stone-800">{row.carat || '—'}</td>
                        <td className="py-2 px-3 text-right text-black">
                          {row.weight_grams.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-right text-black">
                          {row.weight_9999.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-right text-black">
                          {row.rate_per_gram.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-right text-lime-800">
                          {row.total_amount.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                    {!buyRows.length && (
                      <tr>
                        <td colSpan={6} className="py-4 px-3 text-center text-stone-600">
                          No buying records in range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {buyTotal > pageSize && (
                  <div className="flex items-center justify-between mt-3 text-xs text-stone-700">
                    <div>
                      Page {buyPage} of {buyTotalPages} ({buyTotal} rows)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setBuyPage((p) => Math.max(1, p - 1))}
                        disabled={buyPage <= 1}
                        className="px-3 py-1 rounded-full border border-lime-400/60 disabled:opacity-40 hover:bg-lime-100"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setBuyPage((p) => (p < buyTotalPages ? p + 1 : p))}
                        disabled={buyPage >= buyTotalPages}
                        className="px-3 py-1 rounded-full border border-lime-400/60 disabled:opacity-40 hover:bg-lime-100"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Selling detail */}
              <div className="gold-card overflow-x-auto">
                {/* Section header like Excel "SELLING DETAIL" */}
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 rounded bg-amber-400 text-black text-xs font-semibold tracking-wide">
                    SELLING DETAIL
                  </span>
                </div>
                {/* Summary strip for selling side */}
                {selling && (
                  <div className="grid grid-cols-4 gap-3 mb-4 text-sm">
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-black/15">
                      <div className="text-stone-700 text-xs font-medium mb-1">GROSS AMT</div>
                      <div className="text-black font-semibold">
                        {selling.total_amount.toFixed(3)} KWD
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-black/15">
                      <div className="text-stone-700 text-xs font-medium mb-1">GOLD AMT /999.9</div>
                      <div className="text-black font-semibold">
                        {selling.total_gold_amount_9999.toFixed(3)}
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-black/15">
                      <div className="text-stone-700 text-xs font-medium mb-1">GROSS WT /999.9</div>
                      <div className="text-black font-semibold">
                        {selling.total_weight_9999.toFixed(3)}
                      </div>
                    </div>
                    <div className="bg-white/60 rounded-lg px-3 py-2 border border-black/15">
                      <div className="text-stone-700 text-xs font-medium mb-1">AVERAGE /999.9</div>
                      <div className="text-black font-semibold">
                        {selling.average_price_per_gram_9999.toFixed(4)} KWD
                      </div>
                    </div>
                  </div>
                )}
                <p className="text-stone-600 text-xs mb-2">
                  Period: {startDate} → {endDate}
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-2 px-3 text-stone-700 font-medium">Date</th>
                      <th className="text-left py-2 px-3 text-stone-700 font-medium">Detail</th>
                      <th className="text-left py-2 px-3 text-stone-700 font-medium">Carat</th>
                      <th className="text-right py-2 px-3 text-stone-700 font-medium">Weight (g)</th>
                      <th className="text-right py-2 px-3 text-stone-700 font-medium">Rate /g</th>
                      <th className="text-right py-2 px-3 text-stone-700 font-medium">Gold Amt (999.9)</th>
                      <th className="text-right py-2 px-3 text-stone-700 font-medium">Gross amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sellPageRows.map((row, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-stone-100 cursor-pointer hover:bg-lime-50"
                        onClick={() => {
                          setActivityDetailsKind('sell')
                          setActivityDetailsRow(row)
                          setActivityDetailsOpen(true)
                        }}
                      >
                        <td className="py-2 px-3 text-black">{row.date || '—'}</td>
                        <td className="py-2 px-3 text-stone-800">{row.detail}</td>
                        <td className="py-2 px-3 text-stone-800">{row.carat || '—'}</td>
                        <td className="py-2 px-3 text-right text-black">
                          {row.weight_grams.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-right text-black">
                          {row.rate_per_gram.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-right text-black">
                          {row.gold_amount_9999.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 text-right text-lime-800">
                          {row.gross_amount.toFixed(3)}
                        </td>
                      </tr>
                    ))}
                    {!sellRows.length && (
                      <tr>
                        <td colSpan={7} className="py-4 px-3 text-center text-stone-600">
                          No selling records in range.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {sellTotal > pageSize && (
                  <div className="flex items-center justify-between mt-3 text-xs text-stone-700">
                    <div>
                      Page {sellPage} of {sellTotalPages} ({sellTotal} rows)
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSellPage((p) => Math.max(1, p - 1))}
                        disabled={sellPage <= 1}
                        className="px-3 py-1 rounded-full border border-lime-400/60 disabled:opacity-40 hover:bg-lime-100"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        onClick={() => setSellPage((p) => (p < sellTotalPages ? p + 1 : p))}
                        disabled={sellPage >= sellTotalPages}
                        className="px-3 py-1 rounded-full border border-lime-400/60 disabled:opacity-40 hover:bg-lime-100"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Dialog
              open={activityDetailsOpen}
              onOpenChange={(v) => {
                setActivityDetailsOpen(v)
                if (!v) setActivityDetailsRow(null)
              }}
            >
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--panel-bg)] border border-stone-200 text-stone-800">
                <DialogHeader>
                  <DialogTitle className="gold-gradient-text-on-light">
                    Activity details ({activityDetailsKind})
                  </DialogTitle>
                </DialogHeader>

                {!activityDetailsRow ? (
                  <div className="p-4 text-stone-600">No details selected.</div>
                ) : (
                  <div className="space-y-4 p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-xs text-stone-600">Date</p>
                        <p className="text-black font-semibold">{activityDetailsRow.date || '—'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-xs text-stone-600">Detail</p>
                        <p className="text-black font-semibold">{activityDetailsRow.detail || '—'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-xs text-stone-600">Carat</p>
                        <p className="text-black font-semibold">{activityDetailsRow.carat || '—'}</p>
                      </div>
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-xs text-stone-600">Weight (g)</p>
                        <p className="text-black font-semibold">
                          {Number(activityDetailsRow.weight_grams ?? 0).toFixed(3)}
                        </p>
                      </div>
                    </div>

                    {activityDetailsKind === 'sell' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Customer</p>
                          <p className="text-black font-semibold">{activityDetailsRow.customer_name || '—'}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Customer phone</p>
                          <p className="text-black font-semibold">{activityDetailsRow.customer_phone || '—'}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Invoice</p>
                          <p className="text-black font-semibold">{activityDetailsRow.invoice_number || '—'}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Type</p>
                          <p className="text-black font-semibold">Sale</p>
                        </div>
                      </div>
                    )}

                    {activityDetailsKind === 'buy' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Seller / Customer</p>
                          <p className="text-black font-semibold">{activityDetailsRow.customer_name || '—'}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Phone</p>
                          <p className="text-black font-semibold">{activityDetailsRow.customer_phone || '—'}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Invoice / Purchase #</p>
                          <p className="text-black font-semibold">{activityDetailsRow.invoice_number || '—'}</p>
                        </div>
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Type</p>
                          <p className="text-black font-semibold">
                            {activityDetailsRow.source_type === 'buyback' ? 'Customer buyback' : 'Merchant purchase'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-3 bg-white rounded-lg">
                        <p className="text-xs text-stone-600">Rate / g</p>
                        <p className="text-black font-semibold">
                          {Number(activityDetailsRow.rate_per_gram ?? 0).toFixed(3)}
                        </p>
                      </div>

                      {activityDetailsKind === 'buy' ? (
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Total amount</p>
                          <p className="text-black font-semibold">
                            {Number(activityDetailsRow.total_amount ?? 0).toFixed(3)} KWD
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Gross amount</p>
                          <p className="text-black font-semibold">
                            {Number(activityDetailsRow.gross_amount ?? 0).toFixed(3)} KWD
                          </p>
                        </div>
                      )}

                      {activityDetailsKind === 'buy' ? (
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Weight /999.9</p>
                          <p className="text-black font-semibold">
                            {Number(activityDetailsRow.weight_9999 ?? 0).toFixed(3)}
                          </p>
                        </div>
                      ) : (
                        <div className="p-3 bg-white rounded-lg">
                          <p className="text-xs text-stone-600">Gold Amt (999.9)</p>
                          <p className="text-black font-semibold">
                            {Number(activityDetailsRow.gold_amount_9999 ?? 0).toFixed(3)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
    </div>
  )
}
