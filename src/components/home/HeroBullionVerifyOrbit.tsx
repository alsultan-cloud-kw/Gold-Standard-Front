import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import gsap from 'gsap'
import { Blocks, QrCode, Shield, Stamp, BadgeCheck, FileCheck2, type LucideIcon } from 'lucide-react'

type OrbitKey = 'blockchain' | 'qr' | 'hologram' | 'companyStamp' | 'ministry' | 'receipt'

const ORBIT_ITEMS: ReadonlyArray<{
  key: OrbitKey
  Icon: LucideIcon
}> = [
  { key: 'receipt', Icon: FileCheck2 },
  { key: 'blockchain', Icon: Blocks },
  { key: 'qr', Icon: QrCode },
  { key: 'ministry', Icon: BadgeCheck },
  { key: 'companyStamp', Icon: Stamp },
  { key: 'hologram', Icon: Shield },
]

/**
 * Six verification chips distributed around the hero bar (3×3 ring, center open).
 */
export function HeroBullionVerifyOrbit() {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLUListElement | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px)', () => {
      const ctx = gsap.context(() => {
        const chips = gsap.utils.toArray<HTMLElement>('.hero-orbit__chip', root)
        gsap.set(chips, { autoAlpha: 1 })
        chips.forEach((chip, i) => {
          gsap.to(chip, {
            y: i % 2 === 0 ? -5 : 4,
            duration: 2.8 + (i % 3) * 0.4,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: i * 0.22,
          })
        })
      }, root)
      return () => ctx.revert()
    })

    mm.add('(prefers-reduced-motion: no-preference) and (max-width: 1023px)', () => {
      const ctx = gsap.context(() => {
        const chips = gsap.utils.toArray<HTMLElement>('.hero-orbit__chip', root)
        gsap.set(chips, { autoAlpha: 1, y: 0 })
        chips.forEach((chip, i) => {
          gsap.to(chip, {
            y: i % 2 === 0 ? -2 : 2,
            duration: 3.2 + (i % 3) * 0.35,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: i * 0.18,
          })
        })
      }, root)
      return () => ctx.revert()
    })

    return () => mm.revert()
  }, [])

  return (
    <ul ref={rootRef} className="hero-orbit" aria-label={t('home.heroOrbit.ariaLabel')}>
      {ORBIT_ITEMS.map(({ key, Icon }) => (
        <li key={key} className={`hero-orbit__slot hero-orbit__slot--${key}`}>
          <div
            className="hero-orbit__chip"
            title={t(`home.securityTrust.methods.${key}.title`)}
          >
            <span className="hero-orbit__icon" aria-hidden="true">
              <Icon strokeWidth={1.75} />
            </span>
            <span className="hero-orbit__label">{t(`home.heroOrbit.${key}`)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
