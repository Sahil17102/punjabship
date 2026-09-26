import { Box, Button, Grid, LinearProgress, Stack, Typography } from '@mui/material'
import { MdOutlineFactCheck, MdVerifiedUser } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'

const BRAND_PRIMARY = '#0877C9'
const BRAND_ACCENT = '#B8D719'
const INK = '#111827'
const MUTED = '#6B7280'

const cardSx = {
  borderRadius: 0,
  p: { xs: 1.7, md: 1.9 },
  border: '1px solid rgba(17, 24, 39, 0.08)',
  bgcolor: '#ffffff',
  boxShadow: 'none',
}

const GettingStarted = () => {
  const { walletBalance, user } = useAuth()
  const navigate = useNavigate()

  const isKycDone = user?.domesticKyc?.status === 'verified'
  const progress = isKycDone ? 100 : 55

  return (
    <Stack gap={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
        <Typography sx={{ fontSize: '1.05rem', fontWeight: 800, color: INK }}>Getting Started</Typography>
        <Typography sx={{ fontSize: '12px', color: MUTED, fontWeight: 600 }}>
          Core setup essentials
        </Typography>
      </Stack>

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={cardSx}>
            <Stack spacing={1.2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontWeight: 700, color: INK }}>Wallet Balance</Typography>
                <MdOutlineFactCheck size={20} color={BRAND_PRIMARY} />
              </Stack>

              <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: BRAND_PRIMARY }}>
                ₹{(walletBalance ?? 0).toLocaleString('en-IN')}
              </Typography>

              <Typography sx={{ fontSize: '0.86rem', color: MUTED }}>
                Keep wallet funded to avoid order processing delays.
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/billing/wallet_transactions')}
                  sx={{
                    bgcolor: BRAND_PRIMARY,
                    '&:hover': { bgcolor: '#5519A8' },
                    borderRadius: 0,
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
                >
                  Manage Wallet
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={cardSx}>
            <Stack spacing={1.2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography sx={{ fontWeight: 700, color: INK }}>KYC Verification</Typography>
                <MdVerifiedUser size={20} color={isKycDone ? BRAND_PRIMARY : BRAND_ACCENT} />
              </Stack>

              <Typography sx={{ fontSize: '0.88rem', color: MUTED }}>
                {isKycDone
                  ? 'Your KYC is verified. You are ready for full operations.'
                  : 'Finish KYC to unlock uninterrupted shipping and billing workflows.'}
              </Typography>

              <Box>
                <LinearProgress
                  variant="determinate"
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 0,
                    bgcolor: '#E5E7EB',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 0,
                      background: isKycDone
                        ? BRAND_PRIMARY
                        : `linear-gradient(90deg, ${BRAND_PRIMARY} 0%, ${BRAND_ACCENT} 100%)`,
                    },
                  }}
                />
                <Typography sx={{ mt: 0.7, fontSize: '12px', color: MUTED, fontWeight: 600 }}>
                  {progress}% complete
                </Typography>
              </Box>

              {!isKycDone && (
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => navigate('/profile/kyc_details')}
                  sx={{
                    alignSelf: 'flex-start',
                    bgcolor: BRAND_ACCENT,
                    '&:hover': { bgcolor: '#D95C00' },
                    borderRadius: 0,
                    textTransform: 'none',
                    fontWeight: 700,
                  }}
                >
                  Verify KYC
                </Button>
              )}
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default GettingStarted
