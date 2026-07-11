import { useTranslation } from 'react-i18next'
import { ExternalLink, FileText } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GS_BUSINESS } from '@/constants/businessCredentials'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|#|$)/i.test(url)
}

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(url)
}

export function CommercialLicensePreviewModal({ open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const documentUrl = GS_BUSINESS.licenseDocumentUrl

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[min(90vh,820px)] max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-black/10 px-5 py-4 text-start sm:px-6">
          <DialogTitle className="text-lg font-bold text-[#0B0F19]">
            {t('licenceModal.title')}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#64748B]">
            {t('licenceModal.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 bg-[#F4F4F5]">
          {documentUrl ? (
            isPdfUrl(documentUrl) ? (
              <iframe
                src={documentUrl}
                title={t('licenceModal.title')}
                className="h-full w-full border-0 bg-white"
              />
            ) : isImageUrl(documentUrl) ? (
              <img
                src={documentUrl}
                alt={t('licenceModal.title')}
                className="h-full w-full object-contain"
              />
            ) : (
              <iframe
                src={documentUrl}
                title={t('licenceModal.title')}
                className="h-full w-full border-0 bg-white"
              />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <FileText className="h-10 w-10 text-[#94A3B8]" strokeWidth={1.5} aria-hidden />
              <p className="max-w-sm text-sm leading-relaxed text-[#64748B]">
                {t('licenceModal.unavailable')}
              </p>
            </div>
          )}
        </div>

        {documentUrl ? (
          <DialogFooter className="border-t border-black/10 px-5 py-3 sm:px-6">
            <a
              href={documentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#3F6F00] transition-colors hover:text-[#4F8E00]"
            >
              {t('licenceModal.openNewTab')}
              <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
            </a>
          </DialogFooter>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
