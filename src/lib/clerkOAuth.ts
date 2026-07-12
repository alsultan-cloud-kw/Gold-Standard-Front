export type ClerkOAuthProvider = 'google' | 'apple'

export function buildClerkOAuthUrls(redirectComplete: string) {
  const origin = window.location.origin
  const completePath = redirectComplete.startsWith('http')
    ? `${new URL(redirectComplete).pathname}${new URL(redirectComplete).search}`
    : redirectComplete.startsWith('/')
      ? redirectComplete
      : `/${redirectComplete}`

  // Stay on /sso-callback until Django JWT sync finishes; preserve `next` for post-auth redirect.
  const nextQ =
    completePath && completePath !== '/'
      ? `?next=${encodeURIComponent(completePath)}`
      : ''
  const redirectUrl = `${origin}/sso-callback${nextQ}`

  return { redirectUrl, redirectUrlComplete: redirectUrl }
}

export function getClerkUnavailableMessage() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ?? ''
  const host = window.location.hostname
  const isLocalhost = ['localhost', '127.0.0.1'].includes(host)
  const isGoldStandard =
    host === 'goldstandardkw.com' || host === 'www.goldstandardkw.com'

  if (isLocalhost && publishableKey.startsWith('pk_live_')) {
    return 'Clerk production keys do not load on localhost. Use a pk_test key locally, or test on goldstandardkw.com.'
  }

  if (isGoldStandard || publishableKey.includes('goldstandardkw')) {
    return 'Clerk is not loading. Verify clerk.goldstandardkw.com DNS in Clerk Dashboard → Domains.'
  }

  return null
}

export function clerkOAuthStrategy(provider: ClerkOAuthProvider) {
  return provider === 'apple' ? ('oauth_apple' as const) : ('oauth_google' as const)
}
