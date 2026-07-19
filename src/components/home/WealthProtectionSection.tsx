import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowRight } from 'lucide-react'
import { HomeSectionHeader } from '@/components/home/HomeSectionHeader'
import { cn } from '@/lib/utils'

/** Replays enter animation every time the node scrolls into view. */
function useReplayOnView<T extends HTMLElement>(threshold = 0.3) {
  const ref = useRef<T | null>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setActive(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting)
      },
      { threshold, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold])

  return { ref, active }
}

function delayStyle(seconds: number): CSSProperties {
  return { '--reveal-delay': `${seconds}s` } as CSSProperties
}

/** Pyramid of CSS-drawn gold bars — bottom row first, growing upward. */
function GoldBarStack() {
  const rows = [3, 2, 1]

  return (
    <div className="flex h-28 flex-col-reverse items-center justify-start gap-1 sm:h-32">
      {rows.map((count, rowIndex) => (
        <div key={count} className="flex justify-center gap-1">
          {Array.from({ length: count }).map((_, barIndex) => (
            <div
              key={barIndex}
              className="wealth-duel__bar h-6 w-16 bg-[linear-gradient(180deg,#F9EBB4_0%,#E8C766_38%,#B8860B_100%)] shadow-[0_10px_18px_-6px_rgba(0,0,0,0.5)] [clip-path:polygon(12%_0,88%_0,100%_100%,0_100%)] sm:h-7 sm:w-20"
              style={delayStyle(0.25 + rowIndex * 0.18 + barIndex * 0.08)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/** Stack of banknotes that dissolve as they rise — value fading away. */
function CashNoteStack() {
  const notes = [
    { opacity: 1, tilt: -3, delay: 0.3 },
    { opacity: 0.55, tilt: 4, delay: 0.48 },
    { opacity: 0.24, tilt: -6, delay: 0.66 },
  ]

  return (
    <div className="flex h-28 flex-col-reverse items-center justify-start sm:h-32">
      {notes.map((note, index) => (
        <div
          key={index}
          className={cn(
            'wealth-duel__note relative h-9 w-24 rounded-md border border-white/15 bg-[linear-gradient(135deg,#66755F_0%,#4A5645_100%)] shadow-[0_8px_16px_-8px_rgba(0,0,0,0.55)] sm:h-10 sm:w-28',
            index > 0 && '-mt-3.5 sm:-mt-4',
          )}
          style={
            {
              ...delayStyle(note.delay),
              '--note-opacity': note.opacity,
              '--note-tilt': `${note.tilt}deg`,
            } as CSSProperties
          }
        >
          <span className="absolute inset-1 rounded-[4px] border border-dashed border-white/20" />
          <span className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25 sm:h-6 sm:w-6" />
        </div>
      ))}
    </div>
  )
}

type SideProps = {
  visual: React.ReactNode
  value: string
  valueClassName: string
  label: string
  caption: string
  baseDelay: number
}

function DuelSide({ visual, value, valueClassName, label, caption, baseDelay }: SideProps) {
  return (
    <div className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:gap-6 sm:px-10 sm:py-14">
      <div className="flex items-end">{visual}</div>

      <p
        className={cn(
          'wealth-duel__reveal text-5xl font-bold tabular-nums tracking-tight sm:text-6xl',
          valueClassName,
        )}
        style={delayStyle(baseDelay)}
      >
        {value}
      </p>

      <div className="wealth-duel__reveal" style={delayStyle(baseDelay + 0.12)}>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/50 sm:text-sm">{caption}</p>
      </div>
    </div>
  )
}

export function WealthProtectionSection() {
  const { t } = useTranslation()
  const { ref, active } = useReplayOnView<HTMLDivElement>(0.3)

  return (
    <section className="home-section home-section--compact" id="wealth-protection">
      <div className="home-section-inner">
        <HomeSectionHeader
          kicker={t('home.wealthProtection.kicker')}
          title={t('home.wealthProtection.title')}
          align="center"
        />

        <div
          ref={ref}
          className={cn(
            'wealth-duel relative overflow-hidden rounded-3xl bg-[#0B0F19] shadow-[0_24px_60px_-24px_rgba(11,15,25,0.55)]',
            active && 'is-active',
          )}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-28 start-[-4rem] h-80 w-80 rounded-full bg-[#E8C766]/[0.13] blur-3xl" />
            <div className="absolute -bottom-28 end-[-4rem] h-80 w-80 rounded-full bg-[#DC2626]/[0.07] blur-3xl" />
          </div>

          <div className="relative grid sm:grid-cols-2">
            <DuelSide
              visual={<GoldBarStack />}
              value={t('home.wealthProtection.gold.value')}
              valueClassName="bg-[linear-gradient(180deg,#F9EBB4,#D9AE45)] bg-clip-text text-transparent"
              label={t('home.wealthProtection.gold.label')}
              caption={t('home.wealthProtection.gold.caption')}
              baseDelay={0.75}
            />

            <div className="border-t border-white/[0.08] sm:border-s sm:border-t-0">
              <DuelSide
                visual={<CashNoteStack />}
                value={t('home.wealthProtection.cash.value')}
                valueClassName="text-[#F87171]"
                label={t('home.wealthProtection.cash.label')}
                caption={t('home.wealthProtection.cash.caption')}
                baseDelay={0.9}
              />
            </div>

            <span className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-[#0B0F19] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white/50 sm:inline-flex">
              {t('home.wealthProtection.vs')}
            </span>
          </div>

          <div className="relative flex flex-col items-center gap-4 border-t border-white/[0.08] px-6 py-8 sm:px-10">
            <Link
              to="/products"
              className="group inline-flex w-full max-w-md items-center justify-center gap-2 rounded-xl bg-[#85E307] px-8 py-4 text-base font-bold text-[#0B0F19] shadow-[0_12px_28px_-10px_rgba(133,227,7,0.45)] transition-all hover:bg-[#9BF52B] active:scale-[0.99] sm:w-auto sm:min-w-[300px]"
            >
              {t('home.wealthProtection.cta')}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </Link>

            <p className="text-[11px] text-white/35 sm:text-xs">
              {t('home.wealthProtection.footnote')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
