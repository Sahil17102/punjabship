import {
  alpha,
  Box,
  Grid,
  Paper,
  Stack,
  styled,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import React from 'react'
import {
  FiDollarSign,
  FiGrid,
  FiPackage,
  FiSearch,
  FiSettings,
  FiTool,
  FiTruck,
  FiUsers,
} from 'react-icons/fi'
import PageHeading from '../components/UI/heading/PageHeading'

const BRAND_PRIMARY = '#0877C9'

const Kbd = styled(Box)(({ theme }) => ({
  fontFamily: '"SF Mono", "Monaco", "Cascadia Code", "Roboto Mono", monospace',
  padding: '8px 14px',
  borderRadius: '10px',
  border: '1px solid rgba(217, 4, 22, 0.14)',
  background: 'linear-gradient(180deg, #FFFFFF 0%, #FBF5F2 100%)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: theme.spacing(1),
  marginBottom: theme.spacing(0.5),
  fontSize: '0.82rem',
  fontWeight: 700,
  color: '#17171A',
  boxShadow: '0 8px 18px rgba(20, 20, 20, 0.08)',
  userSelect: 'none',
  minWidth: '32px',
  textAlign: 'center',
}))

interface Shortcut {
  keys: string[]
  label: string
}

interface Category {
  title: string
  icon: React.ReactNode
  shortcuts: Shortcut[]
}

const categories: Category[] = [
  {
    title: 'Navigation',
    icon: <FiGrid size={22} color={BRAND_PRIMARY} />,
    shortcuts: [
      { label: 'Dashboard', keys: ['Ctrl/⌘', 'Shift', 'D'] },
      { label: 'Home', keys: ['Ctrl/⌘', 'Shift', 'H'] },
    ],
  },
  {
    title: 'Orders',
    icon: <FiTruck size={22} color={BRAND_PRIMARY} />,
    shortcuts: [
      { label: 'All Orders', keys: ['Ctrl/⌘', 'Shift', 'O'] },
      { label: 'Create Order', keys: ['Ctrl/⌘', 'Shift', 'N'] },
      { label: 'NDR Events', keys: ['Ctrl/⌘', 'Shift', 'E'] },
      { label: 'RTO Events', keys: ['Ctrl/⌘', 'Shift', 'R'] },
    ],
  },
  {
    title: 'Billing & Finance',
    icon: <FiDollarSign size={22} color={BRAND_PRIMARY} />,
    shortcuts: [
      { label: 'Invoices', keys: ['Ctrl/⌘', 'Shift', 'I'] },
      { label: 'Wallet Transactions', keys: ['Ctrl/⌘', 'Shift', 'W'] },
      { label: 'COD Remittance', keys: ['Ctrl/⌘', 'Shift', 'M'] },
    ],
  },
  {
    title: 'Tools',
    icon: <FiTool size={22} color={BRAND_PRIMARY} />,
    shortcuts: [
      { label: 'Rate Calculator', keys: ['Ctrl/⌘', 'Shift', 'K'] },
      { label: 'Order Tracking', keys: ['Ctrl/⌘', 'Shift', 'T'] },
    ],
  },
  {
    title: 'Operations',
    icon: <FiPackage size={22} color={BRAND_PRIMARY} />,
    shortcuts: [{ label: 'Weight Reconciliation', keys: ['Ctrl/⌘', 'Shift', 'G'] }],
  },
  {
    title: 'Settings & Profile',
    icon: <FiSettings size={22} color={BRAND_PRIMARY} />,
    shortcuts: [
      { label: 'Settings', keys: ['Ctrl/⌘', 'Shift', 'S'] },
      { label: 'Profile', keys: ['Ctrl/⌘', 'Shift', 'P'] },
    ],
  },
  {
    title: 'Support',
    icon: <FiUsers size={22} color={BRAND_PRIMARY} />,
    shortcuts: [{ label: 'Support Tickets', keys: ['Ctrl/⌘', 'Shift', 'U'] }],
  },
  {
    title: 'Global',
    icon: <FiSearch size={22} color={BRAND_PRIMARY} />,
    shortcuts: [
      { label: 'Focus Search', keys: ['Ctrl/⌘', 'K'] },
      { label: 'Keyboard Shortcuts', keys: ['Ctrl/⌘', 'Shift', '/'] },
    ],
  },
]

const KeyboardShortcutsPage: React.FC = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Stack spacing={3.5} sx={{ py: 2.5 }}>
      <PageHeading
        title="Keyboard Shortcuts"
        subtitle="Master the workspace with fast keyboard actions and reduce repetitive navigation."
      />

      {/* <Box
        sx={{
          borderRadius: 5,
          overflow: 'hidden',
          border: `1px solid ${alpha(BRAND_PRIMARY, 0.12)}`,
          boxShadow: '0 18px 38px rgba(20, 20, 20, 0.08)',
        }}
      >
        <Box
          component="img"
          src="/images/keyboard-shortcuts.png"
          alt="Keyboard Shortcuts Guide"
          sx={{ width: '100%', display: 'block', objectFit: 'cover' }}
        />
      </Box> */}

      <Grid container spacing={2.5}>
        {categories.map(({ title, icon, shortcuts }) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={title}>
            <Paper
              elevation={0}
              sx={{
                p: 2.4,
                borderRadius: 5,
                border: `1px solid ${alpha(BRAND_PRIMARY, 0.12)}`,
                boxShadow: '0 16px 32px rgba(20, 20, 20, 0.06)',
                height: '100%',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.2} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    width: 42,
                    height: 42,
                    borderRadius: 3,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: alpha(BRAND_PRIMARY, 0.08),
                  }}
                >
                  {icon}
                </Box>
                <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={800} color="#17171A">
                  {title}
                </Typography>
              </Stack>

              <Stack spacing={1.6}>
                {shortcuts.map(({ label, keys }) => (
                  <Box key={label}>
                    <Typography sx={{ mb: 1.1, color: BRAND_PRIMARY, fontWeight: 700 }}>
                      {label}
                    </Typography>
                    <Box display="flex" flexWrap="wrap" alignItems="center" gap={0.5}>
                      {keys.map((key, idx) => (
                        <React.Fragment key={`${label}-${key}-${idx}`}>
                          <Kbd>{key}</Kbd>
                          {idx < keys.length - 1 && (
                            <Typography sx={{ color: '#6E6763', fontWeight: 700 }}>+</Typography>
                          )}
                        </React.Fragment>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export default KeyboardShortcutsPage
