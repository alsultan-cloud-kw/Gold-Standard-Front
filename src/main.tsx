import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './i18n'
import './index.css'
import App from './App.tsx'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
// Only use a proxy when explicitly set. clerk.goldstandardkw.com DNS is verified — a
// default /__clerk proxy breaks OAuth on Vercel unless api/clerk-fapi is deployed.
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL?.trim()

if (!clerkPublishableKey) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      publishableKey={clerkPublishableKey}
      {...(clerkProxyUrl ? { proxyUrl: clerkProxyUrl } : {})}
      afterSignOutUrl="/"
      signInUrl="/login"
      signUpUrl="/register"
      allowedRedirectOrigins={[
        'http://localhost:5173',
        'https://www.goldstandardkw.com',
        'https://goldstandardkw.com',
      ]}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)