import { alpha, Box, Skeleton, Stack, Tooltip, Typography, useMediaQuery, useTheme } from '@mui/material'
import { MdAccessTime, MdLocationPin, MdLocalShipping } from 'react-icons/md'
import type { Pickup } from '../../api/dashboard.api'
import StatusChip from '../UI/chip/StatusChip'

const BRAND_PRIMARY = '#0877C9'
const INK = '#111827'
const MUTED = '#6B7280'

type UpcomingPickupsHomeProps = {
  data?: Pickup[]
  isLoading?: boolean
  error?: string | null
}

const UpcomingPickupsHome = ({ data: overrideData, isLoading: overrideLoading, error: overrideError }: UpcomingPickupsHomeProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const pickups = overrideData
  const isLoading = overrideLoading ?? false
  const errorMessage = overrideError ?? null

  return (
    <Stack gap={1.8}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Typography sx={{ fontSize: '1.02rem', fontWeight: 800, color: INK }}>
          Upcoming Pickups
        </Typography>
        <Typography sx={{ fontSize: '12px', color: MUTED, fontWeight: 600 }}>
          Scheduled queue
        </Typography>
      </Stack>
      {errorMessage && (
        <Typography sx={{ fontSize: '0.75rem', color: '#b42318', fontWeight: 600 }}>
          {errorMessage}
        </Typography>
      )}

      {isLoading && (
        <Stack gap={1.05}>
          {[1, 2, 3].map((i) => (
            <Box
              key={i}
              sx={{
                borderRadius: 0,
                p: 1.35,
                border: '1px solid rgba(17, 24, 39, 0.08)',
                bgcolor: '#ffffff',
              }}
            >
              <Skeleton variant="text" width={150} height={22} />
              <Skeleton variant="text" width={230} height={18} />
              <Skeleton variant="text" width={190} height={18} />
            </Box>
          ))}
        </Stack>
      )}

      {!isLoading && (!pickups || pickups.length === 0) && (
        <Box
          sx={{
            py: 3.3,
            textAlign: 'center',
            borderRadius: 0,
            border: '1px dashed rgba(17, 24, 39, 0.18)',
            bgcolor: '#F8FAFC',
          }}
        >
          <MdLocalShipping size={30} style={{ color: BRAND_PRIMARY, opacity: 0.62 }} />
          <Typography sx={{ mt: 0.8, fontSize: '0.88rem', color: MUTED, fontWeight: 600 }}>
            No upcoming pickups found
          </Typography>
        </Box>
      )}

      {!isLoading && !errorMessage && pickups && pickups.length > 0 && (
        <Stack gap={1.05}>
          {pickups.map((pickup) => {
            const createdDate = pickup.created_at
              ? new Date(pickup.created_at).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })
              : '—'

            const createdTime = pickup.created_at
              ? new Date(pickup.created_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '—'

            const warehouseName = pickup.pickup_details?.warehouse_name ?? 'Warehouse'
            const courier = pickup?.courier_partner ?? 'Courier TBD'
            const address = pickup.pickup_details?.address ?? '—'

            return (
              <Box
                key={pickup.id}
                sx={{
                  borderRadius: 0,
                  p: 1.35,
                  border: '1px solid rgba(17, 24, 39, 0.08)',
                  bgcolor: '#ffffff',
                  transition: 'all .2s ease',
                  '&:hover': {
                    borderColor: 'rgba(17, 24, 39, 0.14)',
                    backgroundColor: '#F8FAFC',
                  },
                }}
              >
                <Stack
                  direction={isMobile ? 'column' : 'row'}
                  alignItems={isMobile ? 'flex-start' : 'center'}
                  justifyContent="space-between"
                  gap={1}
                >
                  <Stack gap={0.7} minWidth={0}>
                    <Stack direction="row" gap={1} minWidth={0} alignItems="center">
                      <Typography
                        noWrap
                        sx={{
                          maxWidth: isMobile ? 210 : 180,
                          fontWeight: 700,
                          color: INK,
                          fontSize: '0.88rem',
                        }}
                      >
                        {warehouseName}
                      </Typography>
                      <Typography
                        noWrap
                        sx={{
                          maxWidth: 130,
                          fontSize: '0.77rem',
                          color: alpha(INK, 0.85),
                          borderRadius: 0,
                          px: 0.8,
                          py: 0.2,
                          bgcolor: '#F4F5F8',
                          border: '1px solid rgba(17, 24, 39, 0.08)',
                        }}
                      >
                        {courier}
                      </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" gap={0.6}>
                      <MdAccessTime size={14} color={MUTED} />
                      <Typography sx={{ fontSize: '12px', color: MUTED }}>
                        Created: {createdDate} | {createdTime}
                      </Typography>
                    </Stack>

                    <Stack direction="row" alignItems="center" gap={0.6} minWidth={0}>
                      <MdLocationPin size={14} color={MUTED} />
                      <Tooltip title={address}>
                        <Typography noWrap sx={{ maxWidth: isMobile ? 230 : 340, fontSize: '12px', color: MUTED }}>
                          {address}
                        </Typography>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  <StatusChip label="Scheduled" status="pending" />
                </Stack>
              </Box>
            )
          })}
        </Stack>
      )}
    </Stack>
  )
}

export default UpcomingPickupsHome
