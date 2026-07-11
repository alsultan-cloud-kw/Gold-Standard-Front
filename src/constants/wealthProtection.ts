/** Indexed timeline for cash vs gold (1970 = 100). Indicative benchmarks only. */
export const WEALTH_TIMELINE_POINTS = [
  { id: 'y1970', labelKey: 'home.wealthProtection.timeline.y1970', cash: 100, gold: 100 },
  { id: 'y1990', labelKey: 'home.wealthProtection.timeline.y1990', cash: 52, gold: 240 },
  { id: 'y2000', labelKey: 'home.wealthProtection.timeline.y2000', cash: 35, gold: 520 },
  { id: 'y2010', labelKey: 'home.wealthProtection.timeline.y2010', cash: 20, gold: 980 },
  { id: 'today', labelKey: 'home.wealthProtection.timeline.today', cash: 10, gold: 2400 },
] as const

/** Dollar values for the end-state comparison chart (indicative). */
export const WEALTH_BAR_CHART = {
  maxValue: 2_400_000,
  startValue: 100_000,
  goldValue: 2_400_000,
  cashValue: 10_000,
  goldLabelKey: 'home.wealthProtection.chart.goldValue',
  cashLabelKey: 'home.wealthProtection.chart.cashValue',
  yTicks: [
    { value: 0, labelKey: 'home.wealthProtection.chart.axis0' },
    { value: 100_000, labelKey: 'home.wealthProtection.chart.axis100k' },
    { value: 500_000, labelKey: 'home.wealthProtection.chart.axis500k' },
    { value: 1_000_000, labelKey: 'home.wealthProtection.chart.axis1m' },
    { value: 2_400_000, labelKey: 'home.wealthProtection.chart.axis2m' },
  ],
} as const
