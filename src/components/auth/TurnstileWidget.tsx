import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { isTurnstileConfigured, turnstileSiteKey } from '@/lib/turnstile'
import { cn } from '@/lib/utils'

declare global {
  interface Window {
    turnstile?: {
      ready: (callback: () => void) => void
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          callback?: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          retry?: 'auto' | 'never'
          'refresh-expired'?: 'auto' | 'manual' | 'never'
          appearance?: 'always' | 'execute' | 'interaction-only'
        },
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
    }
  }
}

export type TurnstileWidgetHandle = {
  reset: () => void
}

type TurnstileWidgetProps = {
  onToken: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  theme?: 'light' | 'dark' | 'auto'
  className?: string
}

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const MAX_ERROR_RETRIES = 3

let turnstileScriptPromise: Promise<void> | null = null

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()
  if (turnstileScriptPromise) return turnstileScriptPromise

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    turnstileScriptPromise = new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), {
        once: true,
      })
    })
    return turnstileScriptPromise
  }

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Turnstile script failed'))
    document.head.appendChild(script)
  })

  return turnstileScriptPromise
}

function whenTurnstileReady(run: () => void): void {
  if (window.turnstile?.ready) {
    window.turnstile.ready(run)
    return
  }
  run()
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onToken, onExpire, onError, theme = 'auto', className }, ref) {
    const { t } = useTranslation()
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const onTokenRef = useRef(onToken)
    const onExpireRef = useRef(onExpire)
    const onErrorRef = useRef(onError)
    const errorRetriesRef = useRef(0)
    const retryTimerRef = useRef<number | null>(null)
    const [failed, setFailed] = useState(false)
    const [renderKey, setRenderKey] = useState(0)

    onTokenRef.current = onToken
    onExpireRef.current = onExpire
    onErrorRef.current = onError

    const hardReset = () => {
      errorRetriesRef.current = 0
      setFailed(false)
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
      setRenderKey((k) => k + 1)
    }

    useImperativeHandle(ref, () => ({
      reset: hardReset,
    }))

    useEffect(() => {
      if (!isTurnstileConfigured || !containerRef.current) return

      let cancelled = false

      const renderWidget = () => {
        if (cancelled || !containerRef.current || !window.turnstile) return

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: turnstileSiteKey,
          theme,
          appearance: 'always',
          retry: 'auto',
          'refresh-expired': 'auto',
          callback: (token) => {
            errorRetriesRef.current = 0
            setFailed(false)
            onTokenRef.current(token)
          },
          'expired-callback': () => {
            setFailed(false)
            onExpireRef.current?.()
          },
          'error-callback': () => {
            onErrorRef.current?.()
            if (errorRetriesRef.current >= MAX_ERROR_RETRIES) {
              setFailed(true)
              return
            }
            errorRetriesRef.current += 1
            if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current)
            retryTimerRef.current = window.setTimeout(() => {
              if (!cancelled && widgetIdRef.current && window.turnstile) {
                window.turnstile.reset(widgetIdRef.current)
              }
            }, 1200)
          },
        })
      }

      const mount = () => {
        whenTurnstileReady(() => {
          if (!cancelled) renderWidget()
        })
      }

      loadTurnstileScript()
        .then(() => {
          // Wait for layout paint so Turnstile iframe has dimensions (avoids 600010 on mobile).
          requestAnimationFrame(() => {
            requestAnimationFrame(mount)
          })
        })
        .catch((err) => {
          console.error('Turnstile failed to load:', err)
          setFailed(true)
          onErrorRef.current?.()
        })

      return () => {
        cancelled = true
        if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current)
          retryTimerRef.current = null
        }
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
      }
    }, [theme, renderKey])

    if (!isTurnstileConfigured) return null

    return (
      <div className={cn('space-y-2', className)}>
        <div ref={containerRef} className="flex min-h-[70px] justify-center" aria-hidden={false} />
        {failed ? (
          <div className="rounded-xl border border-black/8 bg-[#F9F9FA] px-3 py-2.5 text-center">
            <p className="text-xs text-[#64748B]">{t('auth.captchaFailed')}</p>
            <button
              type="button"
              onClick={hardReset}
              className="mt-2 text-xs font-semibold text-[#3F6F00] transition hover:text-[#4F8E00]"
            >
              {t('auth.retryCaptcha', { defaultValue: 'Retry verification' })}
            </button>
          </div>
        ) : null}
      </div>
    )
  },
)

export default TurnstileWidget
