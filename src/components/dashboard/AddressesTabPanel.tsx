import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { MapPin, Pencil, Plus, Star, Trash2, X } from 'lucide-react'
import { KuwaitLocationFields } from '@/components/checkout/KuwaitLocationFields'
import {
  accountsApi,
  type SavedAddress,
  type SavedAddressWrite,
} from '@/services/api'
import { cn } from '@/lib/utils'
import {
  dashboardFieldClass,
  dashboardLabelClass,
  dashboardPanelClass,
  dashboardPrimaryBtnClass,
} from '@/lib/dashboardStyles'

type FormState = {
  label: string
  address_line1: string
  address_line2: string
  city: string
  governorate: string
  postal_code: string
  country: string
  is_default: boolean
}

const emptyForm = (): FormState => ({
  label: '',
  address_line1: '',
  address_line2: '',
  city: '',
  governorate: '',
  postal_code: '',
  country: 'Kuwait',
  is_default: false,
})

function fromAddress(a: SavedAddress): FormState {
  return {
    label: a.label || '',
    address_line1: a.address_line1 || '',
    address_line2: a.address_line2 || '',
    city: a.city || '',
    governorate: a.governorate || '',
    postal_code: a.postal_code || '',
    country: a.country || 'Kuwait',
    is_default: Boolean(a.is_default),
  }
}

function formatLines(a: SavedAddress): string[] {
  const lines = [
    a.address_line1,
    a.address_line2,
    [a.city, a.governorate].filter(Boolean).join(', '),
    [a.postal_code, a.country].filter(Boolean).join(' · '),
  ]
  return lines.map((l) => (l || '').trim()).filter(Boolean)
}

