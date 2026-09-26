import { alpha, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { MdDashboardCustomize, MdRefresh } from 'react-icons/md'

interface DashboardHeaderProps {
  isRefetching: boolean
  onRefresh: () => void
  onCustomize?: () => void
}

const BRAND_PRIMARY = '#0877C9'
export default function DashboardHeader({
  isRefetching,
  onRefresh,
  onCustomize,
}: DashboardHeaderProps) {
  const metricPills = ['Courier routing', 'NDR watchlist', 'Billing control', 'Shipment visibility']

  return (
    <Box
      sx={{
        mb: 2.1,
        p: { xs: 2.2, md: 2.8 },
        borderRadius: 5,
        border: `1px solid ${alpha(BRAND_PRIMARY, 0.18)}`,
        background: `linear-gradient(135deg, ${alpha('#141416', 0.98)} 0%, ${alpha(
          '#1D1D21',
          0.98,
        )} 48%, ${alpha(BRAND_PRIMARY, 0.9)} 100%)`,
        color: '#fff',
        boxShadow: '0 26px 56px rgba(20, 20, 20, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at top right, rgba(255,255,255,0.12) 0%, transparent 24%)',
          pointerEvents: 'none',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={1.8}
        sx={{ position: 'relative', zIndex: 1 }}
      >
        <Box sx={{ maxWidth: 860 }}>
          <Typography
            sx={{
              fontSize: '0.75rem',
              fontWeight: 800,
              color: alpha('#fff', 0.76),
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              mb: 0.8,
            }}
          >
            Merchant Dashboard
          </Typography>
          <Typography
            sx={{
              fontSize: { xs: '1.65rem', md: '2.2rem' },
              fontWeight: 800,
              mb: 0.7,
              color: 'white',
              letterSpacing: '-0.03em',
            }}
          >
            Run shipping, finance, and exceptions from one cleaner PunjabShip workspace.
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: alpha('#fff', 0.82), lineHeight: 1.6 }}>
            Keep pickup readiness, courier allocation, remittance exposure, and delivery exceptions
            visible without jumping across disconnected tools.
          </Typography>
          <Stack direction="row" spacing={0.9} useFlexGap flexWrap="wrap" sx={{ mt: 1.6 }}>
            {metricPills.map((pill) => (
              <Box
                key={pill}
                sx={{
                  px: 1.15,
                  py: 0.7,
                  borderRadius: 999,
                  border: `1px solid ${alpha('#fff', 0.18)}`,
                  bgcolor: alpha('#fff', 0.08),
                }}
              >
                <Typography sx={{ fontSize: '0.74rem', fontWeight: 700, color: '#fff' }}>
                  {pill}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        <Stack direction="row" spacing={1}>
          {onCustomize && (
            <Button
              onClick={onCustomize}
              variant="outlined"
              startIcon={<MdDashboardCustomize size={18} />}
              sx={{
                borderColor: alpha('#fff', 0.42),
                color: 'black',
                textTransform: 'none',
                fontWeight: 700,
                borderRadius: 999,
                px: 1.5,
                '&:hover': { borderColor: '#fff', bgcolor: alpha('#fff', 0.12) },
              }}
            >
              Customize
            </Button>
          )}

          <Button
            onClick={onRefresh}
            disabled={isRefetching}
            variant="contained"
            startIcon={
              isRefetching ? (
                <CircularProgress size={14} thickness={4} sx={{ color: '#fff' }} />
              ) : (
                <MdRefresh size={18} />
              )
            }
            sx={{
              bgcolor: '#fff',
              color: 'ButtonFace',
              textTransform: 'none',
              fontWeight: 800,
              borderRadius: 999,
              px: 1.7,
              '&:hover': { bgcolor: alpha('#fff', 0.9) },
            }}
          >
            {isRefetching ? 'Refreshing' : 'Refresh'}
          </Button>
        </Stack>
      </Stack>
    </Box>
  )
}
