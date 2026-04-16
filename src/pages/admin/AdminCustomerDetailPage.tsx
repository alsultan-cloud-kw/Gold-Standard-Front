import { useMemo, useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { User, Mail, Phone, Shield, Calendar, Hash, ShoppingBag, ArrowLeft } from 'lucide-react'
import AdminNav from '../../components/admin/AdminNav'
import AdminPaginationBar from '../../components/admin/AdminPaginationBar'
import { adminApi, ordersApi } from '../../services/api'
import { formatNationalityForDisplay } from '@/lib/registrationRegions'

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
  date_of_birth?: string | null
  nationality?: string | null
  civil_id?: string | null
  terms_accepted_at?: string | null
  privacy_policy_accepted_at?: string | null
  terms_policy_version?: string | null
  privacy_policy_version?: string | null
}

type OrderRecord = {
  id: string
  invoice_number: string
  sale_date: string
  status: string
  status_display?: string
  total_amount: string
  branch_name?: string
  payment_method_display?: string
}

function asOrderList(data: unknown): OrderRecord[] {
  if (Array.isArray(data)) return data as OrderRecord[]
  const p = data as { results?: OrderRecord[] } | undefined
  return p?.results ?? []
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}

export default function AdminCustomerDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const { i18n } = useTranslation()
  const nationalityLocale = i18n.language?.startsWith('ar') ? 'ar' : 'en'

  const { data: detailUser, isLoading: detailLoading } = useQuery({
    queryKey: ['adminCustomerDetail', userId],
    queryFn: () => adminApi.getUser(userId!),
    enabled: !!userId,
  })

  const { data: customerProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['adminCustomerProfileDetail', userId],
    queryFn: () => adminApi.getCustomerProfileByUserId(userId!),
    enabled: !!userId,
  })

  const { data: ordersData } = useQuery({
    queryKey: ['adminCustomerOrders', userId],
    queryFn: () => ordersApi.getOrders({ customer: userId!, page_size: '100' }),
    enabled: !!userId,
  })

  const customerOrders = useMemo(() => asOrderList(ordersData), [ordersData])

  const orderPageSize = 10
  const [orderPage, setOrderPage] = useState(1)
  const orderTotal = customerOrders.length
  const orderTotalPages = Math.max(1, Math.ceil(orderTotal / orderPageSize))
  const orderPageRows = useMemo(
    () => customerOrders.slice((orderPage - 1) * orderPageSize, orderPage * orderPageSize),
    [customerOrders, orderPage],
  )

  useEffect(() => {
    setOrderPage(1)
  }, [userId, ordersData])

  useEffect(() => {
    if (orderPage > orderTotalPages) setOrderPage(orderTotalPages)
  }, [orderPage, orderTotalPages])

  if (!userId) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <AdminNav />
          <p className="text-stone-600">Invalid customer.</p>
          <Link to="/admin/customers" className="text-lime-800 hover:text-lime-800 mt-2 inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to customers
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <Link
          to="/admin/customers"
          className="inline-flex items-center gap-2 gold-gradient-text-on-light hover:text-lime-800 text-sm mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to customers
        </Link>

        {detailLoading ? (
          <div className="gold-card p-8 text-center text-stone-600">Loading...</div>
        ) : detailUser ? (
          <div className="space-y-8">
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">Customer details</h1>

            <div className="gold-card p-6">
              <h2 className="text-lg font-semibold text-black mb-4">Profile</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-lime-800 shrink-0" />
                  <span className="text-stone-600 w-24">Name</span>
                  <span className="text-black">{(detailUser as UserRecord).full_name || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-lime-800 shrink-0" />
                  <span className="text-stone-600 w-24">Email</span>
                  <span className="text-black truncate">{(detailUser as UserRecord).email || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-lime-800 shrink-0" />
                  <span className="text-stone-600 w-24">Phone</span>
                  <span className="text-black">{(detailUser as UserRecord).phone_number || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-lime-800 shrink-0" />
                  <span className="text-stone-600 w-24">Role</span>
                  <span className="text-black">{(detailUser as UserRecord).role_display || (detailUser as UserRecord).role}</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Hash className="w-4 h-4 text-lime-800 shrink-0" />
                  <span className="text-stone-600 w-24">ID</span>
                  <span className="text-stone-800 font-mono text-xs truncate">{(detailUser as UserRecord).id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-600 w-24">Active</span>
                  <span className={(detailUser as UserRecord).is_active ? 'text-green-400' : 'text-red-400'}>
                    {(detailUser as UserRecord).is_active ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-600 w-24">Verified</span>
                  <span className="text-black">{(detailUser as UserRecord).is_verified ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-lime-800 shrink-0" />
                  <span className="text-stone-600 w-24">Joined</span>
                  <span className="text-black">{formatDate((detailUser as UserRecord).date_joined)}</span>
                </div>
                {(detailUser as UserRecord).date_of_birth && (
                  <div className="flex items-center gap-2">
                    <span className="text-stone-600 w-24">Date of birth</span>
                    <span className="text-black">{(detailUser as UserRecord).date_of_birth}</span>
                  </div>
                )}
                {(detailUser as UserRecord).nationality && (
                  <div className="flex items-center gap-2">
                    <span className="text-stone-600 w-24">Nationality</span>
                    <span className="text-black">
                      {formatNationalityForDisplay(
                        (detailUser as UserRecord).nationality,
                        nationalityLocale
                      )}
                    </span>
                  </div>
                )}
                {(detailUser as UserRecord).civil_id && (
                  <div className="flex items-center gap-2">
                    <span className="text-stone-600 w-24">Civil ID</span>
                    <span className="text-black">{(detailUser as UserRecord).civil_id}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 sm:col-span-2">
                  <span className="text-stone-600 w-24">Terms accepted</span>
                  <span className="text-black">
                    {(detailUser as UserRecord).terms_accepted_at
                      ? new Date((detailUser as UserRecord).terms_accepted_at as string).toLocaleString()
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-600 w-24">Terms version</span>
                  <span className="text-black">{(detailUser as UserRecord).terms_policy_version || '—'}</span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <span className="text-stone-600 w-24">Privacy accepted</span>
                  <span className="text-black">
                    {(detailUser as UserRecord).privacy_policy_accepted_at
                      ? new Date((detailUser as UserRecord).privacy_policy_accepted_at as string).toLocaleString()
                      : '—'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-600 w-24">Privacy version</span>
                  <span className="text-black">{(detailUser as UserRecord).privacy_policy_version || '—'}</span>
                </div>

                {!profileLoading && customerProfile ? (
                  <>
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <span className="text-stone-600 w-24">Address</span>
                      <span className="text-black">
                        {[customerProfile.address_line1, customerProfile.address_line2].filter(Boolean).join(', ') ||
                          '—'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-600 w-24">City</span>
                      <span className="text-black">{customerProfile.city || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-600 w-24">Governorate</span>
                      <span className="text-black">{customerProfile.governorate || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-600 w-24">Postal code</span>
                      <span className="text-black">{customerProfile.postal_code || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-600 w-24">Country</span>
                      <span className="text-black">{customerProfile.country || '—'}</span>
                    </div>
                  </>
                ) : null}
              </div>
            </div>

            <div className="gold-card p-6">
              <h2 className="text-lg font-semibold text-black flex items-center gap-2 mb-4">
                <ShoppingBag className="w-5 h-5 text-lime-800" />
                Order history ({customerOrders.length})
              </h2>
              {customerOrders.length === 0 ? (
                <p className="text-stone-600">No orders yet.</p>
              ) : (
                <div className="border border-stone-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-white/80 border-b border-stone-200">
                        <th className="text-left py-3 px-4 text-stone-600 font-medium">Invoice</th>
                        <th className="text-left py-3 px-4 text-stone-600 font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-stone-600 font-medium">Status</th>
                        <th className="text-right py-3 px-4 text-stone-600 font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orderPageRows.map((order) => (
                        <tr key={order.id} className="border-b border-stone-100 last:border-0">
                          <td className="py-3 px-4 font-mono text-stone-800">{order.invoice_number}</td>
                          <td className="py-3 px-4 text-stone-800">{formatDate(order.sale_date)}</td>
                          <td className="py-3 px-4">
                            <span className="inline-block px-2 py-1 rounded text-xs bg-lime-100/80 text-lime-800">
                              {order.status_display || order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-lime-800 tabular-nums">
                            {Number(order.total_amount).toLocaleString()} KWD
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {customerOrders.length > orderPageSize && (
                <AdminPaginationBar
                  page={orderPage}
                  totalPages={orderTotalPages}
                  total={orderTotal}
                  pageSize={orderPageSize}
                  onPageChange={setOrderPage}
                  itemLabel="orders"
                />
              )}
            </div>
          </div>
        ) : (
          <div className="gold-card p-8">
            <p className="text-stone-600">Could not load customer.</p>
            <Link to="/admin/customers" className="text-lime-800 hover:text-lime-800 mt-2 inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Back to customers
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
