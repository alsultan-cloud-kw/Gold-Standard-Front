import { useMemo, useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { walletApi } from '../../services/api'
import AdminNav from '../../components/admin/AdminNav'
import AdminPaginationBar from '../../components/admin/AdminPaginationBar'

type AdminWalletSummary = {
  currency: string
  total_wallet_liability: number
  wallets: {
    id: string
    user_id: string | null
    user_name: string | null
    user_email: string | null
    balance: number
    currency: string
  }[]
}

export default function AdminWallet() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminWalletSummary'],
    queryFn: () => walletApi.getAdminSummary() as Promise<AdminWalletSummary>,
  })

  const currency = data?.currency ?? 'KWD'
  const liabilityTotal = data?.total_wallet_liability ?? 0
  const wallets = data?.wallets ?? []

  const pageSize = 10
  const [page, setPage] = useState(1)
  const walletRowTotal = wallets.length
  const totalPages = Math.max(1, Math.ceil(walletRowTotal / pageSize))
  const pageRows = useMemo(
    () => wallets.slice((page - 1) * pageSize, page * pageSize),
    [wallets, page],
  )

  useEffect(() => {
    setPage(1)
  }, [data])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 mt-4">
          <h1 className="text-2xl font-bold gold-gradient-text-on-light">Wallet overview</h1>
        </div>
        <AdminNav />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="gold-card">
            <p className="text-sm text-stone-700 mb-1">Total wallet liability</p>
            <p className="text-3xl font-bold text-black">
              {liabilityTotal.toFixed(3)} {currency}
            </p>
          </div>
          <div className="gold-card">
            <p className="text-sm text-stone-700 mb-1">Wallets count</p>
            <p className="text-3xl font-bold text-black">{wallets.length}</p>
          </div>
        </div>

        <div className="gold-card">
          <h2 className="text-lg font-semibold text-black mb-4">Customer wallets</h2>
          {isLoading && !data ? (
            <p className="text-stone-600 text-center py-8">Loading wallets…</p>
          ) : wallets.length === 0 ? (
            <p className="text-stone-600 text-center py-8">No wallets found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-stone-700 border-b border-stone-200">
                    <th className="py-2 pr-2">Customer</th>
                    <th className="py-2 pr-2">Email</th>
                    <th className="py-2 pr-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((w) => (
                    <tr key={w.id} className="border-b border-stone-100 last:border-0">
                      <td className="py-2 pr-2 text-stone-800">
                        {w.user_name || w.user_email || w.user_id || 'Customer'}
                      </td>
                      <td className="py-2 pr-2 text-stone-600">
                        {w.user_email || '—'}
                      </td>
                      <td className="py-2 pr-2 text-right text-black">
                        {w.balance.toFixed(3)} {w.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {walletRowTotal > pageSize && (
                <AdminPaginationBar
                  page={page}
                  totalPages={totalPages}
                  total={walletRowTotal}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  itemLabel="wallets"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
