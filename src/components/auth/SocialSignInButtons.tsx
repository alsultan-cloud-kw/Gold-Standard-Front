import SocialSignInButton from './SocialSignInButton'

type SocialSignInButtonsProps = {
  mode: 'sign-in' | 'sign-up'
  redirectComplete: string
  disabled?: boolean
}

/** Google + Apple via Clerk OAuth (same /sso-callback flow). */
export default function SocialSignInButtons({
  mode,
  redirectComplete,
  disabled,
}: SocialSignInButtonsProps) {
  return (
    <div className="space-y-3">
      <div id="clerk-captcha" className="hidden" aria-hidden />
      <SocialSignInButton
        provider="google"
        mode={mode}
        redirectComplete={redirectComplete}
        disabled={disabled}
      />
      <SocialSignInButton
        provider="apple"
        mode={mode}
        redirectComplete={redirectComplete}
        disabled={disabled}
      />
    </div>
  )
}
