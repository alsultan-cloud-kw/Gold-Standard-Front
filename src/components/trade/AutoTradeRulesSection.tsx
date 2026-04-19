import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  adminApi,
  goldAutoTradeRulesApi,
  type DaralsabaekPublicCarat,
  type DaralsabaekPublicRatesResponse,
  type GoldAutoTradeRule,
  type GoldAutoTradeRuleWrite,
  productsApi,
} from '../../services/api'

type CaratRow = { id: string; carat_value: number; display_name_en?: string; is_active?: boolean }

function numFromApi(v: string | number | null | undefined): string {
  if (v == null || v === '') return ''
  const n = typeof v === 'string' ? parseFloat(v) : v
  return Number.isFinite(n) ? String(n) : ''
}

function parseApiError(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: unknown } }
  const d = e?.response?.data
  if (typeof d === 'string') return d
  if (d && typeof d === 'object' && 'detail' in d) {
    const det = (d as { detail: unknown }).detail
    if (typeof det === 'string') return det
    if (Array.isArray(det)) return det.map(String).join(' ')
  }
  if (d && typeof d === 'object') {
    const parts: string[] = []
    for (const [k, v] of Object.entries(d as Record<string, unknown>)) {
      if (Array.isArray(v)) parts.push(...v.map((x) => `${k}: ${String(x)}`))
      else parts.push(`${k}: ${String(v)}`)
    }
    if (parts.length) return parts.join(' · ')
  }
  return fallback
}

const emptyForm = () => ({
  caratId: '',
  /** Manual reference buy (KWD/g) when Prices page has no buy rate for this carat. */
  buyRef: '',
  /** Additional amount on buy (± KWD/g); with Prices page rate, empty means “not using buy threshold”. */
  buyAdj: '',
  sellRef: '',
  sellAdj: '',
  autoBuyGrams: '1',
  sellAll: true,
  autoSellGrams: '',
  cooldown: '300',
  enabled: true,
})

function matchPublicCaratRow(
  carats: DaralsabaekPublicCarat[] | undefined,
  caratValue: number | undefined,
): DaralsabaekPublicCarat | null {
  if (caratValue == null || !carats?.length) return null
  return (
    carats.find((c) => {
      const m = String(c.key || '').match(/(\d{1,2})\s*K/i)
      return m ? parseInt(m[1], 10) === caratValue : false
    }) ?? null
  )
}

function computeMinBuyThreshold(form: { buyRef: string; buyAdj: string }, pricePageBuy: number | null): number | null {
  const liveBuy = pricePageBuy != null && Number.isFinite(pricePageBuy) ? pricePageBuy : null
  if (liveBuy != null) {
    if (form.buyAdj.trim() === '') return null
    const adj = parseFloat(form.buyAdj)
    if (!Number.isFinite(adj)) return null
    return liveBuy + adj
  }
  const baseRaw = form.buyRef.trim()
  if (baseRaw === '') return null
  const base = parseFloat(baseRaw)
  if (!Number.isFinite(base)) return null
  const adj = form.buyAdj.trim() === '' ? 0 : parseFloat(form.buyAdj)
  if (!Number.isFinite(adj)) return null
  return base + adj
}

function computeMaxSellThreshold(
  form: { sellRef: string; sellAdj: string },
  pricePageSell: number | null,
): number | null {
  const liveSell = pricePageSell != null && Number.isFinite(pricePageSell) ? pricePageSell : null
  if (liveSell != null) {
    if (form.sellAdj.trim() === '') return null
    const adj = parseFloat(form.sellAdj)
    if (!Number.isFinite(adj)) return null
    return liveSell + adj
  }
  const baseRaw = form.sellRef.trim()
  if (baseRaw === '') return null
  const base = parseFloat(baseRaw)
  if (!Number.isFinite(base)) return null
  const adj = form.sellAdj.trim() === '' ? 0 : parseFloat(form.sellAdj)
  if (!Number.isFinite(adj)) return null
  return base + adj
}

