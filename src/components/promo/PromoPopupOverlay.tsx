import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Timer, X } from 'lucide-react'
import { handpriceDiscountApi, promoPopupApi } from '@/services/api'
import { resolvePromoCtaForWeb } from '@/lib/promoDestinations'
import {
  dismissPromoPopup,
  shouldShowPromoPopup,
  type PromoLayout,
  type PromoPopupPublic,
} from '@/lib/promoPopup'

function pad(n: number) {
  return String(Math.max(0, n)).padStart(2, '0')
}

function useCountdown(endsAt?: string | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!endsAt) return
    const t = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(t)
  }, [endsAt])
  return useMemo(() => {
    if (!endsAt) return { h: 0, m: 0, s: 0 }
    const diff = Math.max(0, new Date(endsAt).getTime() - now)
    const total = Math.floor(diff / 1000)
    return { h: Math.floor(total / 3600), m: Math.floor((total % 3600) / 60), s: total % 60 }
  }, [endsAt, now])
}

function CountdownFeature({
  accent,
  muted,
  text,
  subtitle,
  h,
  m,
  s,
  isAr,
}: {
  accent: string
  muted: string
  text: string
  subtitle: string
  h: number
  m: number
  s: number
  isAr: boolean
}) {
  const units = isAr
    ? [
        { value: pad(h), label: 'ساعة' },
        { value: pad(m), label: 'دقيقة' },
        { value: pad(s), label: 'ثانية' },
      ]
    : [
        { value: pad(h), label: 'HRS' },
        { value: pad(m), label: 'MIN' },
        { value: pad(s), label: 'SEC' },
      ]

  return (
    <div className="flex min-w-0 flex-col items-center px-0.5 text-center">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10"
        style={{ background: 'rgba(255,255,255,0.06)', color: accent }}
      >
        <Timer className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="mt-1.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: muted }}>
        {subtitle}
      </div>
      <div className="mt-1.5 flex items-start justify-center gap-1">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-start gap-1">
            <div className="flex flex-col items-center">
              <span
                className="font-mono text-base font-black leading-none tabular-nums sm:text-lg"
                style={{ color: text }}
              >
                {u.value}
              </span>
              <span
                className="mt-0.5 text-[8px] font-semibold uppercase tracking-wider"
                style={{ color: muted }}
              >
                {u.label}
              </span>
            </div>
            {i < units.length - 1 ? (
              <span className="font-mono text-base font-black leading-none" style={{ color: text }}>
                :
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PromoPopupOverlay() {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const isAr = (i18n.language || 'en').startsWith('ar')
  const { data } = useQuery({
    queryKey: ['promoPopup', 'website'],
    queryFn: () => promoPopupApi.getPublic('website'),
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  })
  const [open, setOpen] = useState(false)
  const [payload, setPayload] = useState<PromoPopupPublic | null>(null)

  useEffect(() => {
    if (!data) return
    if (shouldShowPromoPopup(data)) {
      setPayload(data)
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [data])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || !payload?.layout || typeof document === 'undefined') return null

  const layout = payload.layout
  const close = () => {
    dismissPromoPopup(payload)
    setOpen(false)
  }

  return createPortal(
    <PromoCard
      layout={layout}
      isAr={isAr}
      localeMode={payload.locale_mode || layout.direction || 'auto'}
      onClose={close}
      onCta={(cta) => {
        void (async () => {
          const resolved = resolvePromoCtaForWeb(cta)
          if (resolved.kind === 'dismiss') {
            close()
            return
          }
          if (resolved.kind === 'apply_discount') {
            try {
              await handpriceDiscountApi.apply(resolved.code, 'website', 'promo')
            } catch {
              /* still dismiss; checkout will re-validate */
            }
            close()
            navigate('/products')
            return
          }
          if (resolved.kind === 'external') {
            window.open(resolved.url, '_blank', 'noopener,noreferrer')
          } else {
            navigate(resolved.path)
          }
          close()
        })()
      }}
    />,
    document.body,
  )
}

function PromoCard({
  layout,
  isAr,
  localeMode,
  onClose,
  onCta,
}: {
  layout: PromoLayout
  isAr: boolean
  localeMode: string
  onClose: () => void
  onCta: (cta: {
    destination?: string
    productSlug?: string
    discountCode?: string
    href?: string
  }) => void
}) {
  const dir =
    localeMode === 'auto' || layout.direction === 'auto'
      ? isAr
        ? 'rtl'
        : 'ltr'
      : localeMode === 'rtl' || layout.direction === 'rtl'
        ? 'rtl'
        : 'ltr'
  const c = {
    panel: layout.colors?.panel || '#0B0F19',
    accent: layout.colors?.accent || '#85E307',
    text: layout.colors?.text || '#FFFFFF',
    muted: layout.colors?.muted || '#94A3B8',
    divider: layout.colors?.divider || '#1E293B',
  }
  const bg = layout.background || { type: 'gradient' as const, colors: ['#0a0a0a', '#111111'] }
  const countdownItem = layout.featureItems?.find((f) => f.kind === 'countdown')
  const cd = useCountdown(countdownItem?.countdownEndsAt)
  const pick = (en?: string, ar?: string) => (isAr ? ar || en || '' : en || ar || '')

  let backgroundStyle: CSSProperties = { background: c.panel }
  if (bg.type === 'solid') backgroundStyle = { background: bg.colors?.[0] || c.panel }
  else if (bg.type === 'gradient') {
    backgroundStyle = {
      background: `linear-gradient(180deg, ${bg.colors?.[0] || '#0a0a0a'} 0%, ${bg.colors?.[1] || '#111'} 100%)`,
    }
  } else if (bg.type === 'image' && bg.imageUrl) {
    backgroundStyle = {
      backgroundImage: `linear-gradient(rgba(0,0,0,${bg.overlayOpacity ?? 0.35}), rgba(0,0,0,${bg.overlayOpacity ?? 0.35})), url(${bg.imageUrl})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[92vh] w-full max-w-md overflow-y-auto rounded-3xl shadow-2xl"
        style={{ ...backgroundStyle, color: c.text }}
        dir={dir}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute end-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{
            background: `radial-gradient(ellipse 80% 100% at 50% 0%, ${c.accent}44, transparent 70%)`,
          }}
        />
        <div className="relative space-y-4 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-2 pe-10">
            {(layout.badges || []).map((b, i) => {
              const text = pick(b.text, b.textAr)
              if (b.shape === 'circle') {
                return (
                  <div
                    key={i}
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full px-1 text-center text-[10px] font-black leading-tight"
                    style={{ background: b.bg || c.accent, color: b.fg || '#0B0F19' }}
                  >
                    {text}
                  </div>
                )
              }
              return (
                <div
                  key={i}
                  className="inline-flex items-center rounded-md px-2.5 py-1 text-[11px] font-black uppercase tracking-wide"
                  style={{ background: b.bg || c.accent, color: b.fg || '#0B0F19' }}
                >
                  {text}
                </div>
              )
            })}
          </div>

          <div style={{ textAlign: layout.header?.align === 'center' ? 'center' : 'start' }}>
            <h2 className="text-2xl font-black leading-tight sm:text-3xl">
              <span>{pick(layout.header?.title, layout.header?.titleAr)} </span>
              <span style={{ color: c.accent }}>
                {pick(layout.header?.titleAccent, layout.header?.titleAccentAr)}
              </span>
            </h2>
            <p className="mt-2 text-sm leading-relaxed" style={{ color: c.muted }}>
              {pick(layout.header?.body, layout.header?.bodyAr)}
            </p>
          </div>

          {layout.hero?.imageUrl ? (
            <img
              src={layout.hero.imageUrl}
              alt=""
              className="mx-auto max-h-48 w-full rounded-2xl object-contain"
            />
          ) : null}

          <div className="grid grid-cols-3 gap-1 border-y py-4" style={{ borderColor: c.divider }}>
            {(layout.featureItems || []).slice(0, 3).map((f, i) =>
              f.kind === 'countdown' ? (
                <CountdownFeature
                  key={i}
                  accent={c.accent}
                  muted={c.muted}
                  text={c.text}
                  subtitle={pick(f.subtitle, f.subtitleAr)}
                  h={cd.h}
                  m={cd.m}
                  s={cd.s}
                  isAr={isAr}
                />
              ) : (
                <div key={i} className="min-w-0 px-1 text-center">
                  <div className="text-[10px] font-bold uppercase" style={{ color: c.accent }}>
                    {f.icon || '•'}
                  </div>
                  <div
                    className="mt-1 text-[9px] font-bold uppercase tracking-wide"
                    style={{ color: c.muted }}
                  >
                    {pick(f.subtitle, f.subtitleAr)}
                  </div>
                  <div className="mt-1 text-xs font-bold leading-tight">{pick(f.title, f.titleAr)}</div>
                  <div className="text-[10px] leading-snug" style={{ color: c.muted }}>
                    {pick(f.body, f.bodyAr)}
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="space-y-2">
            {(layout.ctas || []).map((cta, i) => {
              const label = pick(cta.label, cta.labelAr)
              if (cta.style === 'ghost' || cta.destination === 'dismiss') {
                return (
                  <button
                    key={i}
                    type="button"
                    className="w-full py-2 text-sm font-semibold"
                    style={{ color: c.accent }}
                    onClick={() => onCta(cta)}
                  >
                    {label}
                  </button>
                )
              }
              return (
                <button
                  key={i}
                  type="button"
                  className="w-full rounded-xl py-3 text-sm font-black uppercase tracking-wide"
                  style={{
                    background: c.accent,
                    color: '#0B0F19',
                    boxShadow: cta.effect === 'glow' ? `0 0 28px ${c.accent}66` : undefined,
                  }}
                  onClick={() => onCta(cta)}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <div className="grid grid-cols-4 gap-2">
            {(layout.trustIcons || []).map((t, i) => (
              <div key={i} className="text-center">
                <div className="text-xs" style={{ color: c.accent }}>
                  {t.icon || '•'}
                </div>
                <div className="mt-0.5 text-[9px] leading-tight" style={{ color: c.muted }}>
                  {pick(t.label, t.labelAr)}
                </div>
              </div>
            ))}
          </div>

          {(layout.footer?.text || layout.footer?.textAr) && (
            <p className="text-center text-[11px]" style={{ color: c.muted }}>
              {pick(layout.footer?.text, layout.footer?.textAr)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
