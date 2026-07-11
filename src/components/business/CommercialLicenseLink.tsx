import { useState, type ReactNode } from 'react'
import { CommercialLicensePreviewModal } from '@/components/business/CommercialLicensePreviewModal'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  className?: string
}

/** Opens the commercial licence PDF preview modal. */
export function CommercialLicenseLink({ children, className }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-0.5 font-semibold text-[#3F6F00] underline-offset-2 transition-colors hover:text-[#4F8E00] hover:underline',
          className,
        )}
      >
        {children}
      </button>
      <CommercialLicensePreviewModal open={open} onOpenChange={setOpen} />
    </>
  )
}
