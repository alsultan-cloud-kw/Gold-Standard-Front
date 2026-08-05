import SocialSignInButton from './SocialSignInButton'
import type { ClerkOAuthProvider } from '@/lib/clerkOAuth'

type SocialSignInButtonsProps = {
  mode: 'sign-in' | 'sign-up'
  redirectComplete: string
  disabled?: boolean
  /** Mobile WebView: auto-start this provider from `?oauth=apple|google`. */
  autoProvider?: ClerkOAuthProvider | null
}

/** Google + Apple via Clerk OAuth (same /sso-callback flow). */
export default function SocialSignInButtons({
  mode,
  redirectComplete,
  disabled,
  autoProvider,
}: SocialSignInButtonsProps) {
  return (
    <div className="space-y-3">
      <div id="clerk-captcha" className="hidden" aria-hidden />
      <SocialSignInButton
        provider="google"
        mode={mode}
        redirectComplete={redirectComplete}
        disabled={disabled}
        autoStart={autoProvider === 'google'}
      />
      <SocialSignInButton
        provider="apple"
        mode={mode}
        redirectComplete={redirectComplete}
        disabled={disabled}
        autoStart={autoProvider === 'apple'}
      />
    </div>
  )
}
