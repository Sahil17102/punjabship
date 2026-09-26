import { Alert, Box, Button, Card, LinearProgress, Stack, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from '../../components/UI/Toast'
import { useAuth } from '../../context/auth/AuthContext'
import {
  auditShopifyInstall,
  exchangeShopifyBootstrap,
  exchangeShopifySession,
  startPublicShopifyOAuth,
  startShopifyOAuth,
} from '../../api/integrations'
import { getShopifyIdToken } from '../../utils/shopifyAppBridge'
import { isEmbeddedShopifyContext } from '../../utils/shopifyEmbedded'

const normalizeShopifyStoreUrl = (value?: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
    .replace(/\/admin(?:\/.*)?$/, '')

const sanitizeNextPath = (value?: string) =>
  String(value || '').trim().startsWith('/') ? String(value || '').trim() : '/channels/connected'

const CONNECTION_TIMEOUT_MS = 30_000

class ShopifyConnectionTimeoutError extends Error {
  constructor() {
    super('Shopify took too long to respond')
    this.name = 'ShopifyConnectionTimeoutError'
  }
}

const withConnectionTimeout = <T,>(request: Promise<T>) =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(
      () => reject(new ShopifyConnectionTimeoutError()),
      CONNECTION_TIMEOUT_MS,
    )

    request.then(
      (value) => {
        window.clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timeoutId)
        reject(error)
      },
    )
  })

type ApiError = {
  code?: string
  message?: string
  response?: { status?: number; data?: { error?: string; message?: string } }
}

const getAuditFailureDetail = (error: ApiError) => {
  if (error instanceof ShopifyConnectionTimeoutError) return 'connection_timeout'
  const status = Number(error.response?.status)
  if (Number.isFinite(status) && status > 0) return `http_${status}`
  if (String(error.message || '').toLowerCase().includes('app bridge')) return 'app_bridge_unavailable'
  return 'client_error'
}

const getConnectionErrorMessage = (error: ApiError, fallback: string) => {
  if (error instanceof ShopifyConnectionTimeoutError) {
    return 'The connection is taking longer than expected. Check your internet connection and try again.'
  }

  const status = Number(error.response?.status)
  const rawMessage = String(error.message || '').toLowerCase()
  if (
    error.code === 'ERR_NETWORK' ||
    rawMessage.includes('network') ||
    rawMessage.includes('failed to fetch') ||
    rawMessage.includes('timeout')
  ) {
    return 'We could not reach Shopify. Check your internet connection and try again.'
  }

  if (status >= 500) {
    return 'Shopify is temporarily unavailable. Please wait a moment and try again.'
  }

  return error.response?.data?.error || error.response?.data?.message || error.message || fallback
}

const exchangeEmbeddedShopifySession = async (shop?: string) => {
  let lastError: unknown

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const sessionToken = await getShopifyIdToken()
    void auditShopifyInstall({ event: 'id_token_acquired', shop })
    void auditShopifyInstall({ event: 'session_exchange_started', shop })

    try {
      return await exchangeShopifySession(sessionToken)
    } catch (error: unknown) {
      lastError = error
      const apiError = error as ApiError
      if (apiError.response?.status !== 401 || attempt > 0) throw error
    }
  }

  throw lastError || new Error('Shopify session could not be restored')
}

