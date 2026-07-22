import { useState } from 'react'

export type BullionFrameProps = {
  productImageUrl: string | null
  serialNumber: string
  weightGrams?: string | number | null
  purityDisplay: string
  altEn: string
  altAr: string
  lang: 'en' | 'ar'
}

export function BullionFrame({
  productImageUrl,
  serialNumber,
  weightGrams,
  purityDisplay,
  altEn,
  altAr,
  lang,
}: BullionFrameProps) {
  const [imgError, setImgError] = useState(false)
  const alt = lang === 'ar' ? altAr : altEn
  const weightLabel = weightGrams ? `${weightGrams}g` : '—'

  return (
    <div className="bullion-frame relative mx-auto w-full max-w-[220px]">
      <div
        className="relative rounded-sm border-4 border-[#C9B87A] bg-[#FFFBF5] p-2 shadow-[inset_0_0_0_1px_#8B6914]"
        style={{
          boxShadow: 'inset 0 0 0 1px #8B6914, 0 4px 20px rgba(139,105,20,0.15)',
        }}
      >
        <div className="pointer-events-none absolute left-1 top-1 h-4 w-4 border-l-2 border-t-2 border-[#8B6914]" />
        <div className="pointer-events-none absolute right-1 top-1 h-4 w-4 border-r-2 border-t-2 border-[#8B6914]" />
        <div className="pointer-events-none absolute bottom-1 left-1 h-4 w-4 border-b-2 border-l-2 border-[#8B6914]" />
        <div className="pointer-events-none absolute bottom-1 right-1 h-4 w-4 border-b-2 border-r-2 border-[#8B6914]" />

        <div className="aspect-[4/5] overflow-hidden bg-stone-100">
          {productImageUrl && !imgError ? (
            <img
              src={productImageUrl}
              alt={alt}
              className="h-full w-full object-contain"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-amber-100 to-amber-200 px-3 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#8B6914]">Gold Standard</span>
              <span className="mt-2 text-lg font-bold text-[#0B0F19]">{weightLabel}</span>
              <span className="text-[10px] font-semibold text-stone-600">FINE GOLD · {purityDisplay}</span>
            </div>
          )}
        </div>

        <div className="mt-1 border-t border-[#C9B87A]/60 bg-[#0B0F19]/90 px-2 py-1.5 text-center">
          <p className="truncate font-mono text-[10px] font-bold tracking-wide text-[#F5E6B8]">{serialNumber}</p>
          <p className="text-[9px] text-stone-300">
            {weightLabel} · {purityDisplay}
          </p>
        </div>
      </div>
    </div>
  )
}
