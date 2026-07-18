import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Blocks, QrCode, Shield, Stamp, BadgeCheck, FileCheck2, type LucideIcon } from 'lucide-react'
import { ensureGsap, useGSAP } from '@/motion/gsap'
import { MOTION } from '@/motion/tokens'

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
 * Ambient float is almost imperceptible — luxury weight, not decoration.
 */
export function HeroBullionVerifyOrbit() {
  const { t } = useTranslation()
  const rootRef = useRef<HTMLUListElement | null>(null)
  const { gsap } = ensureGsap()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(prefers-reduced-motion: no-preference) and (min-width: 1024px)', () => {
        const chips = gsap.utils.toArray<HTMLElement>('.hero-orbit__chip')
        gsap.set(chips, { autoAlpha: 1 })
        chips.forEach((chip, i) => {
          gsap.to(chip, {
            y: i % 2 === 0 ? -3 : 2.5,
            duration: MOTION.duration.ambient + (i % 3) * 0.35,
            ease: MOTION.ease.sine,
            yoyo: true,
            repeat: -1,
            delay: i * 0.2,
          })
        })
      })

      mm.add('(prefers-reduced-motion: no-preference) and (max-width: 1023px)', () => {
        const chips = gsap.utils.toArray<HTMLElement>('.hero-orbit__chip')
        gsap.set(chips, { autoAlpha: 1, y: 0 })
        chips.forEach((chip, i) => {
          gsap.to(chip, {
            y: i % 2 === 0 ? -1.5 : 1.5,
            duration: MOTION.duration.ambient + 0.4 + (i % 3) * 0.3,
            ease: MOTION.ease.sine,
            yoyo: true,
            repeat: -1,
            delay: i * 0.16,
          })
        })
      })

      return () => mm.revert()
    },
    { scope: rootRef },
  )

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
