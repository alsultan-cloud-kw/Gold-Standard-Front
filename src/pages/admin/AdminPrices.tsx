import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { TrendingUp, Save, RefreshCw, BellRing } from 'lucide-react'
import {
  productsApi,
  adminApi,
  priceAlertsApi,
  type DaralsabaekMetalPricesResponse,
} from '../../services/api'
import AdminNav from '../../components/admin/AdminNav'
import { toast } from 'sonner'

const CARAT_KEYS = ['24K', '22K', '21K', '18K'] as const
type CaratKey = (typeof CARAT_KEYS)[number]
const PRECIOUS_METAL_KEYS = ['Silver', 'Platinum'] as const
type PreciousKey = (typeof PRECIOUS_METAL_KEYS)[number]
type MarkupKey = CaratKey | PreciousKey
const ALL_MARKUP_KEYS: MarkupKey[] = [...CARAT_KEYS, ...PRECIOUS_METAL_KEYS]

const MARKUP_STORAGE_KEY = 'adminGoldAdditionalKwdPerGram'

type GoldPriceRow = {
  id: string | null
  carat: {
    id: string
    display_name_en: string
    purity_percentage: number
    carat_value?: number
  }
  buy_price_per_gram: string | number | null
  sell_price_per_gram: string | number | null
  spread?: number | null
}

type AdminPriceAlertRow = {
  id: string
  status?: string
  spot_metal?: string
  gold_carats?: number | string | null
  price_side?: string
  target_price?: string | number | null
  condition?: string
  created_at?: string | null
  triggered_at?: string | null
  user?: { full_name?: string | null; phone_number?: string | null; email?: string | null } | null
}

type MarkupRow = {
  buyAdd: string
  sellAdd: string
  clubBuyAdd: string
  clubSellAdd: string
}

function loadAdditional(): Record<string, MarkupRow> {
  try {
    const raw = localStorage.getItem(MARKUP_STORAGE_KEY)
    if (!raw) return {}
    const p = JSON.parse(raw) as Record<string, Partial<MarkupRow>>
    const out: Record<string, MarkupRow> = {}
    for (const k of ALL_MARKUP_KEYS) {
      const v = p[k]
      out[k] = {
        buyAdd: v?.buyAdd ?? '0',
        sellAdd: v?.sellAdd ?? '0',
        clubBuyAdd: v?.clubBuyAdd ?? '0',
        clubSellAdd: v?.clubSellAdd ?? '0',
      }
    }
    return out
  } catch {
    return {}
  }
}

function saveAdditional(m: Record<string, MarkupRow>) {
  try {
    localStorage.setItem(MARKUP_STORAGE_KEY, JSON.stringify(m))
  } catch {
    /* ignore */
  }
}

function getApiRates(
  r: NonNullable<DaralsabaekMetalPricesResponse['result']>,
  key: CaratKey
): { buy: number; sell: number } {
  switch (key) {
    case '24K':
      return { buy: r.purchaseGoldPrice, sell: r.sellGoldPrice }
    case '22K':
      return { buy: r.purchase22GoldPrice, sell: r.sell22GoldPrice }
    case '21K':
      return { buy: r.purchase21GoldPrice, sell: r.sell21GoldPrice }
    case '18K':
      return { buy: r.purchase18GoldPrice, sell: r.sell18GoldPrice }
  }
}

function getApiRatesForMarkupKey(
  r: NonNullable<DaralsabaekMetalPricesResponse['result']>,
  key: MarkupKey
): { buy: number; sell: number } {
  if (key === 'Silver') return { buy: r.purchaseSilverPrice, sell: r.sellSilverPrice }
  if (key === 'Platinum') return { buy: r.purchasePlatinumPrice, sell: r.sellPlatinumPrice }
  return getApiRates(r, key)
}

function getRatesByCaratValue(
  r: NonNullable<DaralsabaekMetalPricesResponse['result']>,
  caratValue: number
): { buy: number; sell: number } | null {
  const map: Record<number, CaratKey> = { 24: '24K', 22: '22K', 21: '21K', 18: '18K' }
  const key = map[caratValue]
  if (!key) return null
  return getApiRates(r, key)
}

function emptyMarkupRow(): MarkupRow {
  return { buyAdd: '0', sellAdd: '0', clubBuyAdd: '0', clubSellAdd: '0' }
}

function normalizeMarkupRows(partial: Record<string, Partial<MarkupRow>> | undefined) {
  const out: Record<string, MarkupRow> = {}
  for (const k of ALL_MARKUP_KEYS) {
    const v = partial?.[k]
    out[k] = {
      buyAdd: v?.buyAdd ?? '0',
      sellAdd: v?.sellAdd ?? '0',
      clubBuyAdd: v?.clubBuyAdd ?? '0',
      clubSellAdd: v?.clubSellAdd ?? '0',
    }
  }
  return out
}

