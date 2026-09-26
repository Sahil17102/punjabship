/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Typography } from '@mui/material'
import { Controller } from 'react-hook-form'
import CustomInput from '../../UI/inputs/CustomInput'

interface PasswordFieldProps {
  control: any
  errors: any
  watchPassword: string
  isEdit?: boolean
}

const PasswordField: React.FC<PasswordFieldProps> = ({
  control,
  errors,
  watchPassword,
  isEdit = false,
}) => {
  const passwordValidation = [
    { label: 'Min 8 chars', valid: (watchPassword || '').length >= 8 },
    { label: 'Uppercase', valid: /[A-Z]/.test(watchPassword || '') },
    { label: 'Lowercase', valid: /[a-z]/.test(watchPassword || '') },
    { label: 'Number', valid: /\d/.test(watchPassword || '') },
    { label: 'Special char', valid: /[@$!%*?&]/.test(watchPassword || '') },
  ]

  return (
    <Controller
      name="password"
      control={control}
      rules={{
        required: isEdit ? false : 'Password is required',
        minLength: { value: 8, message: 'Minimum 8 characters' },
        pattern: {
          value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
          message: 'Password must contain uppercase, lowercase, number & special character',
        },
      }}
      render={({ field }) => (
        <Box display="flex" flexDirection="column" gap={0.5}>
          <CustomInput
            {...field}
            type="password"
            label="Password"
            placeholder="Enter password"
            required
            helperText={errors.password?.message}
            error={!!errors.password?.message}
          />
          <Box display="flex" gap={1} flexWrap="wrap">
            {passwordValidation.map((v) => (
              <Typography
                key={v.label}
                variant="caption"
                sx={{
                  fontWeight: 500,
                  color: v.valid ? 'success.main' : 'text.secondary',
                  backgroundColor: v.valid ? 'rgba(0,255,0,0.1)' : 'rgba(0,0,0,0.05)',
                  px: 1,
                  borderRadius: 1,
                }}
              >
                {v.label}
              </Typography>
            ))}
          </Box>
        </Box>
      )}
    />
  )
}

export default PasswordField
