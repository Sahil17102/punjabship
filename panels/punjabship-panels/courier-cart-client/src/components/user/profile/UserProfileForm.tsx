import {
  alpha,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { BiCheckCircle, BiErrorCircle } from 'react-icons/bi'
import { FiCamera, FiMail, FiPhone, FiSave, FiUser } from 'react-icons/fi'
import { useAuth } from '../../../context/auth/AuthContext'
import { usePresignedDownloadUrls } from '../../../hooks/Uploads/usePresignedDownloadUrls'
import { useUpdateUserProfile } from '../../../hooks/User/useUpdateUserProfile'
import type { CompanyInfo, IUserProfileDB } from '../../../types/user.types'
import CustomIconLoadingButton from '../../UI/button/CustomLoadingButton'
import CustomInput from '../../UI/inputs/CustomInput'
import { toast } from '../../UI/Toast'
import type { UploadedFileInfo } from '../../UI/uploader/FileUploader'
import FileUploader from '../../UI/uploader/FileUploader'
import ProfileEmailVerificationModal from './ProfileEmailVerificationModal'
import PhoneVerificationModal from './ProfilePhoneVerificationModal'

export const BRAND_GREEN = '#0877C9'
export const BRAND_ORANGE = '#B8D719'
export const BRAND_GRADIENT = `linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_ORANGE} 100%)`

export default function UserProfileForm() {
  const { user, loading } = useAuth()
  const { mutateAsync, isPending: saving } = useUpdateUserProfile()

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
    setValue,
  } = useForm<Partial<CompanyInfo>>()

  const [showEmailModal, setShowEmailModal] = useState(false)
  const [showPhoneModal, setShowPhoneModal] = useState(false)

  const watchedEmail = watch('contactEmail')
  const watchedPhone = watch('contactNumber')
  const avatarKey = watch('profilePicture')
  const accountStatus = user?.approved ?? ''

  useEffect(() => {
    if (user && !loading) {
      reset({
        profilePicture: user.companyInfo?.profilePicture,
        contactPerson: user.companyInfo?.contactPerson ?? '',
        contactEmail: user.companyInfo?.contactEmail ?? '',
        contactNumber: user.companyInfo?.contactNumber ?? '',
      })
    }
  }, [user, loading, reset])

  const { data: avatarUrl } = usePresignedDownloadUrls({
    keys: avatarKey,
    enabled: !!avatarKey,
  })

  const handleAvatarUploaded = useCallback(
    (files: UploadedFileInfo[]) => {
      if (files.length) {
        setValue('profilePicture', files[0].key, { shouldValidate: true })
      }
    },
    [setValue],
  )

  const onSubmit = async (values: Partial<CompanyInfo>) => {
    try {
      await mutateAsync({ companyInfo: values } as IUserProfileDB)
      toast.open({ message: 'Profile updated successfully', severity: 'success' })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast.open({
        message: error?.response?.data?.message ?? 'Update failed',
        severity: 'error',
      })
    }
  }

  const VerifiedChip = ({ ok }: { ok: boolean }) =>
    ok ? (
      <Chip
        icon={<BiCheckCircle size={15} />}
        label="Verified"
        size="small"
        sx={{
          bgcolor: alpha(BRAND_GREEN, 0.12),
          color: BRAND_GREEN,
          border: `1px solid ${alpha(BRAND_GREEN, 0.3)}`,
          fontWeight: 700,
          '& .MuiChip-icon': { color: BRAND_GREEN },
        }}
      />
    ) : (
      <Chip
        icon={<BiErrorCircle size={15} />}
        label="Unverified"
        size="small"
        sx={{
          bgcolor: alpha(BRAND_ORANGE, 0.12),
          color: '#9b4d00',
          border: `1px solid ${alpha(BRAND_ORANGE, 0.35)}`,
          fontWeight: 700,
          '& .MuiChip-icon': { color: '#9b4d00' },
        }}
      />
    )

  return (
    <>
      <Paper
        component="form"
        elevation={0}
        onSubmit={handleSubmit(onSubmit)}
        sx={{
          p: { xs: 2, md: 2.8 },
          borderRadius: 0,
          border: `1px solid ${alpha(BRAND_GREEN, 0.13)}`,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(251,245,242,0.98) 100%)',
          boxShadow: '0 14px 32px rgba(17, 17, 19, 0.06)',
        }}
      >
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            justifyContent="space-between"
            spacing={1.8}
          >
            <Box sx={{ maxWidth: 640 }}>
              <Typography
                sx={{
                  fontSize: '0.72rem',
                  letterSpacing: 1.8,
                  color: BRAND_ORANGE,
                  fontWeight: 700,
                }}
              >
                PERSONAL PROFILE
              </Typography>
            </Box>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <Box
                sx={{
                  minWidth: 150,
                  p: 1.25,
                  border: `1px solid ${alpha('#111827', 0.08)}`,
                  bgcolor: alpha('#ffffff', 0.82),
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: '#6E6763',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Account review
                </Typography>
                <Typography sx={{ mt: 0.6, fontWeight: 800, color: '#17171A' }}>
                  {accountStatus ? 'Approved' : 'Pending'}
                </Typography>
              </Box>
              <Box
                sx={{
                  minWidth: 150,
                  p: 1.25,
                  border: `1px solid ${alpha('#111827', 0.08)}`,
                  bgcolor: alpha('#ffffff', 0.82),
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.72rem',
                    color: '#6E6763',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Verification
                </Typography>
                <Typography sx={{ mt: 0.6, fontWeight: 800, color: '#17171A' }}>
                  {user?.companyInfo?.POCEmailVerified && user?.companyInfo?.POCPhoneVerified
                    ? 'Complete'
                    : 'Action needed'}
                </Typography>
              </Box>
            </Stack>
          </Stack>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 0,
                  border: `1px solid ${alpha(BRAND_GREEN, 0.12)}`,
                  background:
                    'linear-gradient(180deg, rgba(8,119,201,0.04) 0%, rgba(255,255,255,0.92) 100%)',
                  height: '100%',
                }}
              >
                <Stack spacing={1.4} alignItems="center">
                  <Box
                    sx={{
                      width: 52,
                      height: 52,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(BRAND_GREEN, 0.08),
                      color: BRAND_GREEN,
                      border: `1px solid ${alpha(BRAND_GREEN, 0.12)}`,
                    }}
                  >
                    <FiCamera size={18} />
                  </Box>
                  <Box textAlign="center">
                    <Typography sx={{ fontWeight: 800, color: '#17171A' }}>
                      Profile image
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6E6763', mt: 0.4 }}>
                      Add the primary contact avatar used across the account center.
                    </Typography>
                  </Box>
                  <FileUploader
                    variant="avatar"
                    accept="image/*"
                    avatarSize={122}
                    placeholder={
                      avatarUrl && typeof avatarUrl === 'string'
                        ? avatarUrl
                        : '/images/blank-avatar.jpg'
                    }
                    onUploaded={handleAvatarUploaded}
                  />
                </Stack>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <Stack spacing={1.6}>
                <Paper
                  elevation={0}
                  sx={{ p: 1.6, borderRadius: 0, border: `1px solid ${alpha(BRAND_GREEN, 0.12)}` }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(BRAND_GREEN, 0.08),
                        color: BRAND_GREEN,
                      }}
                    >
                      <FiUser size={16} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#17171A' }}>
                        Primary contact name
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: '#6E6763' }}>
                        The person responsible for account operations and approvals.
                      </Typography>
                    </Box>
                  </Stack>
                  <CustomInput
                    label="Full Name"
                    {...register('contactPerson', {
                      required: 'Name is required',
                      minLength: { value: 2, message: 'Name too short' },
                    })}
                    error={!!errors.contactPerson}
                    helperText={errors.contactPerson?.message}
                  />
                </Paper>

                <Paper
                  elevation={0}
                  sx={{ p: 1.6, borderRadius: 0, border: `1px solid ${alpha(BRAND_GREEN, 0.12)}` }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(BRAND_GREEN, 0.08),
                        color: BRAND_GREEN,
                      }}
                    >
                      <FiMail size={16} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#17171A' }}>
                        Email verification
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: '#6E6763' }}>
                        Keep the main support and login contact verified.
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4}>
                    <Box flex={1}>
                      <CustomInput
                        label="Email"
                        {...register('contactEmail', {
                          required: 'E-mail is required',
                          pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: 'Invalid e-mail',
                          },
                        })}
                        error={!!errors.contactEmail}
                        helperText={errors.contactEmail?.message}
                      />
                    </Box>

                    <Stack
                      direction="row"
                      spacing={1.2}
                      alignItems="center"
                      sx={{ minWidth: { sm: 190 } }}
                    >
                      <Tooltip
                        title={
                          user?.companyInfo?.POCEmailVerified
                            ? 'Email verified'
                            : 'Email not verified'
                        }
                      >
                        <span>
                          <VerifiedChip ok={!!user?.companyInfo?.POCEmailVerified} />
                        </span>
                      </Tooltip>
                      {!user?.companyInfo?.POCEmailVerified && (
                        <Button
                          onClick={() => setShowEmailModal(true)}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderRadius: 0,
                            textTransform: 'none',
                            fontWeight: 700,
                            borderColor: BRAND_GREEN,
                            color: BRAND_GREEN,
                            '&:hover': {
                              borderColor: BRAND_GREEN,
                              bgcolor: alpha(BRAND_GREEN, 0.08),
                            },
                          }}
                        >
                          Verify
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{ p: 1.6, borderRadius: 0, border: `1px solid ${alpha(BRAND_GREEN, 0.12)}` }}
                >
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.2 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        display: 'grid',
                        placeItems: 'center',
                        bgcolor: alpha(BRAND_GREEN, 0.08),
                        color: BRAND_GREEN,
                      }}
                    >
                      <FiPhone size={16} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 800, color: '#17171A' }}>
                        Phone verification
                      </Typography>
                      <Typography sx={{ fontSize: '0.78rem', color: '#6E6763' }}>
                        Keep the registered operations number ready for alerts and validation.
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.4}>
                    <Box flex={1}>
                      <CustomInput
                        label="Phone"
                        {...register('contactNumber', {
                          pattern: {
                            value: /^\d{10}$/,
                            message: 'Must be 10 digits',
                          },
                        })}
                        error={!!errors.contactNumber}
                        helperText={errors.contactNumber?.message}
                      />
                    </Box>

                    <Stack
                      direction="row"
                      spacing={1.2}
                      alignItems="center"
                      sx={{ minWidth: { sm: 190 } }}
                    >
                      <Tooltip
                        title={
                          user?.companyInfo?.POCPhoneVerified
                            ? 'Phone verified'
                            : 'Phone not verified'
                        }
                      >
                        <span>
                          <VerifiedChip ok={!!user?.companyInfo?.POCPhoneVerified} />
                        </span>
                      </Tooltip>
                      {!user?.companyInfo?.POCPhoneVerified && (
                        <Button
                          onClick={() => setShowPhoneModal(true)}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderRadius: 0,
                            textTransform: 'none',
                            fontWeight: 700,
                            borderColor: alpha('#111827', 0.16),
                            color: '#111827',
                            '&:hover': {
                              borderColor: alpha('#111827', 0.22),
                              bgcolor: '#F8FAFC',
                            },
                          }}
                        >
                          Verify
                        </Button>
                      )}
                    </Stack>
                  </Stack>
                  {!user?.companyInfo?.POCPhoneVerified && (
                    <Typography sx={{ mt: 1, fontSize: '0.8rem', color: '#6B7280' }}>
                      Phone verification is active. Verification codes are currently delivered to
                      the registered email address.
                    </Typography>
                  )}
                </Paper>
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: alpha(BRAND_GREEN, 0.1) }} />

          <Stack direction="row" justifyContent="flex-end">
            <CustomIconLoadingButton
              type="submit"
              disabled={saving}
              text="Save Changes"
              icon={<FiSave size={14} />}
              loading={saving}
              loadingText="Saving..."
              styles={{
                minWidth: 160,
                borderRadius: '0px',
                background: BRAND_GRADIENT,
                color: '#fff',
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      <ProfileEmailVerificationModal
        open={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        email={watchedEmail ?? ''}
      />
      <PhoneVerificationModal
        open={showPhoneModal}
        onClose={() => setShowPhoneModal(false)}
        phone={watchedPhone ?? ''}
      />
    </>
  )
}
