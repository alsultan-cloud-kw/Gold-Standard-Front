import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, Clock, Navigation, ArrowRight, Building2 } from 'lucide-react'
import { inventoryApi } from '../services/api'
import type { Branch } from '../types'
import { GS_CONTACT } from '@/constants/contact'

type PaginatedBranches = { results?: Branch[] } | Branch[]

function asBranchList(data: unknown): Branch[] {
  if (!data) return []
  if (Array.isArray(data)) return data as Branch[]
  const paginated = data as { results?: Branch[] }
  return Array.isArray(paginated.results) ? paginated.results : []
}

function formatTime(raw?: string | null) {
  if (!raw) return null
  // Backend may send "09:00:00" or "9:00"
  const m = String(raw).match(/^(\d{1,2}):(\d{2})/)
  if (!m) return raw
  return `${m[1].padStart(2, '0')}:${m[2]}`
}

export default function BranchesPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['branches'],
    queryFn: inventoryApi.getBranches,
  })

  const branches = useMemo(() => {
    const list = asBranchList(data as PaginatedBranches)
    return list
      .filter((b) => b.is_active !== false)
      .sort((a, b) => Number(b.is_main_branch) - Number(a.is_main_branch))
  }, [data])

  return (
    <div className="min-h-screen bg-[#F9F9FA]">
      <section className="relative overflow-hidden border-b border-black/5 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/40 via-white to-white" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_100%_0%,rgba(133,227,7,0.1),transparent_55%)]" />
        </div>

        <div className="relative page-shell py-12 sm:py-16">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
            {t('branchesPage.kicker')}
          </p>
          <h1 className="store-display-title max-w-3xl text-[#0B0F19]">
            {t('branchesPage.title')}
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#64748B]">
            {t('branchesPage.subtitle')}
          </p>

          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#64748B]">
            <span className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F9F9FA] px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5 text-[#3F6F00]" />
              {isAr ? GS_CONTACT.addressAr : GS_CONTACT.addressEn}
            </span>
            <a
              href={`tel:${GS_CONTACT.phoneTel}`}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#F9F9FA] px-3 py-1.5 font-medium text-[#0B0F19] hover:border-[#85E307]/40"
            >
              <Phone className="h-3.5 w-3.5 text-[#3F6F00]" />
              {GS_CONTACT.phone}
            </a>
          </div>
        </div>
      </section>

      <div className="page-shell py-10 sm:py-14">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-2xl border border-black/5 bg-white"
              />
            ))}
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-900">
            {t('branchesPage.loadError')}
          </div>
        ) : null}

        {!isLoading && !isError && branches.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-14 text-center">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-[#94A3B8]" />
            <p className="text-base font-semibold text-[#0B0F19]">{t('branchesPage.emptyTitle')}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#64748B]">
              {t('branchesPage.emptyBody')}
            </p>
            <Link
              to="/contact"
              className="gold-button mt-6 inline-flex items-center gap-2"
            >
              {t('branchesPage.contactUs')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>
        ) : null}

        {!isLoading && branches.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {branches.map((branch) => {
              const name = isAr && branch.name_ar ? branch.name_ar : branch.name_en
              const open = formatTime(branch.opening_time)
              const close = formatTime(branch.closing_time)
              const friOpen = formatTime(branch.friday_opening_time)
              const friClose = formatTime(branch.friday_closing_time)
              const mapsHref =
                branch.latitude != null && branch.longitude != null
                  ? `https://maps.google.com/?q=${branch.latitude},${branch.longitude}`
                  : `https://maps.google.com/?q=${encodeURIComponent(
                      `${branch.address}, ${branch.city}, Kuwait`,
                    )}`

              return (
                <article
                  key={branch.id}
                  className="flex flex-col rounded-2xl border border-black/10 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6"
                >
                  <div className="mb-5 flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#0B0F19] font-mono text-sm font-bold text-[#85E307]">
                      {branch.code?.slice(0, 3) || 'GS'}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight text-[#0B0F19]">
                          {name}
                        </h2>
                        {branch.is_main_branch ? (
                          <span className="rounded-full bg-[#ECFCCB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3F6F00]">
                            {t('branchesPage.mainBadge')}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-[#94A3B8]">
                        {t(`branchesPage.type.${branch.branch_type}`, {
                          defaultValue: branch.branch_type,
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-[#475569]">
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#3F6F00]" />
                      <span className="leading-relaxed">
                        {branch.address}
                        {branch.city ? `, ${branch.city}` : ''}
                        {branch.governorate ? ` · ${branch.governorate}` : ''}
                      </span>
                    </div>
                    {branch.phone ? (
                      <a
                        href={`tel:${branch.phone.replace(/\s/g, '')}`}
                        className="flex items-center gap-3 font-medium text-[#0B0F19] hover:text-[#3F6F00]"
                      >
                        <Phone className="h-4 w-4 shrink-0 text-[#3F6F00]" />
                        {branch.phone}
                      </a>
                    ) : null}
                    <div className="flex items-start gap-3">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#3F6F00]" />
                      <span className="leading-relaxed">
                        <span className="block">
                          {t('branchesPage.hoursWeekday', { open, close })}
                        </span>
                        {branch.is_open_friday && friOpen && friClose ? (
                          <span className="mt-0.5 block text-[#64748B]">
                            {t('branchesPage.hoursFriday', {
                              open: friOpen,
                              close: friClose,
                            })}
                          </span>
                        ) : (
                          <span className="mt-0.5 block text-[#64748B]">
                            {t('branchesPage.fridayClosed')}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>

                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-[#F9F9FA] px-4 py-2.5 text-sm font-semibold text-[#0B0F19] transition-colors hover:border-[#85E307]/40 hover:bg-[#ECFCCB]/50"
                  >
                    <Navigation className="h-4 w-4 text-[#3F6F00]" />
                    {t('branchesPage.getDirections')}
                  </a>
                </article>
              )
            })}
          </div>
        ) : null}

        <div className="mt-10 rounded-2xl bg-[#0B0F19] px-6 py-8 sm:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-lg">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#85E307]">
                {t('branchesPage.ctaKicker')}
              </p>
              <h2 className="text-xl font-bold text-white sm:text-2xl">
                {t('branchesPage.ctaTitle')}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">
                {t('branchesPage.ctaBody')}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/contact" className="gold-button inline-flex items-center justify-center gap-2">
                {t('branchesPage.contactUs')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" />
              </Link>
              <Link
                to="/products"
                className="inline-flex items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10"
              >
                {t('branchesPage.shopOnline')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
