import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Landmark, X } from 'lucide-react'
import { toast } from 'sonner'
import AdminNav from '../../components/admin/AdminNav'
import AdminPaginationBar from '../../components/admin/AdminPaginationBar'
import { adminApi, type BankChangeRequestRow } from '../../services/api'

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

export default function AdminBankChangeRequests() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const [rejectTarget, setRejectTarget] = useState<BankChangeRequestRow | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data: bankRequests = [], isLoading: bankLoading } = useQuery({
    queryKey: ['adminBankChangeRequests'],
    queryFn: () => adminApi.getBankChangeRequests({ page_size: 100 }),
  })

  const approveBankMutation = useMutation({
    mutationFn: (id: string) => adminApi.approveBankChangeRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBankChangeRequests'] })
      toast.success(t('admin.bankChangeApproved'))
    },
    onError: () => toast.error(t('admin.bankChangeFailed')),
  })

  const rejectBankMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.rejectBankChangeRequest(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminBankChangeRequests'] })
      setRejectTarget(null)
      setRejectReason('')
      toast.success(t('admin.bankChangeRejected'))
    },
    onError: () => toast.error(t('admin.bankChangeFailed')),
  })

  const hasAny = useMemo(() => bankRequests && bankRequests.length > 0, [bankRequests])

  const total = bankRequests.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const pageRows = useMemo(
    () => bankRequests.slice((page - 1) * pageSize, page * pageSize),
    [bankRequests, page],
  )

  useEffect(() => {
    setPage(1)
  }, [bankRequests])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.bankChangeRequestsTitle')}</h1>
            <p className="text-stone-600">{t('admin.bankChangeRequestsSubtitle')}</p>
          </div>
        </div>

        <div className="gold-card mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 mb-4 px-1">
            <Landmark className="w-5 h-5 text-lime-800" />
            <h2 className="text-lg font-semibold text-black">{t('admin.bankChangeRequestsTitle')}</h2>
          </div>

          {bankLoading ? (
            <p className="text-stone-500 text-center py-6">{t('admin.bankChangeLoading')}</p>
          ) : !hasAny ? (
            <p className="text-stone-500 text-center py-6">{t('admin.bankChangeNoPending')}</p>
          ) : (
            <>
            <table className="w-full min-w-[720px]">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2 px-3 text-stone-600 text-sm font-medium">{t('admin.bankChangeCustomer')}</th>
                  <th className="text-left py-2 px-3 text-stone-600 text-sm font-medium">{t('admin.bankChangeBank')}</th>
                  <th className="text-left py-2 px-3 text-stone-600 text-sm font-medium">{t('admin.bankChangeIban')}</th>
                  <th className="text-left py-2 px-3 text-stone-600 text-sm font-medium">{t('admin.bankChangeSubmitted')}</th>
                  <th className="text-left py-2 px-3 text-stone-600 text-sm font-medium">Status</th>
                  <th className="text-center py-2 px-3 text-stone-600 text-sm font-medium">{t('admin.bankChangeProof')}</th>
                  <th className="text-right py-2 px-3 text-stone-600 text-sm font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row) => (
                  <tr key={row.id} className="border-b border-stone-100">
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        className="text-left text-black hover:text-lime-800 underline-offset-2 hover:underline"
                        onClick={() => row.customer_user_id && navigate(`/admin/customers/${row.customer_user_id}`)}
                      >
                        {row.customer_name || '—'}
                      </button>
                      <div className="text-xs text-stone-500 truncate max-w-[200px]" title={row.customer_email ?? ''}>
                        {row.customer_email || row.customer_phone || ''}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-stone-800 text-sm">{row.bank_name}</td>
                    <td className="py-3 px-3 text-stone-800 text-xs font-mono break-all max-w-[180px]">{row.iban}</td>
                    <td className="py-3 px-3 text-stone-700 text-sm whitespace-nowrap">{formatDate(row.created_at)}</td>
                    <td className="py-3 px-3 text-stone-800 text-sm whitespace-nowrap">
                      <span
                        className={
                          row.status === 'approved'
                            ? 'text-emerald-700'
                            : row.status === 'rejected'
                              ? 'text-red-700'
                              : 'text-amber-800'
                        }
                      >
                        {row.status}
                      </span>
                      {row.status !== 'pending' && row.rejection_reason ? (
                        <div className="text-[11px] text-stone-500 mt-1 max-w-[240px] break-words">{row.rejection_reason}</div>
                      ) : null}
                      {row.status !== 'pending' && row.reviewed_at ? (
                        <div className="text-[11px] text-stone-500 mt-1">
                          {row.reviewed_by_name ? `${row.reviewed_by_name} • ` : ''}
                          {formatDate(row.reviewed_at)}
                        </div>
                      ) : null}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.iban_proof_url ? (
                        <a
                          href={row.iban_proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-700 hover:underline"
                        >
                          {t('admin.bankChangeViewProof')}
                        </a>
                      ) : (
                        <span className="text-xs text-stone-500">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        disabled={row.status !== 'pending' || approveBankMutation.isPending || rejectBankMutation.isPending}
                        onClick={() => approveBankMutation.mutate(row.id)}
                        className="mr-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-700/80 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:hover:bg-emerald-700/80"
                      >
                        {t('admin.bankChangeApprove')}
                      </button>
                      <button
                        type="button"
                        disabled={row.status !== 'pending' || approveBankMutation.isPending || rejectBankMutation.isPending}
                        onClick={() => {
                          setRejectTarget(row)
                          setRejectReason('')
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-400 text-red-800 hover:bg-red-50 disabled:opacity-50"
                      >
                        {t('admin.bankChangeReject')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {total > pageSize && (
              <AdminPaginationBar
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={pageSize}
                onPageChange={setPage}
                itemLabel="requests"
              />
            )}
            </>
          )}
        </div>

        {rejectTarget ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bank-reject-title"
          >
            <div className="gold-card max-w-md w-full p-6 relative border border-black/15">
              <button
                type="button"
                className="absolute top-3 end-3 p-1 rounded-lg text-stone-700 hover:bg-lime-100"
                onClick={() => setRejectTarget(null)}
                aria-label={t('admin.bankChangeCancel')}
              >
                <X className="w-5 h-5" />
              </button>
              <h3 id="bank-reject-title" className="text-lg font-semibold text-black pe-8">
                {t('admin.bankChangeRejectTitle')}
              </h3>
              <p className="text-xs text-stone-500 mt-1 mb-3">
                {rejectTarget.customer_name} — {rejectTarget.bank_name}
              </p>
              <label className="block text-sm text-stone-800 mb-2">{t('admin.bankChangeRejectReason')}</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-white border border-black/15 text-black text-sm"
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg text-sm border border-lime-300/50 text-black hover:bg-lime-100"
                  onClick={() => setRejectTarget(null)}
                >
                  {t('admin.bankChangeCancel')}
                </button>
                <button
                  type="button"
                  disabled={rejectBankMutation.isPending}
                  className="px-4 py-2 rounded-lg text-sm bg-red-800/90 text-white hover:bg-red-700 disabled:opacity-50"
                  onClick={() =>
                    rejectBankMutation.mutate({ id: rejectTarget.id, reason: rejectReason.trim() })
                  }
                >
                  {t('admin.bankChangeRejectConfirm')}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

