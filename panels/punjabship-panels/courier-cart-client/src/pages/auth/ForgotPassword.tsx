import { Alert, Box, Button, Link, Paper, Stack, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import { FiArrowLeft, FiCheckCircle, FiLock, FiMail } from 'react-icons/fi'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  requestPasswordResetApi,
  resetPasswordApi,
  verifyPasswordResetOtpApi,
} from '../../api/auth'
import CustomInput from '../../components/UI/inputs/CustomInput'

const PURPLE = '#0877C9'
const INK = '#1B1A1E'
const MUTED = '#6F6D75'

const passwordRules = [
  { label: '8+ characters', test: (value: string) => value.length >= 8 },
  { label: 'Uppercase', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Lowercase', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Number', test: (value: string) => /\d/.test(value) },
  { label: 'Special character', test: (value: string) => /[@$!%*?&]/.test(value) },
]

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error !== 'object' || error === null || !('response' in error)) return fallback
  const response = (error as { response?: { data?: { error?: unknown } } }).response
  return typeof response?.data?.error === 'string' ? response.data.error : fallback
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [step, setStep] = useState<0 | 1 | 2>(0)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!cooldown) return
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000)
    return () => window.clearInterval(timer)
  }, [cooldown])

  const clearMessages = () => {
    setError('')
    setNotice('')
  }

  const requestCode = async () => {
    clearMessages()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid work email address.')
      return
    }

    setBusy(true)
    try {
      const response = await requestPasswordResetApi(email.trim())
      setNotice(response.message)
      setStep(1)
      setCooldown(30)
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError, 'Unable to send the reset code right now.'))
    } finally {
      setBusy(false)
    }
  }

  const verifyCode = async () => {
    clearMessages()
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit reset code from your email.')
      return
    }

    setBusy(true)
    try {
      const response = await verifyPasswordResetOtpApi(email.trim(), otp)
      setResetToken(response.resetToken)
      setStep(2)
    } catch (verifyError: unknown) {
      setError(getErrorMessage(verifyError, 'That reset code is invalid or expired.'))
    } finally {
      setBusy(false)
    }
  }

  const resetPassword = async () => {
    clearMessages()
    const validPassword = passwordRules.every((rule) => rule.test(password))
    if (!validPassword) {
      setError('Choose a password that meets all the requirements below.')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      const response = await resetPasswordApi(email.trim(), resetToken, password)
      setNotice(response.message)
      window.setTimeout(() => navigate('/'), 900)
    } catch (resetError: unknown) {
      setError(getErrorMessage(resetError, 'Unable to reset the password right now.'))
    } finally {
      setBusy(false)
    }
  }

  const title = step === 0 ? 'Forgot your password?' : step === 1 ? 'Check your email' : 'Create a new password'
  const description =
    step === 0
      ? 'Enter your registered work email and we will send a secure reset code.'
      : step === 1
        ? `We sent a 6-digit code to ${email}.`
        : 'Your new password will protect the account across every sign-in.'

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        px: { xs: 2, sm: 3 },
        py: 4,
        background:
          'linear-gradient(135deg, #F7F5FF 0%, #FFFFFF 52%, #FFF8F2 100%)',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          maxWidth: 500,
          border: '1px solid rgba(8,119,201,0.16)',
          borderRadius: 3,
          p: { xs: 3, sm: 5 },
          boxShadow: '0 24px 70px rgba(38, 28, 92, 0.12)',
        }}
      >
        <Stack spacing={3}>
          <Stack spacing={1.5} alignItems="flex-start">
            <Box
              sx={{
                width: 46,
                height: 46,
                display: 'grid',
                placeItems: 'center',
                borderRadius: 1.5,
                color: PURPLE,
                backgroundColor: '#F0EDFF',
              }}
            >
              {step === 0 ? <FiMail size={22} /> : step === 1 ? <FiCheckCircle size={22} /> : <FiLock size={22} />}
            </Box>
            <Typography sx={{ color: INK, fontSize: { xs: '1.65rem', sm: '1.9rem' }, fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography sx={{ color: MUTED, lineHeight: 1.65 }}>{description}</Typography>
          </Stack>

          {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}
          {notice && <Alert severity="success" onClose={() => setNotice('')}>{notice}</Alert>}

          {step === 0 && (
            <Stack spacing={2.2}>
              <CustomInput
                rounded
                topMargin={false}
                label="Work email"
                placeholder="you@company.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
              <Button
                variant="contained"
                onClick={requestCode}
                disabled={busy}
                sx={{ minHeight: 50, borderRadius: 1.25, backgroundColor: PURPLE, fontWeight: 800 }}
              >
                {busy ? 'Sending code...' : 'Send reset code'}
              </Button>
            </Stack>
          )}

          {step === 1 && (
            <Stack spacing={2.2}>
              <CustomInput
                rounded
                topMargin={false}
                label="6-digit reset code"
                placeholder="Enter code"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                inputProps={{ inputMode: 'numeric', maxLength: 6 }}
              />
              <Button
                variant="contained"
                onClick={verifyCode}
                disabled={busy}
                sx={{ minHeight: 50, borderRadius: 1.25, backgroundColor: PURPLE, fontWeight: 800 }}
              >
                {busy ? 'Verifying code...' : 'Verify code'}
              </Button>
              <Button
                variant="text"
                onClick={requestCode}
                disabled={busy || cooldown > 0}
                sx={{ color: PURPLE, fontWeight: 800 }}
              >
                {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
              </Button>
            </Stack>
          )}

          {step === 2 && (
            <Stack spacing={2.2}>
              <CustomInput
                rounded
                topMargin={false}
                label="New password"
                placeholder="Create a strong password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="new-password"
              />
              <CustomInput
                rounded
                topMargin={false}
                label="Confirm new password"
                placeholder="Enter the password again"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                autoComplete="new-password"
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                {passwordRules.map((rule) => (
                  <Typography
                    key={rule.label}
                    sx={{
                      px: 1,
                      py: 0.45,
                      borderRadius: 1,
                      fontSize: '0.72rem',
                      color: rule.test(password) ? '#087A68' : MUTED,
                      backgroundColor: rule.test(password) ? '#E6F6F2' : '#F4F3F7',
                    }}
                  >
                    {rule.label}
                  </Typography>
                ))}
              </Box>
              <Button
                variant="contained"
                onClick={resetPassword}
                disabled={busy}
                sx={{ minHeight: 50, borderRadius: 1.25, backgroundColor: PURPLE, fontWeight: 800 }}
              >
                {busy ? 'Saving password...' : 'Set new password'}
              </Button>
            </Stack>
          )}

          <Link
            component={RouterLink}
            to="/"
            underline="hover"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.8,
              color: INK,
              fontWeight: 700,
            }}
          >
            <FiArrowLeft size={16} />
            Back to sign in
          </Link>
        </Stack>
      </Paper>
    </Box>
  )
}
