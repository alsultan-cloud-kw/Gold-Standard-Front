import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type AuthFlowStep = {
  id: string
  label: string
}

type Props = {
  title: string
  subtitle?: string
  steps?: AuthFlowStep[]
  currentStepId?: string
  children: ReactNode
  footer?: ReactNode
  className?: string
}

/**
 * Shared chrome for Clerk-like multi-step auth (register / sign-in / verify).
 * Light storefront card — matches Gold Standard theme.
 */
export function AuthFlowShell({
  title,
  subtitle,
  steps,
  currentStepId,
  children,
  footer,
  className,
}: Props) {
  const currentIndex = steps?.findIndex((s) => s.id === currentStepId) ?? -1
  const progressPct =
    steps && steps.length > 0 && currentIndex >= 0
      ? Math.round(((currentIndex + 1) / steps.length) * 100)
      : null

  return (
    <div className={cn('min-h-screen bg-[var(--site-bg)] py-10 sm:py-16', className)}>
      <div className="page-shell page-shell--form">
        <div className="mx-auto mb-6 max-w-md text-center sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-[#0B0F19] sm:text-3xl">{title}</h1>
          {subtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-[#64748B] sm:text-base">{subtitle}</p>
          ) : null}
        </div>

        <div className="mx-auto max-w-md overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
          {steps && steps.length > 1 && currentIndex >= 0 ? (
            <div className="border-b border-black/5 px-5 pb-4 pt-5 sm:px-6">
              <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748B]">
                <span>
                  {currentIndex + 1}/{steps.length}
                </span>
                <span className="truncate text-[#0B0F19] normal-case tracking-normal">
                  {steps[currentIndex]?.label}
                </span>
                <span className="tabular-nums">{progressPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#E8EBE3]">
                <div
                  className="h-full rounded-full bg-[#85E307] transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : null}

          <div className="p-5 sm:p-6">{children}</div>

          {footer ? (
            <div className="border-t border-black/5 px-5 py-4 text-center text-sm text-[#64748B] sm:px-6">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
