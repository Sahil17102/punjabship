import { alpha, Box, Divider, Grid, Paper, Stack, Tooltip, Typography } from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { BiInfoCircle } from 'react-icons/bi'
import { lookupPincodeLocation, normalizePincode } from '../../../api/locations'
import { FiBriefcase, FiGlobe, FiMapPin } from 'react-icons/fi'
import { useAuth } from '../../../context/auth/AuthContext'
import { usePresignedDownloadUrls } from '../../../hooks/Uploads/usePresignedDownloadUrls'
import { useUpdateUserProfile } from '../../../hooks/User/useUpdateUserProfile'
import type { CompanyInfo } from '../../../types/user.types'
import CustomIconLoadingButton from '../../UI/button/CustomLoadingButton'
import CustomInput from '../../UI/inputs/CustomInput'
import { toast } from '../../UI/Toast'
import type { UploadedFileInfo } from '../../UI/uploader/FileUploader'
import FileUploader from '../../UI/uploader/FileUploader'
import { BRAND_GRADIENT, BRAND_GREEN } from './UserProfileForm'

interface CompanyFormValues {
  brandName?: string
  businessName?: string
  website?: string
  email: string
  contact: string
  address: string
  city: string
  state: string
  pincode: string
  logo?: string
}

const PINCODE_REGEX = /^[1-9][0-9]{5}$/

