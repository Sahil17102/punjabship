import {
  Box,
  FormControlLabel,
  Link,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { FiKey, FiMail } from 'react-icons/fi'
import { useRequestOtp } from '../../hooks/useOTP'
import { TERMS_AND_CONDITIONS } from '../../utils/constants'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import CustomCheckbox from '../UI/inputs/CustomCheckbox'
import CustomInput from '../UI/inputs/CustomInput'
import CustomModal from '../UI/modal/CustomModal'
import { toast } from '../UI/Toast'
import OtpForm from './OtpForm'
import PasswordLoginForm from './PasswordLoginForm'

const BRAND = '#0877C9'
const INK = '#17171A'
const MUTED = '#6F6F78'

const primaryButtonStyles = {
  width: '100%',
  borderRadius: 1.25,
  backgroundColor: BRAND,
  boxShadow: '0 12px 28px rgba(8,119,201,0.24)',
  minHeight: 52,
  '&:hover': {
    backgroundColor: '#0564AD',
    boxShadow: '0 15px 32px rgba(8,119,201,0.3)',
  },
}

export default function PhoneForm() {
  const activeEmail = sessionStorage.getItem('activeEmail')
  const [step, setStep] = useState<number>(0)
  const [preferredLoginMethod, setPreferredLoginMethod] = useState<'phone' | 'password'>('phone')
  const [email, setEmail] = useState('')
  const [demoOtp, setDemoOtp] = useState<string>()
  const [termsChecked, setTermsChecked] = useState(false)
  const [openTerms, setOpenTerms] = useState(false)

  const { mutate: sendOtpRequest, isPending } = useRequestOtp()

  const handleEmailChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value.trim())
    setDemoOtp(undefined)
  }, [])

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const isValidEmail = email.length > 0 && emailRegex.test(email)

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault()

      if (!termsChecked) {
        toast.open({
          message: 'Please accept the Terms and Conditions to continue.',
          severity: 'warning',
          position: { vertical: 'top', horizontal: 'center' },
        })
        return
      }

      setPreferredLoginMethod('phone')
      sessionStorage.setItem('preferredMethod', 'phone')

      sendOtpRequest(email.toLowerCase().trim(), {
        onSuccess: (response) => {
          setDemoOtp(response.demoOtp)
          setStep(1)
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (error: any) => {
          toast.open({
            message: error?.response?.data?.error || 'OTP request failed',
            severity: 'error',
            position: { vertical: 'top', horizontal: 'center' },
          })
        },
      })
    },
    [email, termsChecked, sendOtpRequest],
  )

  useEffect(() => {
    if (activeEmail) setEmail(activeEmail)
  }, [activeEmail])

  const termsLabel = (
    <Typography sx={{ color: MUTED, fontSize: '0.78rem', lineHeight: 1.5 }}>
      I agree to the{' '}
      <Link
        component="button"
        type="button"
        underline="hover"
        onClick={() => setOpenTerms(true)}
        sx={{ cursor: 'pointer', color: BRAND, fontWeight: 800 }}
      >
        Terms and Conditions
      </Link>
    </Typography>
  )

  const renderOtpEntry = () =>
    step === 0 ? (
      <Stack component="form" onSubmit={handleSubmit} spacing={1.8} width="100%">
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 34,
              height: 34,
              flex: '0 0 auto',
              display: 'grid',
              placeItems: 'center',
              borderRadius: 1,
              color: BRAND,
              backgroundColor: '#F0EDFF',
            }}
          >
            <FiKey size={16} />
          </Box>
          <Box>
            <Typography sx={{ color: INK, fontSize: '0.81rem', fontWeight: 800 }}>
              Passwordless sign-in
            </Typography>
            <Typography sx={{ mt: 0.15, color: MUTED, fontSize: '0.7rem' }}>
              Receive a secure code on your work email.
            </Typography>
          </Box>
        </Stack>

        <CustomInput
          rounded
          topMargin={false}
          type="email"
          label="Work email"
          placeholder="you@company.com"
          value={email}
          name="email"
          id="email"
          onChange={handleEmailChange}
          required
          error={email.length > 0 && !isValidEmail}
          helperText={email.length > 0 && !isValidEmail ? 'Enter a valid email address.' : ''}
          autoFocus
          prefix={<FiMail color={BRAND} size={16} />}
        />

        <FormControlLabel
          sx={{ m: 0, alignItems: 'flex-start' }}
          control={
            <CustomCheckbox
              checked={termsChecked}
              onChange={(event) => setTermsChecked(event.target.checked)}
              color="primary"
            />
          }
          label={<Box sx={{ mt: 0.45 }}>{termsLabel}</Box>}
        />

        <CustomIconLoadingButton
          type="submit"
          sx={primaryButtonStyles}
          textColor="#FFFFFF"
          disabled={!email || !termsChecked || isPending || !isValidEmail}
          text="Send verification code"
          loading={isPending}
          loadingText="Sending..."
        />
      </Stack>
    ) : (
      <OtpForm email={email} demoOtp={demoOtp} onEditEmail={() => setStep(0)} />
    )

  return (
    <Stack spacing={2.1} alignItems="stretch">
      <Typography sx={{ color: INK, fontSize: '0.95rem', fontWeight: 800 }}>
        Choose your sign-in method
      </Typography>

      <ToggleButtonGroup
        value={preferredLoginMethod}
        exclusive
        onChange={(_, value) => {
          if (!value) return
          setPreferredLoginMethod(value)
          setStep(0)
        }}
        fullWidth
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 0.5,
          p: 0.55,
          borderRadius: 1.25,
          backgroundColor: '#F0F1F5',
          '& .MuiToggleButton-root': {
            minHeight: 42,
            textTransform: 'none',
            fontSize: '0.78rem',
            fontWeight: 800,
            border: '0 !important',
            borderRadius: '6px !important',
            color: MUTED,
            px: 1,
            py: 0.7,
            '&.Mui-selected': {
              color: INK,
              backgroundColor: '#FFFFFF',
              boxShadow: '0 5px 15px rgba(26,26,31,0.1)',
            },
          },
        }}
      >
        <ToggleButton value="phone">Email OTP</ToggleButton>
        <ToggleButton value="password">Email + password</ToggleButton>
      </ToggleButtonGroup>

      <Box sx={{ minHeight: 225 }}>
        {preferredLoginMethod === 'phone' ? (
          renderOtpEntry()
        ) : (
          <PasswordLoginForm step={step} setOpenTerms={setOpenTerms} setStep={setStep} />
        )}
      </Box>

      <Typography sx={{ color: MUTED, fontSize: '0.72rem', textAlign: 'center' }}>
        By continuing, you acknowledge PunjabShip&apos;s{' '}
        <Link
          component="button"
          type="button"
          underline="hover"
          onClick={() => setOpenTerms(true)}
          sx={{ color: INK, fontWeight: 800, cursor: 'pointer' }}
        >
          account policies
        </Link>
        .
      </Typography>

      <CustomModal
        open={openTerms}
        onClose={() => setOpenTerms(false)}
        title="Terms and Conditions"
      >
        <Typography
          variant="body2"
          sx={{ whiteSpace: 'pre-line', maxHeight: '60vh', overflowY: 'auto', pr: 1 }}
        >
          {TERMS_AND_CONDITIONS}
        </Typography>
      </CustomModal>
    </Stack>
  )
}