export default function AutoTradeRulesSection() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const dateLocale = i18n.language?.startsWith('ar') ? 'ar-KW' : undefined
  const isRtl = i18n.dir() === 'rtl'

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: caratsRaw } = useQuery({
    queryKey: ['carats', 'auto-trade'],
    queryFn: () => productsApi.getCarats(),
  })

  const carats = useMemo(() => {
    const raw = caratsRaw as { results?: CaratRow[] } | CaratRow[] | undefined
    const list = Array.isArray(raw) ? raw : raw?.results ?? []
    return list
      .filter((c) => c.is_active !== false)
      .slice()
      .sort((a, b) => a.carat_value - b.carat_value)
  }, [caratsRaw])

  const { data: rules = [], isLoading: rulesLoading } = useQuery({
    queryKey: ['goldAutoTradeRules'],
    queryFn: () => goldAutoTradeRulesApi.list(),
  })

  const usedCaratIds = useMemo(() => new Set(rules.map((r) => r.carat)), [rules])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['goldAutoTradeRules'] })
  }

  const createMut = useMutation({
    mutationFn: (body: GoldAutoTradeRuleWrite) => goldAutoTradeRulesApi.create(body),
    onSuccess: () => {
      toast.success(t('tradeGold.auto.saved'))
      setForm(emptyForm())
      setEditingId(null)
      invalidate()
    },
    onError: (err: unknown) => toast.error(parseApiError(err, t('tradeGold.auto.saveFailed'))),
  })

  const patchMut = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<GoldAutoTradeRuleWrite> }) =>
      goldAutoTradeRulesApi.update(id, body),
    onSuccess: () => {
      toast.success(t('tradeGold.auto.updated'))
      setForm(emptyForm())
      setEditingId(null)
      invalidate()
    },
    onError: (err: unknown) => toast.error(parseApiError(err, t('tradeGold.auto.saveFailed'))),
  })

  const toggleMut = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      goldAutoTradeRulesApi.update(id, { is_enabled: enabled }),
    onSuccess: () => invalidate(),
    onError: (err: unknown) => toast.error(parseApiError(err, t('tradeGold.auto.saveFailed'))),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => goldAutoTradeRulesApi.delete(id),
    onSuccess: () => {
      toast.success(t('tradeGold.auto.deleted'))
      if (editingId) setEditingId(null)
      setForm(emptyForm())
      invalidate()
    },
    onError: (err: unknown) => toast.error(parseApiError(err, t('tradeGold.auto.deleteFailed'))),
  })

  const formCaratValue = useMemo(() => {
    const c = carats.find((x) => x.id === form.caratId)
    return c?.carat_value
  }, [carats, form.caratId])

  const { data: publicRatesRaw, isLoading: publicRatesLoading } = useQuery({
    queryKey: ['daralsabaekPublicRates'],
    queryFn: adminApi.getDaralsabaekPublicRates,
    refetchInterval: 20_000,
    retry: 1,
  })
  const publicRes = publicRatesRaw as DaralsabaekPublicRatesResponse | undefined
  const publicCaratRow = useMemo(
    () => (publicRes?.succeeded ? matchPublicCaratRow(publicRes.carats, formCaratValue) : null),
    [publicRes?.succeeded, publicRes?.carats, formCaratValue],
  )
  const pricePageBuy =
    publicCaratRow?.buyTotal != null && Number.isFinite(publicCaratRow.buyTotal) ? publicCaratRow.buyTotal : null
  const pricePageSell =
    publicCaratRow?.sellTotal != null && Number.isFinite(publicCaratRow.sellTotal)
      ? publicCaratRow.sellTotal
      : null

  const minBuyTotal = useMemo(
    () => computeMinBuyThreshold(form, pricePageBuy),
    [form.buyRef, form.buyAdj, pricePageBuy],
  )
  const maxSellTotal = useMemo(
    () => computeMaxSellThreshold(form, pricePageSell),
    [form.sellRef, form.sellAdj, pricePageSell],
  )

  const buildBody = (includeCarat: boolean): GoldAutoTradeRuleWrite | Partial<GoldAutoTradeRuleWrite> => {
    const minBuy = computeMinBuyThreshold(form, pricePageBuy)
    const maxSell = computeMaxSellThreshold(form, pricePageSell)
    const autoBuy = parseFloat(form.autoBuyGrams)
    const cooldown = parseInt(form.cooldown, 10)
    const autoSell =
      !form.sellAll && form.autoSellGrams.trim() !== '' ? parseFloat(form.autoSellGrams) : null

    const body: GoldAutoTradeRuleWrite | Partial<GoldAutoTradeRuleWrite> = {
      is_enabled: form.enabled,
      min_buy_rate_kwd_per_gram:
        minBuy != null && Number.isFinite(minBuy) ? Number(minBuy.toFixed(3)) : null,
      max_sell_rate_kwd_per_gram:
        maxSell != null && Number.isFinite(maxSell) ? Number(maxSell.toFixed(3)) : null,
      auto_buy_grams: Number.isFinite(autoBuy) && autoBuy > 0 ? Number(autoBuy.toFixed(3)) : '0',
      sell_all_on_trigger: form.sellAll,
      auto_sell_grams:
        !form.sellAll && autoSell != null && Number.isFinite(autoSell) && autoSell > 0
          ? Number(autoSell.toFixed(3))
          : null,
      cooldown_seconds: Number.isFinite(cooldown) && cooldown > 0 ? cooldown : 300,
    }
    if (includeCarat && form.caratId) {
      ;(body as GoldAutoTradeRuleWrite).carat = form.caratId
    }
    return body
  }

  const submitCreate = () => {
    if (!form.caratId) {
      toast.error(t('tradeGold.auto.pickCarat'))
      return
    }
    if (form.enabled && minBuyTotal == null && maxSellTotal == null) {
      toast.error(t('tradeGold.auto.needThreshold'))
      return
    }
    if (form.enabled && minBuyTotal != null && (!parseFloat(form.autoBuyGrams) || parseFloat(form.autoBuyGrams) <= 0)) {
      toast.error(t('tradeGold.auto.needAutoBuyGrams'))
      return
    }
    if (form.enabled && maxSellTotal != null && !form.sellAll) {
      const g = parseFloat(form.autoSellGrams)
      if (!Number.isFinite(g) || g <= 0) {
        toast.error(t('tradeGold.auto.needAutoSellGrams'))
        return
      }
    }
    createMut.mutate(buildBody(true) as GoldAutoTradeRuleWrite)
  }

  const submitEdit = () => {
    if (!editingId) return
    patchMut.mutate({ id: editingId, body: buildBody(false) })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(emptyForm())
  }

  const toggleEnabled = (r: GoldAutoTradeRule) => {
    toggleMut.mutate({ id: r.id, enabled: !r.is_enabled })
  }

  return (
    <div className="gold-card p-6 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      <div>
        <h2 className="text-xl font-bold text-black">{t('tradeGold.auto.title')}</h2>
        <p className="text-sm text-stone-700 font-medium mt-1">{t('tradeGold.auto.intro')}</p>
        <ul className="mt-2 text-xs text-stone-600 list-disc ps-5 space-y-1">
          <li>{t('tradeGold.auto.hintBuy')}</li>
          <li>{t('tradeGold.auto.hintSell')}</li>
          <li>{t('tradeGold.auto.hintRates')}</li>
        </ul>
      </div>

      <div className="rounded-xl border-2 border-black/10 bg-lime-50/90 p-4 space-y-4">
        <h3 className="text-sm font-bold text-black">
          {editingId ? t('tradeGold.auto.editRule') : t('tradeGold.auto.newRule')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-black block mb-1">{t('tradeGold.carat')}</label>
            <select
              value={form.caratId}
              disabled={!!editingId}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  caratId: e.target.value,
                  buyRef: '',
                  buyAdj: '',
                  sellRef: '',
                  sellAdj: '',
                }))
              }
              className="w-full px-3 py-2 rounded-lg border-2 border-black/15 bg-white text-black disabled:opacity-60"
            >
              <option value="">{t('tradeGold.auto.pickCarat')}</option>
              {carats.map((c) => {
                const taken = !editingId && usedCaratIds.has(c.id)
                return (
                  <option key={c.id} value={c.id} disabled={taken}>
                    {c.carat_value}K
                    {taken ? ` (${t('tradeGold.auto.alreadyHasRule')})` : ''}
                  </option>
                )
              })}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-sm text-black font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                className="rounded border-black/30"
              />
              {t('tradeGold.auto.enabled')}
            </label>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-semibold text-black block mb-1.5">{t('tradeGold.auto.minBuyLabel')}</label>
            <div
              dir="ltr"
              className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border-2 border-black/10 bg-white px-3 py-2.5"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 shrink-0">
                {t('tradeGold.auto.pricesPageRate')}
              </span>
              {publicRatesLoading && form.caratId ? (
                <span className="text-sm text-stone-500 tabular-nums">…</span>
              ) : pricePageBuy != null ? (
                <span className="text-base font-bold text-black tabular-nums shrink-0">{pricePageBuy.toFixed(3)}</span>
              ) : form.caratId ? (
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.buyRef}
                  onChange={(e) => setForm((f) => ({ ...f, buyRef: e.target.value }))}
                  placeholder={t('tradeGold.auto.refRatePlaceholder')}
                  className="w-[6.75rem] shrink-0 px-2 py-1.5 rounded-lg border-2 border-black/15 bg-lime-50/50 text-sm font-semibold text-black tabular-nums"
                />
              ) : (
                <span className="text-sm text-stone-400 tabular-nums">—</span>
              )}
              <span className="text-xs text-stone-500 shrink-0">KWD/g</span>
              <span className="text-lg font-bold text-black shrink-0 px-0.5" aria-hidden>
                +
              </span>
              <input
                type="number"
                step="0.001"
                value={form.buyAdj}
                onChange={(e) => setForm((f) => ({ ...f, buyAdj: e.target.value }))}
                placeholder="0"
                disabled={!form.caratId}
                className="w-[6.75rem] shrink-0 px-2 py-1.5 rounded-lg border-2 border-black/15 bg-white text-sm font-semibold text-black tabular-nums disabled:opacity-50"
              />
              <span className="text-lg font-bold text-black/35 shrink-0 px-0.5" aria-hidden>
                =
              </span>
              <span className="text-base font-bold text-lime-950 tabular-nums min-w-[4.5rem] shrink-0">
                {minBuyTotal != null ? minBuyTotal.toFixed(3) : '—'}
              </span>
              <span className="text-xs text-stone-500 shrink-0">KWD/g</span>
            </div>
            <p className="text-[11px] text-stone-600 mt-1">{t('tradeGold.auto.rateRowFootnote')}</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-black block mb-1.5">{t('tradeGold.auto.maxSellLabel')}</label>
            <div
              dir="ltr"
              className="flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border-2 border-black/10 bg-white px-3 py-2.5"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-stone-500 shrink-0">
                {t('tradeGold.auto.pricesPageRate')}
              </span>
              {publicRatesLoading && form.caratId ? (
                <span className="text-sm text-stone-500 tabular-nums">…</span>
              ) : pricePageSell != null ? (
                <span className="text-base font-bold text-black tabular-nums shrink-0">{pricePageSell.toFixed(3)}</span>
              ) : form.caratId ? (
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.sellRef}
                  onChange={(e) => setForm((f) => ({ ...f, sellRef: e.target.value }))}
                  placeholder={t('tradeGold.auto.refRatePlaceholder')}
                  className="w-[6.75rem] shrink-0 px-2 py-1.5 rounded-lg border-2 border-black/15 bg-lime-50/50 text-sm font-semibold text-black tabular-nums"
                />
              ) : (
                <span className="text-sm text-stone-400 tabular-nums">—</span>
              )}
              <span className="text-xs text-stone-500 shrink-0">KWD/g</span>
              <span className="text-lg font-bold text-black shrink-0 px-0.5" aria-hidden>
                +
              </span>
              <input
                type="number"
                step="0.001"
                value={form.sellAdj}
                onChange={(e) => setForm((f) => ({ ...f, sellAdj: e.target.value }))}
                placeholder="0"
                disabled={!form.caratId}
                className="w-[6.75rem] shrink-0 px-2 py-1.5 rounded-lg border-2 border-black/15 bg-white text-sm font-semibold text-black tabular-nums disabled:opacity-50"
              />
              <span className="text-lg font-bold text-black/35 shrink-0 px-0.5" aria-hidden>
                =
              </span>
              <span className="text-base font-bold text-lime-950 tabular-nums min-w-[4.5rem] shrink-0">
                {maxSellTotal != null ? maxSellTotal.toFixed(3) : '—'}
              </span>
              <span className="text-xs text-stone-500 shrink-0">KWD/g</span>
            </div>
            <p className="text-[11px] text-stone-600 mt-1">{t('tradeGold.auto.rateRowFootnote')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-black block mb-1">{t('tradeGold.auto.autoBuyGrams')}</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={form.autoBuyGrams}
              onChange={(e) => setForm((f) => ({ ...f, autoBuyGrams: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border-2 border-black/15 bg-white text-black"
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm text-black font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={form.sellAll}
                onChange={(e) => setForm((f) => ({ ...f, sellAll: e.target.checked }))}
                className="rounded border-black/30"
              />
              {t('tradeGold.auto.sellAll')}
            </label>
            {!form.sellAll && (
              <div>
                <label className="text-xs font-semibold text-black block mb-1">{t('tradeGold.auto.autoSellGrams')}</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.autoSellGrams}
                  onChange={(e) => setForm((f) => ({ ...f, autoSellGrams: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border-2 border-black/15 bg-white text-black"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-black block mb-1">{t('tradeGold.auto.cooldown')}</label>
          <input
            type="number"
            min="30"
            step="1"
            value={form.cooldown}
            onChange={(e) => setForm((f) => ({ ...f, cooldown: e.target.value }))}
            className="w-full max-w-xs px-3 py-2 rounded-lg border-2 border-black/15 bg-white text-black"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {editingId ? (
            <>
              <button
                type="button"
                onClick={submitEdit}
                disabled={patchMut.isPending}
                className="gold-button px-4 py-2 rounded-lg font-semibold border-2 border-black/10 disabled:opacity-50"
              >
                {patchMut.isPending ? t('tradeGold.processing') : t('tradeGold.auto.saveChanges')}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={patchMut.isPending}
                className="px-4 py-2 rounded-lg border-2 border-black/20 text-black font-semibold hover:bg-lime-100"
              >
                {t('tradeGold.cancel')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={submitCreate}
              disabled={createMut.isPending}
              className="gold-button px-4 py-2 rounded-lg font-semibold border-2 border-black/10 disabled:opacity-50"
            >
              {createMut.isPending ? t('tradeGold.processing') : t('tradeGold.auto.createRule')}
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-black mb-3">{t('tradeGold.auto.yourRules')}</h3>
        {rulesLoading ? (
          <p className="text-sm text-stone-600 font-medium">{t('tradeGold.auto.loadingRules')}</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-stone-600 font-medium">{t('tradeGold.auto.noRules')}</p>
        ) : (
          <div className="space-y-3">
            {rules.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border-2 border-black/10 bg-white p-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1 text-black">
                  <div className="font-bold text-black">
                    {r.carat_value}K — {r.is_enabled ? t('tradeGold.auto.on') : t('tradeGold.auto.off')}
                  </div>
                  <div className="text-xs text-black/75 font-medium">
                    {r.min_buy_rate_kwd_per_gram != null && (
                      <span className="me-3">
                        {t('tradeGold.auto.minBuyShort')}: {numFromApi(r.min_buy_rate_kwd_per_gram) || '—'} KWD/g
                      </span>
                    )}
                    {r.max_sell_rate_kwd_per_gram != null && (
                      <span>
                        {t('tradeGold.auto.maxSellShort')}: {numFromApi(r.max_sell_rate_kwd_per_gram) || '—'} KWD/g
                      </span>
                    )}
                  </div>
                  {r.last_executed_at && (
                    <div className="text-xs text-stone-600">
                      {t('tradeGold.auto.lastRun')}: {new Date(r.last_executed_at).toLocaleString(dateLocale)}
                      {r.last_action ? ` · ${r.last_action}` : ''}
                      {r.last_error ? ` · ${r.last_error}` : ''}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => toggleEnabled(r)}
                    disabled={toggleMut.isPending}
                    className="px-3 py-1.5 rounded-lg border-2 border-black/20 text-black text-xs font-semibold hover:bg-lime-100"
                  >
                    {r.is_enabled ? t('tradeGold.auto.disable') : t('tradeGold.auto.enable')}
                  </button>
                  {/* <button
                    type="button"
                    onClick={() => startEdit(r)}
                    className="px-3 py-1.5 rounded-lg border border-gold-500/40 text-gold-100 text-xs hover:bg-gold-500/10"
                  >
                    {t('tradeGold.auto.edit')}
                  </button> */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(t('tradeGold.auto.confirmDelete'))) deleteMut.mutate(r.id)
                    }}
                    disabled={deleteMut.isPending}
                    className="px-3 py-1.5 rounded-lg border-2 border-red-600/40 text-red-700 text-xs font-semibold hover:bg-red-50"
                  >
                    {t('tradeGold.auto.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
