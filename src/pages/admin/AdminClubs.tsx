import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'
import AdminNav from '../../components/admin/AdminNav'
import { adminApi, clubsApi } from '../../services/api'
import { isStorefrontRole } from '../../constants/storefrontRoles'

type ClubRow = {
  id: string
  name: string
  head_name?: string
  head_email?: string
  is_active?: boolean
  member_count?: number
  members?: Array<{
    id: string
    user_id: string
    full_name: string
    email: string | null
    phone_number: string | null
    role: string
    joined_at: string | null
  }>
}

function asClubList(data: unknown): ClubRow[] {
  if (Array.isArray(data)) return data as ClubRow[]
  const p = data as { results?: ClubRow[] }
  return p?.results ?? []
}

type UserRecord = {
  id: string
  email: string | null
  phone_number: string | null
  full_name: string
  role: string
}

function asUserList(data: unknown): UserRecord[] {
  if (Array.isArray(data)) return data as UserRecord[]
  const p = data as { results?: UserRecord[] } | undefined
  return p?.results ?? []
}

export default function AdminClubs() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [grantUserId, setGrantUserId] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false)
  const comboRef = useRef<HTMLDivElement>(null)
  const searchInsideRef = useRef<HTMLInputElement>(null)
  const [grantTitle, setGrantTitle] = useState('Loyalty discount')
  const [grantPercent, setGrantPercent] = useState('')
  const [grantAmount, setGrantAmount] = useState('')
  const [grantValidUntil, setGrantValidUntil] = useState('')

  const {
    data: formationConfigData,
    isLoading: formationConfigLoading,
    refetch: refetchFormationConfig,
  } = useQuery({
    queryKey: ['clubFormationConfig'],
    queryFn: () => clubsApi.getFormationConfig(),
  })
  const formationMinOrders = formationConfigData?.min_completed_orders ?? 0
  const [minCompletedOrdersInput, setMinCompletedOrdersInput] = useState(String(formationMinOrders))

  useEffect(() => {
    // Keep input synced when config loads/refreshes.
    if (!formationConfigLoading) {
      setMinCompletedOrdersInput(String(formationMinOrders))
    }
  }, [formationConfigLoading, formationMinOrders])

  const updateFormationConfigMutation = useMutation({
    mutationFn: () => {
      const raw = minCompletedOrdersInput.trim()
      const i = Number(raw)
      if (!raw || Number.isNaN(i) || !Number.isFinite(i) || i < 0) {
        throw new Error('Enter a valid non-negative integer.')
      }
      return clubsApi.updateFormationConfig({ min_completed_orders: i })
    },
    onSuccess: () => {
      toast.success('Club formation rule updated')
      queryClient.invalidateQueries({ queryKey: ['clubFormationConfig'] })
      refetchFormationConfig().catch(() => {})
    },
    onError: (err: unknown) => {
      if (err instanceof Error) toast.error(err.message)
      else toast.error('Failed to update')
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['adminClubs'],
    queryFn: () => clubsApi.listClubs(),
  })
  const clubs = useMemo(() => asClubList(data), [data])

  const { data: usersData, isLoading: customersLoading } = useQuery({
    queryKey: ['adminCustomers'],
    queryFn: () => adminApi.getCustomers({ page_size: 500 }),
  })
  const allUsers = useMemo(() => asUserList(usersData), [usersData])
  const customers = useMemo(
    () => allUsers.filter((u) => isStorefrontRole(u.role)),
    [allUsers],
  )
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers
    const q = customerSearch.toLowerCase()
    return customers.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone_number && u.phone_number.toLowerCase().includes(q)) ||
        u.id.toLowerCase().includes(q),
    )
  }, [customers, customerSearch])

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === grantUserId),
    [customers, grantUserId],
  )

  /** Options in dropdown: filtered list, plus current selection if search hides it */
  const dropdownCustomers = useMemo(() => {
    const ids = new Set(filteredCustomers.map((u) => u.id))
    if (grantUserId && selectedCustomer && !ids.has(grantUserId)) {
      return [selectedCustomer, ...filteredCustomers]
    }
    return filteredCustomers
  }, [filteredCustomers, grantUserId, selectedCustomer])

  function customerOptionLabel(u: UserRecord) {
    const contact = u.email || u.phone_number || `${u.id.slice(0, 8)}…`
    return `${u.full_name || '—'} — ${contact}`
  }

  useEffect(() => {
    if (!customerDropdownOpen) return
    const t = window.setTimeout(() => searchInsideRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [customerDropdownOpen])

  useEffect(() => {
    if (!customerDropdownOpen) return
    const onDoc = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setCustomerDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [customerDropdownOpen])

  const grantMutation = useMutation({
    mutationFn: () => {
      const pctRaw = grantPercent.trim()
      const amtRaw = grantAmount.trim()
      const hasPct = pctRaw !== '' && !Number.isNaN(Number(pctRaw))
      const hasAmt = amtRaw !== '' && !Number.isNaN(Number(amtRaw)) && Number(amtRaw) >= 0
      if (!hasPct && !hasAmt) {
        throw new Error('Enter either a valid discount % or fixed KWD amount')
      }
      if (hasPct && hasAmt) {
        throw new Error('Use only one: percent OR fixed amount')
      }
      const pct = hasPct ? Number(pctRaw) : null
      const amt = hasAmt ? amtRaw : null
      let validUntil: string | null = null
      if (grantValidUntil.trim()) {
        const d = new Date(grantValidUntil)
        if (!Number.isNaN(d.getTime())) validUntil = d.toISOString()
      }
      return clubsApi.grantOffer({
        user_id: grantUserId.trim(),
        title: grantTitle.trim(),
        discount_percent: pct != null && !Number.isNaN(pct) ? pct : null,
        discount_amount_kwd: amt,
        valid_until: validUntil,
      })
    },
    onSuccess: () => {
      toast.success('Offer granted')
      queryClient.invalidateQueries({ queryKey: ['adminClubs'] })
      setGrantPercent('')
      setGrantAmount('')
    },
    onError: (err: unknown) => {
      if (err instanceof Error) {
        toast.error(err.message)
        return
      }
      const e = err as { response?: { data?: Record<string, unknown> } }
      const d = e?.response?.data
      const msg =
        (typeof d?.detail === 'string' && d.detail) ||
        (Array.isArray(d?.non_field_errors) && String(d.non_field_errors[0])) ||
        'Grant failed'
      toast.error(msg)
    },
  })

  return (
    <div className="min-h-screen py-8 bg-[var(--site-bg)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="mb-8">
          <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.clubsTitle')}</h1>
          <p className="text-stone-600 mt-1">{t('admin.clubsSubtitle')}</p>
        </div>

        <div className="gold-card mb-8">
          <h2 className="text-lg font-semibold text-gold-100 mb-4">Club formation eligibility</h2>
          <p className="text-sm text-gold-100/70 mb-4">
            Admin can require a minimum number of completed orders before a customer can create or join a club.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="text-xs text-gold-100/60 block mb-1">Min completed orders</label>
              <input
                type="number"
                min={0}
                className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-gold-500/30 text-gold-100 text-sm"
                value={minCompletedOrdersInput}
                onChange={(e) => setMinCompletedOrdersInput(e.target.value)}
                disabled={formationConfigLoading || updateFormationConfigMutation.isPending}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                onClick={() => updateFormationConfigMutation.mutate()}
                disabled={formationConfigLoading || updateFormationConfigMutation.isPending}
                className="gold-button px-4 py-2 text-sm disabled:opacity-50"
              >
                {updateFormationConfigMutation.isPending ? 'Saving…' : 'Save rule'}
              </button>
            </div>
          </div>
        </div>

        <div className="gold-card mb-8">
          <h2 className="text-lg font-semibold text-gold-100 mb-4">{t('admin.grantCustomerOffer')}</h2>
          <p className="text-sm text-gold-100/70 mb-4">
            {t('admin.grantOfferHint')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
            <div className="md:col-span-2" ref={comboRef}>
              <label className="text-xs text-gold-100/60 block mb-1">{t('admin.selectCustomer')}</label>
              {customersLoading ? (
                <p className="text-xs text-gold-100/50 py-2">Loading customers…</p>
              ) : (
                <div className="relative mt-1">
                  <button
                    type="button"
                    id="grant-customer-combo"
                    aria-expanded={customerDropdownOpen}
                    aria-haspopup="listbox"
                    onClick={() => setCustomerDropdownOpen((o) => !o)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setCustomerDropdownOpen(false)
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-charcoal-800 border border-gold-500/30 text-gold-100 text-sm text-left focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  >
                    <span className={`truncate ${!selectedCustomer ? 'text-gold-100/45' : ''}`}>
                      {selectedCustomer
                        ? customerOptionLabel(selectedCustomer)
                        : t('admin.selectCustomerPlaceholder')}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-gold-400/70 transition-transform ${customerDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {customerDropdownOpen && (
                    <div
                      className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-gold-500/30 bg-charcoal-900 shadow-xl overflow-hidden"
                      role="listbox"
                      aria-labelledby="grant-customer-combo"
                    >
                      <div className="p-2 border-b border-gold-500/20 bg-charcoal-900">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-400/50 pointer-events-none" />
                          <input
                            ref={searchInsideRef}
                            type="search"
                            className="w-full pl-9 pr-3 py-2 rounded-md bg-charcoal-800 border border-gold-500/25 text-gold-100 text-sm placeholder:text-gold-100/40"
                            placeholder={t('admin.searchCustomers')}
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                e.stopPropagation()
                                setCustomerDropdownOpen(false)
                              }
                            }}
                            autoComplete="off"
                          />
                        </div>
                      </div>
                      <ul className="max-h-52 overflow-y-auto py-1">
                        <li>
                          <button
                            type="button"
                            role="option"
                            aria-selected={grantUserId === ''}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gold-500/10 ${grantUserId === '' ? 'bg-gold-500/5 text-gold-100/70' : 'text-gold-100/55'}`}
                            onClick={() => {
                              setGrantUserId('')
                              setCustomerDropdownOpen(false)
                            }}
                          >
                            {t('admin.selectCustomerPlaceholder')}
                          </button>
                        </li>
                        {dropdownCustomers.length === 0 ? (
                          <li className="px-3 py-2 text-sm text-gold-100/50">{t('admin.noCustomersMatchFilter')}</li>
                        ) : (
                          dropdownCustomers.map((u) => (
                            <li key={u.id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={grantUserId === u.id}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-gold-500/10 ${
                                  grantUserId === u.id ? 'bg-amber-500/15 text-amber-100' : 'text-gold-100/90'
                                }`}
                                onClick={() => {
                                  setGrantUserId(u.id)
                                  setCustomerDropdownOpen(false)
                                }}
                              >
                                {customerOptionLabel(u)}
                              </button>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-gold-100/60 block mb-1">Title</label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-gold-500/30 text-gold-100 text-sm"
                value={grantTitle}
                onChange={(e) => setGrantTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gold-100/60 block mb-1">Discount % (optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-gold-500/30 text-gold-100 text-sm"
                value={grantPercent}
                onChange={(e) => setGrantPercent(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <label className="text-xs text-gold-100/60 block mb-1">Fixed KWD off (optional)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-gold-500/30 text-gold-100 text-sm"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-gold-100/60 block mb-1">Valid until (optional, datetime-local)</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-gold-500/30 text-gold-100 text-sm"
                value={grantValidUntil}
                onChange={(e) => setGrantValidUntil(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                disabled={grantMutation.isPending || !grantUserId.trim()}
                onClick={() => grantMutation.mutate()}
                className="gold-button px-4 py-2 text-sm disabled:opacity-50"
              >
                {grantMutation.isPending ? 'Saving…' : t('admin.grantOffer')}
              </button>
            </div>
          </div>
        </div>

        <div className="gold-card overflow-x-auto">
          <h2 className="text-lg font-semibold text-gold-100 mb-4">{t('admin.clubsList')}</h2>
          {isLoading ? (
            <p className="text-gold-100/60 py-8 text-center">Loading…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gold-500/20">
                  <th className="text-left py-3 px-4 text-gold-100/70">Name</th>
                  <th className="text-left py-3 px-4 text-gold-100/70">Head</th>
                  <th className="text-left py-3 px-4 text-gold-100/70">Members</th>
                  <th className="text-left py-3 px-4 text-gold-100/70">Active</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map((c) => (
                  <tr key={c.id} className="border-b border-gold-500/10">
                    <td className="py-3 px-4 text-gold-100 font-medium">{c.name}</td>
                    <td className="py-3 px-4 text-gold-100/80">
                      {c.head_name || '—'}
                      {c.head_email && <span className="block text-xs text-gold-100/50">{c.head_email}</span>}
                    </td>
                    <td className="py-3 px-4 text-gold-100/80">
                      <div className="flex items-center justify-between gap-3">
                        <span>{c.member_count ?? '—'}</span>
                        {c.members && c.members.length > 0 && (
                          <span className="text-xs text-gold-100/55">{c.members.length} listed</span>
                        )}
                      </div>
                      {c.members && c.members.length > 0 ? (
                        <div className="mt-2 space-y-1">
                          {c.members.slice(0, 4).map((m) => (
                            <div key={m.id} className="text-xs text-gold-100/60">
                              <span className="text-gold-100/80 font-medium">{m.full_name}</span>{' '}
                              <span className="text-gold-100/45">({m.role})</span>
                              {(m.email || m.phone_number) && (
                                <span className="block text-[10px] text-gold-100/45">
                                  {m.email || m.phone_number}
                                </span>
                              )}
                            </div>
                          ))}
                          {c.members.length > 4 && (
                            <div className="text-[10px] text-gold-100/45">+{c.members.length - 4} more</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-gold-100/45 mt-2">No active members</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gold-100/80">{c.is_active ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isLoading && clubs.length === 0 && (
            <p className="py-8 text-center text-gold-100/60">No clubs yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}
