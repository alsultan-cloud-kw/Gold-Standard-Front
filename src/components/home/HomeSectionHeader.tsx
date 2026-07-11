import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

type Props = {
  kicker?: string
  title: string
  subtitle?: string
  linkTo?: string
  linkLabel?: string
  align?: 'start' | 'center'
}

export function HomeSectionHeader({
  kicker,
  title,
  subtitle,
  linkTo,
  linkLabel,
  align = 'start',
}: Props) {
  const centered = align === 'center'

  return (
    <header
      className={`section-header flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${
        centered ? 'text-center sm:text-center' : 'text-start'
      }`}
    >
      <div className={centered ? 'mx-auto max-w-2xl' : 'min-w-0'}>
        {kicker ? (
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-[#3F6F00]">
            {kicker}
          </p>
        ) : null}
        <h2 className="type-section-title text-[#0B0F19]">{title}</h2>
        {subtitle ? (
          <p className="type-lead mt-3 max-w-2xl text-[#64748B]">{subtitle}</p>
        ) : null}
      </div>

      {linkTo && linkLabel ? (
        <Link
          to={linkTo}
          className={`inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#3F6F00] hover:text-[#2d5200] transition-colors ${
            centered ? 'mx-auto sm:mx-auto' : 'self-start sm:self-auto'
          }`}
        >
          <span className="uppercase tracking-wide">{linkLabel}</span>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </Link>
      ) : null}
    </header>
  )
}
