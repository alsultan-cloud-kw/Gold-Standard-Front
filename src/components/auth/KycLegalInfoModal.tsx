import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const LEGAL_LINKS = {
  law106:
    'https://www.moj.gov.kw/AR/Documents/MojDocs/%D9%82%D8%A7%D9%86%D9%88%D9%86%20%D8%B1%D9%82%D9%85106%20%D9%84%D8%B3%D9%86%D8%A9%202013%20%D8%A8%D8%B4%D8%A3%D9%86%20%D9%85%D9%83%D8%A7%D9%81%D8%AD%D8%A9%20%D8%BA%D8%B3%D9%8A%D9%84%20%D8%A7%D9%84%D8%A3%D9%85%D9%88%D8%A7%D9%84%20%D9%88%20%D8%AA%D9%85%D9%88%D9%8A%D9%84%20%D8%A7%D9%84%D8%A5%D8%B1%D9%87%D8%A7%D8%A8.pdf',
  decree76: 'https://www.kuna.net.kw/ArticleDetails.aspx?id=3249345',
  cbk: 'https://www.cbk.gov.kw/en/images/expart4-118687_v110_tcm10-118687.pdf',
} as const

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function KycLegalInfoModal({ open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const dealerBullets = t('auth.kyc.legal.goldDealerBullets', {
    returnObjects: true,
  }) as string[]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(88dvh,42rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b border-stone-200 px-5 py-4 text-start">
          <DialogTitle className="text-base font-bold text-[#0B0F19]">
            {t('auth.kyc.legal.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 text-sm leading-relaxed text-[#334155]">
          <p className="text-[#0B0F19]">{t('auth.kyc.legal.intro')}</p>

          <h4 className="mt-5 text-sm font-bold text-[#0B0F19]">
            {t('auth.kyc.legal.mainFrameworkTitle')}
          </h4>
          <ul className="mt-2 list-disc space-y-3 ps-5">
            <li>
              {t('auth.kyc.legal.law106Body')}{' '}
              <a
                href={LEGAL_LINKS.law106}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#3F6F00] underline-offset-2 hover:underline"
              >
                {t('auth.kyc.legal.linkLaw106')}
              </a>
            </li>
            <li>
              {t('auth.kyc.legal.decree76Body')}{' '}
              <a
                href={LEGAL_LINKS.decree76}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#3F6F00] underline-offset-2 hover:underline"
              >
                {t('auth.kyc.legal.linkDecree76')}
              </a>
            </li>
          </ul>

          <h4 className="mt-5 text-sm font-bold text-[#0B0F19]">
            {t('auth.kyc.legal.goldDealersTitle')}
          </h4>
          <p className="mt-2">{t('auth.kyc.legal.goldDealersIntro')}</p>
          <ul className="mt-2 list-disc space-y-2 ps-5">
            {Array.isArray(dealerBullets)
              ? dealerBullets.map((line) => <li key={line}>{line}</li>)
              : null}
          </ul>

          <p className="mt-4">
            {t('auth.kyc.legal.centralBankBody')}{' '}
            <a
              href={LEGAL_LINKS.cbk}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#3F6F00] underline-offset-2 hover:underline"
            >
              {t('auth.kyc.legal.linkCbk')}
            </a>
          </p>

          <h4 className="mt-5 text-sm font-bold text-[#0B0F19]">
            {t('auth.kyc.legal.penaltiesTitle')}
          </h4>
          <p className="mt-2">{t('auth.kyc.legal.penaltiesBody')}</p>
        </div>
        <div className="shrink-0 border-t border-stone-200 px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-xl bg-[#85E307] py-2.5 text-sm font-bold text-[#0B0F19]"
          >
            {t('auth.kyc.legal.close')}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function KycKnowMoreButton({ className }: { className?: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          'text-sm font-semibold text-[#3F6F00] underline-offset-2 hover:underline'
        }
      >
        {t('auth.kyc.legal.knowMore')}
      </button>
      <KycLegalInfoModal open={open} onOpenChange={setOpen} />
    </>
  )
}
