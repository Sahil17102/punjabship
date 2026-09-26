import { Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { FiEdit2, FiRefreshCcw } from 'react-icons/fi'
import { useAuth } from '../../context/auth/AuthContext'
import { useRequestOtp, useVerifyOtp } from '../../hooks/useOTP'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import { toast } from '../UI/Toast'

const OTP_LENGTH = 6
const OTP_RESEND_DELAY_MS = 30000
const BRAND_ORANGE = '#0877C9'
const BRAND_DARK = '#141414'

const primaryButtonStyles = {
  width: '100%',
  borderRadius: 1.25,
  backgroundColor: BRAND_ORANGE,
  boxShadow: '0 12px 28px rgba(8,119,201,0.24)',
  minHeight: 52,
  '&:hover': {
    backgroundColor: '#0564AD',
  },
}

const ghostButtonStyles = {
  width: '100%',
  border: '1px solid rgba(20, 20, 20, 0.1)',
  color: BRAND_DARK,
  backgroundColor: '#ffffff',
  borderRadius: 1.25,
  minHeight: 48,
}

type Props = {
  email: string
  demoOtp?: string
  onEditEmail: () => void
}

export default function OtpForm({ email, demoOtp, onEditEmail }: Props) {
  const { setTokens, setUserId } = useAuth()
  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [visibleDemoOtp, setVisibleDemoOtp] = useState(demoOtp)
  const [error, setError] = useState('')
  const [resendEnabled, setResendEnabled] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(OTP_RESEND_DELAY_MS / 1000)

  const { mutate: verifyOtp, isPending: verifying } = useVerifyOtp()
  const { mutate: resendOtp, isPending: resending } = useRequestOtp()

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setVisibleDemoOtp(demoOtp)
  }, [demoOtp])

  useEffect(() => {
    setResendEnabled(false)
    setSecondsLeft(OTP_RESEND_DELAY_MS / 1000)

    if (timerRef.current) clearTimeout(timerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

    countdownIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    timerRef.current = setTimeout(() => {
      setResendEnabled(true)
      setSecondsLeft(0)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }, OTP_RESEND_DELAY_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [email])

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const nextDigits = [...otpDigits]
    nextDigits[index] = value.slice(-1)
    setOtpDigits(nextDigits)
    setError('')

    if (value && index < OTP_LENGTH - 1) {
      document.getElementById(`otp-${index + 1}`)?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus()
    }
  }

  const fillDemoOtp = () => {
    if (!visibleDemoOtp || visibleDemoOtp.length !== OTP_LENGTH) return
    setOtpDigits(visibleDemoOtp.split(''))
    setError('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const otp = otpDigits.join('')
    if (otp.length !== OTP_LENGTH) {
      setError(`Enter the full ${OTP_LENGTH}-digit verification code.`)
      return
    }

    setError('')

    verifyOtp(
      { email, otp },
      {
        onSuccess: ({ token, refreshToken, user }) => {
          sessionStorage.setItem('activeEmail', email)
          setUserId(user?.id)
          setTokens(token, refreshToken)
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onError: (err: any) => {
          const msg = err?.response?.data?.error || 'OTP verification failed'
          setError(msg)

          if (msg.toLowerCase().includes('otp expired')) {
            setResendEnabled(true)
            setSecondsLeft(0)
            if (timerRef.current) clearTimeout(timerRef.current)
            if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          }
        },
      },
    )
  }

  const handleResendOtp = useCallback(() => {
    if (!resendEnabled || resending) return

    resendOtp(email.toLowerCase().trim(), {
      onSuccess: (response) => {
        setOtpDigits(Array(OTP_LENGTH).fill(''))
        setVisibleDemoOtp(response.demoOtp)
        setError('')
        setResendEnabled(false)
        setSecondsLeft(OTP_RESEND_DELAY_MS / 1000)

        if (timerRef.current) clearTimeout(timerRef.current)
        if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)

        countdownIntervalRef.current = setInterval(() => {
          setSecondsLeft((prev) => {
            if (prev <= 1) {
              clearInterval(countdownIntervalRef.current!)
              return 0
            }
            return prev - 1
          })
        }, 1000)

        timerRef.current = setTimeout(() => {
          setResendEnabled(true)
          setSecondsLeft(0)
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
        }, OTP_RESEND_DELAY_MS)

        toast.open({ message: 'Verification code sent again.', severity: 'success' })
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      onError: (err: any) => {
        setError(err?.response?.data?.error || 'Failed to resend OTP')
      },
    })
  }, [email, resendOtp, resendEnabled, resending])

  return (
    <Stack component="form" onSubmit={handleSubmit} width="100%" mt={1} gap={2}>
      <Box
        sx={{
          p: 1.8,
          borderRadius: 1,
          backgroundColor: '#F0EDFF',
          border: '1px solid #E1DBFF',
        }}
      >
        <Typography variant="body2" sx={{ color: '#5F5A57', lineHeight: 1.7 }}>
          We sent a 6-digit sign-in code to <strong>{email}</strong>.
          <Box
            component="span"
            sx={{
              ml: 0.7,
              display: 'inline-flex',
              alignItems: 'center',
              cursor: 'pointer',
              color: BRAND_ORANGE,
            }}
            onClick={onEditEmail}
          >
            <FiEdit2 size={13} style={{ marginRight: 4 }} />
            Edit
          </Box>
        </Typography>
      </Box>

      {visibleDemoOtp && (
        <Box
          role="status"
          sx={{
            p: 1.5,
            border: '1px solid #D8D1FF',
            borderRadius: 1,
            backgroundColor: '#FAF8FF',
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
            <Box>
              <Typography
                sx={{
                  color: '#0877C9',
                  fontSize: '0.64rem',
                  fontWeight: 850,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Demo sign-in code
              </Typography>
              <Typography
                component="code"
                sx={{
                  display: 'block',
                  mt: 0.4,
                  color: '#17171A',
                  fontFamily: 'monospace',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  letterSpacing: '0.18em',
                }}
              >
                {visibleDemoOtp}
              </Typography>
            </Box>
            <Button
              type="button"
              variant="text"
              onClick={fillDemoOtp}
              sx={{ minWidth: 82, color: '#0877C9', fontWeight: 800 }}
            >
              Fill code
            </Button>
          </Stack>
        </Box>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
          gap: { xs: 0.55, sm: 1 },
          width: '100%',
          maxWidth: 380,
          mx: 'auto',
        }}
      >
        {otpDigits.map((digit, idx) => (
          <TextField
            key={idx}
            id={`otp-${idx}`}
            type="text"
            inputMode="numeric"
            value={digit}
            onChange={(e) => handleChange(idx, e.target.value)}
            onKeyDown={(e) => handleKeyDown(idx, e as KeyboardEvent<HTMLInputElement>)}
            slotProps={{
              htmlInput: {
                maxLength: 1,
                style: {
                  textAlign: 'center',
                  fontSize: '1.15rem',
                  padding: 0,
                  height: 46,
                  fontWeight: 700,
                },
              },
            }}
            sx={{
              width: '100%',
              '& .MuiOutlinedInput-root': {
                height: 52,
                borderRadius: 1,
                backgroundColor: '#FFFFFF',
                color: BRAND_DARK,
                '& fieldset': {
                  borderColor: 'rgba(20, 20, 20, 0.1)',
                },
                '&:hover fieldset': {
                  borderColor: BRAND_ORANGE,
                },
                '&.Mui-focused fieldset': {
                  borderColor: BRAND_ORANGE,
                  borderWidth: 2,
                },
              },
            }}
            error={!!error}
            autoComplete="one-time-code"
            aria-label={`OTP digit ${idx + 1}`}
          />
        ))}
      </Box>

      {error && (
        <Typography variant="caption" color="error" textAlign="center" sx={{ userSelect: 'none' }}>
          {error}
        </Typography>
      )}

      <Typography variant="caption" color="#6E6763" textAlign="center" sx={{ userSelect: 'none' }}>
        Enter the code from your inbox to continue to the merchant shipping workspace.
      </Typography>

      <CustomIconLoadingButton
        type="submit"
        text="Verify and continue"
        sx={primaryButtonStyles}
        disabled={otpDigits.join('').length !== OTP_LENGTH}
        loading={verifying}
        loadingText="Verifying..."
        textColor="#fff"
      />

      <CustomIconLoadingButton
        type="button"
        onClick={handleResendOtp}
        text={resendEnabled ? 'Resend verification code' : `Resend in ${secondsLeft}s`}
        sx={ghostButtonStyles}
        disabled={!resendEnabled || resending}
        loading={resending}
        loadingText="Resending..."
        icon={<FiRefreshCcw size={14} />}
      />
    </Stack>
  )
}
