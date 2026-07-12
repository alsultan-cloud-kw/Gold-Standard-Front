import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { productsApi, type ProductSearchSuggestResponse } from '@/services/api'
import { productImageSrc } from '@/utils/productImage'
import { cn } from '@/lib/utils'

type Props = {
  value: string
  category?: string | null
  onChange: (value: string) => void
  onCommit: (value: string) => void
  onClear: () => void
  className?: string
  autoFocus?: boolean
  /** Navbar overlay — larger touch targets, text-only clear, no duplicate dismiss controls */
  variant?: 'inline' | 'toolbar'
}

export function ProductSearchBox({
  value,
  category,
  onChange,
  onCommit,
  onClear,
  className,
  autoFocus = false,
  variant = 'inline',
}: Props) {
  const { t, i18n } = useTranslation()
  const isAr = i18n.language?.startsWith('ar')
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value.trim()), 280)
    return () => window.clearTimeout(id)
  }, [value])

  useEffect(() => {
    if (!autoFocus) return
    const id = window.requestAnimationFrame(() => inputRef.current?.focus())
    return () => window.cancelAnimationFrame(id)
  }, [autoFocus])

  const enabled = debounced.length >= 2

  const { data, isFetching } = useQuery({
    queryKey: ['product-suggest', debounced, category ?? ''],
    queryFn: () =>
      productsApi.suggestProducts({
        q: debounced,
        category: category || undefined,
        limit: 8,
      }),
    enabled,
    staleTime: 20_000,
  })

  const suggest = (data ?? null) as ProductSearchSuggestResponse | null
  const hasHits = Boolean(
    suggest &&
      (suggest.products.length > 0 ||
        suggest.suggestions.length > 0 ||
        suggest.did_you_mean),
  )
  const hasPanel = open && enabled && (hasHits || isFetching)

  const dismiss = () => {
    setOpen(false)
    inputRef.current?.blur()
  }

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null
      if (target && rootRef.current?.contains(target)) return
      setOpen(false)
      // Defer blur so the outside click still reaches its target.
      window.setTimeout(() => inputRef.current?.blur(), 0)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        dismiss()
      }
    }

    // Capture phase so parent stopPropagation cannot block dismiss.
    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dismiss closes over latest refs
  }, [open])

  const applyTerm = (term: string) => {
    onChange(term)
    onCommit(term)
    dismiss()
  }

  const isToolbar = variant === 'toolbar'

  return (
    <div
      ref={rootRef}
      className={cn(
        'product-search-box relative w-full max-w-md',
        isToolbar && 'product-search-box--toolbar',
        className,
      )}
      onBlur={(e) => {
        const next = e.relatedTarget as Node | null
        if (next && rootRef.current?.contains(next)) return
        setOpen(false)
      }}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onCommit(value.trim())
          dismiss()
        }}
      >
        <Search
          className={cn(
            'pointer-events-none absolute top-1/2 -translate-y-1/2 text-[#94A3B8]',
            isToolbar ? 'start-4 h-5 w-5' : 'start-3.5 h-4 w-4',
          )}
        />
        <input
          ref={inputRef}
          type="text"
          inputMode="search"
          enterKeyHint="search"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={t('productsPage.searchPlaceholder')}
          className={cn(
            'product-search-input w-full rounded-xl border border-black/10 bg-[var(--site-bg-muted)] font-medium text-[#0B0F19] outline-none transition focus:border-[#85E307] focus:bg-white focus:ring-2 focus:ring-[#85E307]/25',
            isToolbar
              ? 'min-h-[3rem] py-3.5 pe-[4.5rem] ps-12 text-base sm:min-h-[3.25rem] sm:rounded-2xl'
              : 'py-3 pe-10 ps-10 text-sm',
          )}
          aria-label={t('productsPage.searchPlaceholder')}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={hasPanel}
          autoComplete="off"
        />
        {value ? (
          <button
            type="button"
            onClick={() => {
              onClear()
              inputRef.current?.focus()
            }}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 font-semibold text-[#64748B] transition hover:text-[#0B0F19]',
              isToolbar
                ? 'end-3 rounded-lg px-2 py-1 text-xs sm:text-sm'
                : 'end-3 rounded-md p-1 text-[#94A3B8] hover:bg-black/5',
            )}
            aria-label={t('productsPage.clearSearch')}
          >
            {isToolbar ? t('productsPage.clearSearchShort') : <X className="h-4 w-4" />}
          </button>
        ) : null}
      </form>

      {hasPanel && (suggest || isFetching) ? (
        <div
          id={listId}
          role="listbox"
          className={cn(
            'product-search-panel absolute inset-x-0 z-40 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_18px_40px_-16px_rgba(11,15,25,0.35)]',
            isToolbar ? 'top-[calc(100%+0.625rem)]' : 'top-[calc(100%+0.4rem)]',
          )}
        >
          {suggest?.did_you_mean ? (
            <button
              type="button"
              onClick={() => applyTerm(suggest.did_you_mean!)}
              className="flex w-full items-center gap-2 border-b border-black/5 px-4 py-3 text-start text-sm text-[#0B0F19] hover:bg-[#ECFCCB]/50 sm:px-4"
            >
              <span className="text-[#64748B]">{t('productsPage.didYouMean')}</span>
              <span className="font-semibold text-[#3F6F00]">{suggest.did_you_mean}</span>
            </button>
          ) : null}

          {suggest && suggest.suggestions.length > 0 ? (
            <div className="border-b border-black/5 px-4 py-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#3F6F00]">
                {t('productsPage.searchSuggestions')}
              </p>
              <div className="flex flex-wrap gap-2">
                {suggest.suggestions.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => applyTerm(term)}
                    className="rounded-full border border-black/10 bg-[var(--site-bg-muted)] px-3 py-1.5 text-sm font-medium text-[#0B0F19] transition hover:border-[#85E307]/50 hover:bg-[#ECFCCB]/60"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {suggest && suggest.products.length > 0 ? (
            <ul className="max-h-[min(18rem,50dvh)] overflow-y-auto py-1.5 sm:max-h-72">
              {suggest.products.map((p) => {
                const label = isAr && p.name_ar ? p.name_ar : p.name_en
                const img = productImageSrc(p)
                return (
                  <li key={p.id} role="option">
                    <Link
                      to={`/products/${p.slug}`}
                      onClick={() => dismiss()}
                      className="flex items-center gap-3.5 px-4 py-3 transition hover:bg-[#ECFCCB]/55 sm:gap-4"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#F4F4F5] sm:h-11 sm:w-11 sm:rounded-lg">
                        {img ? (
                          <img src={img} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Search className="h-4 w-4 text-[#94A3B8]" />
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] font-semibold leading-snug text-[#0B0F19] sm:text-sm">
                          {label}
                        </span>
                        <span className="mt-0.5 hidden truncate text-xs text-[#64748B] sm:block" dir="ltr">
                          {p.sku}
                        </span>
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          ) : null}

          {isFetching && (!suggest || suggest.products.length === 0) ? (
            <p className="px-4 py-3 text-sm text-[#94A3B8]">{t('common.loading')}</p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              onCommit(value.trim())
              dismiss()
            }}
            className="flex w-full items-center justify-center border-t border-black/5 px-4 py-3.5 text-sm font-semibold text-[#3F6F00] hover:bg-[#ECFCCB]/40"
          >
            {t('productsPage.searchAllFor', { query: value.trim() })}
          </button>
        </div>
      ) : null}
    </div>
  )
}
