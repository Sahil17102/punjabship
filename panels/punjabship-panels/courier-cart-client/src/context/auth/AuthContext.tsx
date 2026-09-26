import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'
import { logoutApi } from '../../api/auth'
import {
  clearAuthTokens,
  configureAuthTokenPersistence,
  getAuthTokens,
  setAuthTokens,
} from '../../api/tokenVault'
import { useUserProfile } from '../../hooks/User/useUserProfile'
import type { IUserProfileDB } from '../../types/user.types'
import { emptyUserProfile } from '../../utils/utility'
import { buildShopifyInstallPath, isEmbeddedShopifyContext } from '../../utils/shopifyEmbedded'

/* ---------- context shape ---------- */
interface AuthCtx {
  setUserId: Dispatch<SetStateAction<string>>
  userId: string
  user: IUserProfileDB
  loading: boolean
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string) => void
  clearTokens: () => void
  logout: () => Promise<void>
  refetchUser: () => void
  walletBalance: number | null
  setWalletBalance: Dispatch<SetStateAction<number | null>>
}

export const AuthContext = createContext<AuthCtx | undefined>(undefined)

/* ---------- provider ---------- */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient()

  const [initiallyAuthenticated] = useState(() => {
    if (isEmbeddedShopifyContext()) {
      configureAuthTokenPersistence(false)
      return false
    }

    const { accessToken, refreshToken } = getAuthTokens()
    return Boolean(accessToken && refreshToken)
  })

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initiallyAuthenticated)
  const [authCheckTimedOut, setAuthCheckTimedOut] = useState(false)
  const [authBootstrapExpired, setAuthBootstrapExpired] = useState(false)
  const [walletBalance, setWalletBalance] = useState<number | null>(null)
  const [userId, setUserId] = useState('')

  const {
    data: user,
    isFetching: userFetching,
    isError: userProfileError,
    refetch: refetchUser,
  } = useUserProfile(isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated || user?.id || userProfileError) {
      setAuthCheckTimedOut(false)
      return
    }

    const timeout = window.setTimeout(() => {
      setAuthCheckTimedOut(true)
    }, 3500)

    return () => window.clearTimeout(timeout)
  }, [isAuthenticated, user?.id, userProfileError])

  useEffect(() => {
    if (!isAuthenticated || user?.id || userProfileError) {
      setAuthBootstrapExpired(false)
      return
    }

    const timeout = window.setTimeout(() => {
      setAuthBootstrapExpired(true)
      clearAuthTokens()
      setIsAuthenticated(false)
      queryClient.removeQueries({ queryKey: ['userInfo'] })
      queryClient.removeQueries({ queryKey: ['userProfile'] })
      queryClient.removeQueries({ queryKey: ['walletBalance'] })
    }, 12000)

    return () => window.clearTimeout(timeout)
  }, [isAuthenticated, queryClient, user?.id, userProfileError])

  useEffect(() => {
    // If we successfully fetched a user, ensure auth is marked as true.
    if (user?.id) {
      setIsAuthenticated(true)
    }
    // Do NOT automatically mark user as unauthenticated on generic errors here.
    // Auth state should primarily follow presence of valid tokens; 401 handling
    // is done in axios interceptors which clear tokens and redirect as needed.
  }, [user])

  const setTokens = (access: string, refresh: string) => {
    setAuthTokens(access, refresh)
    setIsAuthenticated(true)
    refetchUser()
  }

  const clearTokens = () => {
    clearAuthTokens()
    setIsAuthenticated(false)
    queryClient.removeQueries({ queryKey: ['userInfo'] })
    queryClient.removeQueries({ queryKey: ['userProfile'] })
    queryClient.removeQueries({ queryKey: ['walletBalance'] })
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch (e) {
      console.error('Logout error ignored:', e)
    }
    clearTokens()
    window.location.href = isEmbeddedShopifyContext()
      ? buildShopifyInstallPath('/channels/connected')
      : '/login'
  }

  const value: AuthCtx = {
    user: user ?? { ...emptyUserProfile },
    loading:
      isAuthenticated &&
      !user?.id &&
      userFetching &&
      !userProfileError &&
      !authCheckTimedOut &&
      !authBootstrapExpired,
    isAuthenticated,
    setUserId,
    setTokens,
    clearTokens,
    userId,
    logout,
    refetchUser,
    walletBalance,
    setWalletBalance,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ---------- hook ---------- */
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
