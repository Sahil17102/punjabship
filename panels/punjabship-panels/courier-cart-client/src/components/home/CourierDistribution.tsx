import { Box, LinearProgress, Skeleton, Stack, Typography } from '@mui/material'
import { FaTruck } from 'react-icons/fa6'
import type { CourierDistribution as CourierDistributionType } from '../../api/dashboard.api'

const BRAND_PRIMARY = '#0877C9'
const INK = '#111827'
const MUTED = '#6B7280'

const barColors = ['#0877C9', '#244f9e', '#B8D719', '#D95C00', '#6B7280', '#17171A']

type CourierDistributionProps = {
  data?: CourierDistributionType[]
  isLoading?: boolean
  error?: string | null
}

const CourierDistribution = ({
  data: overrideData,
  isLoading: overrideLoading,
  error: overrideError,
}: CourierDistributionProps) => {
  const distribution = overrideData
  const isLoading = overrideLoading ?? false
  const errorMessage = overrideError ?? null
  const totalOrders = distribution?.reduce((sum, item) => sum + item.count, 0) || 0

  return (
    <Stack gap={1.8}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography sx={{ fontSize: '1.02rem', fontWeight: 800, color: INK }}>
          Courier Distribution
        </Typography>
        <Typography sx={{ fontSize: '12px', color: MUTED, fontWeight: 600 }}>Order Share</Typography>
      </Stack>
      {errorMessage && (
        <Typography sx={{ fontSize: '0.75rem', color: '#b42318', fontWeight: 600 }}>
          {errorMessage}
        </Typography>
      )}

      {isLoading ? (
        <Stack gap={1.2}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={70} variant="rectangular" sx={{ borderRadius: 0 }} />
          ))}
        </Stack>
      ) : !distribution || distribution.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            borderRadius: 0,
            border: '1px dashed rgba(17, 24, 39, 0.18)',
            bgcolor: '#F8FAFC',
          }}
        >
          <FaTruck size={30} style={{ color: BRAND_PRIMARY, opacity: 0.55 }} />
          <Typography sx={{ mt: 0.8, fontSize: '0.88rem', color: MUTED, fontWeight: 600 }}>
            No courier distribution available
          </Typography>
        </Box>
      ) : (
        <Stack gap={1.05}>
          {distribution.map((item, index) => {
            const percentage = totalOrders > 0 ? (item.count / totalOrders) * 100 : 0
            const color = barColors[index % barColors.length]

            return (
              <Box
                key={index}
                sx={{
                  p: 1.4,
                  borderRadius: 0,
                  border: '1px solid rgba(17, 24, 39, 0.08)',
                  bgcolor: '#ffffff',
                }}
              >
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.95}>
                  <Typography noWrap sx={{ maxWidth: '70%', fontSize: '0.88rem', color: INK, fontWeight: 700 }}>
                    {item.courier || 'Unknown Courier'}
                  </Typography>
                  <Typography sx={{ fontSize: '0.76rem', color: MUTED, fontWeight: 700 }}>
                    {item.count} {item.count === 1 ? 'order' : 'orders'}
                  </Typography>
                </Stack>

                <LinearProgress
                  variant="determinate"
                  value={percentage}
                  sx={{
                    height: 9,
                    borderRadius: 0,
                    bgcolor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 0,
                      bgcolor: color,
                    },
                  }}
                />

                <Stack direction="row" justifyContent="space-between" mt={0.6}>
                  <Typography sx={{ fontSize: '11px', color: MUTED }}>Share</Typography>
                  <Typography
                    sx={{
                      fontSize: '11px',
                      color: percentage > 35 ? '#8a3e00' : BRAND_PRIMARY,
                      fontWeight: 700,
                    }}
                  >
                    {percentage.toFixed(1)}%
                  </Typography>
                </Stack>
              </Box>
            )
          })}
        </Stack>
      )}

      {distribution && distribution.length > 0 && (
        <Box sx={{ p: 1.2, borderRadius: 0, bgcolor: '#F8FAFC', border: '1px solid rgba(17, 24, 39, 0.08)' }}>
          <Typography sx={{ fontSize: '12px', color: INK, fontWeight: 700 }}>
            Total orders processed: {totalOrders}
          </Typography>
        </Box>
      )}
    </Stack>
  )
}

export default CourierDistribution
