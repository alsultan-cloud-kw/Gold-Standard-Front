import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Coins,
  Shield,
  TrendingDown,
  TrendingUp,
  Droplets,
  HeartPulse,
  Hourglass,
  Bitcoin,
  Banknote,
} from 'lucide-react'

export type ComparisonAsset = 'gold' | 'cash' | 'bitcoin' | 'stocks' | 'realEstate'

export type ComparisonCriterion = {
  id: string
  labelKey: string
  icon: LucideIcon
  ratings: Record<ComparisonAsset, number>
}

export const COMPARISON_ASSETS: ComparisonAsset[] = [
  'gold',
  'cash',
  'bitcoin',
  'stocks',
  'realEstate',
]

/** Featured first; others follow for the card rail. */
export const COMPARISON_ASSETS_CARDS: ComparisonAsset[] = [
  'gold',
  'bitcoin',
  'stocks',
  'cash',
  'realEstate',
]

export const COMPARISON_CRITERIA: ComparisonCriterion[] = [
  {
    id: 'inflationHedge',
    labelKey: 'home.goldComparison.criteria.inflationHedge',
    icon: Shield,
    ratings: { gold: 5, cash: 1, bitcoin: 2, stocks: 3, realEstate: 4 },
  },
  {
    id: 'lowVolatility',
    labelKey: 'home.goldComparison.criteria.lowVolatility',
    icon: TrendingDown,
    ratings: { gold: 4, cash: 5, bitcoin: 1, stocks: 2, realEstate: 3 },
  },
  {
    id: 'liquidity',
    labelKey: 'home.goldComparison.criteria.liquidity',
    icon: Droplets,
    ratings: { gold: 4, cash: 5, bitcoin: 5, stocks: 5, realEstate: 1 },
  },
  {
    id: 'crisisResilience',
    labelKey: 'home.goldComparison.criteria.crisisResilience',
    icon: HeartPulse,
    ratings: { gold: 5, cash: 2, bitcoin: 1, stocks: 1, realEstate: 3 },
  },
  {
    id: 'longTermValue',
    labelKey: 'home.goldComparison.criteria.longTermValue',
    icon: Hourglass,
    ratings: { gold: 5, cash: 1, bitcoin: 2, stocks: 4, realEstate: 4 },
  },
]

export const COMPARISON_MAX_SCORE = 5

export const ASSET_META: Record<
  ComparisonAsset,
  { icon: LucideIcon; blurbKey: string }
> = {
  gold: { icon: Coins, blurbKey: 'home.goldComparison.blurbs.gold' },
  cash: { icon: Banknote, blurbKey: 'home.goldComparison.blurbs.cash' },
  bitcoin: { icon: Bitcoin, blurbKey: 'home.goldComparison.blurbs.bitcoin' },
  stocks: { icon: TrendingUp, blurbKey: 'home.goldComparison.blurbs.stocks' },
  realEstate: { icon: Building2, blurbKey: 'home.goldComparison.blurbs.realEstate' },
}

export function assetOverallScore(asset: ComparisonAsset): number {
  const sum = COMPARISON_CRITERIA.reduce((acc, row) => acc + row.ratings[asset], 0)
  return Math.round((sum / COMPARISON_CRITERIA.length) * 10) / 10
}
