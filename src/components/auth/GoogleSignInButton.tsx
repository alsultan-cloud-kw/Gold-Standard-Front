import { useState } from 'react'
import { useClerk } from '@clerk/react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

type GoogleSignInButtonProps = {
  mode: 'sign-in' | 'sign-up'
  redirectComplete: string
  disabled?: boolean
}

function buildOAuthUrls(redirectComplete: string) {
  const origin = window.location.origin
  const redirectUrl = `${origin}/sso-callback`
  const redirectUrlComplete = redirectComplete.startsWith('http')
    ? redirectComplete
    : `${origin}${redirectComplete.startsWith('/') ? redirectComplete : `/${redirectComplete}`}`
  return { redirectUrl, redirectUrlComplete }
}

function getClerkUnavailableMessage() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? ''
  const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname)

  if (isLocalhost && publishableKey.startsWith('pk_live_')) {
    return 'Clerk production keys do not load on localhost. Use a pk_test key locally, or test on goldstandardkw.com.'
  }

  return null
}

export default function GoogleSignInButton({
  mode,
  redirectComplete,
  disabled,
}: GoogleSignInButtonProps) {
  const { t } = useTranslation()
  const { loaded, client } = useClerk()
  const [busy, setBusy] = useState(false)

  const handleGoogle = async () => {
    if (busy || disabled) return

    if (!loaded || !client) {
      console.error('Clerk is not ready for Google OAuth:', { loaded, hasClient: Boolean(client) })
      toast.error(getClerkUnavailableMessage() ?? t('auth.googleSignInFailed'))
      return
    }

    setBusy(true)
    try {
      const { redirectUrl, redirectUrlComplete } = buildOAuthUrls(redirectComplete)
      const params = {
        strategy: 'oauth_google' as const,
        redirectUrl,
        redirectUrlComplete,
      }

      if (mode === 'sign-up') {
        await client.signUp.authenticateWithRedirect(params)
      } else {
        await client.signIn.authenticateWithRedirect(params)
      }
      // Browser navigates away to Google — no further UI updates expected.
    } catch (e) {
      console.error('Google OAuth redirect failed:', e)
      toast.error(t('auth.googleSignInFailed'))
      setBusy(false)
    }
  }

  return (
    <>
      <div id="clerk-captcha" className="hidden" aria-hidden />
      <button
        type="button"
        onClick={() => void handleGoogle()}
        disabled={busy || disabled}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg border border-gold-500/30 bg-white text-charcoal-900 text-sm font-semibold hover:bg-stone-50 disabled:opacity-50 transition-colors"
      >
        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {busy ? t('auth.googleSigningIn') : t('auth.continueWithGoogle')}
      </button>
    </>
  )
}
