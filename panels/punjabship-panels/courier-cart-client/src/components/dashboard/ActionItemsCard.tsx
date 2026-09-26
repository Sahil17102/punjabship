import { alpha, Box, Card, CardContent, Stack, Typography } from '@mui/material'
import { MdKeyboardReturn, MdNotificationsActive } from 'react-icons/md'
import { TbAlertTriangle, TbInvoice } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'

interface ActionItemsCardProps {
  actions: {
    ndrCount: number
    rtoCount: number
    pendingInvoices: number
    pendingInvoiceAmount: number
  }
  formatCurrency: (amount: number) => string
}

const BRAND_PRIMARY = '#0877C9'
const BRAND_ACCENT = '#B8D719'

export default function ActionItemsCard({ actions, formatCurrency }: ActionItemsCardProps) {
  const navigate = useNavigate()

  if (actions.ndrCount === 0 && actions.rtoCount === 0 && actions.pendingInvoices === 0) return null

  const items = [
    actions.ndrCount > 0
      ? {
          title: `${actions.ndrCount} NDR Pending`,
          subtitle: 'Review failed attempts',
          icon: <TbAlertTriangle size={18} />,
          color: '#b42318',
          bg: alpha('#b42318', 0.08),
          path: '/ops/ndr',
        }
      : null,
    actions.rtoCount > 0
      ? {
          title: `${actions.rtoCount} RTO Cases`,
          subtitle: 'Manage return flow',
          icon: <MdKeyboardReturn size={18} />,
          color: '#8a3e00',
          bg: alpha(BRAND_ACCENT, 0.12),
          path: '/ops/rto',
        }
      : null,
    actions.pendingInvoices > 0
      ? {
          title: `${actions.pendingInvoices} Invoice Pending`,
          subtitle: `Amount ${formatCurrency(actions.pendingInvoiceAmount || 0)}`,
          icon: <TbInvoice size={18} />,
          color: BRAND_PRIMARY,
          bg: alpha(BRAND_PRIMARY, 0.08),
          path: '/billing/invoice_management',
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string
    subtitle: string
    icon: React.ReactNode
    color: string
    bg: string
    path: string
  }>

  return (
    <Card sx={{ height: '100%', borderRadius: 2.6, border: `1px solid ${alpha(BRAND_PRIMARY, 0.14)}`, boxShadow: `0 8px 20px ${alpha(BRAND_PRIMARY, 0.08)}` }}>
      <CardContent sx={{ p: 1.8 }}>
        <Stack direction="row" spacing={0.9} alignItems="center" mb={1.35}>
          <Box sx={{ width: 30, height: 30, borderRadius: 1.5, display: 'grid', placeItems: 'center', bgcolor: alpha(BRAND_PRIMARY, 0.12), color: BRAND_PRIMARY }}>
            <MdNotificationsActive size={18} />
          </Box>
          <Typography sx={{ fontSize: '0.94rem', fontWeight: 800, color: '#17171A' }}>Action Required</Typography>
        </Stack>

        <Stack spacing={0.85}>
          {items.map((item) => (
            <Box
              key={item.title}
              onClick={() => navigate(item.path)}
              sx={{
                p: 0.95,
                borderRadius: 2,
                border: `1px solid ${alpha(item.color, 0.28)}`,
                bgcolor: item.bg,
                cursor: 'pointer',
                transition: 'all .2s ease',
                '&:hover': { transform: 'translateX(3px)' },
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography sx={{ fontSize: '12.5px', color: '#17171A', fontWeight: 700 }}>{item.title}</Typography>
                  <Typography sx={{ fontSize: '11.5px', color: '#496189' }}>{item.subtitle}</Typography>
                </Box>
                <Box sx={{ color: item.color }}>{item.icon}</Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
