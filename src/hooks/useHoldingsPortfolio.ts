import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { goldTradingApi, walletApi } from '@/services/api'

export type HoldingsPosition = {
  id: string
  carat_value: number
  carat_display: string
  grams_available: number
  avg_buy_price_per_gram: number
  unrealized_pl_kwd?: number | null
}

export type HoldingsTrade = {
  id: string
  side: 'buy' | 'sell'
  side_display?: string
  carat_value: number
  grams: number
  price_per_gram: number
  total_kwd: number
  fee_kwd?: number
  realized_pl_kwd?: number | null
  created_at: string
}

export type HoldingsQuote = {
  side: 'buy' | 'sell'
  carat_value: number
  carat_display: string
  price_per_gram: number
  grams: number
  kwd_amount: number
  base_kwd_amount?: number
  fee_kwd?: number
  fee_percent?: number
  wallet_balance?: number
  max_grams_by_wallet?: number
  max_grams_for_buy?: number
  grams_available?: number
  currency?: string
}

const CARAT_24 = 24

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const row = data as { results?: T[] }
  return row?.results ?? []
}

function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value ?? NaN)
  return Number.isFinite(n) ? n : 0
}

export function useHoldingsPortfolio(enabled = true) {
  const positionsQuery = useQuery({
    queryKey: ['holdings', 'positions'],
    queryFn: async () => unwrapList<HoldingsPosition>(await goldTradingApi.getPositions()),
    enabled,
    staleTime: 15_000,
  })

  const tradesQuery = useQuery({
    queryKey: ['holdings', 'trades'],
    queryFn: async () => unwrapList<HoldingsTrade>(await goldTradingApi.getTrades()),
    enabled,
    staleTime: 15_000,
  })

  const walletQuery = useQuery({
    queryKey: ['holdings', 'wallet'],
    queryFn: () => walletApi.getMyWallet(),
    enabled,
    staleTime: 15_000,
  })

  const positions = positionsQuery.data ?? []
  const trades = tradesQuery.data ?? []
  const position24 = positions.find((p) => p.carat_value === CARAT_24) ?? null

  const walletBalance = toNumber(
    (walletQuery.data as { wallet?: { balance?: unknown } } | undefined)?.wallet?.balance,
  )

  const stats = useMemo(() => {
    const gramsHeld = toNumber(position24?.grams_available)
    const avgCost = toNumber(position24?.avg_buy_price_per_gram)
    const unrealizedPl = toNumber(position24?.unrealized_pl_kwd)
    const costBasis = gramsHeld > 0 ? gramsHeld * avgCost : 0

    const realizedPl = trades
      .filter((t) => t.side === 'sell')
      .reduce((sum, t) => sum + toNumber(t.realized_pl_kwd), 0)

    const totalBuys = trades.filter((t) => t.side === 'buy').length
    const totalSells = trades.filter((t) => t.side === 'sell').length

    return {
      gramsHeld,
      avgCost,
      costBasis,
      unrealizedPl,
      realizedPl,
      totalPl: unrealizedPl + realizedPl,
      totalBuys,
      totalSells,
    }
  }, [position24, trades])

  const recentTrades = useMemo(
    () =>
      [...trades].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      ).slice(0, 8),
    [trades],
  )

  const isLoading =
    positionsQuery.isLoading || tradesQuery.isLoading || walletQuery.isLoading
  const isError = positionsQuery.isError || tradesQuery.isError

  return {
    carat24: CARAT_24,
    positions,
    position24,
    trades,
    recentTrades,
    walletBalance,
    stats,
    isLoading,
    isError,
    refetch: () => {
      void positionsQuery.refetch()
      void tradesQuery.refetch()
      void walletQuery.refetch()
    },
  }
}
