import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import {
  goldAutoTradeRulesApi,
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

export type QuotePreview = {
  carat_value: number
  /** Adjusted buy KWD/g from quote-buy (matches server auto-buy trigger). */
  buy_rate?: number
  /** Adjusted sell KWD/g from quote-sell (matches server auto-sell trigger). */
  sell_rate?: number
}

type Props = { quotePreview: QuotePreview | null }

const emptyForm = () => ({
  caratId: '',
  minBuy: '',
  maxSell: '',
  autoBuyGrams: '1',
  sellAll: true,
  autoSellGrams: '',
  cooldown: '300',
  enabled: true,
})

export default function AutoTradeRulesSection({ quotePreview }: Props) {
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

  const canApplyBuyQuote =
    quotePreview &&
    formCaratValue != null &&
    quotePreview.carat_value === formCaratValue &&
    quotePreview.buy_rate != null &&
    Number.isFinite(quotePreview.buy_rate)

  const canApplySellQuote =
    quotePreview &&
    formCaratValue != null &&
    quotePreview.carat_value === formCaratValue &&
    quotePreview.sell_rate != null &&
    Number.isFinite(quotePreview.sell_rate)

  const buildBody = (includeCarat: boolean): GoldAutoTradeRuleWrite | Partial<GoldAutoTradeRuleWrite> => {
    const minRaw = form.minBuy.trim()
    const maxRaw = form.maxSell.trim()
    const minBuy = minRaw === '' ? null : parseFloat(minRaw)
    const maxSell = maxRaw === '' ? null : parseFloat(maxRaw)
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
    if (form.enabled && !form.minBuy.trim() && !form.maxSell.trim()) {
      toast.error(t('tradeGold.auto.needThreshold'))
      return
    }
    if (form.enabled && form.minBuy.trim() && (!parseFloat(form.autoBuyGrams) || parseFloat(form.autoBuyGrams) <= 0)) {
      toast.error(t('tradeGold.auto.needAutoBuyGrams'))
      return
    }
    if (form.enabled && form.maxSell.trim() && !form.sellAll) {
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
        <h2 className="text-xl font-semibold text-gold-100">{t('tradeGold.auto.title')}</h2>
        <p className="text-sm text-gold-100/70 mt-1">{t('tradeGold.auto.intro')}</p>
        <ul className="mt-2 text-xs text-gold-100/60 list-disc ps-5 space-y-1">
          <li>{t('tradeGold.auto.hintBuy')}</li>
          <li>{t('tradeGold.auto.hintSell')}</li>
          <li>{t('tradeGold.auto.hintRates')}</li>
        </ul>
      </div>

      <div className="rounded-xl border border-gold-500/25 bg-charcoal-800/50 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gold-200">
          {editingId ? t('tradeGold.auto.editRule') : t('tradeGold.auto.newRule')}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gold-100/70 block mb-1">{t('tradeGold.carat')}</label>
            <select
              value={form.caratId}
              disabled={!!editingId}
              onChange={(e) => setForm((f) => ({ ...f, caratId: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100 disabled:opacity-60"
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
            <label className="flex items-center gap-2 text-sm text-gold-100 cursor-pointer">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => setForm((f) => ({ ...f, enabled: e.target.checked }))}
                className="rounded border-gold-500/50"
              />
              {t('tradeGold.auto.enabled')}
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gold-100/70 block mb-1">{t('tradeGold.auto.minBuyLabel')}</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={form.minBuy}
              onChange={(e) => setForm((f) => ({ ...f, minBuy: e.target.value }))}
              placeholder={t('tradeGold.auto.optional')}
              className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100"
            />
            {canApplyBuyQuote && (
              <button
                type="button"
                className="mt-1 text-xs text-gold-400 hover:text-gold-300 underline"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    minBuy: (quotePreview!.buy_rate as number).toFixed(3),
                  }))
                }
              >
                {t('tradeGold.auto.applyBuyQuote')}
              </button>
            )}
          </div>
          <div>
            <label className="text-xs text-gold-100/70 block mb-1">{t('tradeGold.auto.maxSellLabel')}</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={form.maxSell}
              onChange={(e) => setForm((f) => ({ ...f, maxSell: e.target.value }))}
              placeholder={t('tradeGold.auto.optional')}
              className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100"
            />
            {canApplySellQuote && (
              <button
                type="button"
                className="mt-1 text-xs text-gold-400 hover:text-gold-300 underline"
                onClick={() =>
                  setForm((f) => ({
                    ...f,
                    maxSell: (quotePreview!.sell_rate as number).toFixed(3),
                  }))
                }
              >
                {t('tradeGold.auto.applySellQuote')}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs text-gold-100/70 block mb-1">{t('tradeGold.auto.autoBuyGrams')}</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={form.autoBuyGrams}
              onChange={(e) => setForm((f) => ({ ...f, autoBuyGrams: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100"
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="flex items-center gap-2 text-sm text-gold-100 cursor-pointer">
              <input
                type="checkbox"
                checked={form.sellAll}
                onChange={(e) => setForm((f) => ({ ...f, sellAll: e.target.checked }))}
                className="rounded border-gold-500/50"
              />
              {t('tradeGold.auto.sellAll')}
            </label>
            {!form.sellAll && (
              <div>
                <label className="text-xs text-gold-100/70 block mb-1">{t('tradeGold.auto.autoSellGrams')}</label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={form.autoSellGrams}
                  onChange={(e) => setForm((f) => ({ ...f, autoSellGrams: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100"
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="text-xs text-gold-100/70 block mb-1">{t('tradeGold.auto.cooldown')}</label>
          <input
            type="number"
            min="30"
            step="1"
            value={form.cooldown}
            onChange={(e) => setForm((f) => ({ ...f, cooldown: e.target.value }))}
            className="w-full max-w-xs px-3 py-2 rounded-lg border border-gold-500/30 bg-charcoal-800 text-gold-100"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {editingId ? (
            <>
              <button
                type="button"
                onClick={submitEdit}
                disabled={patchMut.isPending}
                className="px-4 py-2 rounded-lg bg-gold-500 text-black font-semibold hover:bg-gold-400 disabled:opacity-50"
              >
                {patchMut.isPending ? t('tradeGold.processing') : t('tradeGold.auto.saveChanges')}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                disabled={patchMut.isPending}
                className="px-4 py-2 rounded-lg border border-gold-500/40 text-gold-100 hover:bg-gold-500/10"
              >
                {t('tradeGold.cancel')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={submitCreate}
              disabled={createMut.isPending}
              className="px-4 py-2 rounded-lg bg-gold-500 text-black font-semibold hover:bg-gold-400 disabled:opacity-50"
            >
              {createMut.isPending ? t('tradeGold.processing') : t('tradeGold.auto.createRule')}
            </button>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gold-200 mb-3">{t('tradeGold.auto.yourRules')}</h3>
        {rulesLoading ? (
          <p className="text-sm text-gold-100/60">{t('tradeGold.auto.loadingRules')}</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-gold-100/60">{t('tradeGold.auto.noRules')}</p>
        ) : (
          <div className="space-y-3">
            {rules.map((r) => (
              <div
                key={r.id}
                className="rounded-lg border border-gold-500/20 bg-charcoal-800/60 p-4 text-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
              >
                <div className="space-y-1 text-gold-100">
                  <div className="font-semibold text-gold-200">
                    {r.carat_value}K — {r.is_enabled ? t('tradeGold.auto.on') : t('tradeGold.auto.off')}
                  </div>
                  <div className="text-xs text-gold-100/70">
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
                    <div className="text-xs text-gold-100/50">
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
                    className="px-3 py-1.5 rounded-lg border border-gold-500/40 text-gold-100 text-xs hover:bg-gold-500/10"
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
                    className="px-3 py-1.5 rounded-lg border border-red-500/40 text-red-300 text-xs hover:bg-red-500/10"
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
