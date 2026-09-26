import { Button, Stack } from '@mui/material'
import { useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import CustomInput from '../../../components/UI/inputs/CustomInput'
import CustomDialog from '../../../components/UI/modal/CustomModal'

interface CreateApiKeyFormData {
  key_name: string
}

interface CreateApiKeyModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: CreateApiKeyFormData) => void
  isLoading: boolean
}

export const CreateApiKeyModal = ({
  open,
  onClose,
  onSubmit,
  isLoading,
}: CreateApiKeyModalProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApiKeyFormData>({
    defaultValues: {
      key_name: '',
    },
  })

  const handleFormSubmit = (data: CreateApiKeyFormData) => {
    onSubmit(data)
    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmitClick = () => {
    if (formRef.current) {
      formRef.current.requestSubmit()
    }
  }

  return (
    <CustomDialog
      open={open}
      onClose={handleClose}
      title="Create API Key"
      maxWidth="sm"
      footer={
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" disabled={isLoading} onClick={handleSubmitClick}>
            Create
          </Button>
        </Stack>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit(handleFormSubmit)}>
        <Controller
          name="key_name"
          control={control}
          rules={{
            required: 'Key name is required',
            minLength: {
              value: 2,
              message: 'Key name must be at least 2 characters',
            },
          }}
          render={({ field }) => (
            <CustomInput
              {...field}
              label="Key Name"
              placeholder="e.g., Production API Key"
              required
              helperText={errors.key_name?.message}
              error={!!errors.key_name}
            />
          )}
        />
      </form>
    </CustomDialog>
  )
}
