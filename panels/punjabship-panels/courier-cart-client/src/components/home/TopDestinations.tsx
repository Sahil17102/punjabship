import { alpha, Box, Button, Skeleton, Stack, Typography } from '@mui/material'
import { MdLocationOn } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import type { TopDestination } from '../../api/dashboard.api'

const BRAND_PRIMARY = '#0877C9'
const INK = '#111827'
const MUTED = '#6B7280'

type TopDestinationsProps = {
  data?: TopDestination[]
  isLoading?: boolean
  error?: string | null
}

const TopDestinations = ({ data: overrideData, isLoading: overrideLoading, error: overrideError }: TopDestinationsProps) => {
  const navigate = useNavigate()
  const destinations = overrideData
  const isLoading = overrideLoading ?? false
  const errorMessage = overrideError ?? null

  return (
    <Stack spacing={1.8}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography sx={{ fontSize: '1.02rem', fontWeight: 800, color: INK }}>
          Top Destinations
        </Typography>
        <Typography sx={{ fontSize: '12px', color: MUTED, fontWeight: 600 }}>Top lanes</Typography>
      </Stack>
      {errorMessage && (
        <Typography sx={{ fontSize: '0.75rem', color: '#b42318', fontWeight: 600 }}>
          {errorMessage}
        </Typography>
      )}

      {isLoading ? (
        <Stack spacing={1.2}>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} height={60} variant="rectangular" sx={{ borderRadius: 0 }} />
          ))}
        </Stack>
      ) : !destinations || destinations.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 4,
            borderRadius: 0,
            border: '1px dashed rgba(17, 24, 39, 0.18)',
            bgcolor: '#F8FAFC',
          }}
        >
          <MdLocationOn size={34} style={{ color: BRAND_PRIMARY, opacity: 0.6 }} />
          <Typography sx={{ mt: 0.8, fontSize: '0.88rem', color: MUTED, fontWeight: 600 }}>
            No destination data available yet
          </Typography>
        </Box>
      ) : (
        <Stack spacing={0.9}>
          {destinations.map((destination, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.4,
                borderRadius: 0,
                border: '1px solid rgba(17, 24, 39, 0.08)',
                bgcolor: '#ffffff',
                transition: 'all .2s ease',
                '&:hover': {
                  borderColor: 'rgba(17, 24, 39, 0.14)',
                  bgcolor: '#F8FAFC',
                },
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 0,
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: '0.78rem',
                  color: index === 0 ? '#ffffff' : INK,
                  bgcolor: index === 0 ? BRAND_PRIMARY : '#F4F5F8',
                  flexShrink: 0,
                }}
              >
                {index + 1}
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontSize: '0.9rem', fontWeight: 700, color: INK }}>
                  {destination.city}
                </Typography>
                <Typography noWrap sx={{ fontSize: '0.77rem', color: MUTED }}>
                  {destination.state}
                </Typography>
              </Box>

              <Box
                sx={{
                  px: 1.2,
                  py: 0.55,
                  borderRadius: 0,
                  border: '1px solid rgba(17, 24, 39, 0.08)',
                  bgcolor: '#F9FAFB',
                }}
              >
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: INK }}>
                  {destination.count} {destination.count === 1 ? 'order' : 'orders'}
                </Typography>
              </Box>
            </Box>
          ))}
        </Stack>
      )}

      {destinations && destinations.length > 0 && (
        <Box textAlign="right">
          <Button
            onClick={() => navigate('/orders/list')}
            variant="text"
            sx={{
              color: BRAND_PRIMARY,
              fontWeight: 700,
              textTransform: 'none',
              '&:hover': { bgcolor: alpha(BRAND_PRIMARY, 0.08) },
            }}
          >
            View All Orders
          </Button>
        </Box>
      )}
    </Stack>
  )
}

export default TopDestinations
