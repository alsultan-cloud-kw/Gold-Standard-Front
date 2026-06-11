import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { authApi } from '../services/api'
import type { User, CustomerProfile } from '../types'
import { isStorefrontRole } from '../constants/storefrontRoles'

interface AuthContextType {
  user: User | null
  profile: CustomerProfile | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: { email?: string; phone_number?: string; password: string }) => Promise<void>
  loginWithClerk: (clerkSessionToken: string) => Promise<void>
  register: (data: unknown) => Promise<void>
  logout: () => void
  updateUser: (data: unknown) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing token and validate
    const token = localStorage.getItem('access_token')
    if (token) {
      fetchUser()
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchUser = async () => {
    try {
      const userData = await authApi.getMe()
      setUser(userData as User)
      
      // Fetch profile if customer
      if (isStorefrontRole((userData as User).role)) {
        // Fetch profile when needed (storefront roles share CustomerProfile)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: { email?: string; phone_number?: string; password: string }) => {
    try {
      const response = await authApi.login(credentials)
      localStorage.setItem('access_token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
      setUser(response.user as User)
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const loginWithClerk = async (clerkSessionToken: string) => {
    const response = await authApi.clerkLogin(clerkSessionToken)
    localStorage.setItem('access_token', response.access)
    localStorage.setItem('refresh_token', response.refresh)
    setUser(response.user as User)
  }

  const register = async (data: unknown) => {
    try {
      const response = await authApi.register(data)
      localStorage.setItem('access_token', response.access)
      localStorage.setItem('refresh_token', response.refresh)
      setUser(response.user as User)
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      authApi.logout(refreshToken).catch(console.error)
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
    setProfile(null)
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
        login,
        loginWithClerk,
        register,
        logout,
        updateUser,
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
