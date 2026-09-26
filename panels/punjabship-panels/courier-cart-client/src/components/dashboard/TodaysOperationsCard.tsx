import { Box, Card, CardContent, Grid, Typography, alpha, useTheme } from '@mui/material'
import { TbTruckDelivery } from 'react-icons/tb'

interface TodaysOperationsCardProps {
  todayOps: {
    orders: number
    pending: number
    inTransit: number
    delivered: number
  }
}

export default function TodaysOperationsCard({ todayOps }: TodaysOperationsCardProps) {
  const theme = useTheme()

  const operations = [
    { label: 'Today Orders', value: todayOps.orders || 0, color: theme.palette.primary.main },
    { label: 'Pending', value: todayOps.pending || 0, color: theme.palette.info.main },
    { label: 'In Transit', value: todayOps.inTransit || 0, color: theme.palette.warning.main },
    { label: 'Delivered', value: todayOps.delivered || 0, color: theme.palette.success.main },
  ]

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, transparent 100%)`
          : 'white',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          <TbTruckDelivery style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Today's Operations
        </Typography>
        <Grid container spacing={2} mt={1}>
          {operations.map((op, idx) => (
            <Grid size={{ xs: 6 }} key={idx}>
              <Box sx={{ p: 2, bgcolor: alpha(op.color, 0.1), borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {op.label}
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {op.value}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )
}
