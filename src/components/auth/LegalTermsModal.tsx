import { useTranslation } from 'react-i18next'
import { getCombinedLegalClauses } from '@/content/legalDocs'
import { GS_CONTACT } from '@/constants/contact'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Scrollable terms + privacy — keeps register form state intact. */
export function LegalTermsModal({ open, onOpenChange }: Props) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.dir() === 'rtl'
  const clauses = getCombinedLegalClauses(i18n.language)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(90vh,720px)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-xl"
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        <DialogHeader className="border-b border-black/10 px-5 py-4 text-start">
          <DialogTitle className="text-lg font-bold text-[#0B0F19]">
            {t('legal.combined.pageTitle')}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#64748B]">
            {t('legal.combined.subtitle')}
          </DialogDescription>
        </DialogHeader>
        <ol className="min-h-0 flex-1 list-none space-y-3 overflow-y-auto p-5">
          {clauses.map((clause, index) => (
            <li
              key={index}
              className="rounded-xl border border-black/10 bg-[#F9F9FA] p-4"
            >
              <div className="mb-2 flex items-start gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#0B0F19] font-mono text-[10px] font-bold text-[#85E307]">
                  {index + 1}
                </span>
                {clause.title ? (
                  <h3 className="pt-0.5 text-sm font-bold text-[#0B0F19]">{clause.title}</h3>
                ) : null}
              </div>
              <p className="text-xs leading-relaxed text-[#64748B]">{clause.text}</p>
            </li>
          ))}
        </ol>
        <p className="border-t border-black/10 px-5 py-3 text-center text-xs text-[#64748B]">
          {t('legal.combined.contactHint')}{' '}
          <a href={`mailto:${GS_CONTACT.email}`} className="font-semibold text-[#3F6F00]">
            {GS_CONTACT.email}
          </a>
        </p>
      </DialogContent>
    </Dialog>
  )
}
