import { useState, useMemo, useRef, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search, ChevronDown, Users } from 'lucide-react'
import { toast } from 'sonner'
import AdminPaginationBar from '../../components/admin/AdminPaginationBar'
import { clubsApi } from '../../services/api'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

type ClubMember = {
  id: string
  user_id: string
  full_name: string
  email: string | null
  phone_number: string | null
  role: string
  joined_at: string | null
  initials?: string
  avatar_url?: string | null
  completed_orders?: number
  xp?: number
  level?: number
}

type ClubRow = {
  id: string
  name: string
  head_name?: string
  head_email?: string
  is_active?: boolean
  member_count?: number
  members?: ClubMember[]
}

function memberInitials(m: ClubMember): string {
  const fromApi = (m.initials || '').trim()
  if (fromApi) return fromApi.slice(0, 2).toUpperCase()
  const parts = (m.full_name || '').trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  if (parts.length === 1 && parts[0].length >= 2) return parts[0].slice(0, 2).toUpperCase()
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return '?'
}

function avatarTone(seed: string): string {
  const tones = [
    'bg-[#E8F5E0] text-[#3F6F00]',
    'bg-[#ECFCCB] text-[#365314]',
    'bg-[#FEF3C7] text-[#92400E]',
    'bg-[#E0E7FF] text-[#3730A3]',
    'bg-[#FCE7F3] text-[#9D174D]',
    'bg-[#E0F2FE] text-[#075985]',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return tones[hash % tones.length]
}

function MemberAvatar({
  member,
  size = 'md',
  className,
}: {
  member: ClubMember
  size?: 'sm' | 'md' | 'lg'
  className?: string
}) {
  const sizeClass =
    size === 'lg' ? 'h-11 w-11 text-sm' : size === 'sm' ? 'h-7 w-7 text-[10px]' : 'h-9 w-9 text-xs'
  if (member.avatar_url) {
    return (
      <img
        src={member.avatar_url}
        alt=""
        className={cn(sizeClass, 'shrink-0 rounded-full object-cover ring-2 ring-white', className)}
      />
    )
  }
  return (
    <span
      className={cn(
        sizeClass,
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white',
        avatarTone(member.user_id || member.full_name || member.id),
        className,
      )}
      aria-hidden
    >
      {memberInitials(member)}
    </span>
  )
}

function roleLabel(role: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  if (role === 'head') return t('admin.clubMemberRoleHead', { defaultValue: 'Head' })
  return t('admin.clubMemberRoleMember', { defaultValue: 'Member' })
}

function formatJoined(iso: string | null | undefined, locale: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(locale.startsWith('ar') ? 'ar-KW' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function asClubList(data: unknown): ClubRow[] {
  if (Array.isArray(data)) return data as ClubRow[]
  const p = data as { results?: ClubRow[] }
  return p?.results ?? []
}

export default function AdminClubs() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [grantClubId, setGrantClubId] = useState('')
  const [clubSearch, setClubSearch] = useState('')
  const [clubDropdownOpen, setClubDropdownOpen] = useState(false)
  const comboRef = useRef<HTMLDivElement>(null)
  const searchInsideRef = useRef<HTMLInputElement>(null)
  const [grantTitle, setGrantTitle] = useState('Loyalty discount')
  const [grantPercent, setGrantPercent] = useState('')
  const [grantAmount, setGrantAmount] = useState('')
  const [grantValidUntil, setGrantValidUntil] = useState('')
  const [membersClub, setMembersClub] = useState<ClubRow | null>(null)
  const [memberSearch, setMemberSearch] = useState('')

  const {
    data: formationConfigData,
    isLoading: formationConfigLoading,
    refetch: refetchFormationConfig,
  } = useQuery({
    queryKey: ['clubFormationConfig'],
    queryFn: () => clubsApi.getFormationConfig(),
  })
  const formationMinOrders = formationConfigData?.min_completed_orders ?? 0
  const formationPerSlot = formationConfigData?.orders_per_additional_member
  const formationInviteUses = formationConfigData?.default_invite_max_uses ?? 50
  const [minCompletedOrdersInput, setMinCompletedOrdersInput] = useState(String(formationMinOrders))
  const [ordersPerSlotInput, setOrdersPerSlotInput] = useState('')
  const [inviteMaxUsesInput, setInviteMaxUsesInput] = useState(String(formationInviteUses))

  useEffect(() => {
    if (!formationConfigLoading) {
      setMinCompletedOrdersInput(String(formationMinOrders))
      setOrdersPerSlotInput(
        formationPerSlot != null && formationPerSlot > 0 ? String(formationPerSlot) : '',
      )
      setInviteMaxUsesInput(String(formationInviteUses))
    }
  }, [formationConfigLoading, formationMinOrders, formationPerSlot, formationInviteUses])

  const updateFormationConfigMutation = useMutation({
    mutationFn: () => {
      const raw = minCompletedOrdersInput.trim()
      const i = Number(raw)
      if (raw === '' || Number.isNaN(i) || !Number.isFinite(i) || i < 0) {
        throw new Error('Enter a valid non-negative integer for minimum orders.')
      }
      const perRaw = ordersPerSlotInput.trim()
      let orders_per_additional_member: number | null = null
      if (perRaw !== '') {
        const p = Number(perRaw)
        if (Number.isNaN(p) || !Number.isFinite(p) || p < 0) {
          throw new Error(t('admin.clubFormationPerSlotInvalid'))
        }
        orders_per_additional_member = p > 0 ? p : null
      }
      const usesRaw = inviteMaxUsesInput.trim()
      const uses = Number(usesRaw)
      if (usesRaw === '' || Number.isNaN(uses) || !Number.isFinite(uses) || uses < 1 || uses > 500) {
        throw new Error(t('admin.clubFormationInviteUsesInvalid'))
      }
      return clubsApi.updateFormationConfig({
        min_completed_orders: i,
        orders_per_additional_member,
        default_invite_max_uses: Math.floor(uses),
      })
    },
    onSuccess: () => {
      toast.success(t('admin.clubFormationSaved'))
      queryClient.invalidateQueries({ queryKey: ['clubFormationConfig'] })
      refetchFormationConfig().catch(() => {})
    },
    onError: (err: unknown) => {
      if (err instanceof Error) toast.error(err.message)
      else toast.error(t('admin.clubFormationSaveFailed'))
    },
  })

  const { data, isLoading } = useQuery({
    queryKey: ['adminClubs'],
    queryFn: () => clubsApi.listClubs(),
  })
  const clubs = useMemo(() => asClubList(data), [data])

  const [clubsPage, setClubsPage] = useState(1)
  const clubsPageSize = 10
  const clubsTotal = clubs.length
  const clubsTotalPages = Math.max(1, Math.ceil(clubsTotal / clubsPageSize))
  const clubsPageRows = useMemo(
    () => clubs.slice((clubsPage - 1) * clubsPageSize, clubsPage * clubsPageSize),
    [clubs, clubsPage],
  )

  useEffect(() => {
    setClubsPage(1)
  }, [data])

  useEffect(() => {
    if (clubsPage > clubsTotalPages) setClubsPage(clubsTotalPages)
  }, [clubsPage, clubsTotalPages])

  const filteredClubs = useMemo(() => {
    if (!clubSearch.trim()) return clubs
    const q = clubSearch.toLowerCase()
    return clubs.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.head_name && c.head_name.toLowerCase().includes(q)) ||
        (c.head_email && c.head_email.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q),
    )
  }, [clubs, clubSearch])

  const selectedClub = useMemo(
    () => clubs.find((c) => c.id === grantClubId),
    [clubs, grantClubId],
  )

  const membersModalList = useMemo(() => {
    const list = membersClub?.members ?? []
    const q = memberSearch.trim().toLowerCase()
    if (!q) return list
    return list.filter(
      (m) =>
        m.full_name?.toLowerCase().includes(q) ||
        (m.email && m.email.toLowerCase().includes(q)) ||
        (m.phone_number && m.phone_number.toLowerCase().includes(q)) ||
        m.role?.toLowerCase().includes(q),
    )
  }, [membersClub, memberSearch])

  const openMembersModal = (club: ClubRow) => {
    setMemberSearch('')
    setMembersClub(club)
  }

  /** Options in dropdown: filtered list, plus current selection if search hides it */
  const dropdownClubs = useMemo(() => {
    const ids = new Set(filteredClubs.map((c) => c.id))
    if (grantClubId && selectedClub && !ids.has(grantClubId)) {
      return [selectedClub, ...filteredClubs]
    }
    return filteredClubs
  }, [filteredClubs, grantClubId, selectedClub])

  function clubOptionLabel(c: ClubRow) {
    const head = c.head_name || c.head_email || '—'
    const count = c.member_count ?? c.members?.length ?? 0
    return `${c.name || '—'} — ${head} (${count})`
  }

  useEffect(() => {
    if (!clubDropdownOpen) return
    const t = window.setTimeout(() => searchInsideRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [clubDropdownOpen])

  useEffect(() => {
    if (!clubDropdownOpen) return
    const onDoc = (e: MouseEvent) => {
      if (comboRef.current && !comboRef.current.contains(e.target as Node)) {
        setClubDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [clubDropdownOpen])

  const grantMutation = useMutation({
    mutationFn: async () => {
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

      const club = clubs.find((c) => c.id === grantClubId)
      if (!club) throw new Error('Please choose a club')

      const payloadBase = {
        club_id: grantClubId,
        title: grantTitle.trim(),
        discount_percent: pct != null && !Number.isNaN(pct) ? pct : null,
        discount_amount_kwd: amt,
        valid_until: validUntil,
      }

      return clubsApi.createClubOffer(payloadBase)
    },
    onSuccess: () => {
      toast.success(t('admin.clubOfferCreated', { defaultValue: 'Club offer created — members inherit until expiry' }))
      queryClient.invalidateQueries({ queryKey: ['adminClubs'] })
      queryClient.invalidateQueries({ queryKey: ['adminClubOffers'] })
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
    <div className="admin-page-inner">
      <div className="admin-page-body">
        <div className="mb-8">
          <h1 className="text-3xl font-bold gold-gradient-text-on-light">{t('admin.clubsTitle')}</h1>
          <p className="text-stone-600 mt-1">{t('admin.clubsSubtitle')}</p>
        </div>

        <div className="gold-card mb-8">
          <h2 className="text-lg font-semibold text-black mb-2">{t('admin.clubFormationTitle')}</h2>
          <p className="text-sm text-stone-700 mb-4">{t('admin.clubFormationIntro')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs text-stone-600 block mb-1">
                {t('admin.clubFormationMinOrdersLabel')}
              </label>
              <input
                type="number"
                min={0}
                className="w-full px-3 py-2 rounded-lg bg-white border border-black/15 text-black text-sm"
                value={minCompletedOrdersInput}
                onChange={(e) => setMinCompletedOrdersInput(e.target.value)}
                disabled={formationConfigLoading || updateFormationConfigMutation.isPending}
              />
              <p className="text-xs text-stone-500 mt-1.5">{t('admin.clubFormationMinOrdersHint')}</p>
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1">
                {t('admin.clubFormationPerMemberLabel')}
              </label>
              <input
                type="number"
                min={0}
                placeholder={t('admin.clubFormationPerMemberPlaceholder')}
                className="w-full px-3 py-2 rounded-lg bg-white border border-black/15 text-black text-sm placeholder:text-stone-500"
                value={ordersPerSlotInput}
                onChange={(e) => setOrdersPerSlotInput(e.target.value)}
                disabled={formationConfigLoading || updateFormationConfigMutation.isPending}
              />
              <p className="text-xs text-stone-500 mt-1.5">{t('admin.clubFormationPerMemberHint')}</p>
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1">
                {t('admin.clubFormationInviteUsesLabel')}
              </label>
              <input
                type="number"
                min={1}
                max={500}
                className="w-full px-3 py-2 rounded-lg bg-white border border-black/15 text-black text-sm"
                value={inviteMaxUsesInput}
                onChange={(e) => setInviteMaxUsesInput(e.target.value)}
                disabled={formationConfigLoading || updateFormationConfigMutation.isPending}
              />
              <p className="text-xs text-stone-500 mt-1.5">{t('admin.clubFormationInviteUsesHint')}</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={() => updateFormationConfigMutation.mutate()}
              disabled={formationConfigLoading || updateFormationConfigMutation.isPending}
              className="gold-button px-4 py-2 text-sm disabled:opacity-50"
            >
              {updateFormationConfigMutation.isPending
                ? t('admin.clubFormationSaving')
                : t('admin.clubFormationSave')}
            </button>
          </div>
        </div>

        <div className="gold-card mb-8">
          <h2 className="text-lg font-semibold text-black mb-4">{t('admin.grantCustomerOffer')}</h2>
          <p className="text-sm text-stone-700 mb-4">
            {t('admin.grantOfferHint', {
              defaultValue:
                'Pick a club, set a title and either a percent or fixed KWD off. The offer stays on the club — current and future members inherit it until expiry.',
            })}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl">
            <div className="md:col-span-2" ref={comboRef}>
              <label className="text-xs text-stone-600 block mb-1">{t('admin.selectCustomer')}</label>
              {isLoading ? (
                <p className="text-xs text-stone-500 py-2">Loading clubs…</p>
              ) : (
                <div className="relative mt-1">
                  <button
                    type="button"
                    id="grant-customer-combo"
                    aria-expanded={clubDropdownOpen}
                    aria-haspopup="listbox"
                    onClick={() => setClubDropdownOpen((o) => !o)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setClubDropdownOpen(false)
                    }}
                    className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-white border border-black/15 text-black text-sm text-left focus:outline-none focus:ring-2 focus:ring-lime-500/40"
                  >
                    <span className={`truncate ${!selectedClub ? 'text-stone-500' : ''}`}>
                      {selectedClub
                        ? clubOptionLabel(selectedClub)
                        : t('admin.selectCustomerPlaceholder')}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-lime-800 transition-transform ${clubDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {clubDropdownOpen && (
                    <div
                      className="absolute z-50 left-0 right-0 mt-1 rounded-lg border border-black/15 bg-white shadow-xl overflow-hidden"
                      role="listbox"
                      aria-labelledby="grant-customer-combo"
                    >
                      <div className="p-2 border-b border-stone-200 bg-white">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
                          <input
                            ref={searchInsideRef}
                            type="search"
                            className="w-full pl-9 pr-3 py-2 rounded-md bg-white border border-black/15 text-black text-sm placeholder:text-stone-500"
                            placeholder={t('admin.searchCustomers')}
                            value={clubSearch}
                            onChange={(e) => setClubSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                e.stopPropagation()
                                setClubDropdownOpen(false)
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
                            aria-selected={grantClubId === ''}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-lime-100 ${grantClubId === '' ? 'bg-lime-50 text-stone-700' : 'text-stone-600'}`}
                            onClick={() => {
                              setGrantClubId('')
                              setClubDropdownOpen(false)
                            }}
                          >
                            {t('admin.selectCustomerPlaceholder')}
                          </button>
                        </li>
                        {dropdownClubs.length === 0 ? (
                          <li className="px-3 py-2 text-sm text-stone-500">{t('admin.noCustomersMatchFilter')}</li>
                        ) : (
                          dropdownClubs.map((c) => (
                            <li key={c.id}>
                              <button
                                type="button"
                                role="option"
                                aria-selected={grantClubId === c.id}
                                className={`w-full text-left px-3 py-2 text-sm hover:bg-lime-100 ${
                                  grantClubId === c.id ? 'bg-amber-500/15 text-amber-100' : 'text-stone-800'
                                }`}
                                onClick={() => {
                                  setGrantClubId(c.id)
                                  setClubDropdownOpen(false)
                                }}
                              >
                                {clubOptionLabel(c)}
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
              <label className="text-xs text-stone-600 block mb-1">Title</label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-white border border-black/15 text-black text-sm"
                value={grantTitle}
                onChange={(e) => setGrantTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1">Discount % (optional)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                className="w-full px-3 py-2 rounded-lg bg-white border border-black/15 text-black text-sm"
                value={grantPercent}
                onChange={(e) => setGrantPercent(e.target.value)}
                placeholder="e.g. 5"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 block mb-1">Fixed KWD off (optional)</label>
              <input
                type="number"
                step="0.001"
                min="0"
                className="w-full px-3 py-2 rounded-lg bg-white border border-black/15 text-black text-sm"
                value={grantAmount}
                onChange={(e) => setGrantAmount(e.target.value)}
                placeholder="e.g. 10"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-stone-600 block mb-1">Valid until (optional, datetime-local)</label>
              <input
                type="datetime-local"
                className="w-full px-3 py-2 rounded-lg bg-white border border-black/15 text-black text-sm"
                value={grantValidUntil}
                onChange={(e) => setGrantValidUntil(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <button
                type="button"
                disabled={grantMutation.isPending || !grantClubId.trim()}
                onClick={() => grantMutation.mutate()}
                className="gold-button px-4 py-2 text-sm disabled:opacity-50"
              >
                {grantMutation.isPending ? 'Saving…' : t('admin.grantOffer')}
              </button>
            </div>
          </div>
        </div>

        <div className="gold-card overflow-x-auto">
          <h2 className="text-lg font-semibold text-black mb-4">{t('admin.clubsList')}</h2>
          {isLoading ? (
            <p className="text-stone-600 py-8 text-center">Loading…</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-stone-700">Name</th>
                  <th className="text-left py-3 px-4 text-stone-700">Head</th>
                  <th className="text-left py-3 px-4 text-stone-700">Members</th>
                  <th className="text-left py-3 px-4 text-stone-700">Active</th>
                </tr>
              </thead>
              <tbody>
                {clubsPageRows.map((c) => (
                  <tr key={c.id} className="border-b border-stone-100">
                    <td className="py-3 px-4 text-black font-medium">{c.name}</td>
                    <td className="py-3 px-4 text-stone-800">
                      {c.head_name || '—'}
                      {c.head_email && <span className="block text-xs text-stone-500">{c.head_email}</span>}
                    </td>
                    <td className="py-3 px-4 text-stone-800">
                      {(() => {
                        const members = c.members ?? []
                        const count = c.member_count ?? members.length
                        const preview = members.slice(0, 3)
                        if (!count) {
                          return (
                            <span className="text-xs text-stone-500">
                              {t('admin.clubNoMembers', { defaultValue: 'No members' })}
                            </span>
                          )
                        }
                        return (
                          <div className="flex flex-wrap items-center gap-2.5">
                            <div className="flex items-center -space-x-2 rtl:space-x-reverse">
                              {preview.map((m) => (
                                <MemberAvatar key={m.id} member={m} size="sm" />
                              ))}
                              {count > preview.length && (
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-600 ring-2 ring-white">
                                  +{count - preview.length}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-medium text-stone-800 tabular-nums">
                              {count}
                            </span>
                            <button
                              type="button"
                              onClick={() => openMembersModal(c)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-black/10 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 hover:bg-lime-50 hover:border-lime-700/30 transition-colors"
                            >
                              <Users className="h-3.5 w-3.5 text-lime-800" aria-hidden />
                              {t('admin.clubViewMembers', { defaultValue: 'View members' })}
                            </button>
                          </div>
                        )
                      })()}
                    </td>
                    <td className="py-3 px-4 text-stone-800">{c.is_active ? 'Yes' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isLoading && clubs.length === 0 && (
            <p className="py-8 text-center text-stone-600">No clubs yet.</p>
          )}
          {!isLoading && clubsTotal > clubsPageSize && (
            <AdminPaginationBar
              page={clubsPage}
              totalPages={clubsTotalPages}
              total={clubsTotal}
              pageSize={clubsPageSize}
              onPageChange={setClubsPage}
              itemLabel="clubs"
            />
          )}
        </div>
      </div>

      <Dialog
        open={!!membersClub}
        onOpenChange={(open) => {
          if (!open) {
            setMembersClub(null)
            setMemberSearch('')
          }
        }}
      >
        <DialogContent className="bg-white border-black/15 text-black max-w-lg w-[min(100vw-1.5rem,32rem)] p-0 gap-0 overflow-hidden flex flex-col max-h-[min(90vh,40rem)]">
          <DialogHeader className="px-5 pt-5 pb-3 border-b border-stone-200 shrink-0 space-y-1">
            <DialogTitle className="text-lg font-semibold text-black flex items-center gap-2">
              <Users className="h-5 w-5 text-lime-800 shrink-0" aria-hidden />
              <span className="truncate">
                {t('admin.clubMembersModalTitle', {
                  defaultValue: 'Members — {{name}}',
                  name: membersClub?.name || '—',
                })}
              </span>
            </DialogTitle>
            <DialogDescription className="text-sm text-stone-600">
              {t('admin.clubMembersModalSubtitle', {
                defaultValue: '{{count}} active member(s)',
                count: membersClub?.members?.length ?? membersClub?.member_count ?? 0,
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 py-3 border-b border-stone-100 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
              <input
                type="search"
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                placeholder={t('admin.clubMembersSearch', {
                  defaultValue: 'Search by name, email, or phone…',
                })}
                className="w-full pl-9 pr-3 py-2 rounded-md bg-white border border-black/15 text-black text-sm placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-lime-500/30"
                autoComplete="off"
              />
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2">
            {membersModalList.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-stone-500">
                {memberSearch.trim()
                  ? t('admin.clubMembersNoMatch', { defaultValue: 'No members match your search.' })
                  : t('admin.clubNoMembers', { defaultValue: 'No members' })}
              </p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {membersModalList.map((m) => (
                  <li key={m.id} className="flex items-start gap-3 px-3 py-3">
                    <MemberAvatar member={m} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-stone-900 truncate">{m.full_name}</p>
                        <span
                          className={cn(
                            'inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            m.role === 'head'
                              ? 'bg-[#FEF3C7] text-[#92400E]'
                              : 'bg-[#EDF3EC] text-[#346538]',
                          )}
                        >
                          {roleLabel(m.role, t)}
                        </span>
                      </div>
                      {m.email ? (
                        <p className="mt-0.5 text-xs text-stone-600 truncate" title={m.email}>
                          {m.email}
                        </p>
                      ) : null}
                      {m.phone_number ? (
                        <p className="text-xs text-stone-500 truncate" dir="ltr">
                          {m.phone_number}
                        </p>
                      ) : null}
                      <p className="mt-1 text-[11px] text-stone-400">
                        {t('admin.clubMemberJoined', {
                          defaultValue: 'Joined {{date}}',
                          date: formatJoined(m.joined_at, i18n.language),
                        })}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
