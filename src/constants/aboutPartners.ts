import wathaqLogo from '@/assets/partners/wathaq-logo.png'
import sultanGoldLogo from '@/assets/partners/sultan-gold.png'
import burganLogo from '@/assets/partners/burgan.png'
import cbkLogo from '@/assets/partners/cbk.png'
import openSanctionsLogo from '@/assets/partners/opensanctions-logo.svg'

export type AboutPartnerId = 'wathaq' | 'sultanGold' | 'burgan' | 'cbk' | 'openSanctions'

export type AboutPartner = {
  id: AboutPartnerId
  href: string
  logoSrc: string
  logoClassName?: string
  logoBgClassName?: string
  featured?: boolean
}

export const ABOUT_PARTNERS: AboutPartner[] = [
  {
    id: 'wathaq',
    href: 'https://wethaqlaw.com/',
    logoSrc: wathaqLogo,
    logoBgClassName: 'bg-[#0B0F19]',
    logoClassName: 'h-9 sm:h-10 max-w-[90%]',
  },
  {
    id: 'sultanGold',
    href: 'https://www.sultangold.net/',
    logoSrc: sultanGoldLogo,
    logoBgClassName: 'bg-[#F9F9FA]',
    logoClassName: 'h-11 sm:h-12',
  },
  {
    id: 'burgan',
    href: 'https://www.burgan.com/',
    logoSrc: burganLogo,
    logoBgClassName: 'bg-white',
    logoClassName: 'h-12 sm:h-14 max-w-[85%] object-contain',
  },
  {
    id: 'cbk',
    href: 'https://www.cbk.com/',
    logoSrc: cbkLogo,
    logoBgClassName: 'bg-white',
    logoClassName: 'h-10 sm:h-12 max-w-[90%] object-contain',
  },
  {
    id: 'openSanctions',
    href: 'https://www.opensanctions.org/',
    logoSrc: openSanctionsLogo,
    logoBgClassName: 'bg-white',
    logoClassName: 'h-8 sm:h-9 max-w-[92%] object-contain',
  },
]
