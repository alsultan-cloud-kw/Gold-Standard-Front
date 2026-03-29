import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'
import AdminNav from '../../components/admin/AdminNav'
import { accountingApi, inventoryApi } from '../../services/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'salaries', label: 'Salaries' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'taxes', label: 'Taxes' },
  { value: 'other', label: 'Other' },
]

function asList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const p = data as { results?: T[] }
  return p?.results ?? []
}

type Branch = { id: string; code: string; name_en: string }

export default function AdminExpenses() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [form, setForm] = useState({
    category: 'other',
    branch: '',
    expense_date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    receipt_number: '',
  })

  const { data: branchesData } = useQuery({
    queryKey: ['branches'],
    queryFn: () => inventoryApi.getBranches(),
  })
  const branches = asList<Branch>(branchesData)

  const { data: expensesData, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: () => accountingApi.getExpenses(),
  })

  const createMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => accountingApi.createExpense(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      queryClient.invalidateQueries({ queryKey: ['expenseSummary', startDate, endDate] })
      setModalOpen(false)
      resetForm()
      toast.success('Expense created')
    },
    onError: (err: { response?: { data?: Record<string, string[]> } }) => {
      const msg = err?.response?.data
      const first = msg && typeof msg === 'object' && Object.values(msg)[0]
      toast.error(Array.isArray(first) ? first[0] : 'Failed to create expense')
    },
  })

  function resetForm() {
    setForm({
      category: 'other',
      branch: branches[0]?.id ?? '',
      expense_date: new Date().toISOString().slice(0, 10),
      description: '',
      amount: '',
      receipt_number: '',
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const branchId = form.branch || branches[0]?.id
    if (!branchId) {
      toast.error('Select a branch')
      return
    }
    const amount = parseFloat(form.amount)
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid amount')
      return
    }
    createMutation.mutate({
      category: form.category,
      branch: branchId,
      expense_date: form.expense_date,
      description: form.description.trim() || '—',
      amount: amount.toFixed(3),
      receipt_number: form.receipt_number.trim() || null,
    })
  }

  const { data: summaryData } = useQuery({
    queryKey: ['expenseSummary', startDate, endDate],
    queryFn: () => accountingApi.getExpenseSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  })

  const list = Array.isArray(expensesData) ? expensesData : (expensesData as { results?: unknown[] })?.results ?? []
  // Client-side pagination for expense list
  const [page, setPage] = useState(1)
  const pageSize = 10
  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageItems = list.slice(start, end)
  const summary = summaryData as { total_expenses?: number; summary?: { category: string; total: number }[] } | undefined

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.expenses')}</h1>
            <p className="text-stone-600 mt-1">{t('admin.expensesSubtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setModalOpen(true)
              if (branches.length && !form.branch) setForm((f) => ({ ...f, branch: branches[0].id }))
            }}
            className="gold-button inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('admin.addExpense')}
          </button>
        </div>

        {summaryData && (
          <div className="gold-card mb-8">
            <h2 className="text-lg font-semibold text-gold-100 mb-4">{t('admin.expenseSummaryByDate')}</h2>
            <div className="flex flex-wrap gap-4 mb-4">
              <label className="flex items-center gap-2">
                <span className="text-gold-100/70 text-sm">{t('admin.from')}</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gold-500/30 rounded-lg bg-white text-stone-800"
                />
              </label>
              <label className="flex items-center gap-2">
                <span className="text-gold-100/70 text-sm">{t('admin.to')}</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gold-500/30 rounded-lg bg-white text-stone-800"
                />
              </label>
            </div>
            <p className="text-gold-100/80 mb-2">
              {t('admin.totalExpenses')}: <strong className="text-gold-400">{Number(summary?.total_expenses ?? 0).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD</strong>
            </p>
            {summary?.summary && summary.summary.length > 0 && (
              <ul className="list-disc list-inside text-gold-100/80 text-sm">
                {summary.summary.map((s: { category: string; total: number }, i: number) => (
                  <li key={i}>{s.category}: {Number(s.total).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {isLoading ? (
          <div className="gold-card p-8 text-center text-gold-100/80">{t('common.loading')}</div>
        ) : (
          <div className="gold-card overflow-x-auto">
            <h2 className="text-lg font-semibold text-gold-100 mb-4">{t('admin.expenseList')}</h2>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gold-500/20">
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">{t('admin.expenseNumber')}</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">{t('admin.date')}</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">{t('admin.category')}</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">{t('admin.description')}</th>
                  <th className="text-left py-3 px-4 text-gold-100/70 font-medium">{t('admin.branch')}</th>
                  <th className="text-right py-3 px-4 text-gold-100/70 font-medium">{t('admin.amount')}</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((e: { id: string; expense_number: string; expense_date: string; category_display?: string; description?: string; branch_name?: string; amount: number }) => (
                  <tr key={e.id} className="border-b border-gold-500/10">
                    <td className="py-3 px-4 font-mono text-gold-100">{e.expense_number}</td>
                    <td className="py-3 px-4 text-gold-100">{e.expense_date}</td>
                    <td className="py-3 px-4 text-gold-100/80">{e.category_display || e.category || '—'}</td>
                    <td className="py-3 px-4 text-gold-100/80 max-w-xs truncate">{e.description || '—'}</td>
                    <td className="py-3 px-4 text-gold-100/80">{e.branch_name || '—'}</td>
                    <td className="py-3 px-4 text-right text-gold-400 font-medium">
                      {Number(e.amount).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {list.length === 0 && (
              <p className="py-8 text-center text-gold-100/60">No expenses found.</p>
            )}
          </div>
        )}
        {!isLoading && total > pageSize && (
          <div className="mt-4 gold-card flex items-center justify-between text-xs text-gold-100/70">
            <div>
              Page {page} of {totalPages} ({total} expenses)
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
              >
                Next
              </button>
            </div>
          </div>
        )}

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[var(--panel-bg)] border border-gold-500/30 rounded-xl shadow-xl text-stone-800">
            <DialogHeader>
              <DialogTitle className="gold-gradient-text-on-light">{t('admin.addExpense')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">{t('admin.category')} *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">{t('admin.branch')} *</label>
                <select
                  value={form.branch}
                  onChange={(e) => setForm((f) => ({ ...f, branch: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                >
                  <option value="">Select branch</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name_en} ({b.code})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">{t('admin.date')} *</label>
                <input
                  type="date"
                  value={form.expense_date}
                  onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">{t('admin.description')} *</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                  rows={3}
                  placeholder="Expense description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">{t('admin.amount')} (KWD) *</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-1">Receipt number (optional)</label>
                <input
                  type="text"
                  value={form.receipt_number}
                  onChange={(e) => setForm((f) => ({ ...f, receipt_number: e.target.value }))}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg bg-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg text-stone-700 hover:bg-stone-100"
                >
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={createMutation.isPending} className="gold-button">
                  {createMutation.isPending ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
