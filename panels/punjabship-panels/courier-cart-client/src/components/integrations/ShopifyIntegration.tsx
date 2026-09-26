import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useState } from 'react'
import { SiShopify } from 'react-icons/si'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { useStartShopifyOAuth } from '../../hooks/useIntegrations'
import { buildShopifyInstallPath, isEmbeddedShopifyContext } from '../../utils/shopifyEmbedded'
import { toast } from '../UI/Toast'

const SHOPIFY_APP_URL = 'http://127.0.0.1:5174/shopify/install'
const SHOPIFY_OAUTH_CALLBACK_URL =
  'http://127.0.0.1:5174/api/integrations/shopify/oauth/callback'
const SHOPIFY_REQUIRED_SCOPES = [
  'read_orders',
  'write_orders',
  'read_merchant_managed_fulfillment_orders',
  'write_merchant_managed_fulfillment_orders',
]

const normalizeShopifyStoreUrl = (value: string) => {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''

  let host = raw
  try {
    host = new URL(raw.startsWith('http') ? raw : `https://${raw}`).hostname
  } catch {
    host = raw.replace(/^https?:\/\//, '').split('/')[0] || raw
  }

  host = host.replace(/^www\./, '').replace(/\/+$/, '')
  if (/^[a-z0-9][a-z0-9-]*$/.test(host)) return `${host}.myshopify.com`
  return host
}

interface IShopifyIntegrationProps {
  fullWidth?: boolean
  forOnboarding?: boolean
  fromChannelList?: boolean
}

export interface ShopifyForm {
  storeUrl: string
  apiKey?: string
  webhookSecret?: string
  name?: string
  adminApiAccessToken?: string
  hostName?: string
  domain?: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: any
  userId?: string
  status?: 'active' | 'inactive'
  settings?: {
    fulfillTrigger?: string
    customerNotifyOnFulfill?: string
    orderTagsToFetch?: string
    codTags?: string
    prepaidTags?: string
    autoUpdateShipmentStatus?: boolean
    autoCancelOrders?: boolean
    markCodPaidOnDelivery?: boolean
  }
}

export default function ShopifyIntegration({ fullWidth }: IShopifyIntegrationProps) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const isConnected = Boolean(user?.salesChannels?.shopify)
  const isEmbeddedShopify = isEmbeddedShopifyContext()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [storeUrl, setStoreUrl] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [storeError, setStoreError] = useState('')
  const { mutate: startOAuth, isPending: startingOAuth } = useStartShopifyOAuth()

  const handleShopifyAction = () => {
    if (isConnected) {
      navigate('/channels/connected')
      return
    }

    if (isEmbeddedShopify) {
      navigate(buildShopifyInstallPath('/channels/connected'))
      return
    }

    setDialogOpen(true)
  }

  const handleStartOAuth = () => {
    const shop = normalizeShopifyStoreUrl(storeUrl)
    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop)) {
      setStoreError('Enter a valid Shopify store, for example mystore.myshopify.com')
      return
    }
    if (!clientId.trim() || !clientSecret.trim()) {
      setStoreError('Enter the Shopify client ID and client secret to continue.')
      return
    }

    setStoreError('')
    startOAuth(
      {
        shop,
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        returnTo: '/channels/connected',
      },
      {
        onSuccess: (response: any) => {
          const authUrl = response?.authUrl || response?.data?.authUrl
          if (!authUrl) {
            toast.open({
              message: 'Shopify did not return an installation link. Please try again.',
              severity: 'error',
            })
            return
          }
          window.location.assign(authUrl)
        },
        onError: (error: any) => {
          toast.open({
            message:
              error?.response?.data?.error ||
              error?.message ||
              'Unable to start Shopify installation',
            severity: 'error',
          })
        },
      },
    )
  }

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: 'transparent',
        borderColor: 'rgba(255,255,255,0.1)',
        color: 'inherit',
        height: '100%',
        width: fullWidth ? '100%' : 'auto',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
        <Box display="flex" justifyContent="center" mb={1}>
          <SiShopify size={28} />
        </Box>
        <Typography fontWeight={600}>Shopify</Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
        <Button
          size="small"
          variant="contained"
          color={isConnected ? 'success' : 'inherit'}
          onClick={handleShopifyAction}
          fullWidth={isMobile}
        >
          {isConnected ? 'Manage' : isEmbeddedShopify ? 'Finish Shopify install' : 'Connect Shopify'}
        </Button>
      </CardActions>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ pb: 1 }}>
          Connect Shopify store
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.25} sx={{ pt: 1 }}>
            <Alert severity="info">
              Enter the store URL and authorize PunjabShip in Shopify. After approval, your orders
              can be synced from the connected store.
            </Alert>

            <TextField
              label="Shopify client ID"
              placeholder="Enter your Shopify client ID"
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value)
                if (storeError) setStoreError('')
              }}
              fullWidth
              autoComplete="off"
              helperText="Copy this from the app's Settings page in Shopify Dev Dashboard."
            />

            <TextField
              label="Shopify client secret"
              placeholder="Enter your Shopify client secret"
              type="password"
              value={clientSecret}
              onChange={(event) => {
                setClientSecret(event.target.value)
                if (storeError) setStoreError('')
              }}
              fullWidth
              autoComplete="new-password"
              helperText="Used securely for this installation and stored encrypted after connection."
            />

            <TextField
              label="Shopify store URL"
              placeholder="your-store.myshopify.com"
              value={storeUrl}
              onChange={(event) => {
                setStoreUrl(event.target.value)
                if (storeError) setStoreError('')
              }}
              onBlur={() => setStoreUrl((current) => normalizeShopifyStoreUrl(current))}
              error={Boolean(storeError)}
              helperText={storeError || 'Use the permanent myshopify.com domain from Shopify.'}
              fullWidth
              autoFocus
            />

            <Box
              sx={{
                border: '1px solid rgba(109,74,255,0.2)',
                borderRadius: 2,
                bgcolor: 'rgba(109,74,255,0.05)',
                p: 2,
              }}
            >
              <Typography fontWeight={800} fontSize="0.9rem" mb={0.75}>
                Custom app setup
              </Typography>
              <Typography color="text.secondary" fontSize="0.82rem" mb={1.25}>
                Create or configure the app in Shopify Dev Dashboard, then enter its Client ID and
                Client Secret above.
              </Typography>
              <Stack spacing={1}>
                {[
                  ['Application URL', SHOPIFY_APP_URL],
                  ['Allowed redirection URL', SHOPIFY_OAUTH_CALLBACK_URL],
                  ['Admin API access scopes', SHOPIFY_REQUIRED_SCOPES.join(', ')],
                ].map(([label, value]) => (
                  <Box key={label}>
                    <Typography fontWeight={700} fontSize="0.76rem">
                      {label}
                    </Typography>
                    <Box
                      component="code"
                      sx={{
                        display: 'block',
                        mt: 0.35,
                        p: 0.75,
                        borderRadius: 1,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        color: 'text.primary',
                        fontSize: '0.72rem',
                        lineHeight: 1.45,
                        overflowWrap: 'anywhere',
                      }}
                    >
                      {value}
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Typography color="text.secondary" fontSize="0.78rem" mt={1.25}>
                Enable app installation and grant order and fulfillment permissions. The callback
                host must match the application URL host exactly.
              </Typography>
            </Box>

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleStartOAuth} variant="contained" disabled={startingOAuth}>
            {startingOAuth ? 'Starting...' : 'Install app'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
