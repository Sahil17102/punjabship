// src/api/axiosInstance.ts
import axios from 'axios'
import { clearAuthTokens, getAuthTokens, setAuthTokens } from './tokenVault'
import { buildShopifyInstallPath, isEmbeddedShopifyContext } from '../utils/shopifyEmbedded'
import { getShopifyIdToken } from '../utils/shopifyAppBridge'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5004/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
})

let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null

const redirectToAuthentication = () => {
  window.location.href = isEmbeddedShopifyContext()
    ? buildShopifyInstallPath(window.location.pathname)
    : '/login'
}

/* ----- attach access token to every request ----- */
api.interceptors.request.use(async (cfg) => {
  const { accessToken } = getAuthTokens()

  if (isEmbeddedShopifyContext()) {
    if (accessToken) cfg.headers.set('X-PunjabShip-Access-Token', accessToken)

    // Shopify session tokens expire after one minute. Fetch a fresh token for
    // every embedded backend request instead of caching one in browser storage.
    if (!cfg.url?.includes('/integrations/shopify/oauth/session')) {
      const shopifySessionToken = await getShopifyIdToken()
      cfg.headers.set('Authorization', `Bearer ${shopifySessionToken}`)
    }
  } else if (accessToken && !cfg.headers.Authorization) {
    cfg.headers.set('Authorization', `Bearer ${accessToken}`)
  }

  return cfg
})

/* ----- silent‑refresh once per 401 ----- */
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config
    if (!original) return Promise.reject(err)

    if (
      err.response?.status === 401 &&
      String(err.response?.data?.code || '').startsWith('SHOPIFY_SESSION_') &&
      !original._shopifySessionRetry
    ) {
      original._shopifySessionRetry = true
      return api(original)
    }

    // Skip refresh if:
    // 1. Not a 401 error
    // 2. Already retried
    // 3. This is the refresh token endpoint itself (avoid infinite loop)
    if (
      err.response?.status !== 401 ||
      original._retry ||
      original.url?.includes('/integrations/shopify/oauth/session') ||
      original.url?.includes('/auth/refresh-token')
    ) {
      return Promise.reject(err)
    }

    original._retry = true

    const { refreshToken } = getAuthTokens()
    if (!refreshToken) {
      clearAuthTokens()
      redirectToAuthentication()
      return Promise.reject(err)
    }

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(
            `${API_BASE_URL}/auth/refresh-token`,
            { refreshToken },
            {
              headers: {
                'x-refresh-token': refreshToken, // ✅ Send in header for better security
              },
            },
          )
          .then(({ data }) => data)
          .finally(() => {
            refreshPromise = null
          })
      }

      const data = await refreshPromise

      if (!data?.accessToken || !data?.refreshToken) {
        throw new Error('Invalid response from refresh token endpoint')
      }

      setAuthTokens(data.accessToken, data.refreshToken)
      original.headers.Authorization = `Bearer ${data.accessToken}`
      
      return api(original) // retry original request with new token
    } catch (e: unknown) {
      // A Shopify bootstrap can replace the credentials while an older refresh is in flight.
      // Never let that stale request erase the newly issued session.
      if (getAuthTokens().refreshToken === refreshToken) {
        clearAuthTokens()

        if (!window.location.pathname.includes('/login')) redirectToAuthentication()
      }
      return Promise.reject(e)
    }
  },
)

export default api
