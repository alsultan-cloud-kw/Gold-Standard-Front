import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Printer } from 'lucide-react'
import { accountingApi } from '../../services/api'
import { TRADING_AND_VIRTUAL_WALLET_ENABLED } from '@/featureFlags'

const CURRENCY = 'KWD'
const fmt = (n: number) => Number(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const fmtPct = (n: number) => `${Number(n ?? 0).toFixed(1)}%`
const fmtCost = (n: number) => `(${fmt(n)})`

type PLData = {
  report_title?: string
  currency?: string
  start_date?: string
  end_date?: string
  revenue?: number
  cost_of_goods_sold?: number
  purchases?: number
  cost_of_sales?: number
  gross_profit?: number
  gross_margin?: number
  buyback_cost?: number
  operating_expenses?: number
  expense_breakdown?: { category: string; category_display?: string; total: number; count: number }[]
  net_profit?: number
  net_margin?: number
}

type BSAccount = { account_code: string; account_name_en: string; current_balance: number }
type BSData = {
  report_title?: string
  currency?: string
  as_of_date?: string
  assets?: { total?: number; accounts?: BSAccount[] }
  liabilities?: { total?: number; accounts?: BSAccount[] }
  equity?: { total?: number; accounts?: BSAccount[] }
  total_liabilities_and_equity?: number
  is_balanced?: boolean
}

export default function AdminFinancialReports() {
  const { t } = useTranslation()
  const printRef = useRef<HTMLDivElement>(null)
  const [plStart, setPlStart] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [plEnd, setPlEnd] = useState(() => new Date().toISOString().slice(0, 10))
  const [bsDate, setBsDate] = useState(() => new Date().toISOString().slice(0, 10))

  const { data: plData } = useQuery({
    queryKey: ['profitLoss', plStart, plEnd],
    queryFn: () => accountingApi.getProfitLoss(plStart, plEnd),
    enabled: !!plStart && !!plEnd,
  })

  const { data: bsData } = useQuery({
    queryKey: ['balanceSheet', bsDate],
    queryFn: () => accountingApi.getBalanceSheet(bsDate),
  })

  const pl = plData as PLData | undefined
  const bs = bsData as BSData | undefined

  const handlePrint = () => {
    window.print()
  }

  const periodLabel = pl?.start_date && pl?.end_date
    ? `For the period ${new Date(pl.start_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} to ${new Date(pl.end_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : ''
  const asOfLabel = bs?.as_of_date
    ? `As at ${new Date(bs.as_of_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
    : ''

  return (
    <div className="admin-page-inner">
      <div className="admin-page-body admin-page-body--narrow">
        <div className="no-print">
          <Link
            to="/admin/accounting"
            className="inline-flex items-center gap-2 text-stone-600 hover:text-amber-700 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('admin.backToAccounting')}
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.financialReports')}</h1>
              <p className="text-stone-600 mt-1">{t('admin.financialReportsSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-amber-600 text-amber-800 bg-amber-50 hover:bg-amber-100 transition-colors"
            >
              <Printer className="w-4 h-4" />
              {t('admin.printPdf')}
            </button>
          </div>
        </div>

        <div ref={printRef} className="space-y-10 print:space-y-8">
          {/* ——— Profit & Loss ——— */}
          <section className="gold-card print:shadow-none print:border print:border-stone-300">
            <div className="no-print flex flex-wrap gap-4 mb-6">
              <label className="flex items-center gap-2">
                <span className="text-stone-700 text-sm">From</span>
                <input
                  type="date"
                  value={plStart}
                  onChange={(e) => setPlStart(e.target.value)}
                  className="px-3 py-2 border border-black/15 rounded-lg bg-white text-stone-800"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-stone-700 text-sm">To</span>
                <input
                  type="date"
                  value={plEnd}
                  onChange={(e) => setPlEnd(e.target.value)}
                  className="px-3 py-2 border border-black/15 rounded-lg bg-white text-stone-800"
                />
              </label>
            </div>

            <h2 className="text-xl font-semibold text-black mb-1">
              {pl?.report_title ?? 'Profit & Loss Statement'}
            </h2>
            {periodLabel && <p className="text-sm text-stone-700 mb-6">{periodLabel}</p>}

            {pl ? (
              <div className="overflow-x-auto">
                <table className="w-full max-w-lg text-black">
                  <tbody>
                    <tr>
                      <td className="py-1 pt-2 font-medium text-stone-800">Revenue (Sales)</td>
                      <td className="py-1 pt-2 text-right font-medium">{fmt(pl.revenue ?? 0)} {pl.currency ?? CURRENCY}</td>
                      <td className="py-1 pt-2 text-right text-sm text-stone-600 w-16">100%</td>
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td colSpan={3} className="py-2 text-sm font-medium text-stone-800">Cost of sales</td>
                    </tr>
                    <tr>
                      <td className="py-1 pl-4 text-stone-800">Cost of goods sold</td>
                      <td className="py-1 text-right">{fmtCost(pl.cost_of_goods_sold ?? 0)}</td>
                      <td className="py-1 text-right text-sm text-stone-600">
                        {(pl.revenue ?? 0) !== 0 ? fmtPct(((pl.cost_of_goods_sold ?? 0) / (pl.revenue ?? 1)) * 100) : '—'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 pl-4 text-stone-800">Purchases (from merchants)</td>
                      <td className="py-1 text-right">{fmtCost(pl.purchases ?? 0)}</td>
                      <td className="py-1 text-right text-sm text-stone-600">
                        {(pl.revenue ?? 0) !== 0 ? fmtPct(((pl.purchases ?? 0) / (pl.revenue ?? 1)) * 100) : '—'}
                      </td>
                    </tr>
                    <tr className="border-b border-stone-100">
                      <td className="py-1 pl-4 font-medium text-stone-800">Total cost of sales</td>
                      <td className="py-1 text-right font-medium">{fmtCost(pl.cost_of_sales ?? (pl.cost_of_goods_sold ?? 0) + (pl.purchases ?? 0))}</td>
                      <td className="py-1" />
                    </tr>
                    <tr className="border-b border-stone-200">
                      <td className="py-2 font-medium text-black">Gross profit</td>
                      <td className="py-2 text-right font-medium text-lime-800">{fmt(pl.gross_profit ?? 0)} {pl.currency ?? CURRENCY}</td>
                      <td className="py-2 text-right text-sm text-lime-800">{fmtPct(pl.gross_margin ?? 0)}</td>
                    </tr>
                    {(TRADING_AND_VIRTUAL_WALLET_ENABLED && (pl.buyback_cost ?? 0) !== 0) && (
                      <tr>
                        <td className="py-1 text-stone-800">Buyback cost (trading)</td>
                        <td className="py-1 text-right">{fmtCost(pl.buyback_cost!)}</td>
                        <td className="py-1" />
                      </tr>
                    )}
                    <tr>
                      <td className="py-1 text-stone-800">Operating expenses</td>
                      <td className="py-1 text-right">{fmtCost(pl.operating_expenses ?? 0)}</td>
                      <td className="py-1" />
                    </tr>
                    {Array.isArray(pl.expense_breakdown) && pl.expense_breakdown.length > 0 && (
                      <tr>
                        <td colSpan={3} className="py-2">
                          <table className="w-full text-sm text-stone-700">
                            <tbody>
                              {pl.expense_breakdown.map((row: { category: string; category_display?: string; total: number }) => (
                                <tr key={row.category}>
                                  <td className="py-0.5 pl-6">{row.category_display ?? row.category}</td>
                                  <td className="py-0.5 text-right">{fmtCost(row.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-black/15">
                      <td className="py-3 font-semibold text-black">Net profit</td>
                      <td className="py-3 text-right font-semibold text-lime-800">{fmt(pl.net_profit ?? 0)} {pl.currency ?? CURRENCY}</td>
                      <td className="py-3 text-right text-sm font-medium text-lime-800">{fmtPct(pl.net_margin ?? 0)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-stone-600 py-6">Select date range and load report.</p>
            )}
          </section>

          {/* ——— Balance Sheet ——— */}
          <section className="gold-card print:shadow-none print:border print:border-stone-300">
            <div className="no-print mb-6">
              <label className="flex items-center gap-2">
                <span className="text-stone-700 text-sm">As of</span>
                <input
                  type="date"
                  value={bsDate}
                  onChange={(e) => setBsDate(e.target.value)}
                  className="px-3 py-2 border border-black/15 rounded-lg bg-white text-stone-800"
                />
              </label>
            </div>

            <h2 className="text-xl font-semibold text-black mb-1">
              {bs?.report_title ?? 'Balance Sheet'}
            </h2>
            {asOfLabel && <p className="text-sm text-stone-700 mb-6">{asOfLabel}</p>}

            {bs ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wide mb-2">Assets</h3>
                  <table className="w-full text-black">
                    <tbody>
                      {Array.isArray(bs.assets?.accounts) && bs.assets.accounts.length > 0 ? (
                        bs.assets.accounts.map((acc) => (
                          <tr key={acc.account_code} className="border-b border-stone-100">
                            <td className="py-1.5 font-mono text-sm text-stone-800">{acc.account_code}</td>
                            <td className="py-1.5 text-stone-800">{acc.account_name_en}</td>
                            <td className="py-1.5 text-right">{fmt(acc.current_balance)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={3} className="py-2 text-stone-500 text-sm">No asset accounts</td></tr>
                      )}
                      <tr className="border-t border-stone-200 font-medium">
                        <td colSpan={2} className="py-2 text-black">Total assets</td>
                        <td className="py-2 text-right text-lime-800">{fmt(bs.assets?.total ?? 0)} {bs.currency ?? CURRENCY}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wide mb-2">Liabilities</h3>
                  <table className="w-full text-black">
                    <tbody>
                      {Array.isArray(bs.liabilities?.accounts) && bs.liabilities.accounts.length > 0 ? (
                        bs.liabilities.accounts.map((acc) => (
                          <tr key={acc.account_code} className="border-b border-stone-100">
                            <td className="py-1.5 font-mono text-sm text-stone-800">{acc.account_code}</td>
                            <td className="py-1.5 text-stone-800">{acc.account_name_en}</td>
                            <td className="py-1.5 text-right">{fmt(acc.current_balance)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={3} className="py-2 text-stone-500 text-sm">No liability accounts</td></tr>
                      )}
                      <tr className="border-t border-stone-200 font-medium">
                        <td colSpan={2} className="py-2 text-black">Total liabilities</td>
                        <td className="py-2 text-right">{fmt(bs.liabilities?.total ?? 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <h3 className="text-sm font-semibold text-stone-800 uppercase tracking-wide mt-4 mb-2">Equity</h3>
                  <table className="w-full text-black">
                    <tbody>
                      {Array.isArray(bs.equity?.accounts) && bs.equity.accounts.length > 0 ? (
                        bs.equity.accounts.map((acc) => (
                          <tr key={acc.account_code} className="border-b border-stone-100">
                            <td className="py-1.5 font-mono text-sm text-stone-800">{acc.account_code}</td>
                            <td className="py-1.5 text-stone-800">{acc.account_name_en}</td>
                            <td className="py-1.5 text-right">{fmt(acc.current_balance)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan={3} className="py-2 text-stone-500 text-sm">No equity accounts</td></tr>
                      )}
                      <tr className="border-t border-stone-200 font-medium">
                        <td colSpan={2} className="py-2 text-black">Total equity</td>
                        <td className="py-2 text-right">{fmt(bs.equity?.total ?? 0)}</td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="w-full mt-4">
                    <tbody>
                      <tr className="border-t-2 border-black/15 font-semibold">
                        <td colSpan={2} className="py-2 text-black">Total liabilities & equity</td>
                        <td className="py-2 text-right text-lime-800">{fmt(bs.total_liabilities_and_equity ?? 0)} {bs.currency ?? CURRENCY}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
            {bs && (
              <div className="mt-6 pt-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm text-stone-700">
                  {bs.is_balanced === false ? 'Note: Assets and Liabilities + Equity may not balance (check posted journal entries).' : 'Assets = Liabilities + Equity.'}
                </span>
              </div>
            )}
            {!bs && <p className="text-stone-600 py-6">Select date and load report.</p>}
          </section>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff; }
          .gold-card { background: #fff; color: #1c1917; border-color: #d6d3d1; }
          .gold-card .text-black { color: #1c1917; }
          .gold-card .text-black\\/70 { color: #57534e; }
          .gold-card .text-black\\/80 { color: #44403c; }
          .gold-card .text-black\\/90 { color: #292524; }
          .gold-card .text-lime-800 { color: #3f6212; }
          .gold-card .text-black\\/60 { color: #78716c; }
          .gold-card .border-stone-100 { border-color: #e7e5e4; }
          .gold-card .border-stone-200 { border-color: #d6d3d1; }
          .gold-card .border-black\\/15 { border-color: #a8a29e; }
        }
      `}</style>
    </div>
  )
}
