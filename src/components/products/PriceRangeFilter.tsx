import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

type Props = {
  minParam: string
  maxParam: string
  boundsMin: number
  boundsMax: number
  onCommit: (min: string, max: string) => void
  className?: string
}

function parseOr(raw: string, fallback: number) {
  if (raw.trim() === '') return fallback
  const n = Number(raw)
  return Number.isFinite(n) ? n : fallback
}

/**
 * Price range: dual-thumb slider + number inputs.
 * Local draft state while typing/dragging; commits to parent (URL) without remounting focus.
 */
export function PriceRangeFilter({
  minParam,
  maxParam,
  boundsMin,
  boundsMax,
  onCommit,
  className,
}: Props) {
  const { t } = useTranslation()
  const span = Math.max(boundsMax - boundsMin, 1)
  const step = span > 500 ? 1 : span > 50 ? 0.5 : 0.1

  const [draftMin, setDraftMin] = useState(minParam)
  const [draftMax, setDraftMax] = useState(maxParam)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastCommitted = useRef({ min: minParam, max: maxParam })

  // Sync from URL when cleared externally (chips / clear all), not while typing.
  useEffect(() => {
    if (minParam === lastCommitted.current.min && maxParam === lastCommitted.current.max) return
    lastCommitted.current = { min: minParam, max: maxParam }
    setDraftMin(minParam)
    setDraftMax(maxParam)
  }, [minParam, maxParam])

  const commit = (minStr: string, maxStr: string) => {
    let lo = minStr.trim() === '' ? '' : String(Number(minStr))
    let hi = maxStr.trim() === '' ? '' : String(Number(maxStr))
    if (lo !== '' && !Number.isFinite(Number(lo))) lo = ''
    if (hi !== '' && !Number.isFinite(Number(hi))) hi = ''
    if (lo !== '' && hi !== '' && Number(lo) > Number(hi)) {
      const tmp = lo
      lo = hi
      hi = tmp
    }
    lastCommitted.current = { min: lo, max: hi }
    onCommit(lo, hi)
  }

  const scheduleCommit = (minStr: string, maxStr: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => commit(minStr, maxStr), 350)
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const sliderValue = useMemo(() => {
    const lo = parseOr(draftMin, boundsMin)
    const hi = parseOr(draftMax, boundsMax)
    return [
      Math.min(Math.max(lo, boundsMin), boundsMax),
      Math.min(Math.max(hi, boundsMin), boundsMax),
    ] as [number, number]
  }, [draftMin, draftMax, boundsMin, boundsMax])

  const onSliderChange = (values: number[]) => {
    const lo = values[0] ?? boundsMin
    const hi = values[1] ?? boundsMax
    const minStr = String(Number(lo.toFixed(3)))
    const maxStr = String(Number(hi.toFixed(3)))
    setDraftMin(minStr)
    setDraftMax(maxStr)
    scheduleCommit(minStr, maxStr)
  }

  const onMinChange = (v: string) => {
    setDraftMin(v)
    scheduleCommit(v, draftMax)
  }

  const onMaxChange = (v: string) => {
    setDraftMax(v)
    scheduleCommit(draftMin, v)
  }

  const onBlurCommit = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    commit(draftMin, draftMax)
  }

  return (
    <div className={cn('space-y-4', className)}>
      <Slider
        min={boundsMin}
        max={boundsMax}
        step={step}
        value={sliderValue}
        onValueChange={onSliderChange}
        aria-label={t('productsPage.priceRange')}
        className="py-1 [&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:bg-[#E8EBE3] [&_[data-slot=slider-range]]:bg-[#3F6F00] [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-[#3F6F00]"
      />

      <div className="flex items-center justify-between gap-2 text-[11px] font-medium tabular-nums text-[#94A3B8]">
        <span dir="ltr">{boundsMin.toFixed(0)}</span>
        <span dir="ltr">{boundsMax.toFixed(0)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[#64748B]">
            {t('productsPage.minLabel')}
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={step}
            placeholder={String(boundsMin)}
            value={draftMin}
            onChange={(e) => onMinChange(e.target.value)}
            onBlur={onBlurCommit}
            className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm font-medium text-[#0B0F19] outline-none transition focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-[#64748B]">
            {t('productsPage.maxLabel')}
          </span>
          <input
            type="number"
            inputMode="decimal"
            min={0}
            step={step}
            placeholder={String(boundsMax)}
            value={draftMax}
            onChange={(e) => onMaxChange(e.target.value)}
            onBlur={onBlurCommit}
            className="w-full rounded-xl border border-black/10 bg-white px-3.5 py-3 text-sm font-medium text-[#0B0F19] outline-none transition focus:border-[#85E307] focus:ring-2 focus:ring-[#85E307]/25"
          />
        </label>
      </div>
    </div>
  )
}
