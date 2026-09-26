import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { FiCheckCircle, FiPackage, FiSettings, FiShoppingBag } from 'react-icons/fi'
import { MdArrowBack, MdArrowForward } from 'react-icons/md'
import { useNavigate } from 'react-router-dom'
import StepOneForm from '../../components/onboarding/StepOneForm'
import StepThree from '../../components/onboarding/StepThree'
import StepTwoForm from '../../components/onboarding/StepTwoForm'
import SwitchAccountButton from '../../components/onboarding/SwitchAccountButton'
import CustomIconLoadingButton from '../../components/UI/button/CustomLoadingButton'
import FullScreenLoader from '../../components/UI/loader/FullScreenLoader'
import { useAuth } from '../../context/auth/AuthContext'
import { useCompleteUserOnboarding } from '../../hooks/useCompleteUserOnboarding'
import type { UserInfoData } from '../../types/user.types'
import { hasValidationErrors, validateOnboardingFields } from '../../utils/functions'
import { initialFormData } from '../../utils/utility'

const BRAND_ORANGE = '#0877C9'
const BRAND_ORANGE_DARK = '#0564AD'
const BRAND_DARK = '#141414'

export type FormErrors = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [K in keyof UserInfoData]: any
}

const steps = [
  {
    key: 1,
    title: 'Company identity',
    helper: 'Business contact, address, and primary account details',
    icon: <FiShoppingBag size={16} />,
  },
  {
    key: 2,
    title: 'Shipping profile',
    helper: 'Business model, brand setup, and volume expectations',
    icon: <FiPackage size={16} />,
  },
  {
    key: 3,
    title: 'Store readiness',
    helper: 'Website details and future integration preferences',
    icon: <FiSettings size={16} />,
  },
]

