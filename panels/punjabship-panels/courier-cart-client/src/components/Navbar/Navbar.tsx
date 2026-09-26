import { alpha, Box, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import { FaBolt, FaWallet } from 'react-icons/fa'
import { TbLayoutSidebarRightCollapseFilled } from 'react-icons/tb'
import { useLocation } from 'react-router-dom'
import { useUserProfile } from '../../hooks/User/useUserProfile'
import StatusChip from '../UI/chip/StatusChip'
import GlobalSearch from './GlobalSearch'
import QuickActions from './QuickActions'
import UserMenu from './UserMenu'
import WalletMenu from './WalletMenu'

interface NavbarProps {
  handleDrawerToggle: () => void
}

const BRAND_SURFACE = '#FFFFFF'
const BRAND_TEXT = '#141414'
const BRAND_PRIMARY = '#0877C9'

const pageTitles: Array<[string, string]> = [
  ['/settings/manage_pickups', 'Pickup Addresses'],
  ['/settings/invoice_preferences', 'Invoice Preferences'],
  ['/settings/label_config', 'Label Settings'],
  ['/settings/users_management', 'User Management'],
  ['/settings/courier_priority', 'Courier Priority'],
  ['/settings/api-integration', 'API Integration'],
  ['/billing/wallet_transactions', 'Wallet Transactions'],
  ['/billing/invoice_management', 'Invoices'],
  ['/orders/b2c/list', 'B2C Shipments'],
  ['/orders/b2b/list', 'B2B Shipments'],
  ['/orders/create', 'Create Shipment'],
  ['/orders/list', 'All Shipments'],
  ['/tools/rate_calculator', 'Rate Calculator'],
  ['/tools/order_tracking', 'Track Shipment'],
  ['/tools/rate_card', 'Rate Chart'],
  ['/reconciliation/weight/settings', 'Weight Audit Rules'],
  ['/reconciliation/weight', 'Weight Audit'],
  ['/channels/connected', 'Connected Channels'],
  ['/channels/channel_list', 'Connect Store'],
  ['/support/tickets', 'Support Tickets'],
  ['/support/about_us', 'About PunjabShip'],
  ['/profile/company', 'Company Profile'],
  ['/profile/bank_details', 'Bank Details'],
  ['/profile/kyc_details', 'KYC Details'],
  ['/profile/password', 'Password Settings'],
  ['/profile', 'Profile'],
  ['/account-readiness', 'Account Readiness'],
  ['/cod-remittance', 'COD Settlements'],
  ['/couriers/partners', 'Courier Partners'],
  ['/ops/ndr', 'NDR Management'],
  ['/ops/rto', 'RTO Management'],
  ['/reports', 'Insights Overview'],
  ['/settings', 'Workspace Settings'],
  ['/dashboard', 'Dashboard'],
  ['/home', 'Overview'],
]

const getPageTitle = (pathname: string) =>
  pageTitles.find(([path]) => pathname === path || pathname.startsWith(`${path}/`))?.[1] ||
  'PunjabShip Workspace'

export default function Navbar({ handleDrawerToggle }: NavbarProps) {
  const theme = useTheme()
  const { pathname } = useLocation()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const isCompactNavbar = useMediaQuery(theme.breakpoints.down('lg'))
  const { data: user } = useUserProfile(true)
  return (
    <Box sx={{ position: 'sticky', top: 0, zIndex: (currentTheme) => currentTheme.zIndex.appBar }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={{ xs: 0.5, sm: 0.6, md: 0.8, lg: 1.0 }}
        sx={{
          px: { xs: 0.5, sm: 0.8, md: 1.2, lg: 1.5 },
          py: { xs: 0.4, sm: 0.45, md: 0.5, lg: 0.6 },
          borderRadius: 0,
          backgroundColor: alpha(BRAND_SURFACE, 0.98),
          border: 0,
          borderBottom: `1px solid ${alpha('#30236E', 0.14)}`,
          boxShadow: '0 4px 14px rgba(48,35,87,0.06)',
          minHeight: { xs: 44, sm: 46, md: 48, lg: 52 },
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Stack
          direction="row"
          spacing={{ xs: 0.6, sm: 0.8, md: 1.0, lg: 1.2 }}
          alignItems="center"
          minWidth={0}
          flex={1}
        >
          {isMobile && (
            <IconButton
              data-tour-mobile-menu
              onClick={handleDrawerToggle}
              title="Open menu"
              sx={{
                width: { xs: 32, sm: 34, md: 36, lg: 40 },
                height: { xs: 32, sm: 34, md: 36, lg: 40 },
                borderRadius: 2,
                bgcolor: alpha('#000', 0.02),
                border: `1.5px solid ${alpha('#000', 0.08)}`,
                color: BRAND_TEXT,
                transition: 'all 280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                '&:hover': {
                  bgcolor: alpha(BRAND_PRIMARY, 0.09),
                  borderColor: alpha(BRAND_PRIMARY, 0.25),
                  color: BRAND_PRIMARY,
                  boxShadow: `0 4px 12px ${alpha(BRAND_PRIMARY, 0.12)}, inset 0 1px 0 rgba(255, 255, 255, 0.5)`,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <TbLayoutSidebarRightCollapseFilled size={16} />
            </IconButton>
          )}

          <Typography
            component="div"
            noWrap
            title={getPageTitle(pathname)}
            sx={{
              minWidth: 0,
              maxWidth: { xs: 150, sm: 190, lg: 240 },
              color: '#30236E',
              fontFamily: '"Hahmlet Variable", Georgia, serif',
              fontSize: { xs: '0.9rem', sm: '1rem', lg: '1.1rem' },
              fontWeight: 700,
              lineHeight: 1.2,
              flexShrink: 1,
            }}
          >
            {getPageTitle(pathname)}
          </Typography>

          <Box
            sx={{
              display: { xs: 'none', sm: 'block' },
              flex: 1,
              maxWidth: { sm: 280, md: 380, lg: 480 },
            }}
          >
            <GlobalSearch compact={isCompactNavbar} />
          </Box>
        </Stack>

        <Stack
          direction="row"
          spacing={{ xs: 0.4, sm: 0.5, md: 0.7, lg: 0.85 }}
          alignItems="center"
          justifyContent="flex-end"
          flexShrink={0}
          sx={{ minWidth: 0 }}
        >
          {isCompactNavbar ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <QuickActions compact iconOverride={<FaBolt size={12} />} />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <WalletMenu iconOnly iconOverride={<FaWallet size={12} />} />
              </Box>
            </>
          ) : (
            <>
              {user?.approved ? (
                <StatusChip
                  status="success"
                  label="Verified Account"
                  sx={{
                    display: { xs: 'none', md: 'flex' },
                    height: 28,
                    px: 1,
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    borderRadius: '999px',
                    border: '1px solid rgba(21, 128, 61, 0.25)',
                    background: 'rgba(21, 128, 61, 0.08)',
                    color: '#15803D',
                    '& .MuiChip-icon': {
                      color: '#15803D',
                    },
                  }}
                />
              ) : null}{' '}
              <QuickActions />
              <WalletMenu />
            </>
          )}
          <UserMenu />
        </Stack>
      </Stack>
    </Box>
  )
}
