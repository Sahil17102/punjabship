import { Box, Card, CardContent, LinearProgress, Stack, Typography, alpha, useTheme } from '@mui/material'
import { MdLocalShipping } from 'react-icons/md'

interface CourierPerformanceCardProps {
  courierPerformance: Record<string, { count: number; delivered: number; deliveryRate: number }>
}

export default function CourierPerformanceCard({
  courierPerformance,
}: CourierPerformanceCardProps) {
  const theme = useTheme()

  const couriers = Object.entries(courierPerformance || {})
    .sort(([, a], [, b]) => (b.count || 0) - (a.count || 0))
    .slice(0, 5)
    .map(([name, perf]) => ({ name, ...perf }))

  if (couriers.length === 0) {
    return null
  }

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.05)} 0%, transparent 100%)`
          : 'white',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          <MdLocalShipping style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Courier Performance
        </Typography>
        <Stack spacing={2} mt={2}>
          {couriers.map((courier) => (
            <Box key={courier.name}>
              <Stack direction="row" justifyContent="space-between" mb={1}>
                <Typography variant="body2" fontWeight="medium">
                  {courier.name}
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {courier.deliveryRate || 0}% success
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {courier.count || 0} orders
              </Typography>
              <LinearProgress
                variant="determinate"
                value={courier.deliveryRate || 0}
                sx={{ height: 6, borderRadius: 3, mt: 1 }}
                color="success"
              />
            </Box>
          ))}
        </Stack>
      </CardContent>
    </Card>
  )
}
