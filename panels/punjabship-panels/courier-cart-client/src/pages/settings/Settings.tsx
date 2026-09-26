import {
  alpha,
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { FaBuilding, FaFileInvoice, FaTruck, FaUsers } from 'react-icons/fa'
import { FaLink } from 'react-icons/fa6'
import { IoDocumentTextOutline } from 'react-icons/io5'
import { MdOutlineRequestQuote, MdPriorityHigh, MdSecurity } from 'react-icons/md'
import { PiPassword } from 'react-icons/pi'
import { RiBankFill } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'

type SettingItem = {
  title: string
  description: string
  key: string
  icon: React.ReactNode
}

const allSettings: SettingItem[] = [
  // Identity & access
  {
    title: 'Company profile',
    description: 'Maintain business identity, registered contact details, and brand-facing information.',
    key: '/profile/company',
    icon: <FaBuilding />,
  },
  {
    title: 'Login password',
    description: 'Update password policies and strengthen day-to-day account security.',
    key: '/profile/user_profile/settings/password',
    icon: <PiPassword />,
  },
  {
    title: 'KYC verification',
    description: 'Review compliance documents and keep verification data ready for operations.',
    key: '/profile/kyc_details',
    icon: <MdSecurity />,
  },
  {
    title: 'Bank accounts',
    description: 'Manage payout-ready bank accounts for wallet, billing, and settlement flows.',
    key: '/profile/bank_details',
    icon: <RiBankFill />,
  },
  {
    title: 'User management',
    description: 'Create employee access, assign responsibilities, and control active users.',
    key: '/settings/users_management',
    icon: <FaUsers />,
  },
  // Shipping operations
  {
    title: 'Pickup addresses',
    description: 'Control warehouse origins, address readiness, and dispatch pickup locations.',
    key: '/settings/manage_pickups',
    icon: <FaTruck />,
  },
  {
    title: 'Invoice preferences',
    description: 'Define invoice presentation, branding, and downstream document preferences.',
    key: '/settings/invoice_preferences',
    icon: <FaFileInvoice />,
  },
  {
    title: 'Billing preferences',
    description: 'Configure how invoices and financial preferences are managed for the workspace.',
    key: '/settings/billing_preferences',
    icon: <MdOutlineRequestQuote />,
  },
  {
    title: 'Label configuration',
    description: 'Tune shipping label fields, output details, and document visibility.',
    key: '/settings/label_config',
    icon: <IoDocumentTextOutline />,
  },
  // Connections & routing
  {
    title: 'Connected channels',
    description: 'Review store connections and manage how order sources flow into PunjabShip.',
    key: '/channels/connected',
    icon: <FaLink />,
  },
  {
    title: 'Courier priority',
    description: 'Shape routing preference logic around speed, serviceability, and cost.',
    key: '/settings/courier_priority',
    icon: <MdPriorityHigh />,
  },
  {
    title: 'API integration',
    description: 'Control API keys, webhook subscriptions, and integration security surfaces.',
    key: '/settings/api-integration',
    icon: <FaLink />,
  },
]

function SettingTile({ item, onOpen }: { item: SettingItem; onOpen: () => void }) {
  return (
    <Paper
      elevation={0}
      onClick={onOpen}
      sx={{
        height: '100%',
        p: 2,
        borderRadius: 3,
        border: '1px solid rgba(17, 17, 19, 0.08)',
        background: 'linear-gradient(180deg, #FFFFFF 0%, #FAF7F5 100%)',
        boxShadow: '0 14px 28px rgba(17, 17, 19, 0.04)',
        cursor: 'pointer',
        transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: alpha('#0877C9', 0.24),
          boxShadow: '0 18px 34px rgba(17, 17, 19, 0.08)',
        },
      }}
    >
      <Stack spacing={1.35}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            color: '#0877C9',
            bgcolor: alpha('#0877C9', 0.08),
            border: `1px solid ${alpha('#0877C9', 0.12)}`,
          }}
        >
          {item.icon}
        </Box>
        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: '#17171A' }}>
          {item.title}
        </Typography>
        <Typography sx={{ fontSize: '0.88rem', color: '#6E6763', lineHeight: 1.55 }}>
          {item.description}
        </Typography>
      </Stack>
    </Paper>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()

  return (
    <Box sx={{ p: { xs: 1.5, md: 2.2 } }}>
      <Stack spacing={3}>
        {/* Page Header */}
        <Stack spacing={0.75}>
          <Typography sx={{ fontSize: { xs: '1.3rem', md: '1.5rem' }, fontWeight: 900, color: '#17171A' }}>
            Settings
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#6B7280', lineHeight: 1.6 }}>
            Manage your workspace, security, users and account preferences
          </Typography>
        </Stack>

        {/* Settings Grid */}
        <Grid container spacing={2}>
          {allSettings.map((item) => (
            <Grid key={item.key} size={{ xs: 12, sm: 6, lg: 4 }}>
              <SettingTile item={item} onOpen={() => navigate(item.key)} />
            </Grid>
          ))}
        </Grid>
      </Stack>
    </Box>
  )
}
