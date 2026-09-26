import {
  Alert,
  alpha,
  Box,
  Button,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { BiWallet } from 'react-icons/bi'
import { useAuth } from '../context/auth/AuthContext'
import { useUserProfile } from '../hooks/User/useUserProfile'
import { usePaymentOptions } from '../hooks/usePaymentOptions'
import { useRechargeWallet } from '../hooks/useRechargeWallets'
import { toast } from './UI/Toast'
import CustomIconLoadingButton from './UI/button/CustomLoadingButton'
import CustomDialog from './UI/modal/CustomModal'

const BRAND_ORANGE = '#0877C9'
const BRAND_ORANGE_DARK = '#0564AD'
const BRAND_SURFACE = '#FCF8F7'

interface AddMoneyDialogProps {
  open: boolean
  setOpen: Dispatch<SetStateAction<boolean>>
  currentBalance: number
}

const quickAmounts = [500, 1000, 2000, 10000]

const AddMoneyDialog: React.FC<AddMoneyDialogProps> = ({ open, setOpen, currentBalance }) => {
  const { user } = useAuth()
  const [amount, setAmount] = useState<number>(500)
  const recharge = useRechargeWallet()
  const { data: paymentOptions } = usePaymentOptions()
  const { data: profile } = useUserProfile(true)

  const minWalletRecharge = paymentOptions?.minWalletRecharge ?? 0

  const effectiveAmount = amount || 0
  const isBelowMin = minWalletRecharge > 0 && effectiveAmount < minWalletRecharge
  const kycStatus = profile?.domesticKyc?.status
  const isKycBlocked = kycStatus !== 'verified'

  const handleRecharge = async () => {
    if (isKycBlocked) {
      toast.open({
        message:
          kycStatus === 'pending' || kycStatus === 'verification_in_progress'
            ? 'KYC verification is not completed yet. You can recharge once your KYC is verified.'
            : 'Please complete your KYC to recharge your wallet.',
        severity: 'warning',
      })
      return
    }

    if (isBelowMin) {
      toast.open({
        message: `Minimum wallet recharge amount is ₹${minWalletRecharge.toLocaleString('en-IN')}`,
        severity: 'warning',
      })
      return
    }

    try {
      await recharge.mutateAsync({
        amount,
        prefill: {
          name: user?.companyInfo?.businessName,
          email: user.companyInfo?.contactEmail ?? '',
          contact: user.companyInfo?.contactNumber ?? '',
        },
      })
    } catch (err: unknown) {
      console.error('Recharge error:', err)
      toast.open({ message: 'Recharge failed!', severity: 'error' })
    }
  }

  return (
    <CustomDialog
      maxWidth="xs"
      title={
        <Stack direction="row" spacing={2} justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight={800} sx={{ color: '#141414' }}>
            Add Money to Wallet
          </Typography>

          <Box
            display="flex"
            gap={1}
            alignItems="center"
            sx={{
              bgcolor: '#FFF3F4',
              px: 2,
              py: 1,
              borderRadius: 3,
              border: `1px solid ${alpha(BRAND_ORANGE, 0.12)}`,
            }}
          >
            <BiWallet size={18} color={BRAND_ORANGE} />
            <Typography variant="body2" fontWeight={800} color={BRAND_ORANGE_DARK}>
              ₹{currentBalance.toLocaleString('en-IN')}
            </Typography>
          </Box>
        </Stack>
      }
      open={open}
      onClose={() => setOpen(false)}
    >
      <Box display="flex" flexDirection="column" width="100%">
        <Box
          width="100%"
          display="flex"
          justifyContent="center"
          sx={{
            bgcolor: BRAND_SURFACE,
            borderRadius: 5,
            p: 3,
            mb: 3,
            border: '1px solid rgba(20, 20, 20, 0.08)',
          }}
        >
          <TextField
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            variant="standard"
            placeholder="Enter Amount"
            slotProps={{
              input: {
                disableUnderline: true,
                startAdornment: (
                  <InputAdornment position="start" sx={{ fontSize: '2.5rem', color: BRAND_ORANGE }}>
                    ₹
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '2rem',
                  fontWeight: 800,
                  borderBottom: `2px solid ${alpha(BRAND_ORANGE, 0.18)}`,
                  width: '100%',
                  maxWidth: 280,
                  color: '#141414',
                  pb: 1,
                  mx: 'auto',
                  transition: 'all 0.3s ease',
                  '&:focus-within': {
                    borderBottomColor: BRAND_ORANGE,
                  },
                },
                inputProps: {
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                  style: {
                    textAlign: 'center',
                    color: '#141414',
                    MozAppearance: 'textfield',
                  },
                },
              },
            }}
            sx={{
              '& .MuiInputBase-input::placeholder': {
                color: '#8D8783',
                opacity: 0.7,
              },
              '& input::-webkit-outer-spin-button, & input::-webkit-inner-spin-button': {
                WebkitAppearance: 'none',
                margin: 0,
              },
              '& input[type=number]': { MozAppearance: 'textfield' },
            }}
          />
        </Box>

        <Box mb={3}>
          <Typography variant="body2" fontWeight={700} sx={{ color: '#6E6A66', mb: 1.5, textAlign: 'center' }}>
            Quick Select Amount
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1.5} width="100%" justifyContent="center">
            {quickAmounts.map((v) => (
              <Button
                key={v}
                variant={amount === v ? 'contained' : 'outlined'}
                onClick={() => setAmount(v)}
                sx={{
                  borderRadius: 3.5,
                  minWidth: 92,
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  px: 3,
                  py: 1.2,
                  bgcolor: amount === v ? '#141414' : '#FFFFFF',
                  color: amount === v ? '#FFFFFF' : '#141414',
                  border: `1px solid ${amount === v ? '#141414' : 'rgba(20, 20, 20, 0.1)'}`,
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: amount === v ? '#1F1F22' : BRAND_SURFACE,
                    borderColor: amount === v ? '#141414' : 'rgba(20, 20, 20, 0.14)',
                  },
                }}
              >
                ₹{v.toLocaleString('en-IN')}
              </Button>
            ))}
          </Stack>
        </Box>

        <Divider sx={{ my: 3, borderColor: 'rgba(20, 20, 20, 0.08)' }} />

        {isKycBlocked && (
          <Alert
            severity="warning"
            sx={{
              mb: 2,
              borderRadius: 4,
              border: '1px solid rgba(201, 122, 18, 0.25)',
              bgcolor: 'rgba(201, 122, 18, 0.06)',
              color: '#8D560E',
              fontSize: '0.85rem',
              '& .MuiAlert-icon': { color: '#C97A12' },
            }}
          >
            {kycStatus === 'pending' || kycStatus === 'verification_in_progress'
              ? 'Your KYC is under review. You will be able to recharge once it is verified.'
              : 'Please complete your KYC to recharge your wallet.'}
          </Alert>
        )}

        <Box
          sx={{
            bgcolor: BRAND_SURFACE,
            border: '1px solid rgba(20, 20, 20, 0.08)',
            borderRadius: 5,
            p: 2.5,
            mb: 3,
          }}
        >
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="body2" sx={{ color: '#6E6A66', fontWeight: 700 }}>
              Amount to Pay
            </Typography>
            <Typography variant="h6" sx={{ color: BRAND_ORANGE_DARK, fontWeight: 800 }}>
              ₹{effectiveAmount.toLocaleString('en-IN')}
            </Typography>
          </Stack>
          <Typography variant="caption" sx={{ color: '#7D7773', fontSize: '0.8rem' }}>
            {minWalletRecharge > 0
              ? `Minimum recharge amount is ₹${minWalletRecharge.toLocaleString(
                  'en-IN',
                )}. This amount will be added to your wallet instantly.`
              : 'This amount will be added to your wallet instantly.'}
          </Typography>
        </Box>

        <CustomIconLoadingButton
          onClick={handleRecharge}
          disabled={recharge.isPending || effectiveAmount <= 0 || isBelowMin || isKycBlocked}
          text={`Proceed to Pay ₹${effectiveAmount.toLocaleString('en-IN')}`}
          loadingText="Processing Payment..."
          loading={recharge.isPending}
          styles={{
            width: '100%',
            py: 1.8,
            fontSize: '1rem',
            fontWeight: 700,
            textTransform: 'none',
            boxShadow: 'none',
            background: `linear-gradient(135deg, ${BRAND_ORANGE} 0%, ${BRAND_ORANGE_DARK} 100%)`,
            color: '#FFFFFF',
            borderRadius: 3.5,
            '&:hover': {
              background: `linear-gradient(135deg, ${BRAND_ORANGE_DARK} 0%, #7F0715 100%)`,
            },
          }}
        />
      </Box>
    </CustomDialog>
  )
}

export default AddMoneyDialog
