import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search, User, Mail, Phone, Shield } from 'lucide-react'
import { toast } from 'sonner'
import AdminNav from '../../components/admin/AdminNav'
import { adminApi } from '../../services/api'

type UserRecord = {
  id: string
  email: string | null
  phone_number: string | null
  full_name: string
  role: string
  role_display?: string
  is_active: boolean
  is_verified?: boolean
  date_joined: string
}

function asUserList(data: unknown): UserRecord[] {
  if (Array.isArray(data)) return data as UserRecord[]
  const p = data as { results?: UserRecord[] } | undefined
  return p?.results ?? []
}

export default function AdminCustomers() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 10

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['adminCustomers'],
    queryFn: () => adminApi.getCustomers({ page_size: 500 }),
  })

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, is_active }: { userId: string; is_active: boolean }) =>
      adminApi.updateUser(userId, { is_active }),
    onSuccess: (_, { is_active }) => {
      queryClient.invalidateQueries({ queryKey: ['adminCustomers'] })
      toast.success(is_active ? 'User activated' : 'User deactivated')
    },
    onError: (e: Error) => toast.error(e.message || 'Update failed'),
  })

  const users = useMemo(() => asUserList(usersData), [usersData])

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users
    const q = searchQuery.toLowerCase()
    const result = users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone_number?.toLowerCase().includes(q) ||
        u.role_display?.toLowerCase().includes(q) ||
        u.role?.toLowerCase().includes(q)
    )
    setPage(1)
    return result
  }, [users, searchQuery])

  const total = filteredUsers.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageItems = filteredUsers.slice(start, end)

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    } catch {
      return '—'
    }
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.customers')}</h1>
            <p className="text-gold-100/60">{t('admin.customersSubtitle')}</p>
          </div>
        </div>

        {/* Bank change requests moved to a dedicated tab: /admin/bank-requests */}

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold-400/60" />
            <input
              type="text"
              placeholder="Search by name, email, phone, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
            />
          </div>
        </div>

        <div className="gold-card overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-gold-500/20">
                <th className="text-left py-3 px-4 text-gold-100/60 font-medium">User</th>
                <th className="text-left py-3 px-4 text-gold-100/60 font-medium">Contact</th>
                <th className="text-left py-3 px-4 text-gold-100/60 font-medium">Role</th>
                <th className="text-center py-3 px-4 text-gold-100/60 font-medium">Active</th>
                <th className="text-left py-3 px-4 text-gold-100/60 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gold-100/60">
                    Loading...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gold-100/60">
                    No users found.
                  </td>
                </tr>
              ) : (
                pageItems.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-gold-500/10 cursor-pointer hover:bg-gold-500/5 transition-colors"
                    onClick={() => navigate(`/admin/customers/${user.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gold-500/10 flex items-center justify-center shrink-0">
                          <User className="w-5 h-5 text-gold-400" />
                        </div>
                        <span className="text-gold-100">{user.full_name || '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm space-y-0.5">
                        {user.email ? (
                          <p className="text-gold-100 flex items-center gap-1 truncate max-w-[220px]" title={user.email}>
                            <Mail className="w-3 h-3 shrink-0" /> {user.email}
                          </p>
                        ) : (
                          <p className="text-gold-100/50 flex items-center gap-1">—</p>
                        )}
                        {user.phone_number ? (
                          <p className="text-gold-100/80 flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" /> {user.phone_number}
                          </p>
                        ) : (
                          <p className="text-gold-100/50 flex items-center gap-1">—</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gold-500/10 text-gold-400">
                        <Shield className="w-3 h-3" />
                        {user.role_display || user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={user.is_active}
                        disabled={updateUserMutation.isPending}
                        onClick={() =>
                          updateUserMutation.mutate({
                            userId: user.id,
                            is_active: !user.is_active,
                          })
                        }
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-gold-500/50 disabled:opacity-50 ${
                          user.is_active ? 'bg-green-600' : 'bg-charcoal-600'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition translate-x-0.5 mt-0.5 ${
                            user.is_active ? 'translate-x-5' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-gold-100/80 text-sm">
                      {formatDate(user.date_joined)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {!isLoading && total > pageSize && (
            <div className="mt-3 flex items-center justify-between text-xs text-gold-100/70">
              <div>
                Page {page} of {totalPages} ({total} users)
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
        </div>

      </div>
    </div>
  )
}