const ShopifyInstallPage = () => {
  const { isAuthenticated, loading, setTokens } = useAuth()
  const queryClient = useQueryClient()
  const location = useLocation()
  const navigate = useNavigate()
  const handledRef = useRef(false)
  const [status, setStatus] = useState<'idle' | 'starting' | 'exchanging' | 'error'>('idle')
  const [message, setMessage] = useState('Preparing Shopify connection...')
  const [retryAttempt, setRetryAttempt] = useState(0)

  const retryConnection = () => {
    const params = new URLSearchParams(location.search)
    if (params.get('shopify') === 'error') {
      params.delete('shopify')
      params.delete('message')
      handledRef.current = false
      const search = params.toString()
      navigate(`${location.pathname}${search ? `?${search}` : ''}`, { replace: true })
      return
    }

    handledRef.current = false
    setStatus('idle')
    setMessage('Retrying your Shopify connection...')
    setRetryAttempt((attempt) => attempt + 1)
  }

  useEffect(() => {
    if (loading || handledRef.current) return

    let active = true

    const params = new URLSearchParams(location.search)
    const bootstrap = params.get('bootstrap') || ''
    const shop = normalizeShopifyStoreUrl(params.get('shop') || '')
    const host = params.get('host') || ''
    const shopifyStatus = params.get('shopify') || ''
    const next = sanitizeNextPath(params.get('next') || '/channels/connected')
    const fallbackMessage =
      shopifyStatus === 'error' ? params.get('message') || 'Shopify connection failed' : params.get('message') || ''

    if (bootstrap) {
      handledRef.current = true
      setStatus('exchanging')
      setMessage('Finalizing your Shopify install...')
      void auditShopifyInstall({ event: 'bootstrap_exchange_started', shop })

      withConnectionTimeout(exchangeShopifyBootstrap({ bootstrap }))
        .then((result) => {
          if (!active) return
          queryClient.clear()
          setTokens(result.accessToken, result.refreshToken)
          const landing = new URL(next, window.location.origin)
          landing.searchParams.set('shopify', 'connected')
          landing.searchParams.set('message', 'Shopify connected successfully')
          void auditShopifyInstall({ event: 'install_ui_completed', shop: result.shop || shop })
          navigate(`${landing.pathname}${landing.search}`, { replace: true })
        })
        .catch((error: unknown) => {
          if (!active) return
          const apiError = error as ApiError
          const errorMessage = getConnectionErrorMessage(apiError, 'Failed to finalize Shopify install')
          void auditShopifyInstall({
            event: 'install_ui_failed',
            shop,
            detail: getAuditFailureDetail(apiError),
          })
          setStatus('error')
          setMessage(errorMessage)
          toast.open({ message: errorMessage, severity: 'error' })
        })

      return () => {
        active = false
      }
    }

    if (shopifyStatus === 'connected') {
      handledRef.current = true
      toast.open({
        message: fallbackMessage || 'Shopify connected successfully',
        severity: 'success',
      })

      const landing = new URL(next, window.location.origin)
      landing.searchParams.set('shopify', 'connected')
      landing.searchParams.set('message', fallbackMessage || 'Shopify connected successfully')
      navigate(`${landing.pathname}${landing.search}`, { replace: true })
      return
    }

    if (shopifyStatus === 'error') {
      handledRef.current = true
      const errorMessage = fallbackMessage || 'Shopify connection failed'
      setStatus('error')
      setMessage(errorMessage)
      if (shop) {
        void auditShopifyInstall({ event: 'install_ui_failed', shop, detail: 'redirected_error' })
      }
      toast.open({ message: errorMessage, severity: 'error' })
      return
    }

    if ((shop && host) || isEmbeddedShopifyContext()) {
      handledRef.current = true
      setStatus('exchanging')
      setMessage('Securing your Shopify connection...')
      void auditShopifyInstall({ event: 'install_page_opened', shop })
      void auditShopifyInstall({ event: 'app_bridge_started', shop })

      const exchangeSession = exchangeEmbeddedShopifySession(shop).then(async (sessionResult) => {
        if (!sessionResult?.bootstrap) throw new Error('Shopify install could not be finalized')
        try {
          if (sessionResult.developmentSandbox) {
            sessionStorage.setItem('punjabship_shopify_development_sandbox', '1')
          } else {
            sessionStorage.removeItem('punjabship_shopify_development_sandbox')
          }
        } catch {
          // Test-mode messaging is informational and must not block authentication.
        }
        void auditShopifyInstall({ event: 'bootstrap_exchange_started', shop })
        return exchangeShopifyBootstrap({ bootstrap: sessionResult.bootstrap })
      })

      withConnectionTimeout(exchangeSession)
        .then((result) => {
          if (!active) return
          queryClient.clear()
          setTokens(result.accessToken, result.refreshToken)
          const landing = new URL(next, window.location.origin)
          landing.searchParams.set('shopify', 'connected')
          landing.searchParams.set('message', 'Shopify connected successfully')
          void auditShopifyInstall({ event: 'install_ui_completed', shop: result.shop || shop })
          navigate(`${landing.pathname}${landing.search}`, { replace: true })
        })
        .catch((error: unknown) => {
          if (!active) return
          const apiError = error as ApiError
          const errorMessage = getConnectionErrorMessage(apiError, 'Failed to finalize Shopify install')
          void auditShopifyInstall({
            event: 'install_ui_failed',
            shop,
            detail: getAuditFailureDetail(apiError),
          })
          setStatus('error')
          setMessage(errorMessage)
          toast.open({ message: errorMessage, severity: 'error' })
        })
      return () => {
        active = false
      }
    }

    if (!shop) {
      setStatus('error')
      setMessage('Missing Shopify installation context. Please open the app from Shopify admin.')
      toast.open({
        message: 'Missing Shopify installation context.',
        severity: 'error',
      })
      return
    }

    handledRef.current = true
    setStatus('starting')
    setMessage('Opening Shopify authorization...')

    const returnTo = `/shopify/install?next=${encodeURIComponent(next)}`
    const startRequest = isAuthenticated
      ? startShopifyOAuth({ shop, returnTo })
      : startPublicShopifyOAuth({ shop, returnTo })

    withConnectionTimeout(startRequest)
      .then((result) => {
        if (!active) return
        const authUrl = result?.authUrl || result?.data?.authUrl
        if (!authUrl) {
          throw new Error('Shopify authorization URL was not returned')
        }
        window.location.assign(authUrl)
      })
      .catch((error: unknown) => {
        if (!active) return
        const apiError = error as ApiError
        const errorMessage = getConnectionErrorMessage(apiError, 'Error starting Shopify connection')
        setStatus('error')
        setMessage(errorMessage)
        toast.open({ message: errorMessage, severity: 'error' })
      })

    return () => {
      active = false
    }
  }, [isAuthenticated, loading, location.search, navigate, queryClient, retryAttempt, setTokens])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: 2,
        background: 'radial-gradient(circle at top, rgba(232,85,0,0.16) 0%, transparent 36%), linear-gradient(180deg, #0f1115 0%, #17181d 100%)',
        color: '#fff',
      }}
    >
      <Card
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 680,
          borderRadius: 4,
          p: { xs: 3, md: 4 },
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(18px)',
          color: 'inherit',
        }}
      >
        <Stack spacing={2.5} alignItems="center" textAlign="center">
          <Box
            component="img"
            src="/logo/punjabship-mark.svg"
            alt="PunjabShip"
            sx={{ width: 140, height: 'auto' }}
          />
          <Box>
            <Typography sx={{ fontSize: '0.78rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.68)', fontWeight: 800 }}>
              Shopify install
            </Typography>
            <Typography sx={{ mt: 1, fontWeight: 800, fontSize: { xs: '1.5rem', md: '1.9rem' } }}>
              {status === 'error' ? 'Install needs attention' : 'Connecting your Shopify store'}
            </Typography>
            {status === 'error' ? (
              <Alert
                severity="error"
                sx={{ mt: 2, textAlign: 'left', backgroundColor: 'rgba(211, 47, 47, 0.14)', color: '#fff' }}
              >
                {message}
              </Alert>
            ) : (
              <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.72)', lineHeight: 1.7 }}>
                {message}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              pt: 1,
            }}
          >
            {status === 'error' ? (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="contained" onClick={retryConnection} sx={{ backgroundColor: '#0877C9' }}>
                  Try again
                </Button>
                <Button variant="outlined" onClick={() => navigate('/channels/connected')} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>
                  Return to channels
                </Button>
              </Stack>
            ) : (
              <Stack spacing={1} sx={{ width: '100%', maxWidth: 420 }}>
                <LinearProgress
                  aria-label="Shopify connection progress"
                  sx={{ height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)', '& .MuiLinearProgress-bar': { backgroundColor: '#0877C9' } }}
                />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.58)' }}>
                  This usually takes only a few seconds.
                </Typography>
              </Stack>
            )}
          </Box>
        </Stack>
      </Card>
    </Box>
  )
}

export default ShopifyInstallPage