export default function UserOnboarding() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { user: userData, loading: fetchingUserData, refetchUser } = useAuth()
  const { mutateAsync: completeOnboarding, isPending } = useCompleteUserOnboarding()

  const [step, setStep] = useState<number>(1)
  const [formData, setFormData] = useState<UserInfoData>({ ...initialFormData })
  const [formErrors, setFormErrors] = useState<FormErrors>({ ...initialFormData })

  const progressPercent = useMemo(() => Math.round((step / steps.length) * 100), [step])
  const currentStepMeta = steps[step - 1]

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
    subKey?: keyof UserInfoData,
  ) => {
    const { name, value } = e.target

    const updatedForm = subKey
      ? {
          ...formData,
          [subKey]: {
            ...formData[subKey],
            [name]: value,
          },
        }
      : {
          ...formData,
          [name]: value,
        }

    setFormData(updatedForm)

    const newErrors = validateOnboardingFields(updatedForm, step)
    setFormErrors((prev) => {
      if (subKey) {
        return {
          ...prev,
          [subKey]: {
            ...prev[subKey],
            [name]: newErrors[subKey]?.[name] || '',
          },
        }
      }
      return {
        ...prev,
        [name]: newErrors[name] || '',
      }
    })
  }

  const handleNext = async () => {
    const errors = validateOnboardingFields(formData, step)
    setFormErrors(errors)

    if (hasValidationErrors(errors)) return

    try {
      await completeOnboarding({ step, data: formData })
      await refetchUser()

      if (step < steps.length) {
        setStep((prev) => prev + 1)
      } else {
        queryClient.invalidateQueries({ queryKey: ['userProfile'], exact: true })
        navigate('/home')
      }
    } catch (error) {
      console.error('Failed to complete onboarding step', error)
    }
  }

  const handleBack = () => {
    if (step > 1) setStep((prev) => prev - 1)
  }

  useEffect(() => {
    if (!userData) return

    if (userData.onboardingComplete) {
      navigate('/home')
      return
    }

    const resumeStep = (userData.onboardingStep ?? 0) + 1
    const clamped = Math.min(Math.max(resumeStep, 1), steps.length)
    setStep(clamped)
  }, [userData, navigate])

  useEffect(() => {
    if (!userData || !Object.keys(userData).length) return

    setFormData({
      basicInfo: {
        firstName: userData?.companyInfo?.contactPerson?.split(' ')?.[0] ?? '',
        lastName: userData?.companyInfo?.contactPerson?.split(' ')?.slice(1).join(' ') ?? '',
        email: userData?.companyInfo?.contactEmail ?? '',
        phone: userData?.companyInfo?.contactNumber ?? '',
        companyName: userData?.companyInfo?.businessName ?? '',
        pincode: userData?.companyInfo?.pincode ?? '',
        state: userData?.companyInfo?.state ?? '',
        city: userData?.companyInfo?.city ?? '',
        personalWebsite: userData?.companyInfo?.website ?? '',
      },
      businessLegal: {
        brandName: userData?.companyInfo?.brandName ?? '',
        businessCategory: userData?.businessType ?? [],
        monthlyShipments: userData?.monthlyOrderCount ?? '0-100',
      },
      platformIntegration: { ...(userData?.salesChannels ?? {}) },
    })
  }, [userData])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        px: { xs: 1, md: 1.75 },
        py: { xs: 1, md: 1.5 },
        background:
          'radial-gradient(circle at top left, rgba(8,119,201,0.1) 0%, transparent 24%), radial-gradient(circle at bottom right, rgba(20,20,20,0.08) 0%, transparent 26%), linear-gradient(180deg, #f8f7fa 0%, #f0eef5 100%)',
      }}
    >
      {fetchingUserData && <FullScreenLoader />}

      <Box sx={{ maxWidth: 1440, mx: 'auto', width: '100%', minWidth: 0 }}>
        <Paper
          elevation={0}
          sx={{
            borderRadius: { xs: 2, md: 3 },
            overflow: 'hidden',
            border: '1px solid rgba(17,17,19,0.08)',
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(18px)',
            boxShadow: '0 30px 80px rgba(17, 17, 19, 0.12)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '360px minmax(0, 1fr)' },
              minHeight: { xs: 'auto', lg: 'calc(100vh - 48px)' },
              width: '100%',
              minWidth: 0,
            }}
          >
            <Box
              sx={{
                position: 'relative',
                minWidth: 0,
                p: { xs: 2.2, md: 3, lg: 3.4 },
                background:
                  'radial-gradient(circle at 16% 16%, rgba(255,255,255,0.12) 0%, transparent 24%), radial-gradient(circle at 80% 20%, rgba(8,119,201,0.22) 0%, transparent 26%), linear-gradient(180deg, #17171b 0%, #101012 100%)',
                color: '#fff',
                borderBottom: { xs: '1px solid rgba(255,255,255,0.08)', lg: 'none' },
              }}
            >
              <Box
                component="img"
                src="/logo/punjabship-mark.svg"
                alt="PunjabShip"
                sx={{ width: { xs: 150, md: 176 }, height: 'auto', mb: 2.2 }}
              />

              <Stack spacing={2.4} sx={{ height: '100%' }}>
                <Box>
                  <Typography
                    sx={{
                      fontSize: '0.74rem',
                      letterSpacing: '0.16em',
                      textTransform: 'uppercase',
                      fontWeight: 800,
                      color: alpha('#fff', 0.68),
                      mb: 0.8,
                    }}
                  >
                    Workspace Setup
                  </Typography>

                  <Typography
                    sx={{ color: alpha('#fff', 0.74), lineHeight: 1.7, fontSize: '0.92rem' }}
                  >
                    Complete the profile in a few structured steps so shipping, billing, and account
                    operations start with the right defaults.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 1.6,
                    borderRadius: 2,
                    border: '1px solid rgba(255,255,255,0.1)',
                    bgcolor: 'rgba(255,255,255,0.05)',
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
                      Setup progress
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 800, color: '#fff' }}>
                      {progressPercent}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercent}
                    sx={{
                      height: 8,
                      borderRadius: 2,
                      bgcolor: alpha('#fff', 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 2,
                        background: `linear-gradient(90deg, ${BRAND_ORANGE} 0%, #FF7A88 100%)`,
                      },
                    }}
                  />
                </Box>

                <Stack spacing={1.2}>
                  {steps.map((item) => {
                    const isActive = item.key === step
                    const isCompleted = item.key < step

                    return (
                      <Box
                        key={item.key}
                        sx={{
                          p: 1.45,
                          borderRadius: 2,
                          border: `1px solid ${
                            isActive
                              ? alpha(BRAND_ORANGE, 0.42)
                              : isCompleted
                                ? alpha('#fff', 0.14)
                                : alpha('#fff', 0.08)
                          }`,
                          bgcolor: isActive
                            ? alpha(BRAND_ORANGE, 0.16)
                            : isCompleted
                              ? alpha('#fff', 0.05)
                              : 'transparent',
                        }}
                      >
                        <Stack direction="row" spacing={1.1} alignItems="center">
                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              borderRadius: 1.5,
                              display: 'grid',
                              placeItems: 'center',
                              bgcolor: isCompleted ? '#fff' : alpha('#fff', isActive ? 0.12 : 0.08),
                              color: isCompleted ? BRAND_ORANGE : '#fff',
                              fontWeight: 800,
                              flexShrink: 0,
                            }}
                          >
                            {isCompleted ? <FiCheckCircle size={15} /> : item.icon}
                          </Box>
                          <Box>
                            <Typography
                              sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff' }}
                            >
                              {item.title}
                            </Typography>
                            <Typography
                              sx={{
                                color: alpha('#fff', 0.62),
                                fontSize: '0.8rem',
                                lineHeight: 1.5,
                              }}
                            >
                              {item.helper}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    )
                  })}
                </Stack>

                <Box sx={{ mt: 'auto', pt: 1 }}>
                  <SwitchAccountButton />
                </Box>
              </Stack>
            </Box>

            <Box sx={{ p: { xs: 1.4, md: 2, lg: 2.2 }, minWidth: 0, overflowX: 'hidden' }}>
              <Stack spacing={1.6} sx={{ height: '100%' }}>
                <Box
                  sx={{
                    p: { xs: 2, md: 2.4 },
                    borderRadius: 2,
                    border: '1px solid rgba(17,17,19,0.08)',
                    background:
                      'radial-gradient(circle at top right, rgba(8,119,201,0.12) 0%, transparent 24%), linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(248,247,250,0.98) 100%)',
                  }}
                >
                  <Stack
                    direction={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between"
                    alignItems={{ xs: 'flex-start', md: 'center' }}
                    gap={1.5}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '0.74rem',
                          letterSpacing: '0.16em',
                          textTransform: 'uppercase',
                          color: BRAND_ORANGE,
                          fontWeight: 800,
                          mb: 0.7,
                        }}
                      >
                        Step {step} of {steps.length}
                      </Typography>
                      <Typography
                        sx={{
                          color: BRAND_DARK,
                          fontWeight: 800,
                          fontSize: { xs: '1.4rem', md: '1.8rem' },
                          letterSpacing: '-0.04em',
                        }}
                      >
                        {currentStepMeta.title}
                      </Typography>
                      <Typography sx={{ color: '#6E6763', mt: 0.5, lineHeight: 1.65 }}>
                        {currentStepMeta.helper}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        px: 1.25,
                        py: 0.75,
                        borderRadius: 999,
                        bgcolor: alpha(BRAND_ORANGE, 0.08),
                        color: BRAND_ORANGE,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                      }}
                    >
                      Merchant Setup
                    </Box>
                  </Stack>
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    p: { xs: 1.2, md: 1.6 },
                    borderRadius: 2,
                    border: '1px solid rgba(17,17,19,0.08)',
                    background:
                      'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,246,243,0.98) 100%)',
                    boxShadow: '0 20px 42px rgba(17, 17, 19, 0.05)',
                  }}
                >
                  <Box sx={{ minHeight: { xs: 420, md: 520 }, minWidth: 0, overflowX: 'hidden' }}>
                    {step === 1 && (
                      <StepOneForm
                        setFormData={setFormData}
                        formData={formData}
                        onChange={handleChange}
                        onNext={handleNext}
                        errors={formErrors}
                        setErrors={setFormErrors}
                      />
                    )}

                    {step === 2 && (
                      <StepTwoForm
                        formData={formData}
                        onChange={handleChange}
                        errors={formErrors}
                      />
                    )}

                    {step === 3 && (
                      <StepThree
                        formData={formData}
                        onChange={handleChange}
                        errors={formErrors}
                        setErrors={setFormErrors}
                      />
                    )}
                  </Box>
                </Box>

                <Stack
                  direction={{ xs: 'column-reverse', sm: 'row' }}
                  justifyContent="space-between"
                  spacing={1.2}
                  alignItems={{ xs: 'stretch', sm: 'center' }}
                  sx={{
                    p: { xs: 1.4, md: 1.6 },
                    borderRadius: 2,
                    border: '1px solid rgba(17,17,19,0.08)',
                    background: 'rgba(255,255,255,0.88)',
                  }}
                >
                  <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                    {step > 1 ? (
                      <Button
                        variant="outlined"
                        startIcon={<MdArrowBack />}
                        onClick={handleBack}
                        fullWidth={isMobile}
                        sx={{
                          borderColor: 'rgba(17,17,19,0.12)',
                          color: BRAND_DARK,
                          borderRadius: 1.5,
                          px: 2.2,
                          '&:hover': {
                            borderColor: 'rgba(17,17,19,0.2)',
                            backgroundColor: '#f6efea',
                          },
                        }}
                      >
                        Previous
                      </Button>
                    ) : (
                      <Box />
                    )}
                  </Box>

                  <CustomIconLoadingButton
                    text={step === steps.length ? 'Finish Setup' : 'Save & Continue'}
                    onClick={handleNext}
                    loading={isPending}
                    loadingText="Saving..."
                    disabled={isPending}
                    icon={<MdArrowForward />}
                    styles={{
                      width: isMobile ? '100%' : 'auto',
                      minWidth: 190,
                      borderRadius: '4px',
                      background: `linear-gradient(135deg, ${BRAND_ORANGE} 0%, ${BRAND_ORANGE_DARK} 100%)`,
                      color: '#fff',
                      minHeight: 48,
                    }}
                  />
                </Stack>
              </Stack>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
