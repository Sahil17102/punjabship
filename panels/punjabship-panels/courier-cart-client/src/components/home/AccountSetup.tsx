import { alpha, Box, Button, Grid, LinearProgress, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useMerchantReadiness } from '../../hooks/useMerchantReadiness'
import { isEmbeddedShopifyContext } from '../../utils/shopifyEmbedded'

const BRAND_PRIMARY = '#0877C9'
const BRAND_ACCENT = '#B8D719'
const INK = '#111827'
const MUTED = '#6B7280'

const taskCard = {
  borderRadius: 0,
  p: { xs: 1.8, md: 2.1 },
  border: '1px solid rgba(17, 24, 39, 0.08)',
  bgcolor: '#ffffff',
  boxShadow: 'none',
  minHeight: 180,
}

const AccountSetup = () => {
  const { checklist, progress, completedCount, totalCount, isReady, isLoading, assignedPlanName, assignedPlanId } =
    useMerchantReadiness()
  const navigate = useNavigate()
  const isEmbeddedShopify = isEmbeddedShopifyContext()
  const assignedPlanLabel = isLoading
    ? 'Checking assigned plan...'
    : assignedPlanName || assignedPlanId || 'Not assigned'

  return (
    <Stack gap={2}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
        gap={1.2}
      >
        <Box>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: INK }}>
            Merchant Readiness
          </Typography>
          <Typography sx={{ fontSize: '0.84rem', color: MUTED, mt: 0.45 }}>
            Complete all setup checks before order creation is enabled.
          </Typography>
          {!isEmbeddedShopify && (
            <Typography sx={{ fontSize: '0.82rem', color: INK, mt: 0.55, fontWeight: 700 }}>
              Assigned Plan: {assignedPlanLabel}
            </Typography>
          )}
        </Box>
        <Box
          sx={{
            px: 1.2,
            py: 0.5,
            borderRadius: 0,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            bgcolor: isReady ? alpha(BRAND_PRIMARY, 0.12) : alpha(BRAND_ACCENT, 0.14),
            color: isReady ? BRAND_PRIMARY : '#8a3e00',
            border: `1px solid ${isReady ? alpha(BRAND_PRIMARY, 0.28) : alpha(BRAND_ACCENT, 0.35)}`,
          }}
        >
          {completedCount}/{totalCount} complete
        </Box>
      </Stack>

      {!isEmbeddedShopify && <Box
        sx={{
          p: 1.5,
          borderRadius: 0,
          border: '1px solid rgba(17, 24, 39, 0.08)',
          bgcolor: '#F8FAFC',
        }}
      >
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 9,
            borderRadius: 0,
            bgcolor: '#E5E7EB',
            '& .MuiLinearProgress-bar': {
              borderRadius: 0,
              background: `linear-gradient(90deg, ${BRAND_PRIMARY} 0%, ${BRAND_ACCENT} 100%)`,
            },
          }}
        />
        <Typography sx={{ mt: 0.75, fontSize: '12px', color: MUTED, fontWeight: 700 }}>
          {progress}% complete
        </Typography>
      </Box>}

      <Box
        sx={{
          p: 1.6,
          borderRadius: 0,
          border: `1px solid ${alpha(BRAND_ACCENT, 0.2)}`,
          bgcolor: '#FFF7ED',
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          gap={1.2}
        >
          <Box>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 800, color: INK }}>
              Need a Custom Plan?
            </Typography>
            <Typography sx={{ mt: 0.45, fontSize: '0.83rem', color: MUTED, lineHeight: 1.5 }}>
              Contact our admin team if you need a customised plan for higher volume, custom rates,
              or special support.
            </Typography>
          </Box>
          <Button
            onClick={() => navigate('/support/tickets')}
            variant="contained"
            size="small"
            sx={{
              borderRadius: 0,
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: BRAND_PRIMARY,
              '&:hover': { bgcolor: '#5519A8' },
            }}
          >
            Contact Admin Team
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={2}>
        {checklist.map((step) => (
          <Grid key={step.key} size={{ xs: 12, md: 4 }}>
            <Box sx={taskCard}>
              <Stack spacing={1.3} height="100%" justifyContent="space-between">
                <Stack spacing={1.1}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Box
                      sx={{
                        px: 1,
                        py: 0.35,
                        borderRadius: 0,
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: 0.35,
                        textTransform: 'uppercase',
                        bgcolor: step.done ? alpha(BRAND_PRIMARY, 0.12) : alpha(BRAND_ACCENT, 0.14),
                        color: step.done ? BRAND_PRIMARY : '#8a3e00',
                        border: `1px solid ${
                          step.done ? alpha(BRAND_PRIMARY, 0.3) : alpha(BRAND_ACCENT, 0.35)
                        }`,
                      }}
                    >
                      {step.done ? 'Done' : 'Pending'}
                    </Box>
                  </Stack>

                  <Typography sx={{ fontSize: '0.97rem', fontWeight: 700, color: INK }}>
                    {step.title}
                  </Typography>

                  <Typography sx={{ fontSize: '0.84rem', color: MUTED, lineHeight: 1.5 }}>
                    {step.description}
                  </Typography>
                </Stack>

                <Button
                  disabled={isLoading}
                  onClick={() => navigate(step.path)}
                  variant={step.done ? 'outlined' : 'contained'}
                  size="small"
                  sx={{
                    alignSelf: 'flex-start',
                    borderRadius: 0,
                    textTransform: 'none',
                    fontWeight: 700,
                    ...(step.done
                      ? {
                          color: BRAND_PRIMARY,
                          borderColor: alpha(BRAND_PRIMARY, 0.35),
                          '&:hover': { borderColor: BRAND_PRIMARY, bgcolor: alpha(BRAND_PRIMARY, 0.08) },
                        }
                      : {
                          bgcolor: BRAND_ACCENT,
                          '&:hover': { bgcolor: '#D95C00' },
                        }),
                  }}
                >
                  {step.done ? 'Review' : step.actionLabel}
                </Button>
              </Stack>
            </Box>
          </Grid>
        ))}
      </Grid>
    </Stack>
  )
}

export default AccountSetup
