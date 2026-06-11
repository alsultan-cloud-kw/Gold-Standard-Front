import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/react'
import './i18n'
import './index.css'
import App from './App.tsx'

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider
      afterSignOutUrl="/"
      signInUrl="/login"
      signUpUrl="/register"
      allowedRedirectOrigins={[
        'http://localhost:5173',
        'https://www.goldstandardkw.com',
        'https://goldstandardkw.com',
      ]}
      {...(clerkPublishableKey ? { publishableKey: clerkPublishableKey } : {})}
    >
      <App />
    </ClerkProvider>
  </StrictMode>,
)