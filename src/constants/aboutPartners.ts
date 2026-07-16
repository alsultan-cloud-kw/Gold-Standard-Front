import wathaqLogo from '@/assets/partners/wathaq-logo.png'
import sultanGoldLogo from '@/assets/partners/sultan-gold.png'
import kfhLogo from '@/assets/partners/kfh.jpg'

export type AboutPartnerId = 'wathaq' | 'sultanGold' | 'kfh'

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
    id: 'kfh',
    href: 'https://www.kfh.com/',
    logoSrc: kfhLogo,
    logoBgClassName: 'bg-white',
    logoClassName: 'h-9 sm:h-10',
  },
]
