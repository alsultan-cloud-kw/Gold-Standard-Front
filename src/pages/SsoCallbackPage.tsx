import { AuthenticateWithRedirectCallback } from '@clerk/react'

export default function SsoCallbackPage() {
  const origin = window.location.origin

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4">
      <AuthenticateWithRedirectCallback
        signInUrl={`${origin}/login`}
        signUpUrl={`${origin}/register`}
        signInFallbackRedirectUrl={`${origin}/`}
        signUpFallbackRedirectUrl={`${origin}/`}
      />
      <div className="w-8 h-8 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" />
      <p className="text-gold-100/70 text-sm">Signing you in…</p>
      <div id="clerk-captcha" className="hidden" aria-hidden />
    </div>
  )
}
