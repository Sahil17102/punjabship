import { Box, Button, FormControl, FormControlLabel, FormLabel, Stack, Switch } from '@mui/material'
import React, { useRef } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { WebhookSubscription } from '../../../api/apiIntegration'
import CustomInput from '../../../components/UI/inputs/CustomInput'
import CustomDialog from '../../../components/UI/modal/CustomModal'

const WEBHOOK_EVENTS = [
  'order.created',
  'order.updated',
  'order.shipped',
  'order.delivered',
  'order.failed',
  'order.rto',
  'order.cancelled',
  'order.return_created',
  'order.ndr',
  'shipment.label_generated',
  'shipment.manifest_generated',
  'tracking.updated',
]

interface WebhookFormData {
  url: string
  name: string
  events: string[]
  is_active: boolean
}

interface WebhookFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: WebhookFormData) => void
  editingItem: WebhookSubscription | null
  isLoading: boolean
}

export const WebhookFormModal = ({
  open,
  onClose,
  onSubmit,
  editingItem,
  isLoading,
}: WebhookFormModalProps) => {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WebhookFormData>({
    defaultValues: {
      url: '',
      name: '',
      events: [],
      is_active: true,
    },
  })

  const handleFormSubmit = (data: WebhookFormData) => {
    onSubmit(data)
    reset()
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  // Reset form when editingItem changes
  React.useEffect(() => {
    if (editingItem) {
      reset({
        url: editingItem.url,
        name: editingItem.name || '',
        events: editingItem.events || [],
        is_active: editingItem.is_active,
      })
    } else {
      reset({
        url: '',
        name: '',
        events: [],
        is_active: true,
      })
    }
  }, [editingItem, reset])

  const toggleEvent = (
    event: string,
    currentEvents: string[],
    onChange: (events: string[]) => void,
  ) => {
    const newEvents = currentEvents.includes(event)
      ? currentEvents.filter((e) => e !== event)
      : [...currentEvents, event]
    onChange(newEvents)
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
      title={editingItem ? 'Edit Webhook Subscription' : 'Create Webhook Subscription'}
      footer={
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" disabled={isLoading} onClick={handleSubmitClick}>
            {editingItem ? 'Update' : 'Create'}
          </Button>
        </Stack>
      }
    >
      <form ref={formRef} onSubmit={handleSubmit(handleFormSubmit)}>
        <Stack spacing={3}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <CustomInput
                {...field}
                label="Name (optional)"
                placeholder="e.g., Production Webhooks"
              />
            )}
          />

          <Controller
            name="url"
            control={control}
            rules={{
              required: 'Webhook URL is required',
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Please enter a valid URL',
              },
            }}
            render={({ field }) => (
              <CustomInput
                {...field}
                label="Webhook URL"
                placeholder="https://your-app.com/webhooks"
                type="url"
                required
                helperText={errors.url?.message}
                error={!!errors.url}
              />
            )}
          />

          <FormControl fullWidth required error={!!errors.events}>
            <FormLabel>Events to Subscribe</FormLabel>
            <Controller
              name="events"
              control={control}
              rules={{
                validate: (value) => value.length > 0 || 'At least one event must be selected',
              }}
              render={({ field: { onChange, value } }) => (
                <>
                  <Box
                    sx={{
                      border: '1px solid',
                      borderColor: errors.events ? 'error.main' : 'divider',
                      borderRadius: 1,
                      p: 2,
                      maxHeight: 200,
                      overflowY: 'auto',
                    }}
                  >
                    <Stack spacing={1}>
                      {WEBHOOK_EVENTS.map((event) => (
                        <FormControlLabel
                          key={event}
                          control={
                            <Switch
                              checked={value.includes(event)}
                              onChange={() => toggleEvent(event, value, onChange)}
                              size="small"
                            />
                          }
                          label={event}
                        />
                      ))}
                    </Stack>
                  </Box>
                  {errors.events && (
                    <Box
                      component="span"
                      sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}
                    >
                      {errors.events.message}
                    </Box>
                  )}
                </>
              )}
            />
          </FormControl>

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={field.onChange} />}
                label="Active"
              />
            )}
          />
        </Stack>
      </form>
    </CustomDialog>
  )
}
