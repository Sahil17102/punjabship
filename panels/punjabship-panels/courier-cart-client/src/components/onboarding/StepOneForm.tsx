import { Box, Chip, Grid, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import React, { useEffect, useState, type ChangeEvent, type Dispatch, type SetStateAction } from 'react'
import { FiUser } from 'react-icons/fi'
import { MdBusiness, MdEmail, MdLocationPin, MdPhone } from 'react-icons/md'
import { useAuth } from '../../context/auth/AuthContext'
import { lookupPincodeLocation, normalizePincode } from '../../api/locations'
import type { FormErrors } from '../../pages/onboarding/UserOnboarding'
import type { UserInfoData } from '../../types/user.types'
import { createSyntheticEvent } from '../../utils/functions'
import CustomInput from '../UI/inputs/CustomInput'

interface StepOneProps {
  formData: UserInfoData
  onChange: (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    subKey?: keyof UserInfoData,
  ) => void
  setFormData: Dispatch<SetStateAction<UserInfoData>>
  onNext: () => void
  errors: FormErrors
  setErrors: React.Dispatch<React.SetStateAction<FormErrors>>
}

const BRAND_ORANGE = '#0877C9'
const BRAND_INK = '#141414'

export default function StepOneForm({ formData, onChange, errors, setFormData, setErrors }: StepOneProps) {
  const { user: userData } = useAuth()
  const [loadingPincode, setLoadingPincode] = useState(false)
  const [location, setLocation] = useState<{ city: string; state: string }>({ city: '', state: '' })

  useEffect(() => {
    let isActive = true

    async function fetchLocation() {
      const pincode = normalizePincode(formData?.basicInfo?.pincode)

      if (!/^\d{6}$/.test(pincode)) {
        setErrors((prev) => ({
          ...prev,
          basicInfo: { ...prev.basicInfo, pincode: '' },
        }))
        setLocation({ city: '', state: '' })
        return
      }

      setLoadingPincode(true)
      try {
        const loc = await lookupPincodeLocation(pincode)
        if (!isActive) return

        if (!loc) {
          setErrors((prev) => ({
            ...prev,
            basicInfo: { ...prev.basicInfo, pincode: 'Invalid pincode or no location found.' },
          }))
          setLocation({ city: '', state: '' })
        } else {
          setErrors((prev) => ({
            ...prev,
            basicInfo: { ...prev.basicInfo, pincode: '' },
          }))
          setLocation({ city: loc.city, state: loc.state })
        }
      } catch {
        if (!isActive) return
        setErrors((prev) => ({
          ...prev,
          basicInfo: {
            ...prev.basicInfo,
            pincode: 'Failed to validate pincode. Please try again.',
          },
        }))
        setLocation({ city: '', state: '' })
      } finally {
        if (isActive) setLoadingPincode(false)
      }
    }

    fetchLocation()

    return () => {
      isActive = false
    }
  }, [formData?.basicInfo?.pincode, setErrors])

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        state: location.state,
        city: location.city,
      },
    }))
  }, [location?.state, location?.city, setFormData])

  const fieldCardSx = {
    p: { xs: 1.6, md: 2 },
    borderRadius: 4,
    border: '1px solid rgba(20,20,20,0.08)',
    backgroundColor: '#fff',
  }

  return (
    <Stack spacing={{ xs: 2, md: 2.6 }}>
      <Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, color: BRAND_INK, mb: 0.7, fontSize: { xs: '1.22rem', md: '1.5rem' } }}
        >
          Contact & Company Details
        </Typography>
        <Typography variant="body2" sx={{ color: '#6E6763', lineHeight: 1.55 }}>
          Add primary contact information and your business location to start shipping setup.
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={fieldCardSx}>
            <CustomInput
              label="First Name"
              name="firstName"
              value={formData?.basicInfo?.firstName}
              onChange={(e) => onChange(e, 'basicInfo')}
              required
              error={!!errors.basicInfo.firstName}
              helperText={errors.basicInfo.firstName}
              prefix={<FiUser color={BRAND_ORANGE} />}
            />
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Box sx={fieldCardSx}>
            <CustomInput
              label="Last Name"
              name="lastName"
              value={formData?.basicInfo.lastName}
              onChange={(e) => onChange(e, 'basicInfo')}
              required
              error={!!errors.basicInfo.lastName}
              helperText={errors.basicInfo.lastName}
              prefix={<FiUser color={BRAND_ORANGE} />}
            />
          </Box>
        </Grid>
      </Grid>

      <Box sx={fieldCardSx}>
        <CustomInput
          label="Business Name"
          name="companyName"
          value={formData?.basicInfo.companyName}
          onChange={(e) => onChange(e, 'basicInfo')}
          required
          error={!!errors.basicInfo.companyName}
          helperText={errors.basicInfo.companyName}
          prefix={<MdBusiness color={BRAND_ORANGE} />}
        />
      </Box>

      {userData?.companyInfo?.contactEmail && userData?.companyInfo?.POCEmailVerified ? (
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={fieldCardSx}>
              <CustomInput
                label="Email"
                name="email"
                type="email"
                value={formData?.basicInfo.email}
                onChange={(e) => onChange(e, 'basicInfo')}
                disabled
                required
                error={!!errors.basicInfo.email}
                helperText={errors.basicInfo.email}
                prefix={<MdEmail color={BRAND_ORANGE} />}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={fieldCardSx}>
              <CustomInput
                label="Phone"
                name="phone"
                type="tel"
                value={formData?.basicInfo?.phone}
                onChange={(e) => onChange(createSyntheticEvent('phone', e.target.value), 'basicInfo')}
                required
                error={!!errors.basicInfo.phone}
                helperText={errors.basicInfo.phone}
                prefix={<MdPhone color={BRAND_ORANGE} />}
              />
            </Box>
          </Grid>
        </Grid>
      ) : userData?.companyInfo?.contactNumber && userData?.companyInfo?.POCPhoneVerified ? (
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={fieldCardSx}>
              <CustomInput
                label="Email"
                name="email"
                type="email"
                value={formData?.basicInfo.email}
                onChange={(e) => onChange(e, 'basicInfo')}
                required
                error={!!errors.basicInfo.email}
                helperText={errors.basicInfo.email}
                prefix={<MdEmail color={BRAND_ORANGE} />}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={fieldCardSx}>
              <CustomInput
                label="Phone"
                name="phone"
                type="tel"
                value={formData?.basicInfo?.phone}
                onChange={(e) => onChange(e, 'basicInfo')}
                disabled
                required
                error={!!errors.basicInfo.phone}
                helperText={errors.basicInfo.phone}
                prefix={<MdPhone color={BRAND_ORANGE} />}
              />
            </Box>
          </Grid>
        </Grid>
      ) : (
        <Grid container spacing={{ xs: 1.5, md: 2 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={fieldCardSx}>
              <CustomInput
                label="Email"
                name="email"
                type="email"
                value={formData?.basicInfo.email}
                onChange={(e) => onChange(e, 'basicInfo')}
                required
                error={!!errors.basicInfo.email}
                helperText={errors.basicInfo.email}
                prefix={<MdEmail color={BRAND_ORANGE} />}
              />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={fieldCardSx}>
              <CustomInput
                label="Phone"
                name="phone"
                type="tel"
                value={formData?.basicInfo?.phone}
                onChange={(e) => onChange(createSyntheticEvent('phone', e.target.value), 'basicInfo')}
                required
                error={!!errors.basicInfo.phone}
                helperText={errors.basicInfo.phone}
                prefix={<MdPhone color={BRAND_ORANGE} />}
              />
            </Box>
          </Grid>
        </Grid>
      )}

      <Box sx={fieldCardSx}>
        <CustomInput
          label="Pincode"
          name="pincode"
          value={formData?.basicInfo?.pincode}
          onChange={(e) =>
            onChange(createSyntheticEvent('pincode', normalizePincode(e.target.value)), 'basicInfo')
          }
          error={!!errors.basicInfo.pincode}
          helperText={errors.basicInfo.pincode}
          prefix={<MdLocationPin color={BRAND_ORANGE} />}
        />
      </Box>

      {loadingPincode && (
        <Chip
          label="Validating pincode..."
          sx={{
            width: 'fit-content',
            backgroundColor: alpha(BRAND_ORANGE, 0.08),
            color: BRAND_ORANGE,
            fontWeight: 700,
          }}
        />
      )}

      {location?.city && (
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: alpha(BRAND_ORANGE, 0.06),
            border: `1px solid ${alpha(BRAND_ORANGE, 0.18)}`,
          }}
        >
          <Typography variant="body2" sx={{ color: '#914700', fontWeight: 700 }}>
            Detected location: {location.city}, {location.state}
          </Typography>
        </Box>
      )}
    </Stack>
  )
}
