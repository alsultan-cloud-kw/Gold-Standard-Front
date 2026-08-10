import { useTranslation } from 'react-i18next'
import knetBadge from '@/assets/trust/knet-badge.png'
import hallmarkBadge from '@/assets/trust/badge-hallmark.png'
import vaultBadge from '@/assets/trust/badge-vault.png'
import serialBadge from '@/assets/trust/badge-serial.png'
import encryptedBadge from '@/assets/trust/badge-encrypted.png'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

/**
 * KNET-style trust stack for the dark footer:
 * payment mark + short line, then gold-industry / security badges.
 */
export function FooterTrustStrip({ className }: Props) {
  const { t } = useTranslation()

  const badges = [
    { src: hallmarkBadge, altKey: 'footer.trustBadgeHallmarkAlt' },
    { src: vaultBadge, altKey: 'footer.trustBadgeVaultAlt' },
    { src: serialBadge, altKey: 'footer.trustBadgeSerialAlt' },
    { src: encryptedBadge, altKey: 'footer.trustBadgeEncryptedAlt' },
  ] as const

  return (
    <div className={cn('mt-6 max-w-sm text-start', className)}>
      <div className="flex flex-col gap-2">
        <img
          src={knetBadge}
          alt={t('checkoutPage.trustKnetAlt')}
          className="h-8 w-auto max-w-[7.5rem] object-contain object-left"
          loading="lazy"
          decoding="async"
        />
        <p className="text-xs leading-relaxed text-white/55">{t('footer.trustGatewayLine')}</p>
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-2.5" aria-label={t('footer.trustBadgesLabel')}>
        {badges.map((badge) => (
          <li key={badge.altKey}>
            <img
              src={badge.src}
              alt={t(badge.altKey)}
              className="h-auto w-full rounded-lg object-contain"
              loading="lazy"
              decoding="async"
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
