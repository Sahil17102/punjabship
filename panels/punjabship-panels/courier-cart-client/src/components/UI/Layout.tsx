import { Alert, Box, Button, Drawer, Stack, useMediaQuery, useTheme } from '@mui/material'
import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import Navbar from '../Navbar/Navbar'
import KeyboardShortcuts from './keyboard/KeyboardShortcuts'
import Sidebar from './Sidebar'
import { isEmbeddedShopifyContext } from '../../utils/shopifyEmbedded'
import {
  clearImpersonationSession,
  getImpersonationSession,
} from '../../utils/impersonationSession'
import SellerProductTour from '../tour/SellerProductTour'
import { getTourPageId } from '../../utils/sellerTour'
import RequireEmployeeModule from '../auth/wrapper/RequireEmployeeModule'
import { isSellerEmployeeAccount } from '../../utils/sellerEmployee'

export default function Layout() {
  const theme = useTheme()
  const location = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, clearTokens } = useAuth()
  const [impersonationSession, setImpersonationSessionState] = useState(() =>
    getImpersonationSession(),
  )
  const isAdminWorkspace =
    user.role === 'admin' || isSellerEmployeeAccount(user)
  const isOrderCreatePage = location.pathname === '/orders/create'
  const isEmbeddedShopify = isEmbeddedShopifyContext()
  let isShopifyDevelopmentSandbox = false
  try {
    isShopifyDevelopmentSandbox =
      sessionStorage.getItem('punjabship_shopify_development_sandbox') === '1'
  } catch {
    // The banner is informational; storage availability never affects app access.
  }

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev)
  }

  const exitImpersonation = () => {
    clearImpersonationSession()
    clearTokens()
    const adminUrl = import.meta.env.VITE_ADMIN_URL || 'http://127.0.0.1:3001'
    window.location.href = `${String(adminUrl).replace(/\/+$/, '')}/admin/users-management`
  }

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile && mobileOpen) {
      setMobileOpen(false)
    }
  }, [location.pathname, isMobile, mobileOpen])

  useEffect(() => {
    setImpersonationSessionState(getImpersonationSession())
  }, [location.pathname])

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F7F8FC',
        backgroundImage:
          'linear-gradient(rgba(8,119,201,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(8,119,201,0.045) 1px, transparent 1px)',
        backgroundSize: '32px 32px',
        scrollbarGutter: 'stable',
      }}
    >
      <KeyboardShortcuts />
      {!isAdminWorkspace && <SellerProductTour />}

      {isMobile ? (
        <Drawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: 280,
              border: 0,
              background: '#FFFFFF',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            },
          }}
        >
          <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ flex: 1, overflowY: 'auto' }}>
              <Sidebar role={isAdminWorkspace ? 'admin' : 'customer'} forceExpanded />
            </Box>
          </Box>
        </Drawer>
      ) : (
        <Sidebar role={isAdminWorkspace ? 'admin' : 'customer'} />
      )}

      <Stack
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: '100vh',
          p: 0,
          gap: 0,
          scrollbarGutter: 'stable',
        }}
      >
        <Navbar handleDrawerToggle={handleDrawerToggle} />

        {isEmbeddedShopify && (
          <Alert severity={isShopifyDevelopmentSandbox ? 'info' : 'success'} sx={{ borderRadius: 0 }}>
            PunjabShip app access is free. Wallet funds are used only for courier and postage
            services, not for an app subscription or paid feature.
            {isShopifyDevelopmentSandbox &&
              ' Development-store test mode is active: test bookings use no real courier or funds.'}
          </Alert>
        )}

        {impersonationSession && (
          <Alert
            severity="warning"
            sx={{ borderRadius: 0, alignItems: 'center' }}
            action={
              <Button color="inherit" size="small" onClick={exitImpersonation}>
                Exit to Admin
              </Button>
            }
          >
            Admin session active. You are viewing this seller account on behalf of support.
          </Alert>
        )}

        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            p: 0,
            backgroundColor: 'transparent',
          }}
        >
          <Box
            sx={{
              maxWidth: 1700,
              mx: 'auto',
              width: '100%',
              px: isOrderCreatePage
                ? { xs: 0, sm: 0.25, md: 0.4, lg: 0.5 }
                : { xs: 0.4, sm: 0.8, md: 1.5, lg: 2 },
              py: isOrderCreatePage
                ? 0
                : { xs: 0.6, sm: 1, md: 1.5 },
            }}
          >
            <Suspense
              fallback={
                <Box key={`layout-fallback-${location.pathname}`} sx={{ minHeight: 300 }} />
              }
            >
              <Box
                key={location.pathname}
                data-tour-page={getTourPageId(location.pathname)}
                sx={{ width: '100%', minHeight: '300px' }}
              >
                <RequireEmployeeModule>
                  <Outlet />
                </RequireEmployeeModule>
              </Box>
            </Suspense>
          </Box>
        </Box>

        {!isOrderCreatePage && (
          <Box
            sx={{
              maxWidth: 1700,
              mx: 'auto',
              width: '100%',
              px: { xs: 0.6, md: 0.2 },
              pt: 0.4,
              borderTop: '1px solid rgba(17, 17, 19, 0.08)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: { xs: 'center', md: 'space-between' },
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1,
                py: 1.5,
                color: 'text.secondary',
                fontSize: '0.72rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              <Box
                component="a"
                href="https://searchcraftdigital.com/"
                target="_blank"
                rel="noreferrer"
                sx={{
                  color: 'inherit',
                  textDecoration: 'none',
                  fontWeight: 700,
                  fontSize: '6px',
                  fontStyle: 'italic',
                  transition: 'color 180ms ease',
                  '&:hover': {
                    color: 'primary.main',
                  },
                }}
              >
                Crafted by SearchCraft Digital
              </Box>
            </Box>
          </Box>
        )}
      </Stack>
    </Box>
  )
}
