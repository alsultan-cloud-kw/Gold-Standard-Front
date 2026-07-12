import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { isTurnstileConfigured, turnstileSiteKey } from '@/lib/turnstile'

declare global {
  interface Window {
    turnstile?: {
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
}

const SCRIPT_ID = 'cf-turnstile-script'
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
const MAX_ERROR_RETRIES = 2

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve()

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed')), {
        once: true,
      })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = SCRIPT_ID
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Turnstile script failed'))
    document.body.appendChild(script)
  })
}

const TurnstileWidget = forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget({ onToken, onExpire, onError, theme = 'auto' }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const onTokenRef = useRef(onToken)
    const onExpireRef = useRef(onExpire)
    const onErrorRef = useRef(onError)
    const errorRetriesRef = useRef(0)
    const retryTimerRef = useRef<number | null>(null)

    onTokenRef.current = onToken
    onExpireRef.current = onExpire
    onErrorRef.current = onError

    useImperativeHandle(ref, () => ({
      reset: () => {
        errorRetriesRef.current = 0
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
        }
      },
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
          retry: 'auto',
          'refresh-expired': 'auto',
          callback: (token) => {
            errorRetriesRef.current = 0
            onTokenRef.current(token)
          },
          'expired-callback': () => onExpireRef.current?.(),
          'error-callback': () => {
            onErrorRef.current?.()
            if (errorRetriesRef.current >= MAX_ERROR_RETRIES) return
            errorRetriesRef.current += 1
            if (retryTimerRef.current) window.clearTimeout(retryTimerRef.current)
            retryTimerRef.current = window.setTimeout(() => {
              if (!cancelled && widgetIdRef.current && window.turnstile) {
                window.turnstile.reset(widgetIdRef.current)
              }
            }, 900)
          },
        })
      }

      loadTurnstileScript()
        .then(renderWidget)
        .catch((err) => {
          console.error('Turnstile failed to load:', err)
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
    }, [theme])

    if (!isTurnstileConfigured) return null

    return <div ref={containerRef} className="flex min-h-[65px] justify-center" aria-hidden={false} />
  },
)

export default TurnstileWidget
