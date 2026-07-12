type GsiCredentialResponse = {
  credential: string
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void
          prompt: (listener?: (notification: unknown) => void) => void
          cancel: () => void
        }
      }
    }
  }
}

let gsiLoadPromise: Promise<void> | null = null
let gsiInitializedClientId: string | null = null
let gsiPromptInFlight = false

export function loadGoogleGsiScript(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (gsiLoadPromise) return gsiLoadPromise

  gsiLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="accounts.google.com/gsi/client"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('gsi_load_failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('gsi_load_failed'))
    document.head.appendChild(script)
  })

  return gsiLoadPromise
}

export function cancelGoogleOneTap(): void {
  gsiPromptInFlight = false
  try {
    window.google?.accounts?.id?.cancel()
  } catch {
    // ignore
  }
}

type ClerkOneTapClient = {
  authenticateWithGoogleOneTap: (params: { token: string }) => Promise<{ createdSessionId?: string | null }>
  setActive: (params: { session: string }) => Promise<unknown>
}

/** Native Google Identity Services One Tap (single initialize per client ID). */
export async function promptGoogleOneTap(
  clientId: string,
  clerk: ClerkOneTapClient,
  onMoment?: (moment: { type: 'displayed' | 'unavailable'; reason?: string }) => void,
): Promise<void> {
  if (gsiPromptInFlight) return

  await loadGoogleGsiScript()
  if (!window.google?.accounts?.id) {
    onMoment?.({ type: 'unavailable', reason: 'gsi_unavailable' })
    return
  }

  if (gsiInitializedClientId !== clientId) {
    window.google.accounts.id.initialize({
      client_id: clientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      context: 'signin',
      use_fedcm_for_prompt: true,
      itp_support: true,
      callback: async (response: GsiCredentialResponse) => {
        try {
          const result = await clerk.authenticateWithGoogleOneTap({ token: response.credential })
          const sessionId = result?.createdSessionId
          if (sessionId) {
            await clerk.setActive({ session: sessionId })
          }
        } catch (err) {
          console.error('Google One Tap → Clerk failed:', err)
        }
      },
    })
    gsiInitializedClientId = clientId
  }

  gsiPromptInFlight = true
  try {
    // FedCM: avoid deprecated moment notification methods (isDisplayed, etc.).
    window.google.accounts.id.prompt()
    onMoment?.({ type: 'displayed' })
  } catch (err) {
    gsiPromptInFlight = false
    onMoment?.({ type: 'unavailable', reason: 'prompt_failed' })
    throw err
  }
}

export function hasNativeGoogleClientId(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim())
}
