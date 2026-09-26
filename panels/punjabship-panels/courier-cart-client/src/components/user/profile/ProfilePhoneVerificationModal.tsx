import { Stack, TextField, Typography } from '@mui/material'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from '../../UI/Toast'
import {
  useRequestProfilePhoneVerify,
  useVerifyProfilePhoneOtp,
} from '../../../hooks/User/useVerifyProfilePhone'
import CustomDialog from '../../UI/modal/CustomModal'
import CustomIconLoadingButton from '../../UI/button/CustomLoadingButton'

interface Props {
  open: boolean
  onClose: () => void
  phone: string
}

export default function PhoneVerificationModal({ open, onClose, phone }: Props) {
  const queryClient = useQueryClient()
  const { handleSubmit, setValue, clearErrors, formState } = useForm<{ otp: string }>({
    defaultValues: { otp: '' },
  })
  const { errors } = formState

  const [otpArr, setOtpArr] = useState<string[]>(Array(6).fill(''))
  const refs = useRef<Array<HTMLInputElement | null>>([])

  const { mutateAsync: sendOTP } = useRequestProfilePhoneVerify()
  const { mutateAsync: verifyOTP, isPending: verifying } = useVerifyProfilePhoneOtp()

  useEffect(() => {
    if (open && phone) {
      sendOTP({ phone }).then(() =>
        toast.open({
          message: 'Verification code sent to your registered email address.',
          severity: 'info',
        }),
      )
      setOtpArr(Array(6).fill(''))
      setValue('otp', '')
      clearErrors('otp')
    }
  }, [open, phone, sendOTP, setValue, clearErrors])

  const handleBoxChange = (idx: number, char: string) => {
    if (!/^\d?$/.test(char)) return
    const next = [...otpArr]
    next[idx] = char
    setOtpArr(next)

    setValue('otp', next.join(''), { shouldValidate: true })

    if (char && idx < 5) refs.current[idx + 1]?.focus()
  }

  const handleBoxKeyDown = (idx: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Backspace' && !otpArr[idx] && idx > 0) {
      refs.current[idx - 1]?.focus()
    }
  }

  const onVerify = async ({ otp }: { otp: string }) => {
    try {
      await verifyOTP({ phone, otp })
      toast.open({ message: 'Phone verified successfully.', severity: 'success' })
      onClose()
      queryClient.invalidateQueries({ queryKey: ['userProfile'] })
    } catch (error: any) {
      toast.open({
        message: error?.response?.data?.message || 'Invalid verification code',
        severity: 'error',
      })
    }
  }

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Phone Verification"
      footer={
        <CustomIconLoadingButton
          onClick={handleSubmit(onVerify)}
          loading={verifying}
          text="Verify Phone"
          loadingText="Verifying..."
        />
      }
    >
      <Stack spacing={2} mt={1}>
        <Typography variant="body2" color="text.secondary">
          You are verifying the contact number <strong>{phone}</strong>.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter the 6-digit code sent to your registered email address for this phone verification
          request.
        </Typography>

        <Stack direction="row" spacing={1} justifyContent="center">
          {Array.from({ length: 6 }).map((_, i) => (
            <TextField
              key={i}
              inputRef={(el) => (refs.current[i] = el)}
              value={otpArr[i]}
              onChange={(e) => handleBoxChange(i, e.target.value)}
              onKeyDown={(e) => handleBoxKeyDown(i, e)}
              inputProps={{
                maxLength: 1,
                style: {
                  width: 42,
                  textAlign: 'center',
                  fontSize: 18,
                  padding: 12,
                },
              }}
              error={!!errors.otp}
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>

        {errors.otp && (
          <Typography variant="caption" color="error">
            {errors.otp.message}
          </Typography>
        )}
      </Stack>
    </CustomDialog>
  )
}
