import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Radio } from 'lucide-react'
import { buildTickerReel, type TickerItem } from '@/lib/screeningTicker'

type Props = {
  sampleNames: string[]
}

function kindLabel(kind: TickerItem['kind'], t: (k: string) => string): string {
  return t(`customerScreening.ticker.kinds.${kind}`)
}

export function ScreeningLiveTicker({ sampleNames }: Props) {
  const { t } = useTranslation()

  const reel = useMemo(() => {
    const base = buildTickerReel(sampleNames)
    if (base.length === 0) return []
    return [...base, ...base]
  }, [sampleNames])

  if (reel.length === 0) return null

  return (
    <div
      className="relative z-20 overflow-hidden border-b border-black/[0.07] bg-[#0B0F19] text-white"
      role="status"
      aria-live="off"
      aria-label={t('customerScreening.ticker.aria')}
    >
      <div className="flex items-stretch">
        <div className="flex shrink-0 items-center gap-2 border-e border-white/10 bg-[#85E307] px-3 py-2.5 text-[#0B0F19] sm:px-4">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0B0F19]/45" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0B0F19]" />
          </span>
          <Radio className="hidden h-3.5 w-3.5 sm:block" strokeWidth={2.25} aria-hidden />
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] sm:text-xs">
            {t('customerScreening.ticker.live')}
          </span>
        </div>

        <div className="relative min-w-0 flex-1 overflow-hidden py-2.5">
          <div className="gs-screening-marquee flex w-max gap-8 whitespace-nowrap pe-8 ps-4">
            {reel.map((item, idx) => (
              <span
                key={`${item.id}-${idx}`}
                className="inline-flex items-center gap-2 text-sm sm:text-[15px]"
              >
                <span className="font-bold uppercase tracking-[0.12em] text-[#85E307]">
                  {kindLabel(item.kind, t)}
                </span>
                <span className="text-white/25" aria-hidden>
                  ·
                </span>
                <span className="font-medium text-white/90">{item.name}</span>
                <span className="text-white/20" aria-hidden>
                  ◆
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gs-screening-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .gs-screening-marquee {
          animation: gs-screening-marquee 42s linear infinite;
        }
        [dir="rtl"] .gs-screening-marquee {
          animation-name: gs-screening-marquee-rtl;
        }
        @keyframes gs-screening-marquee-rtl {
          from { transform: translateX(0); }
          to { transform: translateX(50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .gs-screening-marquee {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