export default function AdminPrices() {
  const [prices] = useState<Record<string, { buy: string; sell: string }>>({})
  const [additional, setAdditional] = useState<Record<string, MarkupRow>>(() => loadAdditional())
  const [additionalKw2, setAdditionalKw2] = useState<Record<string, MarkupRow>>(() =>
    normalizeMarkupRows(undefined)
  )
  const [additionalKw3, setAdditionalKw3] = useState<Record<string, MarkupRow>>(() =>
    normalizeMarkupRows(undefined)
  )
  const [additionalGs1, setAdditionalGs1] = useState<Record<string, MarkupRow>>(() =>
    normalizeMarkupRows(undefined)
  )
  const [usdToKwdRate, setUsdToKwdRate] = useState<string>('0.307')
  const kw2Hydrated = useRef(false)
  const kw3Hydrated = useRef(false)
  const gs1Hydrated = useRef(false)
  const queryClient = useQueryClient()

  const setAdd = useCallback(
    (key: MarkupKey, field: keyof MarkupRow, value: string) => {
      setAdditional((prev) => {
        const row: MarkupRow = {
          buyAdd: prev[key]?.buyAdd ?? '0',
          sellAdd: prev[key]?.sellAdd ?? '0',
          clubBuyAdd: prev[key]?.clubBuyAdd ?? '0',
          clubSellAdd: prev[key]?.clubSellAdd ?? '0',
          [field]: value,
        }
        const next = { ...prev, [key]: row }
        saveAdditional(next)
        return next
      })
    },
    []
  )
  const setAddKw2 = useCallback((key: MarkupKey, field: keyof MarkupRow, value: string) => {
    setAdditionalKw2((prev) => ({
      ...prev,
      [key]: {
        buyAdd: prev[key]?.buyAdd ?? '0',
        sellAdd: prev[key]?.sellAdd ?? '0',
        clubBuyAdd: prev[key]?.clubBuyAdd ?? '0',
        clubSellAdd: prev[key]?.clubSellAdd ?? '0',
        [field]: value,
      },
    }))
  }, [])
  const setAddKw3 = useCallback((key: MarkupKey, field: keyof MarkupRow, value: string) => {
    setAdditionalKw3((prev) => ({
      ...prev,
      [key]: {
        buyAdd: prev[key]?.buyAdd ?? '0',
        sellAdd: prev[key]?.sellAdd ?? '0',
        clubBuyAdd: prev[key]?.clubBuyAdd ?? '0',
        clubSellAdd: prev[key]?.clubSellAdd ?? '0',
        [field]: value,
      },
    }))
  }, [])
  const setAddGs1 = useCallback((key: MarkupKey, field: keyof MarkupRow, value: string) => {
    setAdditionalGs1((prev) => ({
      ...prev,
      [key]: {
        buyAdd: prev[key]?.buyAdd ?? '0',
        sellAdd: prev[key]?.sellAdd ?? '0',
        clubBuyAdd: prev[key]?.clubBuyAdd ?? '0',
        clubSellAdd: prev[key]?.clubSellAdd ?? '0',
        [field]: value,
      },
    }))
  }, [])

  // Sync markup to backend whenever additional changes (debounced) so /prices shows URL + add without waiting for Save
  const syncRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (syncRef.current) clearTimeout(syncRef.current)
    syncRef.current = setTimeout(() => {
      const payload: Record<string, MarkupRow> = {}
      for (const k of ALL_MARKUP_KEYS) {
        payload[k] = additional[k] ?? {
          buyAdd: '0',
          sellAdd: '0',
          clubBuyAdd: '0',
          clubSellAdd: '0',
        }
      }
      adminApi.putDaralsabaekMarkup(payload).catch(() => {})
    }, 600)
    return () => {
      if (syncRef.current) clearTimeout(syncRef.current)
    }
  }, [additional])

  const { data: goldPrices, isLoading, isError, error } = useQuery({
    queryKey: ['goldPrices'],
    queryFn: productsApi.getGoldPrices,
  })

  const {
    data: daralsabaek,
    isLoading: daralsabaekLoading,
    isError: daralsabaekError,
    refetch: refetchDaralsabaek,
  } = useQuery({
    queryKey: ['daralsabaekMetalPrices'],
    queryFn: adminApi.getDaralsabaekMetalPrices,
    retry: 1,
    refetchInterval: 20_000, // align with Celery cache refresh every 20s
  })

  const {
    data: kw2Data,
    isLoading: kw2Loading,
    isError: kw2Error,
    refetch: refetchKw2,
  } = useQuery({
    queryKey: ['kw2MetalPrices'],
    queryFn: adminApi.getKw2MetalPrices,
    retry: 1,
    refetchInterval: 60_000,
  })
  const {
    data: kw3Data,
    isLoading: kw3Loading,
    isError: kw3Error,
    refetch: refetchKw3,
  } = useQuery({
    queryKey: ['kw3MetalPrices'],
    queryFn: adminApi.getKw3MetalPrices,
    retry: 1,
    refetchInterval: 60_000,
  })
  const {
    data: gs1Data,
    isLoading: gs1Loading,
    isError: gs1Error,
    refetch: refetchGs1,
  } = useQuery({
    queryKey: ['gs1MetalPrices'],
    queryFn: adminApi.getGoldStandardGs1MetalPrices,
    retry: 1,
    refetchInterval: 60_000,
  })

  const { data: kuwaitConfig } = useQuery({
    queryKey: ['kuwaitMarketConfig'],
    queryFn: adminApi.getKuwaitMarketConfig,
    retry: 1,
  })

  const liveSource = (kuwaitConfig?.active_source || 'kw1').toLowerCase()
  const [previewSource, setPreviewSource] = useState<string>('kw1')
  const previewBootstrapped = useRef(false)
  useEffect(() => {
    if (!kuwaitConfig || previewBootstrapped.current) return
    setPreviewSource((kuwaitConfig.active_source || 'kw1').toLowerCase())
    previewBootstrapped.current = true
  }, [kuwaitConfig])

  const setActiveSource = useMutation({
    mutationFn: (active_source: string) => adminApi.putKuwaitMarketConfig({ active_source }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kuwaitMarketConfig'] })
      queryClient.invalidateQueries({ queryKey: ['daralsabaekPublicRates'] })
      toast.success('Website prices now use this source')
    },
    onError: () => toast.error('Could not update source'),
  })

  useEffect(() => {
    if (kw2Hydrated.current || !kuwaitConfig) return
    const src = kuwaitConfig.extra_source_markups?.kw2
    if (src && typeof src === 'object') {
      setAdditionalKw2(normalizeMarkupRows(src as Record<string, Partial<MarkupRow>>))
    }
    kw2Hydrated.current = true
  }, [kuwaitConfig])
  useEffect(() => {
    if (kw3Hydrated.current || !kuwaitConfig) return
    const src = kuwaitConfig.extra_source_markups?.kw3
    if (src && typeof src === 'object') {
      setAdditionalKw3(normalizeMarkupRows(src as Record<string, Partial<MarkupRow>>))
    }
    kw3Hydrated.current = true
  }, [kuwaitConfig])
  useEffect(() => {
    if (gs1Hydrated.current || !kuwaitConfig) return
    const src = kuwaitConfig.extra_source_markups?.gs1
    if (src && typeof src === 'object') {
      setAdditionalGs1(normalizeMarkupRows(src as Record<string, Partial<MarkupRow>>))
    }
    if (typeof kuwaitConfig.usd_to_kwd_rate === 'number' && Number.isFinite(kuwaitConfig.usd_to_kwd_rate)) {
      setUsdToKwdRate(String(kuwaitConfig.usd_to_kwd_rate))
    }
    gs1Hydrated.current = true
  }, [kuwaitConfig])

  const kw2SyncRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!kw2Hydrated.current) return
    if (kw2SyncRef.current) clearTimeout(kw2SyncRef.current)
    kw2SyncRef.current = setTimeout(() => {
      adminApi
        .putKuwaitMarketConfig({ extra_source_markups: { kw2: additionalKw2 } })
        .catch(() => {})
    }, 700)
    return () => {
      if (kw2SyncRef.current) clearTimeout(kw2SyncRef.current)
    }
  }, [additionalKw2])
  const kw3SyncRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!kw3Hydrated.current) return
    if (kw3SyncRef.current) clearTimeout(kw3SyncRef.current)
    kw3SyncRef.current = setTimeout(() => {
      adminApi
        .putKuwaitMarketConfig({ extra_source_markups: { kw3: additionalKw3 } })
        .catch(() => {})
    }, 700)
    return () => {
      if (kw3SyncRef.current) clearTimeout(kw3SyncRef.current)
    }
  }, [additionalKw3])
  const gs1SyncRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!gs1Hydrated.current) return
    if (gs1SyncRef.current) clearTimeout(gs1SyncRef.current)
    gs1SyncRef.current = setTimeout(() => {
      const rate = parseFloat(usdToKwdRate)
      adminApi
        .putKuwaitMarketConfig({
          usd_to_kwd_rate: Number.isFinite(rate) && rate > 0 ? rate : undefined,
          extra_source_markups: { gs1: additionalGs1 },
        })
        .catch(() => {})
    }, 700)
    return () => {
      if (gs1SyncRef.current) clearTimeout(gs1SyncRef.current)
    }
  }, [additionalGs1, usdToKwdRate])

  const apiResultKw1 =
    daralsabaek &&
    (daralsabaek as DaralsabaekMetalPricesResponse).succeeded &&
    (daralsabaek as DaralsabaekMetalPricesResponse).result
      ? (daralsabaek as DaralsabaekMetalPricesResponse).result!
      : null
  const apiResultKw2 =
    kw2Data &&
    (kw2Data as DaralsabaekMetalPricesResponse).succeeded &&
    (kw2Data as DaralsabaekMetalPricesResponse).result
      ? (kw2Data as DaralsabaekMetalPricesResponse).result!
      : null
  const apiResultKw3 =
    kw3Data &&
    (kw3Data as DaralsabaekMetalPricesResponse).succeeded &&
    (kw3Data as DaralsabaekMetalPricesResponse).result
      ? (kw3Data as DaralsabaekMetalPricesResponse).result!
      : null
  const apiResultGs1 =
    gs1Data &&
    (gs1Data as DaralsabaekMetalPricesResponse).succeeded &&
    (gs1Data as DaralsabaekMetalPricesResponse).result
      ? (gs1Data as DaralsabaekMetalPricesResponse).result!
      : null

  const updatePriceMutation = useMutation({
    mutationFn: adminApi.updateGoldPrice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goldPrices'] })
      toast.success('Prices updated successfully')
    },
    onError: () => {
      toast.error('Failed to update prices')
    },
  })

  const { data: adminPriceAlertsData, isLoading: adminPriceAlertsLoading } = useQuery({
    queryKey: ['adminPriceAlerts'],
    queryFn: priceAlertsApi.getAllPriceAlertsForAdmin,
    refetchInterval: 30_000,
  })

  const testReminderTriggerMutation = useMutation({
    mutationFn: adminApi.triggerPriceReminderProcessingNow,
    onSuccess: (res) => {
      const msg = (res as { message?: string } | undefined)?.message || 'Reminder check executed.'
      toast.success(msg)
      queryClient.invalidateQueries({ queryKey: ['priceAlerts'] })
    },
    onError: () => {
      toast.error('Could not run reminder trigger test.')
    },
  })

  const handleSave = async () => {
    try {
      const payload: Record<string, MarkupRow> = {}
      for (const k of ALL_MARKUP_KEYS) payload[k] = additional[k] ?? emptyMarkupRow()
      await adminApi.putDaralsabaekMarkup(payload)
    } catch {
      toast.error('Could not sync markup to server; public prices may be stale.')
    }
    try {
      const parsedRate = parseFloat(usdToKwdRate)
      await adminApi.putKuwaitMarketConfig({
        usd_to_kwd_rate: Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : undefined,
        extra_source_markups: { kw2: additionalKw2, kw3: additionalKw3, gs1: additionalGs1 },
      })
    } catch {
      toast.error('Could not sync Kw2/Kw3/Gold Standard config.')
    }

    const src = previewSource
    const sourceResult =
      src === 'kw2'
        ? apiResultKw2
        : src === 'kw3'
        ? apiResultKw3
        : src === 'gs1'
        ? apiResultGs1
        : apiResultKw1
    const sourceAdds =
      src === 'kw2'
        ? additionalKw2
        : src === 'kw3'
        ? additionalKw3
        : src === 'gs1'
        ? additionalGs1
        : additional
    const rows = (goldPrices as GoldPriceRow[]) || []
    let saved = 0
    for (const price of rows) {
      const caratId = price.carat?.id
      if (!caratId) continue
      const caratValue = price.carat?.carat_value
      const rates =
        sourceResult && caratValue != null ? getRatesByCaratValue(sourceResult, caratValue) : null
      let buy: number
      let sell: number
      if (rates) {
        const key = `${caratValue}K` as CaratKey
        const addB = parseFloat(sourceAdds[key]?.buyAdd ?? '0')
        const addS = parseFloat(sourceAdds[key]?.sellAdd ?? '0')
        buy = rates.buy + (Number.isNaN(addB) ? 0 : addB)
        sell = rates.sell + (Number.isNaN(addS) ? 0 : addS)
      } else {
        const edited = prices[caratId]
        buy = edited?.buy !== undefined ? parseFloat(edited.buy) : Number(price.buy_price_per_gram)
        sell = edited?.sell !== undefined ? parseFloat(edited.sell) : Number(price.sell_price_per_gram)
      }
      if (Number.isNaN(buy) || Number.isNaN(sell) || buy < 0 || sell < 0) continue
      updatePriceMutation.mutate({
        carat_id: caratId,
        buy_price_per_gram: buy,
        sell_price_per_gram: sell,
      })
      saved++
    }
    if (saved === 0) {
      toast.message('Adjust additional amounts above or enter manual prices, then save.')
    }
  }

  const list = (goldPrices as GoldPriceRow[]) || []
  const adminPriceAlerts = Array.isArray(adminPriceAlertsData)
    ? (adminPriceAlertsData as AdminPriceAlertRow[])
    : (((adminPriceAlertsData as { results?: AdminPriceAlertRow[] } | undefined)?.results ?? []) as AdminPriceAlertRow[])
  const activeReminders = adminPriceAlerts
    .filter((x) => x.status === 'active')
    .sort((a, b) => {
      const ad = a.created_at ? new Date(a.created_at).getTime() : 0
      const bd = b.created_at ? new Date(b.created_at).getTime() : 0
      return bd - ad
    })
    .slice(0, 25)
  const selectedResult =
    previewSource === 'kw2'
      ? apiResultKw2
      : previewSource === 'kw3'
      ? apiResultKw3
      : previewSource === 'gs1'
      ? apiResultGs1
      : apiResultKw1
  const selectedLoading =
    previewSource === 'kw2'
      ? kw2Loading
      : previewSource === 'kw3'
      ? kw3Loading
      : previewSource === 'gs1'
      ? gs1Loading
      : daralsabaekLoading
  const selectedError =
    previewSource === 'kw2'
      ? kw2Error
      : previewSource === 'kw3'
      ? kw3Error
      : previewSource === 'gs1'
      ? gs1Error
      : daralsabaekError
  const selectedResponse =
    previewSource === 'kw2'
      ? (kw2Data as DaralsabaekMetalPricesResponse | undefined)
      : previewSource === 'kw3'
      ? (kw3Data as DaralsabaekMetalPricesResponse | undefined)
      : previewSource === 'gs1'
      ? (gs1Data as DaralsabaekMetalPricesResponse | undefined)
      : (daralsabaek as DaralsabaekMetalPricesResponse | undefined)
  const selectedAdditional =
    previewSource === 'kw2'
      ? additionalKw2
      : previewSource === 'kw3'
      ? additionalKw3
      : previewSource === 'gs1'
      ? additionalGs1
      : additional
  const selectedSetAdd =
    previewSource === 'kw2'
      ? setAddKw2
      : previewSource === 'kw3'
      ? setAddKw3
      : previewSource === 'gs1'
      ? setAddGs1
      : setAdd
  const selectedRefetch =
    previewSource === 'kw2'
      ? refetchKw2
      : previewSource === 'kw3'
      ? refetchKw3
      : previewSource === 'gs1'
      ? refetchGs1
      : refetchDaralsabaek
  const selectedLabel =
    previewSource === 'kw2'
      ? 'Kw2 — ATKWT'
      : previewSource === 'kw3'
      ? 'Kw3 — NBJEW'
      : previewSource === 'gs1'
      ? 'Gold Standard — GS1 (GoldAPI)'
      : 'Kw1 — Dar Al Sabaek'
  const selectedHref =
    previewSource === 'kw2'
      ? 'https://gr.atkwt.com/wp-admin/admin-ajax.php'
      : previewSource === 'kw3'
      ? 'https://gr.nbjew.com/wp-admin/admin-ajax.php'
      : previewSource === 'gs1'
      ? 'https://www.goldapi.io/'
      : 'https://api.daralsabaek.com/api/goldAndFundBalance/getMetalSellAndBuyPrices'
  const selectedLinkText =
    previewSource === 'kw2' || previewSource === 'kw3'
      ? 'admin-ajax.php'
      : previewSource === 'gs1'
      ? 'goldapi.io'
      : 'getMetalSellAndBuyPrices'

  const liveLabel =
    liveSource === 'kw2'
      ? 'KW2'
      : liveSource === 'kw3'
      ? 'KW3'
      : liveSource === 'gs1'
      ? 'GS1'
      : liveSource === 'kw4' || liveSource === 'kw5'
      ? liveSource.toUpperCase()
      : 'KW1'
  const previewMismatch = previewSource !== liveSource
  const fmt = (n: number) => (typeof n === 'number' && !Number.isNaN(n) ? n.toFixed(4) : '—')

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <AdminNav />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gold-gradient-text-on-light">Gold Prices</h1>
            <p className="text-stone-700 font-medium">Manage daily gold buy/sell prices</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => testReminderTriggerMutation.mutate()}
              disabled={testReminderTriggerMutation.isPending}
              className="px-4 py-2 rounded-lg border-2 border-black/20 bg-lime-100 text-black font-semibold hover:bg-lime-200 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <BellRing className="w-4 h-4" />
              {testReminderTriggerMutation.isPending ? 'Running…' : 'Test Trigger Reminder Now'}
            </button>
            <button
              onClick={handleSave}
              disabled={updatePriceMutation.isPending || isLoading}
              className="gold-button flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {updatePriceMutation.isPending ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="gold-card mb-6 border-2 border-emerald-500/30 bg-emerald-50/70">
          <div className="flex flex-wrap items-start gap-3 justify-between">
            <div>
              <h2 className="text-xl font-bold text-black mb-1">Live metal prices source</h2>
              <p className="text-sm text-stone-800 font-medium">
                Single trusted upstream:{' '}
                <a
                  href="https://www.goldapi.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-800 font-bold hover:underline"
                >
                  GoldAPI.io
                </a>{' '}
                — gold (XAU), silver (XAG), platinum (XPT), palladium (XPD). Prices are fetched
                server-side every 60s and exposed via{' '}
                <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                  /api/prices/current/
                </code>{' '}
                and{' '}
                <code className="text-xs bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                  /api/prices/history/
                </code>
                .
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold px-3 py-1">
              Active
            </span>
          </div>
        </div>

        <div className="gold-card mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-xl font-bold text-black">Live rates (URL + additional)</h2>
              <p className="text-xs text-stone-600 mt-1">
                General customers: URL + general add. Club members: same total + club add (see
                below). Preview source: <span className="font-semibold">{selectedLabel}</span>. Source:{' '}
                <a
                  href={selectedHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800 font-semibold hover:underline"
                >
                  {selectedLinkText}
                </a>
                .
              </p>
            </div>
            <button
              type="button"
              className="text-sm font-semibold text-black hover:text-lime-900 flex items-center gap-1"
              onClick={() => selectedRefetch()}
            >
              <RefreshCw className={`w-4 h-4 ${selectedLoading ? 'animate-spin' : ''}`} />
              Refresh URL
            </button>
          </div>

          {selectedLoading && (
            <p className="text-stone-700 text-center py-6 font-medium">Loading…</p>
          )}
          {selectedError && (
            <p className="text-red-700 text-sm font-medium py-4">Failed to load URL feed.</p>
          )}
          {!selectedLoading && selectedResponse && !selectedResponse.succeeded && (
            <div className="rounded-lg border-2 border-amber-600/30 bg-amber-50 p-4 text-amber-950 text-sm font-medium">
              Upstream did not succeed
            </div>
          )}

          {selectedResult && (
            <div className="space-y-6">
              {(() => {
                const r = selectedResult
                const usdToKwd = Number.parseFloat(usdToKwdRate)
                const usdToKwdSafe = Number.isFinite(usdToKwd) && usdToKwd > 0 ? usdToKwd : 0.307
                const toUsdOunce = (raw: number | null | undefined): number | null => {
                  if (typeof raw !== 'number' || !Number.isFinite(raw)) return null
                  // Some sources already provide USD/oz; avoid converting those again.
                  if (raw >= 1500) return raw
                  return raw / usdToKwdSafe
                }
                const ounceUsd =
                  typeof r.goldOuncePrice === 'number' ? toUsdOunce(r.goldOuncePrice) : null
                return (
                  <>
                    <div className="gold-card overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 via-transparent to-gold-600/5 pointer-events-none" />
                      <div className="relative flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 py-2">
                        <div>
                          <p className="text-[25px] font-bold text-black uppercase tracking-wider mb-1">
                            Gold ounce Price
                          </p>
                          <p className="text-xs text-stone-600">every {r.updateIntervalInSeconds}s</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p
                            className="text-4xl sm:text-5xl font-bold gold-gradient-text-on-light tabular-nums leading-none"
                            style={{ fontVariantNumeric: 'tabular-nums' }}
                          >
                            ${typeof ounceUsd === 'number' && Number.isFinite(ounceUsd)
                              ? ounceUsd.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })
                              : '—'}
                          </p>
                          <p className="text-stone-700 text-sm font-medium mt-2">USD / troy ounce</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-black mb-2">Sell / Buy KWD/g — live totals</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {ALL_MARKUP_KEYS.map((key) => {
                          const base = getApiRatesForMarkupKey(r, key)
                          const buyAdd = selectedAdditional[key]?.buyAdd ?? '0'
                          const sellAdd = selectedAdditional[key]?.sellAdd ?? '0'
                          const clubBuyAdd = selectedAdditional[key]?.clubBuyAdd ?? '0'
                          const clubSellAdd = selectedAdditional[key]?.clubSellAdd ?? '0'
                          const addB = parseFloat(buyAdd)
                          const addS = parseFloat(sellAdd)
                          const addClubB = parseFloat(clubBuyAdd)
                          const addClubS = parseFloat(clubSellAdd)
                          const buyTotal = base.buy + (Number.isNaN(addB) ? 0 : addB)
                          const sellTotal = base.sell + (Number.isNaN(addS) ? 0 : addS)
                          const buyTotalClub = buyTotal + (Number.isNaN(addClubB) ? 0 : addClubB)
                          const sellTotalClub = sellTotal + (Number.isNaN(addClubS) ? 0 : addClubS)
                          return (
                            <div key={key} className="gold-card ring-1 ring-black/10">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-lime-200/80 flex items-center justify-center border border-black/10">
                                  <TrendingUp className="w-5 h-5 text-black" />
                                </div>
                                <h3 className="text-lg font-bold text-black">{key}</h3>
                              </div>
                              <p className="text-[10px] uppercase text-amber-900 font-bold mb-2">
                                General
                              </p>
                              <div className="space-y-2">
                                <div>
                                  <p className="text-[10px] uppercase text-stone-600 font-semibold">Sell</p>
                                  <p className="text-xl font-bold text-black tabular-nums">{fmt(sellTotal)}</p>
                                  <p className="text-[11px] text-stone-600">
                                    URL {fmt(base.sell)}
                                    {!Number.isNaN(addS) && addS !== 0 && (
                                      <span className="text-amber-800 font-semibold"> + {addS.toFixed(3)}</span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase text-stone-600 font-semibold">Buy</p>
                                  <p className="text-xl font-bold text-black tabular-nums">{fmt(buyTotal)}</p>
                                  <p className="text-[11px] text-stone-600">
                                    URL {fmt(base.buy)}
                                    {!Number.isNaN(addB) && addB !== 0 && (
                                      <span className="text-amber-800 font-semibold"> + {addB.toFixed(3)}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 pt-3 border-t border-black/10 text-xs text-stone-700 font-medium">
                                Spread {fmt(sellTotal - buyTotal)} KWD
                              </div>

                              <p className="text-[10px] uppercase text-black font-bold mt-4 mb-2">
                                Club members
                              </p>
                              <div className="space-y-2 rounded-lg bg-lime-100/90 border-2 border-lime-400/45 px-2 py-2">
                                <div>
                                  <p className="text-[10px] uppercase text-stone-800 font-semibold">Sell</p>
                                  <p className="text-lg font-bold text-black tabular-nums">{fmt(sellTotalClub)}</p>
                                  <p className="text-[11px] text-stone-700">
                                    general {fmt(sellTotal)}
                                    {!Number.isNaN(addClubS) && addClubS !== 0 && (
                                      <span className="text-lime-900 font-semibold"> + {addClubS.toFixed(3)}</span>
                                    )}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-[10px] uppercase text-stone-800 font-semibold">Buy</p>
                                  <p className="text-lg font-bold text-black tabular-nums">{fmt(buyTotalClub)}</p>
                                  <p className="text-[11px] text-stone-700">
                                    general {fmt(buyTotal)}
                                    {!Number.isNaN(addClubB) && addClubB !== 0 && (
                                      <span className="text-lime-900 font-semibold"> + {addClubB.toFixed(3)}</span>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-stone-800 font-medium">
                                Club spread {fmt(sellTotalClub - buyTotalClub)} KWD
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="rounded-xl border-2 border-black/10 bg-lime-50/90 p-4">
                      <h3 className="text-sm font-bold text-black mb-1">
                        General customers — additional (KWD/g)
                      </h3>
                      <p className="text-xs text-stone-700 mb-4 font-medium">
                        Type here — the cards above update immediately. Save writes URL + additional
                        to your gold prices.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {ALL_MARKUP_KEYS.map((key) => (
                          <div
                            key={key}
                            className="rounded-lg border-2 border-black/10 bg-white p-3 shadow-sm"
                          >
                            <p className="text-xs font-bold text-black mb-2">{key}</p>
                            <div className="space-y-2">
                              <div>
                                <label className="text-[10px] font-semibold text-stone-700">+ on sell</label>
                                <input
                                  type="number"
                                  step="0.001"
                                  value={selectedAdditional[key]?.sellAdd ?? '0'}
                                  onChange={(e) => selectedSetAdd(key, 'sellAdd', e.target.value)}
                                  className="w-full px-2 py-1.5 mt-0.5 bg-white border-2 border-black/15 rounded text-black text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-stone-700">+ on buy</label>
                                <input
                                  type="number"
                                  step="0.001"
                                  value={selectedAdditional[key]?.buyAdd ?? '0'}
                                  onChange={(e) => selectedSetAdd(key, 'buyAdd', e.target.value)}
                                  className="w-full px-2 py-1.5 mt-0.5 bg-white border-2 border-black/15 rounded text-black text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-xl border-2 border-lime-400/40 bg-lime-100/90 p-4 shadow-sm">
                      <h3 className="text-sm font-bold text-black mb-1">
                        Club members — extra additional (KWD/g)
                      </h3>
                      <p className="text-xs text-stone-700 mb-4 font-medium">
                        Applied on top of the general total (URL + general add). Use negative values
                        for a better buy rate for members. Checkout and product APIs use this when
                        the customer has an active club membership.
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                        {ALL_MARKUP_KEYS.map((key) => (
                          <div
                            key={`club-${key}`}
                            className="rounded-lg border-2 border-black/10 bg-white p-3 shadow-sm"
                          >
                            <p className="text-xs font-bold text-black mb-2">{key}</p>
                            <div className="space-y-2">
                              <div>
                                <label className="text-[10px] font-semibold text-stone-800">
                                  + on sell (club)
                                </label>
                                <input
                                  type="number"
                                  step="0.001"
                                  value={selectedAdditional[key]?.clubSellAdd ?? '0'}
                                  onChange={(e) => selectedSetAdd(key, 'clubSellAdd', e.target.value)}
                                  className="w-full px-2 py-1.5 mt-0.5 bg-white border-2 border-black/15 rounded text-black text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-semibold text-stone-800">
                                  + on buy (club)
                                </label>
                                <input
                                  type="number"
                                  step="0.001"
                                  value={selectedAdditional[key]?.clubBuyAdd ?? '0'}
                                  onChange={(e) => selectedSetAdd(key, 'clubBuyAdd', e.target.value)}
                                  className="w-full px-2 py-1.5 mt-0.5 bg-white border-2 border-black/15 rounded text-black text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>

        <div className="gold-card mb-8 border-2 border-lime-500/25">
          <h2 className="text-xl font-bold text-black mb-2">USD → KWD conversion</h2>
          <p className="text-sm text-stone-700 font-medium mb-3">
            GoldAPI returns USD prices; this constant is used to convert spot rates and gram prices
            to KWD across the storefront, mobile, and accounting reports.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-black/10 p-3 bg-lime-50/70">
              <label className="text-xs text-stone-700 font-semibold">USD → KWD constant</label>
              <input
                type="number"
                step="0.000001"
                value={usdToKwdRate}
                onChange={(e) => setUsdToKwdRate(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-white border border-black/15 rounded text-black"
              />
            </div>
            <div className="rounded-lg border border-black/10 p-3 bg-lime-50/70 flex flex-col justify-between">
              <p className="text-xs text-stone-700 font-semibold">Refresh GoldAPI now</p>
              <button
                type="button"
                className="mt-2 text-sm font-semibold text-black hover:text-lime-900 flex items-center gap-1"
                onClick={() => refetchGs1()}
              >
                <RefreshCw className={`w-4 h-4 ${gs1Loading ? 'animate-spin' : ''}`} />
                Refresh prices
              </button>
            </div>
          </div>
        </div>

        {isError && (
          <div className="gold-card mb-6 border-red-500/40 text-red-800 text-sm font-medium">
            Could not load gold prices. {(error as Error)?.message}
          </div>
        )}
        {isLoading && (
          <div className="gold-card mb-8 flex items-center justify-center gap-2 py-12 text-stone-700 font-medium">
            <RefreshCw className="w-5 h-5 animate-spin" />
            Loading…
          </div>
        )}
        {!isLoading && list.length === 0 && !isError && (
          <div className="gold-card mb-8 text-center py-12 text-stone-700 font-medium">
            No carats found.
          </div>
        )}

        {/* Carat save targets — only when no URL match; otherwise Save uses additional block */}
        {/* {list.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-bold text-black">Carat prices (manual if not 18–24K)</h2>
            <p className="text-xs text-stone-600">
              For 18–24K, Save uses the live totals from the URL + additional section above.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {list.map((price) => {
            const caratValue = price.carat?.carat_value
            const hasUrl =
              apiResult && caratValue != null && getRatesByCaratValue(apiResult, caratValue) != null
            if (hasUrl) {
              return (
                <div key={price.carat.id} className="gold-card opacity-90">
                  <h3 className="text-lg font-bold text-black">
                    {price.carat.display_name_en}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2">
                    Uses URL + additional above. No manual entry needed.
                  </p>
                </div>
              )
            }
            const buyDefault =
              price.buy_price_per_gram != null ? String(price.buy_price_per_gram) : ''
            const sellDefault =
              price.sell_price_per_gram != null ? String(price.sell_price_per_gram) : ''
            const purity = price.carat?.purity_percentage
            const purityLabel =
              purity != null && purity <= 1 ? `${(purity * 100).toFixed(1)}% Pure` : `${purity}% Pure`
            const caratId = price.carat.id
            return (
              <div key={caratId} className="gold-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-lime-200/50 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-lime-800" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-black">
                      {price.carat.display_name_en}
                    </h3>
                    <p className="text-xs text-stone-700">{purityLabel}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-stone-700">Buy (KWD/g)</label>
                    <input
                      type="number"
                      step="0.001"
                      defaultValue={buyDefault}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          [caratId]: {
                            ...prev[caratId],
                            buy: e.target.value,
                            sell: prev[caratId]?.sell ?? sellDefault,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-lime-200/60 rounded-lg text-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-700">Sell (KWD/g)</label>
                    <input
                      type="number"
                      step="0.001"
                      defaultValue={sellDefault}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          [caratId]: {
                            ...prev[caratId],
                            buy: prev[caratId]?.buy ?? buyDefault,
                            sell: e.target.value,
                          },
                        }))
                      }
                      className="w-full px-3 py-2 bg-white border border-lime-200/60 rounded-lg text-black"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div> */}

        {/* <div className="gold-card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-black">Scraped market prices</h2>
            <button
              type="button"
              className="text-sm text-lime-800 hover:text-black flex items-center gap-1"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['scrapedPricesLatest'] })}
            >
              <RefreshCw className={`w-4 h-4 ${scrapedLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
          {scrapedLoading && (
            <p className="text-stone-700 text-center py-6">Loading…</p>
          )}
          {!scrapedLoading && (!scrapedPrices || scrapedPrices.length === 0) && (
            <p className="text-stone-700 text-center py-6">No scraped prices.</p>
          )}
          {!scrapedLoading && scrapedPrices && scrapedPrices.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-700">
                    <th className="py-2 pr-4">Source</th>
                    <th className="py-2 pr-4">Carat</th>
                    <th className="py-2 pr-4">Buy</th>
                    <th className="py-2 pr-4">Sell</th>
                    <th className="py-2">Scraped at</th>
                  </tr>
                </thead>
                <tbody>
                  {(scrapedPrices as ScrapedPriceRow[]).map((row) => (
                    <tr key={row.id} className="border-b border-stone-100 text-black">
                      <td className="py-2 pr-4">{row.source_name}</td>
                      <td className="py-2 pr-4">{row.carat_value}K</td>
                      <td className="py-2 pr-4">{row.buy_price ?? '—'}</td>
                      <td className="py-2 pr-4">{row.sell_price ?? '—'}</td>
                      <td className="py-2 text-stone-700">
                        {row.scraped_at ? new Date(row.scraped_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div> */}

        {/* <div className="gold-card">
          <h2 className="text-xl font-bold text-black mb-4">Price History</h2>
          <p className="text-stone-700 text-center py-8">Chart placeholder</p>
        </div> */}

        <div className="gold-card mt-8">
          <h2 className="text-xl font-bold text-black mb-2">Active customer reminders</h2>
          <p className="text-xs text-stone-700 mb-4">
            One active threshold reminder per customer is enforced. Latest 25 shown.
          </p>
          {adminPriceAlertsLoading ? (
            <p className="text-stone-700 text-center py-4">Loading reminders…</p>
          ) : activeReminders.length === 0 ? (
            <p className="text-stone-700 text-center py-4">No active reminders.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-black/10 text-stone-700">
                    <th className="py-2 pe-3">Customer</th>
                    <th className="py-2 pe-3">Metal</th>
                    <th className="py-2 pe-3">Side</th>
                    <th className="py-2 pe-3">Condition</th>
                    <th className="py-2 pe-3">Target</th>
                    <th className="py-2 pe-3">Set at</th>
                  </tr>
                </thead>
                <tbody>
                  {activeReminders.map((r) => {
                    const metal =
                      (r.spot_metal || 'gold') === 'gold'
                        ? `${r.gold_carats ?? '—'}K gold`
                        : r.spot_metal || '—'
                    const target = r.target_price != null ? Number(r.target_price) : NaN
                    return (
                      <tr key={r.id} className="border-b border-black/5 text-black">
                        <td className="py-2 pe-3">
                          <div className="font-semibold">{r.user?.full_name || '—'}</div>
                          <div className="text-xs text-stone-600">
                            {r.user?.phone_number || r.user?.email || '—'}
                          </div>
                        </td>
                        <td className="py-2 pe-3">{metal}</td>
                        <td className="py-2 pe-3">{r.price_side || '—'}</td>
                        <td className="py-2 pe-3">{r.condition || '—'}</td>
                        <td className="py-2 pe-3">
                          {Number.isFinite(target) ? `${target.toFixed(3)} KWD/g` : '—'}
                        </td>
                        <td className="py-2 pe-3">
                          {r.created_at ? new Date(r.created_at).toLocaleString() : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
