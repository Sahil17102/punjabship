import { alpha, Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import {
  MdAdd,
  MdCalculate,
  MdLocalShipping,
  MdShoppingCart,
  MdSupport,
  MdTrackChanges,
} from 'react-icons/md'
import { TbTruckDelivery } from 'react-icons/tb'
import { useNavigate } from 'react-router-dom'

const BRAND_PRIMARY = '#0877C9'
export default function QuickActionsCard() {
  const navigate = useNavigate()

  const actions = [
    { label: 'Create Order', icon: <MdAdd size={18} />, path: '/orders/create' },
    { label: 'All Orders', icon: <MdShoppingCart size={18} />, path: '/orders/list' },
    { label: 'Rate Calculator', icon: <MdCalculate size={18} />, path: '/tools/rate_calculator' },
    { label: 'Track AWB', icon: <MdTrackChanges size={18} />, path: '/tools/order_tracking' },
    { label: 'Support', icon: <MdSupport size={18} />, path: '/support/tickets' },
    { label: 'Shipments', icon: <TbTruckDelivery size={18} />, path: '/orders/list' },
  ]

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: 4,
        border: `1px solid ${alpha('#111113', 0.08)}`,
        background: 'linear-gradient(180deg, rgba(19,19,21,0.98) 0%, rgba(30,30,33,0.98) 100%)',
        boxShadow: '0 20px 36px rgba(17, 17, 19, 0.14)',
      }}
    >
      <CardContent sx={{ p: 2.2 }}>
        <Stack direction="row" spacing={1.1} alignItems="center" mb={1.8}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: 1.8,
              display: 'grid',
              placeItems: 'center',
              bgcolor: alpha('#fff', 0.08),
              color: '#fff',
            }}
          >
            <MdLocalShipping size={20} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>Quick Actions</Typography>
            <Typography sx={{ fontSize: '0.76rem', fontWeight: 600, color: alpha('#fff', 0.62) }}>
              Common workflows for bookings, tracking, and support
            </Typography>
          </Box>
        </Stack>

        <Grid container spacing={1.1}>
          {actions.map((action) => {
            return (
              <Grid size={{ xs: 6 }} key={action.label}>
                <Box
                  onClick={() => navigate(action.path)}
                  sx={{
                    p: 0.95,
                    borderRadius: 3,
                    border: `1px solid ${alpha('#fff', 0.08)}`,
                    bgcolor: alpha('#fff', 0.04),
                    cursor: 'pointer',
                    transition: 'all .2s ease',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.08),
                      borderColor: alpha(BRAND_PRIMARY, 0.42),
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: 1.4,
                      display: 'grid',
                      placeItems: 'center',
                        color: '#fff',
                        bgcolor: alpha(BRAND_PRIMARY, 0.26),
                      }}
                    >
                      {action.icon}
                    </Box>
                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                      {action.label}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
            )
          })}
        </Grid>
      </CardContent>
    </Card>
  )
}
