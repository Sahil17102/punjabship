import { Box, Card, CardContent, Chip, LinearProgress, Stack, Typography, alpha, useTheme } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { MdAccountBalanceWallet, MdArrowForward } from 'react-icons/md'
import { TbCurrencyRupee } from 'react-icons/tb'

interface FinancialHealthCardProps {
  financial: {
    walletBalance: number
    codRemittanceDue: number
    codRemittanceCredited: number
  }
  trends: Record<string, unknown>
  formatCurrency: (amount: number) => string
}

export default function FinancialHealthCard({
  financial,
  formatCurrency,
}: FinancialHealthCardProps) {
  const theme = useTheme()
  const navigate = useNavigate()

  const isHealthy = financial.walletBalance > 1000 && financial.codRemittanceDue < financial.walletBalance * 2
  const isLowBalance = financial.walletBalance < 500
  const healthScore = isHealthy ? 90 : isLowBalance ? 40 : 70

  return (
    <Card
      sx={{
        height: '100%',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: `2px solid ${isLowBalance ? theme.palette.error.main : isHealthy ? theme.palette.success.main : theme.palette.warning.main}`,
        background: `linear-gradient(135deg, ${alpha(
          isLowBalance ? theme.palette.error.main : isHealthy ? theme.palette.success.main : theme.palette.warning.main,
          0.05,
        )} 0%, transparent 100%)`,
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                bgcolor: alpha(
                  isLowBalance ? theme.palette.error.main : isHealthy ? theme.palette.success.main : theme.palette.warning.main,
                  0.1,
                ),
                borderRadius: '10px',
                p: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TbCurrencyRupee size={24} color={isLowBalance ? theme.palette.error.main : isHealthy ? theme.palette.success.main : theme.palette.warning.main} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Financial Health
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Your account overview
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={isHealthy ? 'Healthy' : isLowBalance ? 'Low Balance' : 'Warning'}
            color={isHealthy ? 'success' : isLowBalance ? 'error' : 'warning'}
            size="small"
            sx={{ fontWeight: 600, height: 26 }}
          />
        </Stack>

        {/* Health Score */}
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" justifyContent="space-between" mb={1}>
            <Typography variant="body2" fontWeight="medium" color="text.secondary">
              Health Score
            </Typography>
            <Typography variant="body2" fontWeight="bold" color={isHealthy ? 'success.main' : isLowBalance ? 'error.main' : 'warning.main'}>
              {healthScore}/100
            </Typography>
          </Stack>
          <LinearProgress
            variant="determinate"
            value={healthScore}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: alpha(theme.palette.divider, 0.1),
              '& .MuiLinearProgress-bar': {
                borderRadius: 4,
                bgcolor: isHealthy ? theme.palette.success.main : isLowBalance ? theme.palette.error.main : theme.palette.warning.main,
              },
            }}
          />
        </Box>

        <Stack spacing={2.5}>
          <Box
            sx={{
              p: 2.5,
              bgcolor: alpha(theme.palette.primary.main, 0.08),
              borderRadius: '12px',
              border: `1.5px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                transform: 'translateY(-2px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.15)}`,
              },
            }}
            onClick={() => navigate('/billing/wallet_transactions')}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <MdAccountBalanceWallet size={18} color={theme.palette.primary.main} />
                  <Typography variant="body2" fontWeight="600" color="text.secondary">
                    Wallet Balance
                  </Typography>
                </Stack>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  color={isLowBalance ? 'error.main' : 'primary.main'}
                  sx={{ mb: 0.5 }}
                >
                  {formatCurrency(financial.walletBalance || 0)}
                </Typography>
                {isLowBalance ? (
                  <Chip
                    label="⚠️ Recharge required"
                    size="small"
                    color="error"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600 }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Available for shipping
                  </Typography>
                )}
              </Box>
              <MdArrowForward size={20} color={theme.palette.primary.main} style={{ opacity: 0.6 }} />
            </Stack>
          </Box>

          <Box
            sx={{
              p: 2.5,
              bgcolor: alpha(theme.palette.warning.main, 0.08),
              borderRadius: '12px',
              border: `1.5px solid ${alpha(theme.palette.warning.main, 0.2)}`,
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: alpha(theme.palette.warning.main, 0.12),
                transform: 'translateY(-2px)',
              },
            }}
            onClick={() => navigate('/cod-remittance')}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="600" color="text.secondary" gutterBottom>
                  COD Remittance Due
                </Typography>
                <Typography variant="h6" fontWeight="bold" color="warning.main" sx={{ mb: 1 }}>
                  {formatCurrency(financial.codRemittanceDue || 0)}
                </Typography>
                {financial.codRemittanceCredited > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    ✓ Credited this month: {formatCurrency(financial.codRemittanceCredited || 0)}
                  </Typography>
                )}
              </Box>
              <MdArrowForward size={20} color={theme.palette.warning.main} style={{ opacity: 0.6 }} />
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}
