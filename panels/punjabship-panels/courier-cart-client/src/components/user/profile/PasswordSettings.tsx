import {
  alpha,
  Box,
  Divider,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { BiHide, BiShow } from 'react-icons/bi'
import { FiLock } from 'react-icons/fi'
import CustomIconLoadingButton from '../../UI/button/CustomLoadingButton'
import CustomInput from '../../UI/inputs/CustomInput'
import { toast } from '../../UI/Toast'
import { useChangePassword } from '../../../hooks/Auth/useChangePassword'
import { useUserInfo } from '../../../hooks/useUserInfo'

const BRAND_NAVY = '#0877C9'
const BRAND_ORANGE = '#B8D719'

interface PasswordFormValues {
  currentPassword?: string
  newPassword: string
  confirmPassword: string
}

export default function PasswordSettingsForm() {
  const { mutateAsync, isPending: saving } = useChangePassword()
  const { data } = useUserInfo()

  const hasPassword = !!data?.data?.hasPassword

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>()

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const newPassword = watch('newPassword')

  const onSubmit = async (values: PasswordFormValues) => {
    try {
      await mutateAsync({
        ...(values?.currentPassword && { currentPassword: values?.currentPassword }),
        newPassword: values.newPassword,
      })
      toast.open({
        message: hasPassword ? 'Password updated successfully' : 'Password set successfully',
        severity: 'success',
      })
      reset()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.open({
        message: err?.response?.data?.message ?? 'Password update failed',
        severity: 'error',
      })
    }
  }

  const PasswordToggle = ({
    visible,
    setVisible,
  }: {
    visible: boolean
    setVisible: (v: boolean) => void
  }) => (
    <InputAdornment position="end">
      <IconButton
        aria-label={visible ? 'Hide password' : 'Show password'}
        onClick={() => setVisible(!visible)}
        edge="end"
        sx={{ color: '#6b6b6b', '&:hover': { color: BRAND_NAVY, bgcolor: alpha(BRAND_NAVY, 0.08) } }}
      >
        {visible ? <BiHide /> : <BiShow />}
      </IconButton>
    </InputAdornment>
  )

  return (
    <Paper
      component="form"
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.8 },
        borderRadius: 3,
        border: `1px solid ${alpha(BRAND_NAVY, 0.13)}`,
        backgroundColor: '#fff',
        boxShadow: '0 8px 24px rgba(13, 59, 142, 0.08)',
      }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <Stack spacing={2}>
        <Box>
          <Typography sx={{ fontSize: '0.72rem', letterSpacing: 1.8, color: BRAND_ORANGE, fontWeight: 700 }}>
            SECURITY SETTINGS
          </Typography>
          <Typography sx={{ fontSize: { xs: '1.12rem', md: '1.32rem' }, color: BRAND_NAVY, fontWeight: 800 }}>
            {hasPassword ? 'Change Password' : 'Set Password'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#60789f', mt: 0.4 }}>
            {hasPassword
              ? 'Use a strong password and rotate it periodically for better security.'
              : 'Create your first password to enable direct login.'}
          </Typography>
        </Box>

        {hasPassword && (
          <CustomInput
            type={showCurrent ? 'text' : 'password'}
            label="Current Password"
            autoComplete="current-password"
            {...register('currentPassword', { required: 'Current password is required' })}
            error={!!errors.currentPassword}
            helperText={errors.currentPassword?.message}
            postfix={<PasswordToggle visible={showCurrent} setVisible={setShowCurrent} />}
          />
        )}

        <CustomInput
          type={showNew ? 'text' : 'password'}
          label="New Password"
          autoComplete="new-password"
          {...register('newPassword', {
            required: 'New password is required',
            minLength: {
              value: 8,
              message: 'Must be at least 8 characters',
            },
            validate: (value) =>
              /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value) || 'Must include upper, lower & number',
          })}
          error={!!errors.newPassword}
          helperText={errors.newPassword?.message}
          postfix={<PasswordToggle visible={showNew} setVisible={setShowNew} />}
        />

        <CustomInput
          type={showConfirm ? 'text' : 'password'}
          label="Confirm New Password"
          autoComplete="new-password"
          {...register('confirmPassword', {
            required: 'Please confirm the new password',
            validate: (value) => value === newPassword || 'Passwords do not match',
          })}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword?.message}
          postfix={<PasswordToggle visible={showConfirm} setVisible={setShowConfirm} />}
        />

        <Box
          sx={{
            p: 1.4,
            borderRadius: 2,
            border: `1px solid ${alpha(BRAND_ORANGE, 0.24)}`,
            backgroundColor: alpha(BRAND_ORANGE, 0.08),
          }}
        >
          <Stack direction="row" spacing={0.8} alignItems="center">
            <FiLock size={14} color="#9b4d00" />
            <Typography variant="body2" sx={{ color: '#9b4d00' }}>
              Use at least 8 characters with uppercase, lowercase, and numbers.
            </Typography>
          </Stack>
        </Box>

        <Divider sx={{ borderColor: alpha(BRAND_NAVY, 0.1) }} />

        <Stack direction="row" justifyContent="flex-end">
          <CustomIconLoadingButton
            type="submit"
            disabled={saving}
            text={hasPassword ? 'Update Password' : 'Set Password'}
            loading={saving}
            loadingText="Saving..."
            styles={{
              minWidth: 170,
              borderRadius: '10px',
              background: `linear-gradient(135deg, ${BRAND_NAVY} 0%, #2a5fbe 100%)`,
              color: '#fff',
            }}
          />
        </Stack>
      </Stack>
    </Paper>
  )
}
