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

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current)
        }
      },
    }))

    useEffect(() => {
      if (!isTurnstileConfigured || !containerRef.current) return

      let cancelled = false

      loadTurnstileScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return

          if (widgetIdRef.current) {
            window.turnstile.remove(widgetIdRef.current)
            widgetIdRef.current = null
          }

          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: turnstileSiteKey,
            theme,
            callback: (token) => onToken(token),
            'expired-callback': () => onExpire?.(),
            'error-callback': () => onError?.(),
          })
        })
        .catch((err) => {
          console.error('Turnstile failed to load:', err)
          onError?.()
        })

      return () => {
        cancelled = true
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        }
      }
    }, [onToken, onExpire, onError, theme])

    if (!isTurnstileConfigured) return null

    return <div ref={containerRef} className="flex justify-center min-h-[65px]" aria-hidden={false} />
  },
)

export default TurnstileWidget