export default function CompanyInfoForm() {
  const { user } = useAuth()
  const { mutateAsync, isPending: saving } = useUpdateUserProfile()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    getValues,
    reset,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    defaultValues: {
      brandName: user?.companyInfo?.brandName ?? '',
      businessName: user?.companyInfo?.businessName ?? '',
      website: user?.companyInfo?.website ?? '',
      email: user?.companyInfo?.companyEmail ?? '',
      contact: user?.companyInfo?.companyContactNumber ?? '',
      address: user?.companyInfo?.companyAddress ?? '',
      city: user?.companyInfo?.city ?? '',
      state: user?.companyInfo?.state ?? '',
      pincode: user?.companyInfo?.pincode ?? '',
      logo: user?.companyInfo?.companyLogoUrl ?? '',
    },
  })

  /* sync on user change */
  useEffect(() => {
    if (user?.companyInfo) {
      reset({
        brandName: user.companyInfo.brandName ?? '',
        businessName: user.companyInfo.businessName ?? '',
        website: user.companyInfo.website ?? '',
        email: user.companyInfo.companyEmail ?? '',
        contact: user.companyInfo.companyContactNumber ?? '',
        address: user.companyInfo.companyAddress ?? '',
        city: user.companyInfo.city ?? '',
        state: user.companyInfo.state ?? '',
        pincode: user.companyInfo.pincode ?? '',
        logo: user.companyInfo.companyLogoUrl ?? '',
      })
    }
  }, [user, reset])

  /* logo preview */
  const logoKey = watch('logo')
  const { data: logoUrl, isLoading } = usePresignedDownloadUrls({
    keys: logoKey,
    enabled: logoKey && logoKey !== '' ? true : false,
  })

  /* pincode lookup */
  const pincode = watch('pincode')
  const [pinFetching, setPinFetching] = useState(false)

  useEffect(() => {
    let isActive = true

    const fetchPin = async (pin: string) => {
      setPinFetching(true)
      try {
        const location = await lookupPincodeLocation(pin)
        if (!isActive) return

        if (!location) {
          setError('pincode', { type: 'manual', message: 'Invalid pincode' })
          setValue('city', '')
          setValue('state', '')
        } else {
          clearErrors('pincode')
          setValue('city', location.city, { shouldValidate: true })
          setValue('state', location.state, { shouldValidate: true })
        }
      } catch {
        if (!isActive) return
        setError('pincode', { type: 'manual', message: 'PIN lookup failed' })
        setValue('city', '')
        setValue('state', '')
      } finally {
        if (isActive) setPinFetching(false)
      }
    }

    const normalizedPincode = normalizePincode(pincode)
    if (PINCODE_REGEX.test(normalizedPincode)) {
      fetchPin(normalizedPincode)
    } else if (normalizedPincode.length === 6) {
      setError('pincode', { type: 'manual', message: 'Enter a valid Indian pincode' })
      setValue('city', '')
      setValue('state', '')
    } else {
      setValue('city', '')
      setValue('state', '')
      clearErrors('pincode')
    }

    return () => {
      isActive = false
    }
  }, [pincode, setError, clearErrors, setValue])

  /* logo upload cb */
  const handleLogoUploaded = useCallback(
    (files: UploadedFileInfo[]) => {
      if (files.length) {
        setValue('logo', files[0].key, { shouldValidate: true })
      } else {
        setValue('logo', '', { shouldValidate: false })
      }
    },
    [setValue],
  )
  /* submit */
  const onSubmit = async (values: CompanyFormValues) => {
    const normalizedPincode = normalizePincode(values.pincode)
    if (!PINCODE_REGEX.test(normalizedPincode)) {
      setError('pincode', { type: 'manual', message: 'Enter a valid 6 digit Indian pincode' })
      return
    }

    let resolvedCity = getValues('city') || values.city
    let resolvedState = getValues('state') || values.state

    if (!resolvedCity || !resolvedState) {
      setPinFetching(true)
      try {
        const location = await lookupPincodeLocation(normalizedPincode)
        if (!location) {
          setError('pincode', { type: 'manual', message: 'Invalid pincode' })
          return
        }

        resolvedCity = location.city
        resolvedState = location.state
        setValue('city', resolvedCity, { shouldValidate: true })
        setValue('state', resolvedState, { shouldValidate: true })
        clearErrors('pincode')
      } catch {
        setError('pincode', { type: 'manual', message: 'PIN lookup failed' })
        return
      } finally {
        setPinFetching(false)
      }
    }

    try {
      await mutateAsync({
        companyInfo: {
          brandName: values.brandName ?? '',
          businessName: values.businessName,
          website: values.website,
          companyContactNumber: values.contact,
          companyEmail: values.email,
          companyAddress: values.address,
          pincode: normalizedPincode,
          state: resolvedState,
          city: resolvedCity,
          companyLogoUrl: values.logo,
        } as CompanyInfo,
      })
      toast.open({ message: 'Company info updated', severity: 'success' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.open({
        message: err?.response?.data?.message ?? 'Update failed',
        severity: 'error',
      })
    }
  }

  /* business‑name editability */
  const isBusinessNameEditable = user?.businessType?.includes('d2c')

  /* JSX */
  return (
    <Paper
      component="form"
      elevation={0}
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 3,
        mb: 4,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,245,242,0.98) 100%)',
        border: `1px solid ${alpha(BRAND_GREEN, 0.12)}`,
        boxShadow: `0 14px 32px rgba(17, 17, 19, 0.06)`,
        position: 'relative',
        overflow: 'hidden',
      }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Stack spacing={0.8}>
        <Typography sx={{ fontSize: '0.72rem', letterSpacing: 1.8, color: '#B8D719', fontWeight: 700 }}>
          COMPANY PROFILE
        </Typography>
        <Typography sx={{ fontSize: { xs: '1.18rem', md: '1.48rem' }, color: '#17171A', fontWeight: 800 }}>
          Present the business exactly as it should appear on the platform
        </Typography>
        <Typography sx={{ color: '#6E6763', fontSize: '0.92rem', maxWidth: 760 }}>
          Define your public-facing brand, support contact details, and registered business
          address so courier, billing, and support workflows all use the same source of truth.
        </Typography>
      </Stack>

      <Grid container spacing={4}>
        {/* logo */}
        <Grid size={{ md: 3, xs: 12 }} mt={2}>
          <Stack
            alignItems={{ md: 'flex-start', xs: 'center' }}
            gap={1.2}
            sx={{
              p: 2,
              border: `1px solid ${alpha(BRAND_GREEN, 0.12)}`,
              background:
                'linear-gradient(180deg, rgba(8,119,201,0.04) 0%, rgba(255,255,255,0.92) 100%)',
            }}
          >
            <Typography fontSize={'12px'} display={'flex'} alignItems={'center'} gap={1}>
              <Tooltip title="Please click save button to save the company logo">
                <BiInfoCircle color="#5a9de6" />
              </Tooltip>{' '}
              Company logo (optional)
            </Typography>
            <Typography sx={{ fontSize: '0.82rem', color: '#6E6763' }}>
              Use the logo that should represent the brand in account and shipping interfaces.
            </Typography>
            <FileUploader
              variant="dnd"
              showPlaceholderImgByDefault
              accept="image/*"
              loadingPreview={isLoading}
              avatarSize={120}
              placeholder={logoUrl}
              onUploaded={handleLogoUploaded}
            />
          </Stack>
        </Grid>

        {/* form */}
        <Grid size={{ md: 9, xs: 12 }}>
          <Stack spacing={2}>
            <Paper elevation={0} sx={{ p: 1.6, border: `1px solid ${alpha(BRAND_GREEN, 0.12)}`, borderRadius: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.3 }}>
                <Box sx={{ width: 36, height: 36, display: 'grid', placeItems: 'center', bgcolor: alpha(BRAND_GREEN, 0.08), color: BRAND_GREEN }}>
                  <FiBriefcase size={16} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#17171A' }}>
                    Brand and business identifiers
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#6E6763' }}>
                    These names define how your organisation appears across the platform.
                  </Typography>
                </Box>
              </Stack>
              <Grid container spacing={2}>
                <Grid size={{ md: 6, xs: 12 }}>
                  <CustomInput
                    label="Brand name"
                    {...register('brandName')}
                    error={!!errors.brandName}
                    helperText={errors.brandName?.message}
                  />
                </Grid>
                <Grid size={{ md: 6, xs: 12 }}>
                  <CustomInput
                    label="Business name"
                    disabled={!isBusinessNameEditable}
                    {...register('businessName')}
                    error={!!errors.businessName}
                    helperText={
                      !isBusinessNameEditable
                        ? 'Contact support to change'
                        : errors.businessName?.message
                    }
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 1.6, border: `1px solid ${alpha(BRAND_GREEN, 0.12)}`, borderRadius: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.3 }}>
                <Box sx={{ width: 36, height: 36, display: 'grid', placeItems: 'center', bgcolor: alpha(BRAND_GREEN, 0.08), color: BRAND_GREEN }}>
                  <FiGlobe size={16} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#17171A' }}>
                    Public touchpoints
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#6E6763' }}>
                    Website, support email, and phone number used for brand communication.
                  </Typography>
                </Box>
              </Stack>
              <Grid container spacing={2}>
                <Grid size={{ md: 6, xs: 12 }}>
                  <CustomInput
                    label="Website"
                    placeholder="https://yourbrand.com"
                    {...register('website', {
                      pattern: {
                        value: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w\-./?%&=]*)?$/i,
                        message: 'Invalid URL',
                      },
                    })}
                    error={!!errors.website}
                    helperText={errors.website?.message}
                  />
                </Grid>
                <Grid size={{ md: 6, xs: 12 }}>
                  <CustomInput
                    required
                    label="Contact number"
                    {...register('contact', {
                      required: 'Contact number is required',
                      pattern: {
                        value: /^\d{10}$/,
                        message: 'Must be 10 digits',
                      },
                    })}
                    error={!!errors.contact}
                    helperText={errors.contact?.message}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <CustomInput
                    required
                    label="Support email"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Invalid email',
                      },
                    })}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />
                </Grid>
              </Grid>
            </Paper>

            <Paper elevation={0} sx={{ p: 1.6, border: `1px solid ${alpha(BRAND_GREEN, 0.12)}`, borderRadius: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.3 }}>
                <Box sx={{ width: 36, height: 36, display: 'grid', placeItems: 'center', bgcolor: alpha(BRAND_GREEN, 0.08), color: BRAND_GREEN }}>
                  <FiMapPin size={16} />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#17171A' }}>
                    Registered address
                  </Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#6E6763' }}>
                    Courier, invoice, and compliance teams use this address information.
                  </Typography>
                </Box>
              </Stack>
              <Stack spacing={2}>
                <CustomInput
                  required
                  label="Address"
                  multiline
                  rows={2}
                  maxLength={200}
                  {...register('address', { required: 'Address is required' })}
                  error={!!errors.address}
                  helperText={errors.address?.message}
                />

                <Grid container spacing={2}>
                  <Grid size={{ md: 4, xs: 12 }}>
                    <CustomInput
                      required
                      label="Pincode"
                      {...register('pincode', {
                        required: 'Pincode is required',
                        pattern: {
                          value: PINCODE_REGEX,
                          message: 'Enter a valid 6 digit Indian pincode',
                        },
                      })}
                      maxLength={6}
                      onChange={(event) =>
                        setValue('pincode', normalizePincode(event.target.value), {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      error={!!errors.pincode}
                      helperText={errors.pincode?.message || (pinFetching ? 'Validating...' : '')}
                    />
                  </Grid>
                  <Grid size={{ md: 4, xs: 12 }}>
                    <CustomInput label="City" disabled {...register('city')} />
                  </Grid>
                  <Grid size={{ md: 4, xs: 12 }}>
                    <CustomInput label="State" disabled {...register('state')} />
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          </Stack>
        </Grid>
      </Grid>

      <Divider sx={{ my: 1 }} />

      <Stack direction="row" justifyContent="flex-end" gap={2}>
        <CustomIconLoadingButton
          type="submit"
          disabled={saving || pinFetching}
          text="Save changes"
          loading={saving || pinFetching}
          loadingText="Saving…"
          styles={{
            minWidth: 160,
            borderRadius: '0px',
            background: BRAND_GRADIENT,
            color: '#FFFFFF',
            '&:hover': {
              background: 'linear-gradient(135deg, #B90717 0%, #5E1820 100%)',
            },
          }}
        />
      </Stack>
    </Paper>
  )
}
