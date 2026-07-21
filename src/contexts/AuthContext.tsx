import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { authApi } from '../services/api'
import type { User, CustomerProfile } from '../types'
import { markLoginSuccessPending } from '@/lib/authToast'
import {
  clearSignInNudgeSuppress,
  suppressSignInNudge,
} from '@/lib/signInNudgeGate'

interface AuthContextType {
  user: User | null
  profile: CustomerProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  /** Clerk OAuth → Django JWT exchange in progress */
  isClerkSyncing: boolean
  /** Prevents Clerk re-sync during sign-out */
  isLoggingOut: boolean
  /** Manual login/register submit in progress */
  authBusy: boolean
  setAuthBusy: (value: boolean) => void
  setClerkSyncing: (value: boolean) => void
  login: (credentials: {
    email?: string
    phone_number?: string
    password: string
    turnstile_token?: string
  }) => Promise<User>
  loginWithClerk: (clerkSessionToken: string) => Promise<User>
  register: (data: unknown) => Promise<User>
  logout: () => Promise<void>
  updateUser: (data: unknown) => Promise<void>
  /** Re-fetch /users/me/ into context (e.g. after OTP verify). */
  refreshUser: () => Promise<User | null>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isClerkSyncing, setClerkSyncingState] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [authBusy, setAuthBusy] = useState(false)

  const setClerkSyncing = useCallback((value: boolean) => {
    setClerkSyncingState(value)
    if (value) suppressSignInNudge()
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      void fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async (): Promise<User | null> => {
    let settled = false
    const failSafe = window.setTimeout(() => {
      if (settled) return
      settled = true
      setIsLoading(false)
    }, 10_000)

    try {
      const userData = await authApi.getMe()
      if (!settled) {
        const next = userData as User
        setUser(next)
        suppressSignInNudge()
        return next
      }
      return null
    } catch (error) {
      const status = (error as { response?: { status?: number } })?.response?.status
      console.error('Failed to fetch user:', error)
      if (status === 401 || status === 403) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        setUser(null)
      }
      return null
    } finally {
      if (!settled) {
        settled = true
        window.clearTimeout(failSafe)
        setIsLoading(false)
      } else {
        window.clearTimeout(failSafe)
      }
    }
  }

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return null
    try {
      const userData = await authApi.getMe()
      const next = userData as User
      setUser(next)
      return next
    } catch {
      return null
    }
  }, [])

  const login = async (credentials: {
    email?: string
    phone_number?: string
    password: string
    turnstile_token?: string
  }) => {
    const response = await authApi.login(credentials)
    localStorage.setItem('access_token', response.access)
    localStorage.setItem('refresh_token', response.refresh)
    suppressSignInNudge()
    const nextUser = response.user as User
    setUser(nextUser)
    setIsLoading(false)
    markLoginSuccessPending()
    return nextUser
  }

  const loginWithClerk = async (clerkSessionToken: string) => {
    const response = await authApi.clerkLogin(clerkSessionToken)
    localStorage.setItem('access_token', response.access)
    localStorage.setItem('refresh_token', response.refresh)
    suppressSignInNudge()
    const nextUser = response.user as User
    setUser(nextUser)
    setIsLoading(false)
    markLoginSuccessPending()
    return nextUser
  }

  const register = async (data: unknown) => {
    const response = await authApi.register(data)
    localStorage.setItem('access_token', response.access)
    localStorage.setItem('refresh_token', response.refresh)
    suppressSignInNudge()
    const nextUser = response.user as User
    setUser(nextUser)
    setIsLoading(false)
    return nextUser
  }

  const logout = async () => {
    setIsLoggingOut(true)
    setClerkSyncingState(false)
    const refreshToken = localStorage.getItem('refresh_token')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setProfile(null)
    clearSignInNudgeSuppress()
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken)
      } catch (error) {
        console.error('Logout API failed:', error)
      }
    }
    // Brief delay so ClerkAuthBridge does not re-exchange before Clerk session ends.
    await new Promise((r) => window.setTimeout(r, 50))
    setIsLoggingOut(false)
  }

  const updateUser = async (data: unknown) => {
    try {
      const updatedUser = await authApi.updateMe(data)
      setUser(updatedUser as User)
    } catch (error) {
      console.error('Failed to update user:', error)
      throw error
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        isClerkSyncing,
        isLoggingOut,
        authBusy,
        setAuthBusy,
        setClerkSyncing,
        login,
        loginWithClerk,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
