import { Box, Button, Stack, Typography } from '@mui/material'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import AccountSetup from '../../components/home/AccountSetup'
import { useAuth } from '../../context/auth/AuthContext'
import { useMerchantReadiness } from '../../hooks/useMerchantReadiness'
import { isSellerEmployeeAccount } from '../../utils/sellerEmployee'

const AccountReadiness = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { isReady, progress, firstIncompleteStep } = useMerchantReadiness()
  const blockedPath = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from
  const returnPath = `${blockedPath?.pathname || '/orders/list'}${blockedPath?.search || ''}`

  if (isSellerEmployeeAccount(user)) {
    return <Navigate to={returnPath} replace />
  }

  return (
    <Box sx={{ py: { xs: 2, md: 2.5 } }}>
      <Stack spacing={2.2}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          alignItems={{ xs: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          gap={1.4}
        >
          <Box>
            <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.55rem' }, fontWeight: 900, color: '#111827' }}>
              Account Readiness
            </Typography>
            <Typography sx={{ mt: 0.45, fontSize: '0.9rem', color: '#6B7280' }}>
              Complete these checks before the Orders workspace opens for booking and dispatch.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
            {!isReady && firstIncompleteStep && (
              <Button
                variant="contained"
                onClick={() => navigate(firstIncompleteStep.path)}
                sx={{ textTransform: 'none', fontWeight: 800, bgcolor: '#0877C9' }}
              >
                Continue Setup
              </Button>
            )}
            {isReady && (
              <Button
                variant="contained"
                onClick={() => navigate(returnPath)}
                sx={{ textTransform: 'none', fontWeight: 800, bgcolor: '#0877C9' }}
              >
                Open Orders
              </Button>
            )}
          </Stack>
        </Stack>

        {!isReady && (
          <Box
            sx={{
              px: 1.4,
              py: 1,
              bgcolor: '#FFF7ED',
              border: '1px solid rgba(184, 215, 25, 0.28)',
              color: '#8A3E00',
              fontSize: '0.84rem',
              fontWeight: 700,
            }}
          >
            Orders are locked until setup reaches 100%. Current progress: {progress}%.
          </Box>
        )}

        <AccountSetup />
      </Stack>
    </Box>
  )
}

export default AccountReadiness
