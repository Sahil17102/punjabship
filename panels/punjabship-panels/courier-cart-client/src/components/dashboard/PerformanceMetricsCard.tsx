import { Box, Card, CardContent, LinearProgress, Stack, Typography, alpha, useTheme } from '@mui/material'
import { MdAssessment } from 'react-icons/md'

interface PerformanceMetricsCardProps {
  operational: {
    deliverySuccessRate: number
    ndrRate: number
    rtoRate: number
    avgDeliveryTime: number
  }
  formatPercentage: (value: number) => string
}

export default function PerformanceMetricsCard({
  operational,
  formatPercentage,
}: PerformanceMetricsCardProps) {
  const theme = useTheme()
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
        <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
          <Box
            sx={{
              bgcolor: alpha(theme.palette.info.main, 0.1),
              borderRadius: '10px',
              p: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MdAssessment size={24} color={theme.palette.info.main} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight="bold">
              Performance Metrics
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Operational health
            </Typography>
          </Box>
        </Stack>
        <Stack spacing={3} mt={2}>
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                Delivery Success Rate
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatPercentage(operational.deliverySuccessRate || 0)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={operational.deliverySuccessRate || 0}
              sx={{ height: 8, borderRadius: 4 }}
              color="success"
            />
          </Box>
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                NDR Rate
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="error">
                {formatPercentage(operational.ndrRate || 0)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={operational.ndrRate || 0}
              sx={{ height: 8, borderRadius: 4 }}
              color="error"
            />
          </Box>
          <Box>
            <Stack direction="row" justifyContent="space-between" mb={1}>
              <Typography variant="body2" color="text.secondary">
                RTO Rate
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="warning.main">
                {formatPercentage(operational.rtoRate || 0)}
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={operational.rtoRate || 0}
              sx={{ height: 8, borderRadius: 4 }}
              color="warning"
            />
          </Box>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Average Delivery Time
            </Typography>
            <Typography variant="h5" fontWeight="bold">
              {operational.avgDeliveryTime || 0} days
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

