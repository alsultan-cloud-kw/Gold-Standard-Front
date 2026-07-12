import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { MapPin, Phone, ArrowRight, Building2 } from 'lucide-react'
import { inventoryApi } from '../services/api'
import type { Branch } from '../types'
import { GS_CONTACT } from '@/constants/contact'
import { AppLoadingScreen } from '@/components/ui/AppLoadingScreen'
import { BranchesMap } from '@/components/branches/BranchesMap'
import { BranchLocationCard } from '@/components/branches/BranchLocationCard'
import { branchMapCoords } from '@/utils/branchMap'
import { GoogleReviewsBadge } from '@/components/branches/GoogleReviewsBadge'
import { formatBranchTime12h } from '@/utils/formatBranchHours'

type PaginatedBranches = { results?: Branch[] } | Branch[]

function asBranchList(data: unknown): Branch[] {
  if (!data) return []
  if (Array.isArray(data)) return data as Branch[]
  const paginated = data as { results?: Branch[] }
  return Array.isArray(paginated.results) ? paginated.results : []
}

export default function BranchesPage() {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const formatTime = useCallback(
    (raw?: string | null) => formatBranchTime12h(raw, isAr),
    [isAr],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

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

  const mappableCount = useMemo(
    () => branches.filter((b) => branchMapCoords(b) != null).length,
    [branches],
  )

  useEffect(() => {
    if (selectedId || branches.length === 0) return
    const main = branches.find((b) => b.is_main_branch) ?? branches[0]
    setSelectedId(main.id)
  }, [branches, selectedId])

  const handleSelect = (id: string) => {
    setSelectedId(id)
  }

  const selectedBranch = useMemo(
    () => branches.find((b) => b.id === selectedId) ?? branches[0] ?? null,
    [branches, selectedId],
  )

  return (
    <div className="storefront-static-page min-h-screen">
      <section className="relative overflow-hidden border-b border-black/5 bg-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#ECFCCB]/40 via-white to-white" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_45%_at_100%_0%,rgba(133,227,7,0.1),transparent_55%)]" />
        </div>

        <div className="relative page-shell page-section--roomy">
          <p className="page-kicker">{t('branchesPage.kicker')}</p>
          <h1 className="type-page-title max-w-3xl text-[#0B0F19]">{t('branchesPage.title')}</h1>
          <p className="type-lead mt-4 max-w-xl text-[#64748B]">{t('branchesPage.subtitle')}</p>

          <div className="branches-hero-chips mt-6 text-sm text-[#64748B]">
            <span className="branches-hero-chip inline-flex items-center gap-2 rounded-full border border-black/10 bg-[var(--site-bg-muted)] px-3 py-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[#3F6F00]" aria-hidden />
              {isAr ? GS_CONTACT.addressAr : GS_CONTACT.addressEn}
            </span>
            <a
              href={`tel:${GS_CONTACT.phoneTel}`}
              className="branches-hero-chip inline-flex items-center gap-2 rounded-full border border-black/10 bg-[var(--site-bg-muted)] px-3 py-1.5 font-medium text-[#0B0F19] transition-colors hover:border-[#85E307]/40"
            >
              <Phone className="h-3.5 w-3.5 shrink-0 text-[#3F6F00]" aria-hidden />
              <span dir="ltr">{GS_CONTACT.phone}</span>
            </a>
            <GoogleReviewsBadge />
            {!isLoading && branches.length > 0 ? (
              <span className="branches-hero-chip inline-flex items-center rounded-full border border-[#85E307]/25 bg-[#ECFCCB]/50 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[#3F6F00]">
                {t('branchesPage.branchCount', { count: branches.length })}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="page-shell page-section--roomy">
        {isLoading ? (
          <AppLoadingScreen
            message={t('common.loading')}
            className="min-h-[50vh] rounded-2xl border border-black/5"
          />
        ) : null}

        {isError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center text-sm text-red-900">
            {t('branchesPage.loadError')}
          </div>
        ) : null}

        {!isLoading && !isError && branches.length === 0 ? (
          <div className="rounded-2xl border border-black/10 bg-white px-6 py-14 text-center">
            <Building2 className="mx-auto mb-4 h-10 w-10 text-[#94A3B8]" aria-hidden />
            <p className="text-base font-semibold text-[#0B0F19]">{t('branchesPage.emptyTitle')}</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#64748B]">{t('branchesPage.emptyBody')}</p>
            <Link to="/contact" className="gold-button mt-6 inline-flex items-center gap-2">
              {t('branchesPage.contactUs')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </Link>
          </div>
        ) : null}

        {!isLoading && branches.length > 0 ? (
          <section aria-label={t('branchesPage.mapSectionTitle')}>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="page-kicker">{t('branchesPage.mapKicker')}</p>
                <h2 className="type-section-title text-[#0B0F19]">{t('branchesPage.mapSectionTitle')}</h2>
                <p className="type-lead mt-2 max-w-xl text-[#64748B]">{t('branchesPage.mapSectionSubtitle')}</p>
              </div>
              {mappableCount < branches.length ? (
                <p className="max-w-xs text-xs leading-relaxed text-[#94A3B8]">
                  {t('branchesPage.mapPartialHint')}
                </p>
              ) : null}
            </div>

            <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_50px_-28px_rgba(15,23,42,0.35)]">
              <div className="grid grid-cols-1 lg:grid-cols-12">
                <div className="relative lg:col-span-7 xl:col-span-8">
                  <BranchesMap
                    branches={branches}
                    selectedId={selectedId}
                    onSelect={handleSelect}
                    formatTime={formatTime}
                    className="h-[min(42dvh,300px)] w-full sm:h-[min(48dvh,360px)] lg:h-[min(68vh,560px)]"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/10 to-transparent lg:hidden" />
                </div>

                <div className="border-t border-black/8 lg:hidden">
                  <div className="border-b border-black/6 bg-[var(--site-bg-muted)] px-4 py-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      {t('branchesPage.selectBranch')}
                    </p>
                  </div>
                  <div className="branches-mobile-switcher" role="tablist" aria-label={t('branchesPage.selectBranch')}>
                    {branches.map((branch) => {
                      const label = isAr && branch.name_ar ? branch.name_ar : branch.name_en
                      const active = branch.id === selectedId
                      return (
                        <button
                          key={branch.id}
                          type="button"
                          role="tab"
                          aria-selected={active}
                          onClick={() => handleSelect(branch.id)}
                          className={`branches-mobile-chip ${active ? 'branches-mobile-chip--active' : ''}`}
                        >
                          {label}
                        </button>
                      )
                    })}
                  </div>
                  {selectedBranch ? (
                    <BranchLocationCard
                      branch={selectedBranch}
                      selected
                      onSelect={() => {}}
                      formatTime={formatTime}
                      readOnly
                      compact
                    />
                  ) : null}
                </div>

                <div className="hidden min-h-0 flex-col border-s border-black/8 lg:col-span-5 lg:flex xl:col-span-4">
                  <div className="border-b border-black/6 bg-[var(--site-bg-muted)] px-4 py-3 sm:px-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                      {t('branchesPage.selectBranch')}
                    </p>
                  </div>
                  <div className="flex max-h-[min(68vh,560px)] flex-col overflow-y-auto">
                    {branches.map((branch) => (
                      <BranchLocationCard
                        key={branch.id}
                        branch={branch}
                        selected={branch.id === selectedId}
                        onSelect={() => handleSelect(branch.id)}
                        formatTime={formatTime}
                        solo={branches.length === 1}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div className="storefront-static-page__tail relative mt-10 overflow-hidden rounded-2xl bg-[#0B0F19] px-5 py-7 sm:px-8 sm:py-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_100%_0%,rgba(133,227,7,0.12),transparent_55%)]" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-lg">
              <p className="page-kicker text-[#85E307]">{t('branchesPage.ctaKicker')}</p>
              <h2 className="type-section-title text-white">{t('branchesPage.ctaTitle')}</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{t('branchesPage.ctaBody')}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link to="/contact" className="gold-button inline-flex w-full items-center justify-center gap-2 sm:w-auto">
                {t('branchesPage.contactUs')}
                <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </Link>
              <Link
                to="/products"
                className="inline-flex w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
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