export default function AddressesTabPanel() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['savedAddresses'],
    queryFn: () => accountsApi.listSavedAddresses(),
  })

  const [editorOpen, setEditorOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)

  const nextDefaultLabel = useMemo(() => {
    const n = addresses.length + 1
    return t('userDashboard.addresses.defaultLabel', { n })
  }, [addresses.length, t])

  const openCreate = () => {
    setEditingId(null)
    setForm({ ...emptyForm(), label: nextDefaultLabel, is_default: addresses.length === 0 })
    setEditorOpen(true)
  }

  const openEdit = (a: SavedAddress) => {
    setEditingId(a.id)
    setForm(fromAddress(a))
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    setEditingId(null)
    setForm(emptyForm())
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: SavedAddressWrite = {
        label: form.label.trim() || nextDefaultLabel,
        address_line1: form.address_line1.trim(),
        address_line2: form.address_line2.trim() || '',
        city: form.city.trim() || '',
        governorate: form.governorate.trim() || '',
        postal_code: form.postal_code.trim() || '',
        country: form.country.trim() || 'Kuwait',
        is_default: form.is_default,
      }
      if (editingId) {
        return accountsApi.updateSavedAddress(editingId, payload)
      }
      return accountsApi.createSavedAddress(payload)
    },
    onSuccess: () => {
      toast.success(t('userDashboard.addresses.saved'))
      void queryClient.invalidateQueries({ queryKey: ['savedAddresses'] })
      void queryClient.invalidateQueries({ queryKey: ['myCustomerProfile'] })
      closeEditor()
    },
    onError: () => {
      toast.error(t('userDashboard.addresses.saveFailed'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => accountsApi.deleteSavedAddress(id),
    onSuccess: () => {
      toast.success(t('userDashboard.addresses.deleted'))
      void queryClient.invalidateQueries({ queryKey: ['savedAddresses'] })
      void queryClient.invalidateQueries({ queryKey: ['myCustomerProfile'] })
    },
    onError: () => toast.error(t('userDashboard.addresses.deleteFailed')),
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => accountsApi.updateSavedAddress(id, { is_default: true } as Partial<SavedAddressWrite>),
    onSuccess: () => {
      toast.success(t('userDashboard.addresses.defaultSet'))
      void queryClient.invalidateQueries({ queryKey: ['savedAddresses'] })
      void queryClient.invalidateQueries({ queryKey: ['myCustomerProfile'] })
    },
    onError: () => toast.error(t('userDashboard.addresses.saveFailed')),
  })

  useEffect(() => {
    if (!editorOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEditor()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editorOpen])

  if (isLoading) {
    return (
      <div className={dashboardPanelClass}>
        <p className="py-10 text-center text-sm text-[#64748B]">
          {t('userDashboard.addresses.loading')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className={dashboardPanelClass}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="dashboard-panel__title">{t('userDashboard.addresses.title')}</h2>
            <p className="dashboard-panel__subtitle">{t('userDashboard.addresses.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className={cn(dashboardPrimaryBtnClass, 'inline-flex items-center gap-2')}
          >
            <Plus className="h-4 w-4" aria-hidden />
            {t('userDashboard.addresses.addNew')}
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-black/10 bg-[#F8FAFC] px-5 py-10 text-center">
            <MapPin className="mx-auto h-8 w-8 text-[#94A3B8]" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-[#0B0F19]">
              {t('userDashboard.addresses.emptyTitle')}
            </p>
            <p className="mt-1 text-sm text-[#64748B]">{t('userDashboard.addresses.emptyHint')}</p>
            <button
              type="button"
              onClick={openCreate}
              className={cn(dashboardPrimaryBtnClass, 'mt-5 inline-flex items-center gap-2')}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('userDashboard.addresses.addNew')}
            </button>
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {addresses.map((a) => (
              <li
                key={a.id}
                className={cn(
                  'flex flex-col rounded-2xl border bg-white p-4 shadow-sm',
                  a.is_default ? 'border-[#85E307]/50 ring-1 ring-[#85E307]/25' : 'border-black/[0.07]',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-base font-bold text-[#0B0F19]">{a.label}</h3>
                      {a.is_default ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-[#ECFCCB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#3F6F00]">
                          <Star className="h-3 w-3" aria-hidden />
                          {t('userDashboard.addresses.defaultBadge')}
                        </span>
                      ) : null}
                    </div>
                    <ul className="mt-2 space-y-0.5 text-sm leading-relaxed text-[#475569]">
                      {formatLines(a).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  </div>
                  <MapPin className="h-5 w-5 shrink-0 text-[#3F6F00]" aria-hidden />
                </div>
                <div className="mt-4 flex flex-wrap gap-2 border-t border-black/[0.05] pt-3">
                  <button
                    type="button"
                    onClick={() => openEdit(a)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#0B0F19] hover:bg-[#F4F5F1]"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    {t('userDashboard.addresses.edit')}
                  </button>
                  {!a.is_default ? (
                    <button
                      type="button"
                      onClick={() => setDefaultMutation.mutate(a.id)}
                      disabled={setDefaultMutation.isPending}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-semibold text-[#3F6F00] hover:bg-[#F4FBEF]"
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden />
                      {t('userDashboard.addresses.setDefault')}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('userDashboard.addresses.deleteConfirm'))) {
                        deleteMutation.mutate(a.id)
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                    {t('userDashboard.addresses.delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-4 text-xs text-[#64748B]">{t('userDashboard.addresses.checkoutHint')}</p>
      </div>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#0B0F19]/45 p-0 sm:items-center sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="address-editor-title"
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto overflow-x-visible rounded-t-2xl border border-black/5 bg-white shadow-xl sm:rounded-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-white px-5 py-4">
              <h3 id="address-editor-title" className="text-base font-bold text-[#0B0F19]">
                {editingId
                  ? t('userDashboard.addresses.editTitle')
                  : t('userDashboard.addresses.addTitle')}
              </h3>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-full p-2 text-[#64748B] hover:bg-black/[0.04]"
                aria-label={t('userDashboard.addresses.cancel')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="space-y-4 px-5 py-5"
              onSubmit={(e) => {
                e.preventDefault()
                if (form.address_line1.trim().length < 2) {
                  toast.error(t('userDashboard.addresses.line1Required'))
                  return
                }
                if (!form.label.trim()) {
                  toast.error(t('userDashboard.addresses.labelRequired'))
                  return
                }
                saveMutation.mutate()
              }}
            >
              <div>
                <label className={dashboardLabelClass}>
                  {t('userDashboard.addresses.cardName')}
                </label>
                <input
                  type="text"
                  className={dashboardFieldClass}
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  maxLength={80}
                  placeholder={t('userDashboard.addresses.cardNamePh')}
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>{t('userDashboard.addresses.line1')}</label>
                <input
                  type="text"
                  className={dashboardFieldClass}
                  value={form.address_line1}
                  onChange={(e) => setForm((f) => ({ ...f, address_line1: e.target.value }))}
                  autoComplete="street-address"
                  required
                />
              </div>
              <div>
                <label className={dashboardLabelClass}>{t('userDashboard.addresses.line2')}</label>
                <input
                  type="text"
                  className={dashboardFieldClass}
                  value={form.address_line2}
                  onChange={(e) => setForm((f) => ({ ...f, address_line2: e.target.value }))}
                  autoComplete="address-line2"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <KuwaitLocationFields
                  governorate={form.governorate}
                  city={form.city}
                  onGovernorateChange={(v) => setForm((f) => ({ ...f, governorate: v }))}
                  onCityChange={(v) => setForm((f) => ({ ...f, city: v }))}
                  variant="light"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={dashboardLabelClass}>
                    {t('userDashboard.addresses.postalCode')}
                  </label>
                  <input
                    type="text"
                    className={dashboardFieldClass}
                    value={form.postal_code}
                    onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
                    autoComplete="postal-code"
                  />
                </div>
                <div>
                  <label className={dashboardLabelClass}>{t('userDashboard.addresses.country')}</label>
                  <input
                    type="text"
                    className={dashboardFieldClass}
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    autoComplete="country-name"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-[#334155]">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(e) => setForm((f) => ({ ...f, is_default: e.target.checked }))}
                  className="h-4 w-4 rounded border-black/20 text-[#3F6F00] focus:ring-[#85E307]"
                />
                {t('userDashboard.addresses.makeDefault')}
              </label>

              <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-xl border border-black/10 px-4 py-2.5 text-sm font-semibold text-[#0B0F19]"
                >
                  {t('userDashboard.addresses.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className={cn(dashboardPrimaryBtnClass, 'disabled:opacity-50')}
                >
                  {saveMutation.isPending
                    ? t('userDashboard.profile.saving')
                    : t('userDashboard.addresses.save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  )
}
