/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, FormControlLabel, Link, Stack, Tooltip, Typography } from '@mui/material'
import { useState, type Dispatch, type SetStateAction } from 'react'
import { FiMail } from 'react-icons/fi'
import { MdInfoOutline, MdPassword } from 'react-icons/md'
import { Link as RouterLink } from 'react-router-dom'
import { useAuth } from '../../context/auth/AuthContext'
import { useRequestPasswordLogin } from '../../hooks/useRequestPasswordLogin'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import CustomCheckbox from '../UI/inputs/CustomCheckbox'
import CustomInput from '../UI/inputs/CustomInput'
import { toast } from '../UI/Toast'
import EmailVerificationForm from './EmailVerificationForm'

const BRAND_ORANGE = '#0877C9'

const primaryButtonStyles = {
  width: '100%',
  borderRadius: 1.25,
  backgroundColor: BRAND_ORANGE,
  boxShadow: '0 12px 28px rgba(8,119,201,0.24)',
  minHeight: 52,
  '&:hover': {
    backgroundColor: '#0564AD',
    boxShadow: '0 15px 32px rgba(8,119,201,0.3)',
  },
}

interface IPasswordFormProps {
  setStep: Dispatch<SetStateAction<number>>
  step: number
  setOpenTerms: Dispatch<SetStateAction<boolean>>
}

export default function PasswordLoginForm({ setStep, step, setOpenTerms }: IPasswordFormProps) {
  const { setTokens, setUserId } = useAuth()
  const { mutate: requestPasswordLogin, isPending } = useRequestPasswordLogin()

  const [emailForm, setEmailForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({ email: '', password: '' })
  const [touched, setTouched] = useState({ email: false, password: false })
  const [termsChecked, setTermsChecked] = useState(false)

  const validateEmail = (email: string): string => {
    if (!email) return 'Email is required.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Enter a valid email format.'
    return ''
  }

  const validatePassword = (password: string): string => {
    if (!password) return 'Password is required.'
    if (password.length < 6) return 'Minimum 6 characters required.'
    return ''
  }

  const handleChange = (field: 'email' | 'password', value: string) => {
    setEmailForm((prev) => ({ ...prev, [field]: value }))

    if (touched[field]) {
      const error = field === 'email' ? validateEmail(value) : validatePassword(value)
      setErrors((prev) => ({ ...prev, [field]: error }))
    }
  }

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const value = emailForm[field]
    const error = field === 'email' ? validateEmail(value) : validatePassword(value)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const termsLabel = (
    <Typography fontSize="13px" display="flex" alignItems="center" gap="3px" color="#6E6763">
      I agree to{' '}
      <Link
        component="button"
        underline="hover"
        onClick={() => setOpenTerms(true)}
        sx={{ cursor: 'pointer', color: BRAND_ORANGE, fontWeight: 800 }}
      >
        Terms and Conditions
      </Link>
    </Typography>
  )

  const isFormValid = !validateEmail(emailForm.email) && !validatePassword(emailForm.password)

  const handleSubmit = () => {
    if (!termsChecked) {
      toast.open({
        message: 'Please accept the Terms and Conditions to continue.',
        severity: 'warning',
        position: { vertical: 'top', horizontal: 'center' },
      })
      return
    }

    const emailError = validateEmail(emailForm.email)
    const passwordError = validatePassword(emailForm.password)

    setErrors({ email: emailError, password: passwordError })
    setTouched({ email: true, password: true })

    if (!emailError && !passwordError) {
      sessionStorage.setItem('preferredMethod', 'password')

      requestPasswordLogin(
        { email: emailForm.email, password: emailForm.password },
        {
          onSuccess: ({ message, token, refreshToken, user }) => {
            if (message) {
              toast.open({
                message,
                severity: 'success',
                position: { vertical: 'top', horizontal: 'center' },
              })
            }

            if (message.includes('Verification email sent')) {
              setStep(1)
              return
            }

            setUserId(user?.id)
            setTokens(token, refreshToken)
          },
          onError: (error: any) => {
            toast.open({
              message: error?.response?.data?.error || 'Something went wrong',
              severity: 'error',
              position: { vertical: 'top', horizontal: 'center' },
            })
          },
        },
      )
    }
  }

  return step === 0 ? (
    <Stack width="100%" spacing={1.8}>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Box
          sx={{
            width: 34,
            height: 34,
            flex: '0 0 auto',
            display: 'grid',
            placeItems: 'center',
            borderRadius: 1,
            color: BRAND_ORANGE,
            backgroundColor: '#F0EDFF',
          }}
        >
          <MdPassword size={17} />
        </Box>
        <Box>
          <Typography sx={{ color: '#17171A', fontSize: '0.81rem', fontWeight: 800 }}>
            Merchant credentials
          </Typography>
          <Typography sx={{ mt: 0.15, color: '#6F6F78', fontSize: '0.7rem' }}>
            Use your registered email and password.
          </Typography>
        </Box>
      </Stack>

      <CustomInput
        rounded
        topMargin={false}
        prefix={<FiMail color={BRAND_ORANGE} size={16} />}
        type="email"
        name="email"
        id="password-email"
        label="Work email"
        placeholder="you@company.com"
        value={emailForm.email}
        onChange={(e) => handleChange('email', e.target.value)}
        onBlur={() => handleBlur('email')}
        required
        helperText={touched.email && errors.email}
        error={touched.email && !!errors.email}
      />

      <CustomInput
        rounded
        topMargin={false}
        label="Password"
        name="password"
        id="password"
        type="password"
        placeholder="Enter your password"
        prefix={<MdPassword color={BRAND_ORANGE} size={16} />}
        postfix={
          <Tooltip
            title={
              <Typography fontSize="12px">
                Existing Google users can set a password once and use both sign-in methods.
              </Typography>
            }
            arrow
          >
            <Box sx={{ display: 'inline-flex', alignItems: 'center', color: BRAND_ORANGE }}>
              <MdInfoOutline size={17} />
            </Box>
          </Tooltip>
        }
        value={emailForm.password}
        onChange={(e) => handleChange('password', e.target.value)}
        onBlur={() => handleBlur('password')}
        required
        helperText={touched.password && errors.password}
        error={touched.password && !!errors.password}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -0.8 }}>
        <Link
          component={RouterLink}
          to="/forgot-password"
          underline="hover"
          sx={{ color: BRAND_ORANGE, fontSize: '0.78rem', fontWeight: 800 }}
        >
          Forgot password?
        </Link>
      </Box>

      <FormControlLabel
        sx={{ m: 0, alignItems: 'flex-start' }}
        control={
          <CustomCheckbox
            checked={termsChecked}
            onChange={(e) => setTermsChecked(e.target.checked)}
            color="primary"
          />
        }
        label={
          <Typography component="div" mt={0.4} variant="body2">
            {termsLabel}
          </Typography>
        }
      />

      <CustomIconLoadingButton
        type="button"
        text="Sign in securely"
        sx={primaryButtonStyles}
        onClick={handleSubmit}
        disabled={!isFormValid || !termsChecked}
        loading={isPending}
        loadingText="Signing in..."
        textColor="#FFFFFF"
      />
    </Stack>
  ) : (
    <EmailVerificationForm
      onEditEmail={() => setStep(0)}
      email={emailForm.email}
      resendMail={handleSubmit}
      password={emailForm.password}
    />
  )
}
