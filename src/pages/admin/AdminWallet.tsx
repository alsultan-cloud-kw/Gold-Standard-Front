import { useQuery } from '@tanstack/react-query'
import { walletApi } from '../../services/api'
import AdminNav from '../../components/admin/AdminNav'

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
  const total = data?.total_wallet_liability ?? 0
  const wallets = data?.wallets ?? []

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6 mt-4">
          <h1 className="text-2xl font-bold gold-gradient-text-on-light">Wallet overview</h1>
        </div>
        <AdminNav />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="gold-card">
            <p className="text-sm text-gold-100/70 mb-1">Total wallet liability</p>
            <p className="text-3xl font-bold text-gold-100">
              {total.toFixed(3)} {currency}
            </p>
          </div>
          <div className="gold-card">
            <p className="text-sm text-gold-100/70 mb-1">Wallets count</p>
            <p className="text-3xl font-bold text-gold-100">{wallets.length}</p>
          </div>
        </div>

        <div className="gold-card">
          <h2 className="text-lg font-semibold text-gold-100 mb-4">Customer wallets</h2>
          {isLoading && !data ? (
            <p className="text-gold-100/60 text-center py-8">Loading wallets…</p>
          ) : wallets.length === 0 ? (
            <p className="text-gold-100/60 text-center py-8">No wallets found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gold-100/70 border-b border-gold-500/20">
                    <th className="py-2 pr-2">Customer</th>
                    <th className="py-2 pr-2">Email</th>
                    <th className="py-2 pr-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {wallets.map((w) => (
                    <tr key={w.id} className="border-b border-gold-500/10 last:border-0">
                      <td className="py-2 pr-2 text-gold-100/80">
                        {w.user_name || w.user_email || w.user_id || 'Customer'}
                      </td>
                      <td className="py-2 pr-2 text-gold-100/60">
                        {w.user_email || '—'}
                      </td>
                      <td className="py-2 pr-2 text-right text-gold-100">
                        {w.balance.toFixed(3)} {w.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
