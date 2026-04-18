import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { 
  User, 
  ShoppingBag, 
  Bell, 
  MapPin, 
  CreditCard,
  LogOut,
  ChevronRight,
  Scale,
  Users,
  Share2,
  Crown,
  Download,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { RegionFlagImg } from '../components/RegionFlagImg'
import {
  accountsApi,
  ordersApi,
  walletApi,
  tradingApi,
  invoicesApi,
  clubsApi,
  apiService,
  goldTradingApi,
  type BankChangeRequestRow,
} from '../services/api'
import { buildWalletTransactionsDocxBlob } from '../utils/walletTransactionsWordExport'

const KNET_TRADE_GOLD_DEPOSIT_DESC = 'KNET wallet deposit — Gold trading'

function walletDepositApiError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { detail?: unknown } } }
  const d = e?.response?.data?.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d)) return d.map(String).join(', ')
  return fallback
}

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('profile')
  const { user, logout } = useAuth()
  const { t } = useTranslation()

  useEffect(() => {
    // Allow deep-linking into a specific tab (e.g. "/dashboard?tab=club").
    try {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get('tab')
      const allowed = new Set([
        'profile',
        'orders',
        'locked_gold',
        'trade_gold',
        'club',
        'transactions',
        'bank_account',
        'addresses',
        'notifications',
      ])
      if (tab && allowed.has(tab)) setActiveTab(tab)
    } catch {
      // Ignore invalid query params.
    }
  }, [])

  const tabs = [
    { id: 'profile', name: t('userDashboard.tabs.profile'), icon: User },
    { id: 'orders', name: t('userDashboard.tabs.orders'), icon: ShoppingBag },
    { id: 'locked_gold', name: t('userDashboard.tabs.lockedGold'), icon: Scale },
    { id: 'trade_gold', name: 'Trade gold', icon: Crown },
    { id: 'club', name: t('userDashboard.tabs.club'), icon: Users },
    { id: 'transactions', name: t('userDashboard.tabs.transactions'), icon: CreditCard },
    { id: 'bank_account', name: t('userDashboard.tabs.bankAccount'), icon: CreditCard },
    // { id: 'wishlist', name: t('userDashboard.tabs.wishlist'), icon: Heart },
    { id: 'addresses', name: t('userDashboard.tabs.addresses'), icon: MapPin },
    // { id: 'payments', name: 'Payment Methods', icon: CreditCard },
    { id: 'notifications', name: t('userDashboard.tabs.notifications'), icon: Bell },
  ]

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 mt-4">
            <div className="gold-card sticky top-24">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gold-500/20">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold-300 via-gold-400 to-amber-600 shadow-[0_10px_24px_-12px_rgba(212,175,55,0.85)] ring-1 ring-gold-200/45 flex items-center justify-center">
                  {user?.nationality && /^[A-Za-z]{2}$/.test(user.nationality) ? (
                    <span className="inline-flex items-center justify-center rounded-md bg-charcoal-950/80 px-1.5 py-1 ring-1 ring-white/20">
                      <RegionFlagImg
                        code={user.nationality}
                        size="md"
                        className="w-8 h-5 rounded-[3px] ring-1 ring-gold-200/30 shadow-sm"
                      />
                    </span>
                  ) : (
                    <span className="text-xl font-bold text-charcoal-950">
                      {user?.full_name?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gold-100">{user?.full_name}</h3>
                  <p className="text-sm text-gold-100/60">{user?.email}</p>
                </div>
              </div>

              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-gold-500/20 text-gold-400'
                        : 'text-gold-100/60 hover:bg-gold-500/10 hover:text-gold-100'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.name}
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </button>
                ))}
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  Logout
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && <ProfileTab />}
            {activeTab === 'orders' && <OrdersTab />}
            {activeTab === 'locked_gold' && <LockedGoldTab />}
            {activeTab === 'trade_gold' && <TradeGoldTab />}
            {activeTab === 'club' && <ClubTab />}
            {activeTab === 'transactions' && <TransactionsTab />}
            {activeTab === 'bank_account' && <BankAccountTab />}
            {activeTab === 'addresses' && <AddressesTab />}
            {/* Placeholder tabs (can be implemented later) */}
            {/* {activeTab === 'wishlist' && <WishlistTab />} */}
            {/* {activeTab === 'payments' && <PaymentsTab />} */}
            {activeTab === 'notifications' && <NotificationsTab />}
          </div>
        </div>
      </div>
    </div>
  )
}

type ActiveClubInvite = {
  token: string
  expires_at: string
  max_uses: number
  used_count: number
}

type MembershipPayload = {
  membership: { id: string; role: string; joined_at?: string } | null
  club: {
    id: string
    name: string
    head_name?: string
    head_completed_orders?: number
    orders_per_member_slot?: number | null
    additional_member_limit?: number | null
    current_additional_members?: number
    remaining_additional_members?: number | null
    min_completed_orders_required?: number
  } | null
  member_capacity?: {
    additional_limit: number | null
    current_additional: number
    remaining_additional: number | null
  }
  active_invite?: ActiveClubInvite | null
}

type CustomerOfferRow = {
  id: string
  title: string
  discount_percent?: string | null
  discount_amount_kwd?: string | null
  valid_until?: string | null
  source?: string
  is_active?: boolean
}

