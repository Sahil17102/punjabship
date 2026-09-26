import { alpha, Box, Card, CardContent, Grid, Stack, Typography } from '@mui/material'
import {
  MdAccountBalance,
  MdShoppingCart,
  MdLocalShipping,
  MdTrendingDown,
  MdTrendingUp,
} from 'react-icons/md'
import { useNavigate } from 'react-router-dom'

interface QuickStatsCardsProps {
  todayOps: {
    orders: number
    pending: number
    inTransit: number
    delivered: number
  }
  financial: {
    codRemittanceDue: number
  }
  trends: {
    ordersGrowth: number
  }
  formatCurrency: (amount: number) => string
}

const BRAND_PRIMARY = '#0877C9'

export default function QuickStatsCards({
  todayOps,
  financial,
  trends,
  formatCurrency,
}: QuickStatsCardsProps) {
  const navigate = useNavigate()

  const stats = [
    {
      title: 'Orders Today',
      value: todayOps.orders?.toLocaleString() || '0',
      subtitle: `${todayOps.delivered || 0} delivered`,
      icon: <MdShoppingCart size={20} />,
      color: BRAND_PRIMARY,
      onClick: () => navigate('/orders/list'),
    },
    {
      title: 'In Transit',
      value: todayOps.inTransit?.toLocaleString() || '0',
      subtitle: `${todayOps.pending || 0} pending`,
      icon: <MdLocalShipping size={20} />,
      color: '#6A1E25',
      onClick: () => navigate('/orders/list'),
    },
    {
      title: 'COD Due',
      value: formatCurrency(financial.codRemittanceDue || 0),
      subtitle: 'Pending remittance',
      icon: <MdAccountBalance size={20} />,
      color: '#3A3A40',
      onClick: () => navigate('/cod-remittance'),
    },
  ]

  return (
    <Grid container spacing={1.8} mb={2.2}>
      {stats.map((stat, index) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
          <Card
            onClick={stat.onClick}
            sx={{
              borderRadius: 4,
              border: `1px solid ${alpha('#111113', 0.08)}`,
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(247,242,239,0.98) 100%)',
              boxShadow: '0 18px 34px rgba(17, 17, 19, 0.06)',
              cursor: 'pointer',
              transition: 'all .2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: `0 22px 38px ${alpha(BRAND_PRIMARY, 0.12)}`,
                borderColor: alpha(stat.color, 0.35),
              },
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: '11px', fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase', color: alpha('#1B1B1F', 0.7) }}>
                    {stat.title}
                  </Typography>
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1.6,
                      display: 'grid',
                      placeItems: 'center',
                      color: stat.color,
                      bgcolor: alpha(stat.color, 0.12),
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Stack>

                <Typography sx={{ fontSize: '1.22rem', fontWeight: 800, color: '#161618', lineHeight: 1.2 }}>
                  {stat.value}
                </Typography>

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: '12px', color: '#706766', fontWeight: 600 }}>{stat.subtitle}</Typography>
                  {index === 0 && trends.ordersGrowth !== 0 && (
                    <Stack direction="row" spacing={0.3} alignItems="center" sx={{ color: trends.ordersGrowth > 0 ? BRAND_PRIMARY : '#b42318' }}>
                      {trends.ordersGrowth > 0 ? <MdTrendingUp size={13} /> : <MdTrendingDown size={13} />}
                      <Typography sx={{ fontSize: '11px', fontWeight: 700 }}>
                        {trends.ordersGrowth > 0 ? '+' : ''}
                        {trends.ordersGrowth}%
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}