function ClubTab() {
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation()
  const [clubName, setClubName] = useState('')
  const [renameDraft, setRenameDraft] = useState('')
  const [showShareOptions, setShowShareOptions] = useState(false)

  const { data: memData, isLoading: memLoading } = useQuery({
    queryKey: ['clubMembership'],
    queryFn: () => clubsApi.getMyMembership() as Promise<MembershipPayload>,
  })
  const { data: offersData } = useQuery({
    queryKey: ['clubOffers'],
    queryFn: () => clubsApi.getMyOffers() as Promise<CustomerOfferRow[]>,
  })
  const membership = memData?.membership
  const club = memData?.club
  const memberCapacity = memData?.member_capacity
  const activeInvite = memData?.active_invite ?? null
  const offers = Array.isArray(offersData) ? offersData : []

  const inviteLink = useMemo(() => {
    const token = activeInvite?.token
    if (!token) return ''
    return `${window.location.origin}/join-club?token=${encodeURIComponent(token)}`
  }, [activeInvite?.token])
  const remainingSlots = memberCapacity?.remaining_additional
  const hasRemainingSlots = remainingSlots == null || remainingSlots > 0
  const hasInviteUsesLeft = !activeInvite || activeInvite.used_count < activeInvite.max_uses
  const canShareInvite = Boolean(inviteLink) && hasRemainingSlots && hasInviteUsesLeft

  useEffect(() => {
    if (club?.name != null) setRenameDraft(club.name)
  }, [club?.id, club?.name])

  const createMutation = useMutation({
    mutationFn: () => clubsApi.createClub({ name: clubName.trim() }),
    onSuccess: () => {
      toast.success(t('userDashboard.club.toasts.clubCreated'))
      setClubName('')
      queryClient.invalidateQueries({ queryKey: ['clubMembership'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail || t('userDashboard.club.toasts.couldNotCreateClub'))
    },
  })

  const renameMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => clubsApi.updateClub(id, { name }),
    onSuccess: () => {
      toast.success(t('userDashboard.club.toasts.clubRenamed'))
      queryClient.invalidateQueries({ queryKey: ['clubMembership'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail || t('userDashboard.club.toasts.couldNotRenameClub'))
    },
  })

  const inviteMutation = useMutation({
    mutationFn: () => clubsApi.createInvite(club!.id),
    onSuccess: () => {
      setShowShareOptions(false)
      queryClient.invalidateQueries({ queryKey: ['clubMembership'] })
      toast.success(t('userDashboard.club.toasts.inviteLinkCreatedCopyBelow'))
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail || t('userDashboard.club.toasts.couldNotCreateInvite'))
    },
  })

  const leaveMutation = useMutation({
    mutationFn: () => clubsApi.leave(),
    onSuccess: () => {
      toast.success(t('userDashboard.club.toasts.leftClub'))
      setShowShareOptions(false)
      queryClient.invalidateQueries({ queryKey: ['clubMembership'] })
      queryClient.invalidateQueries({ queryKey: ['clubOffers'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail || t('userDashboard.club.toasts.couldNotLeaveClub'))
    },
  })

  const copyLink = () => {
    if (!canShareInvite) {
      toast.error(t('userDashboard.club.toasts.inviteBlocked'))
      return
    }
    void navigator.clipboard.writeText(inviteLink)
    toast.success(t('userDashboard.club.toasts.linkCopied'))
  }

  const shareText = club
    ? t('userDashboard.club.share.joinWithName', { clubName: club.name })
    : t('userDashboard.club.share.join')
  const encodedUrl = encodeURIComponent(inviteLink)
  const encodedText = encodeURIComponent(`${shareText} ${inviteLink}`)

  const shareLinks = [
    { label: t('userDashboard.club.shareLinks.whatsapp'), href: `https://wa.me/?text=${encodedText}` },
    { label: t('userDashboard.club.shareLinks.telegram'), href: `https://t.me/share/url?url=${encodedUrl}&text=${encodeURIComponent(shareText)}` },
    { label: t('userDashboard.club.shareLinks.facebook'), href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: t('userDashboard.club.shareLinks.x'), href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodeURIComponent(shareText)}` },
  ]

  const shareInviteLink = async () => {
    if (!canShareInvite) {
      toast.error(t('userDashboard.club.toasts.inviteBlocked'))
      return
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('userDashboard.club.shareTitle'),
          text: shareText,
          url: inviteLink,
        })
        return
      } catch (err) {
        const e = err as { name?: string }
        if (e?.name === 'AbortError') return
      }
    }
    setShowShareOptions((prev) => !prev)
  }

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-xl font-bold gold-gradient-text-on-light">{t('userDashboard.club.title')}</h2>
      <p className="text-sm text-stone-600">
        {t('userDashboard.club.description')}
      </p>

      {memLoading ? (
        <div className="gold-card p-8 text-center text-gold-100/70">{t('userDashboard.club.loading')}</div>
      ) : !membership || !club ? (
        <div className="gold-card space-y-4">
          <p className="text-gold-100/80 text-sm">{t('userDashboard.club.notInClub')}</p>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs text-gold-100/60 block mb-1">{t('userDashboard.club.clubNameLabel')}</label>
              <input
                className="w-full px-3 py-2 rounded-lg bg-charcoal-800 border border-gold-500/30 text-gold-100 text-sm"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                placeholder={t('userDashboard.club.clubNamePlaceholder')}
              />
            </div>
            <button
              type="button"
              disabled={createMutation.isPending || clubName.trim().length < 2}
              onClick={() => createMutation.mutate()}
              className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
            >
              {createMutation.isPending ? t('userDashboard.club.creating') : t('userDashboard.club.createClub')}
            </button>
          </div>
        </div>
      ) : (
        <div className="gold-card space-y-4">
          <div>
            <p className="text-sm text-gold-100/60">{t('userDashboard.club.clubLabel')}</p>
            {membership.role === 'head' ? (
              <div className="mt-2 space-y-2">
                <label className="text-xs text-gold-100/60 block">{t('userDashboard.club.clubNameLabel')}</label>
                <div className="flex flex-wrap gap-2 items-end">
                  <input
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-lg bg-charcoal-800 border border-gold-500/30 text-gold-100 text-sm"
                    value={renameDraft}
                    onChange={(e) => setRenameDraft(e.target.value)}
                    placeholder={t('userDashboard.club.clubNamePlaceholder')}
                  />
                  <button
                    type="button"
                    disabled={
                      renameMutation.isPending ||
                      renameDraft.trim().length < 2 ||
                      renameDraft.trim() === club.name.trim()
                    }
                    onClick={() => renameMutation.mutate({ id: club.id, name: renameDraft.trim() })}
                    className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                  >
                    {renameMutation.isPending ? t('userDashboard.club.renamingClub') : t('userDashboard.club.saveClubName')}
                  </button>
                </div>
                <p className="text-xs text-gold-100/50">{t('userDashboard.club.renameClubHint')}</p>
              </div>
            ) : (
              <p className="text-2xl font-semibold text-gold-100">{club.name}</p>
            )}
            <p className="text-xs text-gold-100/50 mt-1">
              {t('userDashboard.club.yourRole')} <span className="text-gold-300">{membership.role}</span>
              {club.head_name && ` · ${t('userDashboard.club.headLabel')}: ${club.head_name}`}
            </p>
          </div>

          {membership.role === 'head' && (
            <div className="border border-gold-500/20 rounded-lg p-4 space-y-2">
              <div className="text-xs text-gold-100/60 space-y-1">
                {memberCapacity?.additional_limit == null ? (
                  <p>{t('userDashboard.club.memberLimitUnlimited')}</p>
                ) : (
                  <>
                    <p>
                      {t('userDashboard.club.memberLimitCapped', {
                        current: memberCapacity.current_additional,
                        limit: memberCapacity.additional_limit,
                        remaining: memberCapacity.remaining_additional ?? 0,
                        orders: club.head_completed_orders ?? 0,
                        step: club.orders_per_member_slot ?? 0,
                      })}
                    </p>
                    {club.orders_per_member_slot &&
                    club.orders_per_member_slot > 0 &&
                    (memberCapacity.remaining_additional ?? 0) === 0 ? (
                      <p className="text-gold-100/50">
                        {t('userDashboard.club.memberNextSlotHint', {
                          nextAt:
                            (Math.floor(
                              (club.head_completed_orders ?? 0) / club.orders_per_member_slot,
                            ) +
                              1) *
                            club.orders_per_member_slot,
                        })}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
              <p className="text-sm text-gold-100/80">{t('userDashboard.club.inviteFriendsHint')}</p>
              <button
                type="button"
                disabled={inviteMutation.isPending || (memberCapacity?.remaining_additional ?? 1) <= 0}
                onClick={() => inviteMutation.mutate()}
                className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                {inviteMutation.isPending ? t('userDashboard.club.generating') : t('userDashboard.club.generateInviteLink')}
              </button>
              {inviteLink && (
                <div className="space-y-2">
                  {activeInvite && (
                    <p className="text-xs text-gold-100/50">
                      {t('userDashboard.club.inviteExpires', {
                        date: new Date(activeInvite.expires_at).toLocaleString(i18n.language, {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        }),
                        uses: activeInvite.used_count,
                        maxUses: activeInvite.max_uses,
                      })}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 items-center">
                    <code className="text-xs text-gold-100/80 break-all flex-1">{inviteLink}</code>
                    <button
                      type="button"
                      onClick={shareInviteLink}
                      disabled={!canShareInvite}
                      className="shrink-0 px-2 py-1 text-xs rounded border border-gold-500/40 text-gold-100 inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      {t('userDashboard.club.shareButton')}
                    </button>
                    <span className="shrink-0 text-xs text-gold-100/50 px-0.5 select-none">
                      {t('userDashboard.club.orBetweenActions')}
                    </span>
                    <button
                      type="button"
                      onClick={copyLink}
                      disabled={!canShareInvite}
                      className="shrink-0 px-2 py-1 text-xs rounded border border-gold-500/40 text-gold-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('userDashboard.club.copyButton')}
                    </button>
                  </div>
                  {!canShareInvite && (
                    <p className="text-[11px] text-gold-100/60">{t('userDashboard.club.inviteBlockedHint')}</p>
                  )}
                  {showShareOptions && (
                    <div className="flex flex-wrap gap-2">
                      {shareLinks.map((item) => (
                        <a
                          key={item.label}
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 text-xs rounded border border-gold-500/30 text-gold-100/90 hover:bg-gold-500/10"
                        >
                          {item.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {membership.role === 'member' && (
            <button
              type="button"
              disabled={leaveMutation.isPending}
              onClick={() => leaveMutation.mutate()}
              className="px-3 py-1.5 rounded-lg border border-gold-500/40 text-gold-100 text-sm hover:bg-gold-500/10 disabled:opacity-50"
            >
              {t('userDashboard.club.leaveClub')}
            </button>
          )}

          {/* {membership.role === 'head' && (
            <button
              type="button"
              disabled={dissolveMutation.isPending}
              onClick={() => {
                if (confirm(t('userDashboard.club.dissolveConfirm')))
                  dissolveMutation.mutate()
              }}
              className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 text-sm hover:bg-red-500/10 disabled:opacity-50"
            >
              {t('userDashboard.club.dissolveClub')}
            </button>
          )} */}
        </div>
      )}

      <div className="gold-card">
        <h3 className="text-lg font-semibold text-gold-100 mb-2">{t('userDashboard.club.myOffers')}</h3>
        <p className="text-xs text-gold-100/60 mb-3">{t('userDashboard.club.offersHint')}</p>
        {offers.length === 0 ? (
          <p className="text-gold-100/50 text-sm">{t('userDashboard.club.noOffersYet')}</p>
        ) : (
          <ul className="divide-y divide-gold-500/15">
            {offers.map((o) => (
              <li key={o.id} className="py-2 text-sm">
                <span className="text-gold-100 font-medium">{o.title}</span>
                <span className="text-gold-100/60 ml-2">
                  {o.discount_percent != null && o.discount_percent !== ''
                    ? t('userDashboard.club.discountPercentOff', { percent: o.discount_percent })
                    : o.discount_amount_kwd != null && o.discount_amount_kwd !== ''
                      ? t('userDashboard.club.discountKwdOff', { amount: o.discount_amount_kwd })
                      : '—'}
                </span>
                {o.source && <span className="text-xs text-gold-100/40 ml-2">({o.source})</span>}
                {o.is_active === false && <span className="text-xs text-red-400 ml-2">{t('userDashboard.club.inactive')}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function ProfileTab() {
  const { user, updateUser } = useAuth()
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: profileData } = useQuery({
    queryKey: ['myCustomerProfile'],
    queryFn: () => accountsApi.getMyProfile() as Promise<unknown>,
  })
  const profile = asSingleProfile(profileData)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [saving, setSaving] = useState(false)
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [backFile, setBackFile] = useState<File | null>(null)

  useEffect(() => {
    setFullName(user?.full_name ?? '')
    setEmail(user?.email ?? '')
    setPhoneNumber(user?.phone_number ?? '')
    if (user?.date_of_birth) {
      const d = typeof user.date_of_birth === 'string' ? user.date_of_birth : (user as { date_of_birth?: string }).date_of_birth
      setDateOfBirth(d ? d.slice(0, 10) : '')
    } else {
      setDateOfBirth('')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await updateUser({
        full_name: fullName.trim() || user.full_name,
        email: email.trim() || null,
        phone_number: phoneNumber.trim() || null,
        date_of_birth: dateOfBirth || null,
      })
      if (frontFile || backFile) {
        const fresh = await queryClient.fetchQuery({
          queryKey: ['myCustomerProfile'],
          queryFn: () => accountsApi.getMyProfile() as Promise<unknown>,
        })
        const p = asSingleProfile(fresh)
        if (!p?.id) {
          toast.error(t('userDashboard.profile.toasts.customerProfileNotFoundForUpload'))
          return
        }
        const formData = new FormData()
        if (frontFile) formData.append('civil_id_front', frontFile)
        if (backFile) formData.append('civil_id_back', backFile)
        await accountsApi.updateProfile(p.id, formData)
        queryClient.invalidateQueries({ queryKey: ['myCustomerProfile'] })
        setFrontFile(null)
        setBackFile(null)
      }
      toast.success(t('userDashboard.profile.toasts.profileUpdatedSuccess'))
    } catch (err) {
      const msg = (err as { response?: { data?: Record<string, string[]> } })?.response?.data
      const first = msg && typeof msg === 'object' && Object.values(msg)[0]
      toast.error(Array.isArray(first) ? first[0] : t('userDashboard.profile.toasts.failedToUpdateProfile'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="gold-card mt-4">
      <h2 className="text-xl font-bold text-gold-100 mb-6">{t('userDashboard.profile.title')}</h2>
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gold-100 mb-2">{t('userDashboard.profile.fullName')}</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-100 mb-2">{t('userDashboard.profile.email')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gold-100 mb-2">{t('userDashboard.profile.phone')}</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-100 mb-2">{t('userDashboard.profile.dateOfBirth')}</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
            />
          </div>
        </div>
        <div className="border-t border-gold-500/20 pt-4 space-y-4">
          <h3 className="text-lg font-semibold text-gold-100">{t('userDashboard.profile.identityDocumentsTitle')}</h3>
          <p className="text-sm text-gold-100/60">{t('userDashboard.profile.identityDocumentsHint')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-dashed border-gold-500/40 p-4 rounded-lg text-center hover:border-gold-400 transition">
              <label className="cursor-pointer block">
                <span className="block mb-2 text-gold-300 text-2xl">🪪</span>
                <span className="text-sm text-gold-100/80">{t('userDashboard.profile.civilIdFrontSide')}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setFrontFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {(frontFile || profile?.civil_id_front) && (
                <p className="text-xs text-emerald-400 mt-2">
                  {(frontFile && frontFile.name) || t('userDashboard.profile.existingFrontIdUploaded')}
                </p>
              )}
              {profile?.civil_id_front && !frontFile && (
                <img
                  src={profile.civil_id_front}
                  alt={t('userDashboard.profile.civilIdFrontAlt')}
                  className="mx-auto mt-3 h-32 w-auto rounded-md border border-gold-500/40 object-cover"
                />
              )}
            </div>

            <div className="border border-dashed border-gold-500/40 p-4 rounded-lg text-center hover:border-gold-400 transition">
              <label className="cursor-pointer block">
                <span className="block mb-2 text-gold-300 text-2xl">🪪</span>
                <span className="text-sm text-gold-100/80">{t('userDashboard.profile.civilIdBackSide')}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => setBackFile(e.target.files?.[0] ?? null)}
                />
              </label>
              {(backFile || profile?.civil_id_back) && (
                <p className="text-xs text-emerald-400 mt-2">
                  {(backFile && backFile.name) || t('userDashboard.profile.existingBackIdUploaded')}
                </p>
              )}
              {profile?.civil_id_back && !backFile && (
                <img
                  src={profile.civil_id_back}
                  alt={t('userDashboard.profile.civilIdBackAlt')}
                  className="mx-auto mt-3 h-32 w-auto rounded-md border border-gold-500/40 object-cover"
                />
              )}
            </div>
          </div>
        </div>

        <button type="submit" className="gold-button" disabled={saving}>
          {saving ? t('userDashboard.profile.saving') : t('userDashboard.profile.saveChanges')}
        </button>
      </form>
    </div>
  )
}

function AddressesTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['myCustomerProfile'],
    queryFn: () => accountsApi.getMyProfile() as Promise<unknown>,
  })
  const profile = asSingleProfile(data)
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('Kuwait')

  useEffect(() => {
    const p = asSingleProfile(data)
    if (!p) return
    setAddressLine1(p.address_line1 ?? '')
    setAddressLine2(p.address_line2 ?? '')
    setCity(p.city ?? '')
    setGovernorate(p.governorate ?? '')
    setPostalCode(p.postal_code ?? '')
    setCountry(p.country?.trim() || 'Kuwait')
  }, [data])

  const saveMutation = useMutation({
    mutationFn: async () => {
      const id = profile?.id
      if (!id) throw new Error('NO_PROFILE_ID')
      await accountsApi.updateProfile(id, {
        address_line1: addressLine1.trim() || null,
        address_line2: addressLine2.trim() || null,
        city: city.trim() || null,
        governorate: governorate.trim() || null,
        postal_code: postalCode.trim() || null,
        country: country.trim() || 'Kuwait',
      })
    },
    onSuccess: () => {
      toast.success(t('userDashboard.addresses.saved'))
      queryClient.invalidateQueries({ queryKey: ['myCustomerProfile'] })
    },
    onError: (err: unknown) => {
      const e = err as { message?: string; response?: { data?: Record<string, unknown> } }
      if (e.message === 'NO_PROFILE_ID') {
        toast.error(t('userDashboard.addresses.saveFailed'))
        return
      }
      if (e.message) {
        toast.error(e.message)
        return
      }
      const d = e.response?.data
      const first =
        d && typeof d === 'object'
          ? Object.values(d).find((v) => Array.isArray(v) && v.length)
          : null
      toast.error(
        Array.isArray(first) && first[0]
          ? String(first[0])
          : t('userDashboard.addresses.saveFailed')
      )
    },
  })

  const inputClass =
    'w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100 placeholder:text-gold-100/40'

  if (isLoading && !profile) {
    return (
      <div className="gold-card mt-4">
        <p className="text-gold-100/60 py-8 text-center">{t('userDashboard.addresses.loading')}</p>
      </div>
    )
  }

  if (!profile?.id) {
    return (
      <div className="gold-card mt-4">
        <p className="text-gold-100/80">{t('userDashboard.addresses.noProfile')}</p>
      </div>
    )
  }

  return (
    <div className="gold-card mt-4">
      <h2 className="text-xl font-bold text-gold-100 mb-2">{t('userDashboard.addresses.title')}</h2>
      <p className="text-sm text-gold-100/60 mb-6">{t('userDashboard.addresses.subtitle')}</p>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          if (!profile?.id) return
          saveMutation.mutate()
        }}
      >
        <div>
          <label className="block text-sm font-medium text-gold-100 mb-2">{t('userDashboard.addresses.line1')}</label>
          <input
            type="text"
            className={inputClass}
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            autoComplete="street-address"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gold-100 mb-2">{t('userDashboard.addresses.line2')}</label>
          <input
            type="text"
            className={inputClass}
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            autoComplete="address-line2"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gold-100 mb-2">{t('userDashboard.addresses.city')}</label>
            <input
              type="text"
              className={inputClass}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-100 mb-2">
              {t('userDashboard.addresses.governorate')}
            </label>
            <input
              type="text"
              className={inputClass}
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
              autoComplete="address-level1"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gold-100 mb-2">
              {t('userDashboard.addresses.postalCode')}
            </label>
            <input
              type="text"
              className={inputClass}
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              autoComplete="postal-code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gold-100 mb-2">{t('userDashboard.addresses.country')}</label>
            <input
              type="text"
              className={inputClass}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              autoComplete="country-name"
            />
          </div>
        </div>
        <p className="text-xs text-gold-100/50">{t('userDashboard.addresses.checkoutHint')}</p>
        <button type="submit" className="gold-button" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t('userDashboard.profile.saving') : t('userDashboard.addresses.save')}
        </button>
      </form>
    </div>
  )
}

type OrderSummary = {
  id: string
  invoice_number: string
  sale_date: string
  status: string
  status_display?: string
  total_amount: string
  delivery_type?: string
  delivery_type_display?: string
  items?: { id: string; product_name?: string; quantity: number; total_price: string }[]
}

function asOrderList(data: unknown): OrderSummary[] {
  if (Array.isArray(data)) return data as OrderSummary[]
  const p = data as { results?: OrderSummary[] }
  return p?.results ?? []
}

function OrdersTab() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery({
    queryKey: ['myOrders'],
    queryFn: () => ordersApi.getOrders({ page_size: '100' }) as Promise<unknown>,
  })
  const orders = asOrderList(data)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const total = orders.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageItems = orders.slice(start, end)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const handleDownloadInvoice = async (order: OrderSummary) => {
    if (!order.id) {
      toast.error(t('userDashboard.orders.toasts.orderIdMissingInvoice'))
      return
    }
    setDownloadingId(order.id)
    try {
      const res = (await invoicesApi.getSaleInvoicePreview(order.id)) as { html?: string }
      const html = res?.html
      if (html) {
        const w = window.open('', '_blank')
        if (w) {
          w.document.write(html)
          w.document.close()
          w.focus()
          setTimeout(() => {
            w.print()
          }, 400)
        } else {
          toast.error(t('userDashboard.orders.toasts.allowPopupsDownloadInvoice'))
        }
      } else {
        toast.error(t('userDashboard.orders.toasts.invoiceNotAvailable'))
      }
    } catch {
      toast.error(t('userDashboard.orders.toasts.couldNotLoadInvoice'))
    } finally {
      setDownloadingId(null)
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-xl font-bold gold-gradient-text-on-light mb-4">{t('userDashboard.orders.title')}</h2>
      <div className="gold-card">
        {isLoading ? (
          <p className="text-gold-100/60 text-center py-8">{t('userDashboard.orders.loading')}</p>
        ) : orders.length === 0 ? (
          <p className="text-gold-100/60 text-center py-8">{t('userDashboard.orders.noOrdersYet')}</p>
        ) : (
          <div className="divide-y divide-gold-500/20">
            {pageItems.map((order) => (
              <div key={order.id} className="py-4 first:pt-0">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gold-100">
                      {t('userDashboard.orders.orderLabel')} {order.invoice_number}
                    </p>
                    <p className="text-sm text-gold-100/60">
                      {order.sale_date ? new Date(order.sale_date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      }) : '—'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'delivered' || order.status === 'paid' || order.status === 'locked'
                          ? 'bg-green-500/20 text-green-400'
                          : order.status === 'cancelled' || order.status === 'refunded'
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gold-500/20 text-gold-400'
                      }`}>
                        {order.status_display ?? order.status}
                      </span>
                      <span className="font-medium text-gold-400">
                        {Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDownloadInvoice(order)}
                      disabled={downloadingId === order.id}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-gold-500/60 text-gold-100 hover:bg-gold-500/10 disabled:opacity-50"
                    >
                      {downloadingId === order.id
                        ? t('userDashboard.orders.downloading')
                        : t('userDashboard.orders.downloadInvoice')}
                    </button>
                  </div>
                </div>
                {order.items && order.items.length > 0 && (
                  <ul className="mt-2 text-sm text-gold-100/70 space-y-1">
                    {order.items.slice(0, 3).map((item) => (
                      <li key={item.id}>
                        {item.product_name ?? t('userDashboard.orders.item')} × {item.quantity}
                        {item.total_price && ` — ${Number(item.total_price).toLocaleString(undefined, { minimumFractionDigits: 3 })} KWD`}
                      </li>
                    ))}
                    {order.items.length > 3 && (
                      <li className="text-gold-100/50">
                        +{order.items.length - 3} {t('userDashboard.orders.more')}
                      </li>
                    )}
                  </ul>
                )}
                {order.delivery_type === 'locked' && (
                  <p className="mt-1 text-xs text-amber-400">{t('userDashboard.orders.lockedInVault')}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {!isLoading && total > pageSize && (
        <div className="gold-card mt-2 flex items-center justify-between text-xs text-black-100/70">
          <div>
            {t('userDashboard.orders.pagination', {
              page,
              totalPages,
              total,
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
            >
              {t('userDashboard.orders.prev')}
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
            >
              {t('userDashboard.orders.next')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

type LockedItem = {
  sale_item_id: string
  invoice_number: string
  order_date: string | null
  product_name: string | null
  product_sku: string | null
  product_serial_number: string | null
  carat_value: number | null
  carat_display: string | null
  weight_grams_available: number
}

function LockedGoldTab() {
  const { t } = useTranslation()
  const [lockedView, setLockedView] = useState<'fund' | 'gold' | 'products'>('fund')
  const [confirmItem, setConfirmItem] = useState<LockedItem | null>(null)
  const [quote, setQuote] = useState<{
    total_weight: number
    total_amount: number
    currency: string
  } | null>(null)
  const queryClient = useQueryClient()
  const { data: locked, isLoading } = useQuery({
    queryKey: ['myLockedGold'],
    queryFn: () => ordersApi.getMyLockedGold() as Promise<LockedItem[]>,
  })
  const list = Array.isArray(locked) ? locked : []
  const [page, setPage] = useState(1)
  const pageSize = 10
  const total = list.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageItems = list.slice(start, end)

  const { data: walletData } = useQuery({
    queryKey: ['myWallet'],
    queryFn: () => walletApi.getMyWallet() as Promise<{ wallet?: { balance: number; currency: string } }>,
  })
  // Ensure numeric balance before using toFixed (API may return string/Decimal-like)
  const walletBalanceRaw = (walletData?.wallet as { balance?: unknown } | undefined)?.balance
  const walletBalance =
    typeof walletBalanceRaw === 'number'
      ? walletBalanceRaw
      : Number(walletBalanceRaw ?? 0) || 0
  const walletCurrency = walletData?.wallet?.currency ?? 'KWD'

  const totalGold = list.reduce((sum, item) => sum + (item.weight_grams_available || 0), 0)

  // Get quote (preview) for a single locked product before confirming sell
  const quoteMutation = useMutation({
    mutationFn: (item: LockedItem) =>
      tradingApi.getSellQuote({
        items: [{ sale_item_id: item.sale_item_id, weight_grams: item.weight_grams_available }],
      }) as Promise<{ total_weight: number; total_amount: number; currency: string }>,
    onSuccess: (data, item) => {
      setConfirmItem(item)
      setQuote({
        total_weight: data.total_weight,
        total_amount: data.total_amount,
        currency: data.currency,
      })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail || t('userDashboard.lockedGold.toasts.couldNotGetSellQuote'))
    },
  })

  const sellMutation = useMutation({
    mutationFn: async (payload: { sale_item_id: string }) =>
      tradingApi.placeSellOrder({
        items: [{ sale_item_id: payload.sale_item_id }],
        payment_method: 'wallet',
      }),
    onSuccess: () => {
      toast.success(t('userDashboard.lockedGold.toasts.productSoldSuccess'))
      queryClient.invalidateQueries({ queryKey: ['myLockedGold'] })
      queryClient.invalidateQueries({ queryKey: ['myWallet'] })
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] })
      setConfirmItem(null)
      setQuote(null)
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail || t('userDashboard.lockedGold.toasts.couldNotPlaceSellOrder'))
    },
  })

  const handleSellClick = (item: LockedItem) => {
    quoteMutation.mutate(item)
  }

  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawDescription, setWithdrawDescription] = useState('')
  const withdrawMutation = useMutation({
    mutationFn: (payload: { amount: string; description?: string }) =>
      walletApi.withdraw(payload),
    onSuccess: () => {
      toast.success(t('userDashboard.lockedGold.toasts.withdrawRequested'))
      queryClient.invalidateQueries({ queryKey: ['myWallet'] })
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] })
      setWithdrawModalOpen(false)
      setWithdrawAmount('')
      setWithdrawDescription('')
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { detail?: string } } }
      toast.error(e?.response?.data?.detail || t('userDashboard.lockedGold.toasts.withdrawFailed'))
    },
  })
  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(withdrawAmount)
    if (Number.isNaN(amount) || amount <= 0) {
      toast.error(t('userDashboard.lockedGold.toasts.enterValidAmount'))
      return
    }
    if (amount > walletBalance) {
      toast.error(t('userDashboard.lockedGold.toasts.amountExceedsAvailableBalance'))
      return
    }
    withdrawMutation.mutate({
      amount: amount.toFixed(3),
      description: withdrawDescription.trim() || t('userDashboard.lockedGold.withdrawDefaultDescription'),
    })
  }

  return (
    <div className="space-y-4 mt-4">
      {/* <div className="flex items-center justify-between mt-4">
        <h2 className="text-xl font-bold gold-gradient-text-on-light">Locked gold</h2>
        {list.length > 0 && (
          <Link
            to="/sell-gold"
            className="text-sm font-medium gold-gradient-text-on-light hover:text-gold-300 flex items-center gap-1"
          >
            Sell gold <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div> */}
      <p className="gold-gradient-text-on-light">
        {t('userDashboard.lockedGold.heroHint')}
      </p>

      <div className="flex gap-2">
        {[
          { id: 'fund', label: t('userDashboard.lockedGold.tabs.fund') },
          // { id: 'gold', label: 'Gold' },
          { id: 'products', label: t('userDashboard.lockedGold.tabs.products') },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setLockedView(tab.id as 'fund' | 'gold' | 'products')}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              lockedView === tab.id
                ? 'border-gold-500 bg-amber-900/40 text-gold-100'
                : 'border-gold-500/40 gold-gradient-text-on-light hover:bg-gold-500/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="gold-card">
        {isLoading ? (
          <p className="text-gold-100/60 text-center py-8">{t('userDashboard.lockedGold.loading')}</p>
        ) : lockedView === 'fund' ? (
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <p className="text-sm text-gold-100">{t('userDashboard.lockedGold.availableFund')}</p>
              <p className="text-3xl font-bold text-gold-100">
                {walletBalance.toFixed(3)} {walletCurrency}
              </p>
              <p className="text-xs text-gold-100 mt-2">
                {t('userDashboard.lockedGold.currentFundHint')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setWithdrawModalOpen(true)}
              disabled={walletBalance <= 0}
              className="shrink-0 px-4 py-2 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-500/50"
            >
              {t('userDashboard.lockedGold.withdrawButton')}
            </button>
          </div>
        ) : list.length === 0 ? (
          <p className="text-gold-100/60 text-center py-8">
            {t('userDashboard.lockedGold.noLockedGold')}
          </p>
        ) : lockedView === 'gold' ? (
          <div className="space-y-3">
            <p className="text-sm text-gold-100">{t('userDashboard.lockedGold.totalLockedGold')}</p>
            <p className="text-3xl font-bold text-gold-100">{totalGold.toFixed(3)} g</p>
            <p className="text-xs text-gold-100 mt-2">
              {t('userDashboard.lockedGold.totalLockedGoldHint')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gold-500/20">
            {pageItems.map((item) => (
              <div key={item.sale_item_id} className="py-4 first:pt-0">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium text-gold-100">
                      {item.product_name ?? item.product_sku ?? t('userDashboard.lockedGold.fallbackGold')}
                    </p>
                    <p className="text-sm text-gold-100/60">
                      Order {item.invoice_number}
                      {item.carat_display && ` · ${item.carat_display}`}
                      {item.product_serial_number && ` · ${item.product_serial_number}`}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleSellClick(item)}
                      disabled={quoteMutation.isPending || sellMutation.isPending}
                      className="mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      {quoteMutation.isPending && confirmItem?.sale_item_id === item.sale_item_id
                        ? t('userDashboard.lockedGold.selling.preparingQuote')
                        : sellMutation.isPending
                        ? t('userDashboard.lockedGold.selling.selling')
                        : t('userDashboard.lockedGold.selling.sellThisProduct')}
                    </button>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gold-400">
                      {item.weight_grams_available.toFixed(3)} g
                    </p>
                    <p className="text-xs text-gold-100/60">
                      {item.order_date ? new Date(item.order_date).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {lockedView === 'products' && !isLoading && total > pageSize && (
        <div className="gold-card mt-2 flex items-center justify-between text-xs text-gold-100/70">
          <div>
            {t('userDashboard.lockedGold.pagination', { page, totalPages, total })}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
            >
              {t('userDashboard.lockedGold.prev')}
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
            >
              {t('userDashboard.lockedGold.next')}
            </button>
          </div>
        </div>
      )}

      {confirmItem && quote && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="gold-card max-w-md w-full">
            <h3 className="text-lg font-semibold text-gold-100 mb-3">
              {t('userDashboard.lockedGold.confirmSellFor', {
                productName:
                  confirmItem.product_name ?? confirmItem.product_sku ?? t('userDashboard.lockedGold.fallbackGold'),
              })}
            </h3>
            <p className="text-sm text-gold-100/70 mb-2">
              {t('userDashboard.lockedGold.confirmSellHint')}
            </p>
            <div className="mt-3 border border-gold-500/30 rounded-lg p-3 text-sm text-gold-100/80 bg-charcoal-900/60">
              <div className="flex justify-between mb-1">
                <span>{t('userDashboard.lockedGold.details.lockedWeight')}</span>
                <span>{confirmItem.weight_grams_available.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>{t('userDashboard.lockedGold.details.pureWeight')}</span>
                <span>{quote.total_weight.toFixed(3)} g</span>
              </div>
              <div className="flex justify-between font-semibold mt-2">
                <span>{t('userDashboard.lockedGold.details.amountYouWillReceive')}</span>
                <span>
                  {quote.total_amount.toFixed(3)} {quote.currency}
                </span>
              </div>
            </div>
            <p className="text-xs text-gold-100/60 mt-3">
              {t('userDashboard.lockedGold.invoicePreviewHint')}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setConfirmItem(null)
                  setQuote(null)
                }}
                className="px-3 py-1 rounded-lg text-xs font-medium border border-gold-500/40 text-gold-100 hover:bg-gold-500/10"
              >
                {t('userDashboard.lockedGold.cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirmItem) return
                  sellMutation.mutate({ sale_item_id: confirmItem.sale_item_id })
                }}
                disabled={sellMutation.isPending}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {sellMutation.isPending ? t('userDashboard.lockedGold.selling.selling') : t('userDashboard.lockedGold.confirmSell')}
              </button>
            </div>
          </div>
        </div>
      )}

      {withdrawModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="gold-card max-w-md w-full">
            <h3 className="text-lg font-semibold text-gold-100 mb-3">{t('userDashboard.lockedGold.withdrawModal.title')}</h3>
            <p className="text-sm text-gold-100/70 mb-3">
              {t('userDashboard.lockedGold.withdrawModal.hint')}
            </p>
            <form onSubmit={handleWithdrawSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-gold-100/70 mb-1">
                  {t('userDashboard.lockedGold.withdrawModal.amountLabel', { currency: walletCurrency })}
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max={walletBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.000"
                  className="w-full rounded-lg border border-gold-500/40 bg-charcoal-900/60 text-gold-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-gold-100/50 mt-1">
                  {t('userDashboard.lockedGold.withdrawModal.available', {
                    amount: walletBalance.toFixed(3),
                    currency: walletCurrency,
                  })}
                </p>
              </div>
              <div>
                <label className="block text-xs text-gold-100/70 mb-1">{t('userDashboard.lockedGold.withdrawModal.noteLabel')}</label>
                <input
                  type="text"
                  value={withdrawDescription}
                  onChange={(e) => setWithdrawDescription(e.target.value)}
                  placeholder={t('userDashboard.lockedGold.withdrawModal.notePlaceholder')}
                  className="w-full rounded-lg border border-gold-500/40 bg-charcoal-900/60 text-gold-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawModalOpen(false)
                    setWithdrawAmount('')
                    setWithdrawDescription('')
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gold-500/40 text-gold-100 hover:bg-gold-500/10"
                >
                  {t('userDashboard.lockedGold.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={withdrawMutation.isPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {withdrawMutation.isPending ? t('userDashboard.lockedGold.withdrawModal.processing') : t('userDashboard.lockedGold.withdrawModal.withdraw')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

type CustomerProfile = {
  id: string
  address_line1?: string | null
  address_line2?: string | null
  city?: string | null
  governorate?: string | null
  postal_code?: string | null
  country?: string | null
  bank_name?: string | null
  iban?: string | null
  civil_id_front?: string | null
  civil_id_back?: string | null
  iban_proof?: string | null
}

function asSingleProfile(data: unknown): CustomerProfile | null {
  if (!data) return null
  if (Array.isArray(data)) return (data[0] as CustomerProfile) ?? null
  const p = data as { results?: CustomerProfile[]; id?: string; user?: unknown }
  if (p.results && p.results.length > 0) return p.results[0]
  // Non-paginated single object (or future API shape)
  if (typeof p.id === 'string' && p.user !== undefined) return p as CustomerProfile
  return null
}

function BankAccountTab() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['myCustomerProfile'],
    queryFn: () => accountsApi.getMyProfile() as Promise<unknown>,
  })

  const { data: requestRows = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['myBankChangeRequests'],
    queryFn: () => accountsApi.getMyBankChangeRequests(),
  })

  const profile = asSingleProfile(data)
  const pendingRequest = requestRows.find((r: BankChangeRequestRow) => r.status === 'pending')

  const sortedRequests = useMemo(
    () =>
      [...requestRows].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ),
    [requestRows]
  )
  const latestRequest = sortedRequests[0]
  const showRejectionNotice =
    !pendingRequest && latestRequest?.status === 'rejected'

  const [bankName, setBankName] = useState('')
  const [iban, setIban] = useState('')
  const [ibanProofFile, setIbanProofFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (pendingRequest) {
      setBankName(pendingRequest.bank_name)
      setIban(pendingRequest.iban)
      return
    }
    setBankName(profile?.bank_name ?? '')
    setIban(profile?.iban ?? '')
  }, [profile?.bank_name, profile?.iban, pendingRequest?.id, pendingRequest?.bank_name, pendingRequest?.iban])

  const mutation = useMutation({
    mutationFn: (formData: FormData) => accountsApi.createBankChangeRequest(formData),
    onSuccess: () => {
      toast.success(t('userDashboard.bankAccount.toasts.requestSubmitted'))
      queryClient.invalidateQueries({ queryKey: ['myBankChangeRequests'] })
    },
    onError: (err: unknown) => {
      const dataErr = (err as { response?: { data?: Record<string, unknown> } })?.response?.data
      const nonField = dataErr?.non_field_errors
      if (Array.isArray(nonField) && nonField[0]) {
        toast.error(String(nonField[0]))
        return
      }
      const ibanErr = dataErr?.iban
      if (Array.isArray(ibanErr) && ibanErr[0]) {
        toast.error(String(ibanErr[0]))
        return
      }
      toast.error(t('userDashboard.bankAccount.toasts.failedToSubmitRequest'))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.id) {
      toast.error(t('userDashboard.bankAccount.toasts.customerProfileNotFound'))
      return
    }
    if (pendingRequest) return
    const formData = new FormData()
    formData.append('bank_name', bankName.trim())
    formData.append('iban', iban.replace(/\s/g, ''))
    if (ibanProofFile) formData.append('iban_proof', ibanProofFile)
    setSaving(true)
    mutation.mutate(formData, { onSettled: () => setSaving(false) })
  }

  const busy = isLoading || loadingRequests

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-xl font-bold gold-gradient-text-on-light mb-2">{t('userDashboard.bankAccount.title')}</h2>
      <p className="text-sm gold-gradient-text-on-light mb-4 whitespace-pre-line">
        {t('userDashboard.bankAccount.hintApproval')}
      </p>
      <div className="gold-card space-y-6">
        {busy && !profile ? (
          <p className="text-gold-100/60 text-center py-8">{t('userDashboard.bankAccount.loading')}</p>
        ) : !profile ? (
          <p className="text-gold-100/60 text-center py-8">
            {t('userDashboard.bankAccount.customerProfileNotFoundLong')}
          </p>
        ) : (
          <>
            <div className="rounded-lg border border-gold-500/25 bg-charcoal-900/40 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gold-200">
                {t('userDashboard.bankAccount.currentSavedTitle')}
              </h3>
              <p className="text-xs text-gold-100/50">{t('userDashboard.bankAccount.currentSavedHint')}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gold-100/50">{t('userDashboard.bankAccount.bankNameLabel')}: </span>
                  <span className="text-gold-100">{profile.bank_name?.trim() || '—'}</span>
                </div>
                <div>
                  <span className="text-gold-100/50">{t('userDashboard.bankAccount.ibanLabel')}: </span>
                  <span className="text-gold-100 font-mono text-xs break-all">{profile.iban?.trim() || '—'}</span>
                </div>
              </div>
              {profile.iban_proof ? (
                <a
                  href={profile.iban_proof}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full border border-gold-500/60 text-gold-100 hover:bg-gold-500/10 mt-2"
                >
                  {t('userDashboard.bankAccount.downloadProof')}
                </a>
              ) : null}
            </div>

            {pendingRequest ? (
              <div className="rounded-lg border border-amber-500/40 bg-amber-950/30 p-4">
                <p className="text-sm font-medium text-amber-100">{t('userDashboard.bankAccount.pendingTitle')}</p>
                <p className="text-xs text-amber-100/70 mt-1">{t('userDashboard.bankAccount.pendingBody')}</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gold-100/90">
                  <div>
                    <span className="text-gold-100/50">{t('userDashboard.bankAccount.bankNameLabel')}: </span>
                    {pendingRequest.bank_name}
                  </div>
                  <div>
                    <span className="text-gold-100/50">{t('userDashboard.bankAccount.ibanLabel')}: </span>
                    <span className="font-mono text-xs">{pendingRequest.iban}</span>
                  </div>
                </div>
                {pendingRequest.iban_proof_url ? (
                  <a
                    href={pendingRequest.iban_proof_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block mt-2 text-xs text-emerald-400 hover:underline"
                  >
                    {t('userDashboard.bankAccount.viewSubmittedProof')}
                  </a>
                ) : null}
              </div>
            ) : null}

            {showRejectionNotice && latestRequest ? (
              <div className="rounded-lg border border-red-500/35 bg-red-950/25 p-4">
                <p className="text-sm font-medium text-red-200">{t('userDashboard.bankAccount.rejectedTitle')}</p>
                {latestRequest.rejection_reason ? (
                  <p className="text-xs text-red-100/80 mt-1">{latestRequest.rejection_reason}</p>
                ) : null}
                <p className="text-xs text-gold-100/60 mt-2">{t('userDashboard.bankAccount.rejectedResubmitHint')}</p>
              </div>
            ) : null}

            {!pendingRequest ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <p className="text-sm text-gold-100/70">{t('userDashboard.bankAccount.proposedSectionTitle')}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gold-100 mb-2">
                      {t('userDashboard.bankAccount.bankNameLabel')}
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                      placeholder={t('userDashboard.bankAccount.bankNamePlaceholder')}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gold-100 mb-2">
                      {t('userDashboard.bankAccount.ibanLabel')}
                    </label>
                    <input
                      type="text"
                      value={iban}
                      onChange={(e) => setIban(e.target.value)}
                      className="w-full px-4 py-3 bg-charcoal-800 border border-gold-500/30 rounded-lg text-gold-100"
                      placeholder={t('userDashboard.bankAccount.ibanPlaceholder')}
                    />
                  </div>
                </div>

                <div className="border border-dashed border-gold-500/40 p-4 rounded-lg text-center hover:border-gold-400 transition">
                  <label className="cursor-pointer block">
                    <span className="block mb-2 text-gold-300 text-2xl">📄</span>
                    <span className="text-sm text-gold-100/80">
                      {t('userDashboard.bankAccount.uploadIbanProof')}
                    </span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => setIbanProofFile(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {ibanProofFile ? (
                    <p className="mt-2 text-xs text-emerald-400">{ibanProofFile.name}</p>
                  ) : (
                    <p className="mt-2 text-xs text-gold-100/40">{t('userDashboard.bankAccount.proofOptionalHint')}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="gold-button"
                  disabled={saving || mutation.isPending}
                >
                  {saving || mutation.isPending
                    ? t('userDashboard.bankAccount.submitting')
                    : t('userDashboard.bankAccount.submitRequestButton')}
                </button>
              </form>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}

type WalletTx = {
  id: string
  type: 'deposit' | 'withdrawal' | 'buy' | 'sell' | 'adjustment'
  type_display?: string
  amount: number
  balance_after: number
  reference?: string | null
  description?: string | null
  created_at: string
}

function parseWalletTxInstant(tx: WalletTx): Date | null {
  if (!tx.created_at) return null
  const d = new Date(tx.created_at)
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfLocalDay(ymd: string): Date {
  const [y, m, day] = ymd.split('-').map((x) => parseInt(x, 10))
  if (!y || !m || !day) return new Date(NaN)
  return new Date(y, m - 1, day, 0, 0, 0, 0)
}

function endOfLocalDay(ymd: string): Date {
  const [y, m, day] = ymd.split('-').map((x) => parseInt(x, 10))
  if (!y || !m || !day) return new Date(NaN)
  return new Date(y, m - 1, day, 23, 59, 59, 999)
}

function filterWalletTxsByDateRange(txs: WalletTx[], dateFrom: string, dateTo: string): WalletTx[] {
  if (!dateFrom && !dateTo) return txs
  return txs.filter((tx) => {
    const d = parseWalletTxInstant(tx)
    if (!d) return false
    if (dateFrom) {
      const start = startOfLocalDay(dateFrom)
      if (d < start) return false
    }
    if (dateTo) {
      const end = endOfLocalDay(dateTo)
      if (d > end) return false
    }
    return true
  })
}

function TransactionsTab() {
  const [selectedTx, setSelectedTx] = useState<WalletTx | null>(null)
  const [receipt, setReceipt] = useState<Record<string, unknown> | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [wordExporting, setWordExporting] = useState(false)
  const { t, i18n } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['walletTransactions'],
    queryFn: () => walletApi.getTransactions() as Promise<WalletTx[]>,
  })

  const txs = Array.isArray(data) ? data : []
  const rangeInvalid = Boolean(
    dateFrom && dateTo && startOfLocalDay(dateFrom).getTime() > endOfLocalDay(dateTo).getTime(),
  )
  const filteredTxs = useMemo(() => {
    if (rangeInvalid) return []
    return filterWalletTxsByDateRange(txs, dateFrom, dateTo)
  }, [txs, dateFrom, dateTo, rangeInvalid])

  const [page, setPage] = useState(1)
  const pageSize = 10
  const total = filteredTxs.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const pageItems = filteredTxs.slice(start, end)

  useEffect(() => {
    setPage(1)
  }, [dateFrom, dateTo])

  const handleViewReceipt = async (tx: WalletTx) => {
    if (!tx.reference) {
      toast.error(t('userDashboard.transactions.toasts.noReceiptReference'))
      return
    }
    try {
      setSelectedTx(tx)
      const data = (await tradingApi.getBuyback(tx.reference)) as Record<string, unknown>
      setReceipt(data)
    } catch {
      toast.error(t('userDashboard.transactions.toasts.couldNotLoadReceiptDetails'))
      setSelectedTx(null)
      setReceipt(null)
    }
  }

  const downloadFilteredWord = async () => {
    if (rangeInvalid) {
      toast.error(t('userDashboard.transactions.toasts.invalidDateRange'))
      return
    }
    if (filteredTxs.length === 0) {
      toast.error(t('userDashboard.transactions.toasts.downloadRangeEmpty'))
      return
    }
    const locale = i18n.language?.startsWith('ar') ? 'ar-KW' : undefined
    const isRtl = i18n.dir() === 'rtl'
    const rangeLabel =
      dateFrom && dateTo
        ? t('userDashboard.transactions.printRangeBoth', { from: dateFrom, to: dateTo })
        : dateFrom
          ? t('userDashboard.transactions.printRangeFromOnly', { from: dateFrom })
          : dateTo
            ? t('userDashboard.transactions.printRangeToOnly', { to: dateTo })
            : t('userDashboard.transactions.printRangeAll')
    const generated = new Date().toLocaleString(locale)
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '').replace('T', '-')
    const filename =
      dateFrom || dateTo
        ? `wallet-transactions-${dateFrom || 'all'}_to_${dateTo || 'all'}_${stamp}.docx`
        : `wallet-transactions-all_${stamp}.docx`
    setWordExporting(true)
    try {
      const rows = filteredTxs.map((tx) => {
        const d = parseWalletTxInstant(tx)
        const dateStr = d
          ? d.toLocaleString(locale, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : '—'
        const isCredit = tx.type === 'deposit' || tx.type === 'sell'
        const sign = isCredit ? '+' : '-'
        return {
          date: dateStr,
          type: String(tx.type_display ?? tx.type),
          description: String(tx.description || ''),
          amount: `${sign}${Number(tx.amount).toFixed(3)} KWD`,
          balance: `${Number(tx.balance_after).toFixed(3)} KWD`,
          reference: String(tx.reference || '—'),
        }
      })
      const blob = await buildWalletTransactionsDocxBlob({
        documentTitle: t('userDashboard.transactions.wordDoc.title'),
        periodLabel: t('userDashboard.transactions.wordDoc.period'),
        periodValue: rangeLabel,
        generatedLabel: t('userDashboard.transactions.wordDoc.generated'),
        generatedValue: generated,
        rowCountLabel: t('userDashboard.transactions.wordDoc.rowCount'),
        rowCountValue: String(filteredTxs.length),
        headers: [
          t('userDashboard.transactions.table.date'),
          t('userDashboard.transactions.table.type'),
          t('userDashboard.transactions.table.description'),
          t('userDashboard.transactions.table.amount'),
          t('userDashboard.transactions.table.balanceAfter'),
          t('userDashboard.transactions.wordDoc.reference'),
        ],
        rows,
        isRtl,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success(t('userDashboard.transactions.toasts.downloadComplete'))
    } catch {
      toast.error(t('userDashboard.transactions.toasts.downloadFailed'))
    } finally {
      setWordExporting(false)
    }
  }

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-xl font-bold gold-gradient-text-on-light mb-2">{t('userDashboard.transactions.title')}</h2>
      <p className="text-sm gold-gradient-text-on-light mb-4">
        {t('userDashboard.transactions.hint')}
      </p>

      {!isLoading && txs.length > 0 && (
        <div className="gold-card p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gold-100">{t('userDashboard.transactions.dateRangeTitle')}</h3>
          <p className="text-xs text-gold-100/60">{t('userDashboard.transactions.dateRangeHint')}</p>
          {rangeInvalid && (
            <p className="text-xs text-red-400">{t('userDashboard.transactions.rangeInvalid')}</p>
          )}
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-gold-100/70 block mb-1">{t('userDashboard.transactions.dateFrom')}</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-900/40 text-gold-100 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="text-xs text-gold-100/70 block mb-1">{t('userDashboard.transactions.dateTo')}</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-900/40 text-gold-100 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2 sm:pb-0.5">
              <button
                type="button"
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium border border-gold-500/40 text-gold-100 hover:bg-gold-500/10"
              >
                {t('userDashboard.transactions.clearDateRange')}
              </button>
              <button
                type="button"
                onClick={() => void downloadFilteredWord()}
                disabled={rangeInvalid || filteredTxs.length === 0 || wordExporting}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-500 border border-amber-400/40 disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4 shrink-0" aria-hidden />
                {wordExporting
                  ? t('userDashboard.transactions.wordDoc.generating')
                  : t('userDashboard.transactions.downloadWord')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="gold-card">
        {isLoading ? (
          <p className="text-gold-100/60 text-center py-8">{t('userDashboard.transactions.loading')}</p>
        ) : txs.length === 0 ? (
          <p className="text-gold-100/60 text-center py-8">{t('userDashboard.transactions.noTransactionsYet')}</p>
        ) : filteredTxs.length === 0 ? (
          <p className="text-gold-100/60 text-center py-8">{t('userDashboard.transactions.noTransactionsInRange')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gold-100/70 border-b border-gold-500/20">
                  <th className="py-2 pr-2">{t('userDashboard.transactions.table.date')}</th>
                  <th className="py-2 pr-2">{t('userDashboard.transactions.table.type')}</th>
                  <th className="py-2 pr-2">{t('userDashboard.transactions.table.description')}</th>
                  <th className="py-2 pr-2 text-right">{t('userDashboard.transactions.table.amount')}</th>
                  <th className="py-2 pl-2 text-right">{t('userDashboard.transactions.table.balanceAfter')}</th>
                  <th className="py-2 pl-2 text-right">{t('userDashboard.transactions.table.receipt')}</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((tx) => {
                  const d = tx.created_at ? new Date(tx.created_at) : null
                  const isCredit = tx.type === 'deposit' || tx.type === 'sell'
                  return (
                    <tr key={tx.id} className="border-b border-gold-500/10 last:border-0">
                      <td className="py-2 pr-2 text-gold-100/80">
                        {d
                          ? d.toLocaleString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      <td className="py-2 pr-2 text-gold-100/90">
                        {tx.type_display ?? tx.type}
                      </td>
                      <td className="py-2 pr-2 text-gold-100/70">
                        {tx.description || tx.reference || '—'}
                      </td>
                      <td
                        className={`py-2 pr-2 text-right font-semibold ${
                          isCredit ? 'text-emerald-400' : 'text-red-400'
                        }`}
                      >
                        {isCredit ? '+' : '-'}
                        {Number(tx.amount).toFixed(3)} KWD
                      </td>
                      <td className="py-2 pl-2 text-right text-gold-100/80">
                        {Number(tx.balance_after).toFixed(3)} KWD
                      </td>
                      <td className="py-2 pl-2 text-right">
                        {tx.type === 'sell' && tx.reference ? (
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(tx)}
                            className="text-xs px-3 py-1 rounded-full border border-gold-500/60 text-gold-100 hover:bg-gold-500/10"
                          >
                            {t('userDashboard.transactions.viewReceipt')}
                          </button>
                        ) : (
                          <span className="text-xs text-gold-100/40">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {!isLoading && total > pageSize && (
        <div className="gold-card mt-2 flex items-center justify-between text-xs text-black-100/70">
          <div>
            {t('userDashboard.transactions.pagination', { page, totalPages, total })}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
            >
              {t('userDashboard.transactions.prev')}
            </button>
            <button
              type="button"
              onClick={() => setPage((p) => (p < totalPages ? p + 1 : p))}
              disabled={page >= totalPages}
              className="px-3 py-1 rounded-full border border-gold-500/60 disabled:opacity-40 hover:bg-gold-500/10"
            >
              {t('userDashboard.transactions.next')}
            </button>
          </div>
        </div>
      )}
      {selectedTx && receipt && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="gold-card max-w-2xl w-full bg-[var(--site-bg)]">
            <h3 className="text-xl font-bold text-gold-100 mb-4">
              {t('userDashboard.transactions.sellReceiptTitle', {
                description: selectedTx.description || t('userDashboard.transactions.goldBuybackFallback'),
              })}
            </h3>
            <p className="text-sm text-gold-100/70 mb-4">
              {t('userDashboard.transactions.officialSellReceiptHint')}
            </p>

            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gold-100/80">
              <div>
                <div className="flex justify-between">
                  <span className="text-gold-100/60">{t('userDashboard.transactions.details.transactionDate')}</span>
                  <span>
                    {selectedTx.created_at
                      ? new Date(selectedTx.created_at).toLocaleString()
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gold-100/60">{t('userDashboard.transactions.details.transactionType')}</span>
                  <span>{selectedTx.type_display ?? selectedTx.type}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gold-100/60">{t('userDashboard.transactions.details.reference')}</span>
                  <span>{selectedTx.reference || '—'}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-gold-100/60">{t('userDashboard.transactions.details.amountCredited')}</span>
                  <span className="font-semibold text-emerald-400">
                    +{Number(selectedTx.amount).toFixed(3)} KWD
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gold-100/60">{t('userDashboard.transactions.details.walletBalanceAfter')}</span>
                  <span>{Number(selectedTx.balance_after).toFixed(3)} KWD</span>
                </div>
              </div>
            </div>

            {/* Line items summary if available on receipt (buyback details) */}
            {'items' in receipt && Array.isArray((receipt as any).items) && (
              <div className="mb-4 border border-gold-500/30 rounded-lg max-h-64 overflow-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-gold-100/70 border-b border-gold-500/20">
                      <th className="py-2 px-3">{t('userDashboard.transactions.receiptTable.carat')}</th>
                      <th className="py-2 px-3 text-right">{t('userDashboard.transactions.receiptTable.weight')}</th>
                      <th className="py-2 px-3 text-right">{t('userDashboard.transactions.receiptTable.rate')}</th>
                      <th className="py-2 px-3 text-right">{t('userDashboard.transactions.receiptTable.lineTotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(receipt as any).items.map(
                      (it: {
                        id: string
                        carat_display?: string
                        carat_value?: number
                        weight_grams: number | string
                        price_per_gram: number | string
                        total_price: number | string
                      }) => {
                        const w = Number(it.weight_grams ?? 0)
                        const r = Number(it.price_per_gram ?? 0)
                        const t = Number(it.total_price ?? 0)
                        return (
                          <tr key={it.id} className="border-b border-gold-500/10 last:border-0">
                            <td className="py-2 px-3 text-gold-100/80">
                              {it.carat_display ??
                                (it.carat_value ? `${it.carat_value}K` : '—')}
                            </td>
                            <td className="py-2 px-3 text-right text-gold-100/80">
                              {w.toFixed(3)}
                            </td>
                            <td className="py-2 px-3 text-right text-gold-100/80">
                              {r.toFixed(3)}
                            </td>
                            <td className="py-2 px-3 text-right text-gold-100/90">
                              {t.toFixed(3)} KWD
                            </td>
                          </tr>
                        )
                      },
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedTx(null)
                  setReceipt(null)
                }}
                className="px-3 py-1 rounded-lg text-xs font-medium border border-gold-500/40 text-gold-100 hover:bg-gold-500/10"
              >
                {t('userDashboard.transactions.close')}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-3 py-1 rounded-lg text-xs font-medium bg-amber-600 text-white hover:bg-amber-700"
              >
                {t('userDashboard.transactions.printDownload')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

type PriceAlertRow = {
  id: string
  alert_type?: string
  spot_metal?: string
  spot_metal_display?: string
  gold_carats?: number | string | null
  price_side?: string
  price_side_display?: string
  target_price?: string | number | null
  condition?: string
  status?: string
  triggered_at?: string | null
}

function NotificationsTab() {
  const { t } = useTranslation()

  const storageKey = 'priceAlertLastSeenAt'
  const [lastSeenAtMs, setLastSeenAtMs] = useState<number>(() => {
    try {
      const v = localStorage.getItem(storageKey)
      return v ? new Date(v).getTime() : 0
    } catch {
      return 0
    }
  })

  const { data, isLoading } = useQuery({
    queryKey: ['priceAlerts'],
    queryFn: () => apiService.get('/accounts/price-alerts/'),
    refetchInterval: 30_000,
    retry: 1,
  })

  useEffect(() => {
    // Mark current device as "seen" when the user opens the notifications tab.
    try {
      const nowIso = new Date().toISOString()
      localStorage.setItem(storageKey, nowIso)
      setLastSeenAtMs(new Date(nowIso).getTime())
    } catch {
      // ignore localStorage issues
    }
  }, [])

  const alerts = Array.isArray(data) ? (data as PriceAlertRow[]) : []
  const triggered = alerts
    .filter((a) => a.status === 'triggered')
    .sort((a, b) => {
      const ad = a.triggered_at ? new Date(a.triggered_at).getTime() : 0
      const bd = b.triggered_at ? new Date(b.triggered_at).getTime() : 0
      return bd - ad
    })

  return (
    <div className="space-y-4 mt-4">
      <h2 className="text-xl font-bold gold-gradient-text-on-light">
        {t('userDashboard.tabs.notifications')}
      </h2>
      <p className="text-sm gold-gradient-text-on-light mb-1">
        Price reminders you set on the Prices page.
      </p>

      {isLoading ? (
        <p className="text-black-100/60 text-center py-8">Loading...</p>
      ) : triggered.length === 0 ? (
        <p className="text-black-100/60 text-center py-8">No triggered reminders yet.</p>
      ) : (
        <div className="space-y-3">
          {triggered.map((a) => {
            const goldCaratNum = a.gold_carats != null ? Number(a.gold_carats) : NaN
            const metal = (a.spot_metal || 'gold').toLowerCase()
            const metalLine =
              metal === 'silver'
                ? 'Silver'
                : metal === 'platinum'
                  ? 'Platinum'
                  : Number.isFinite(goldCaratNum)
                    ? `${goldCaratNum}K gold`
                    : a.spot_metal_display || 'Gold'
            const sideLabel = a.price_side_display ?? a.price_side ?? '—'
            const target = a.target_price != null ? Number(a.target_price) : NaN
            const d = a.triggered_at ? new Date(a.triggered_at) : null
            const isNew = a.triggered_at ? d!.getTime() > lastSeenAtMs : false

            const thresholdText =
              a.condition === 'above'
                ? `rate increases above ${Number.isFinite(target) ? target.toFixed(3) : '—'} KWD/g`
                : a.condition === 'below'
                  ? `rate decreases below ${Number.isFinite(target) ? target.toFixed(3) : '—'} KWD/g`
                  : ''

            return (
              <div
                key={a.id}
                className={`gold-card p-4 border ${
                  isNew ? 'border-amber-400/50 ring-1 ring-amber-400/30' : 'border-gold-500/20'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm text-black-100/70">
                      {metalLine} • {sideLabel}
                    </div>
                    <div className="text-black-100 font-semibold mt-1">Triggered</div>
                    {thresholdText && (
                      <div className="text-sm text-gold-100/70 mt-1">{thresholdText}</div>
                    )}
                  </div>
                  <div className="text-xs text-black-100/50">
                    {d ? d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function TradeGoldTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [depositAmount, setDepositAmount] = useState('')
  const knetPresets = [10, 25, 50, 100] as const

  const { data, isLoading } = useQuery({
    queryKey: ['goldPositions'],
    queryFn: () => goldTradingApi.getPositions() as Promise<unknown>,
    retry: 1,
  })

  const { data: walletData } = useQuery({
    queryKey: ['myWallet'],
    queryFn: () => walletApi.getMyWallet(),
  })
  const walletBalanceRaw = (walletData?.wallet as { balance?: unknown } | undefined)?.balance
  const walletBalance =
    typeof walletBalanceRaw === 'number'
      ? walletBalanceRaw
      : Number(walletBalanceRaw ?? 0) || 0

  const depositMutation = useMutation({
    mutationFn: (amountStr: string) =>
      walletApi.deposit({ amount: amountStr, description: KNET_TRADE_GOLD_DEPOSIT_DESC }),
    onSuccess: () => {
      toast.success(t('tradeGold.knetDeposit.success'))
      setDepositAmount('')
      queryClient.invalidateQueries({ queryKey: ['myWallet'] })
      queryClient.invalidateQueries({ queryKey: ['wallet', 'trade-gold'] })
      queryClient.invalidateQueries({ queryKey: ['walletTransactions'] })
    },
    onError: (err: unknown) =>
      toast.error(walletDepositApiError(err, t('tradeGold.knetDeposit.failed'))),
  })

  const submitKnetDeposit = () => {
    const n = parseFloat(depositAmount.replace(/,/g, '.'))
    if (!Number.isFinite(n) || n <= 0) {
      toast.error(t('tradeGold.knetDeposit.invalidAmount'))
      return
    }
    depositMutation.mutate(n.toFixed(3))
  }

  const positions = Array.isArray(data) ? (data as any[]) : []
  const totalGrams = positions.reduce((sum, p) => sum + Number(p.grams_available ?? 0), 0)
  const totalUnrealized = positions.reduce((sum, p) => {
    const v = p.unrealized_pl_kwd
    if (v == null || !Number.isFinite(Number(v))) return sum
    return sum + Number(v)
  }, 0)

  const plClass = totalUnrealized >= 0 ? 'text-emerald-400' : 'text-red-400'

  return (
    <div className="gold-card mt-4 p-6 space-y-4">
      <h2 className="text-xl font-bold gold-gradient-text-on-light">Trade gold</h2>
      <p className="text-sm text-stone-600">
        Buy or sell virtual gold instantly by grams or KWD using your wallet balance.
      </p>

      <div className="rounded-lg bg-charcoal-800/60 border border-gold-500/20 p-3">
        <p className="text-xs text-gold-100/60">{t('tradeGold.walletBalance')}</p>
        <p className="text-xl font-bold text-gold-200">{walletBalance.toFixed(3)} KWD</p>
      </div>

      <div className="rounded-lg border border-amber-500/30 bg-charcoal-800/50 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/35 flex items-center justify-center shrink-0">
            <CreditCard className="w-4 h-4 text-amber-300" aria-hidden />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gold-100">{t('tradeGold.knetDeposit.title')}</h3>
            <p className="text-xs text-gold-100/60 leading-snug">{t('tradeGold.knetDeposit.subtitle')}</p>
          </div>
        </div>
        <p className="text-xs text-gold-100/50 leading-relaxed">{t('tradeGold.knetDeposit.note')}</p>
        <div className="flex flex-wrap gap-1.5">
          {knetPresets.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setDepositAmount(String(v))}
              className="px-2.5 py-1 rounded-md text-xs font-medium border border-amber-500/35 text-black-100/90 hover:bg-amber-500/15 transition-colors"
            >
              {v} KWD
            </button>
          ))}
        </div>
        <label className="block">
          <span className="text-xs text-gold-100/60 mb-1 block">{t('tradeGold.knetDeposit.amountLabel')}</span>
          <input
            type="number"
            inputMode="decimal"
            step="0.001"
            min="0"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder={t('tradeGold.knetDeposit.amountPlaceholder')}
            className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={submitKnetDeposit}
          disabled={depositMutation.isPending}
          className="w-full px-3 py-2.5 rounded-lg text-sm font-semibold bg-amber-600 text-white hover:bg-amber-500 border border-amber-400/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {depositMutation.isPending ? t('tradeGold.processing') : t('tradeGold.knetDeposit.cta')}
        </button>
      </div>

      {isLoading ? (
        <p className="text-gold-100/60 text-sm">Loading positions…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg bg-charcoal-800/60 border border-gold-500/20 p-3">
            <p className="text-xs text-gold-100/60">Your total virtual grams</p>
            <p className="text-2xl font-bold text-gold-200">{totalGrams.toFixed(3)} g</p>
          </div>
          <div className="rounded-lg bg-charcoal-800/60 border border-gold-500/20 p-3">
            <p className="text-xs text-gold-100/60">Unrealized P/L</p>
            <p className={`text-2xl font-bold ${plClass}`}>{totalUnrealized.toFixed(3)} KWD</p>
          </div>
        </div>
      )}

      <Link
        to="/trade-gold"
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gold-500 text-black font-semibold hover:bg-gold-400"
      >
        Open trading page
      </Link>
    </div>
  )
}

// Wishlist, addresses, payment methods, and notifications tabs can be implemented later if needed.
