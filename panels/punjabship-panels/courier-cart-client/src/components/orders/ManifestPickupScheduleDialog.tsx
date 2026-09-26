import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from '@mui/material'
import CustomInput from '../UI/inputs/CustomInput'

type ManifestPickupScheduleDialogProps = {
  open: boolean
  title: string
  description?: string
  pickupDate: string
  pickupTime: string
  pickupLocation: string
  expectedPackageCount: number
  minDate?: string
  onPickupDateChange: (value: string) => void
  onPickupTimeChange: (value: string) => void
  onPickupLocationChange: (value: string) => void
  onExpectedPackageCountChange: (value: number) => void
  onCancel: () => void
  onConfirm: () => void
}

export default function ManifestPickupScheduleDialog({
  open,
  title,
  description,
  pickupDate,
  pickupTime,
  pickupLocation,
  expectedPackageCount,
  minDate,
  onPickupDateChange,
  onPickupTimeChange,
  onPickupLocationChange,
  onExpectedPackageCountChange,
  onCancel,
  onConfirm,
}: ManifestPickupScheduleDialogProps) {
  const now = new Date()
  const selectedDateTime =
    pickupDate && pickupTime ? new Date(`${pickupDate}T${pickupTime}:00`) : null
  const minimumAllowed = new Date(now.getTime() + 15 * 60 * 1000)

  let validationMessage = ''
  if (!pickupDate || !pickupTime) {
    validationMessage = 'Pickup date and time are required.'
  } else if (!pickupLocation.trim()) {
    validationMessage = 'Pickup location is required.'
  } else if (!Number.isFinite(expectedPackageCount) || expectedPackageCount < 1) {
    validationMessage = 'Expected package count must be at least 1.'
  } else if (!selectedDateTime || Number.isNaN(selectedDateTime.getTime())) {
    validationMessage = 'Enter a valid pickup date and time.'
  } else if (selectedDateTime.getTime() < minimumAllowed.getTime()) {
    validationMessage = 'Pickup date/time cannot be in the past. Please choose at least 15 minutes from now.'
  }

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack gap={2} mt={1}>
          <Typography variant="body2" color="text.secondary">
            {description ||
              'Confirm a valid future pickup slot before generating the Delhivery manifest.'}
          </Typography>
          <CustomInput
            label="Pickup Date"
            type="date"
            value={pickupDate}
            onChange={(e) => onPickupDateChange((e.target as HTMLInputElement).value)}
            inputProps={minDate ? { min: minDate } : undefined}
            error={Boolean(validationMessage) && Boolean(pickupDate)}
          />
          <CustomInput
            label="Pickup Time"
            type="time"
            value={pickupTime}
            onChange={(e) => onPickupTimeChange((e.target as HTMLInputElement).value)}
            error={Boolean(validationMessage) && Boolean(pickupTime)}
          />
          <CustomInput
            label="Pickup Location"
            value={pickupLocation}
            onChange={(e) => onPickupLocationChange((e.target as HTMLInputElement).value)}
            error={Boolean(validationMessage) && Boolean(pickupLocation)}
            helperText="Must exactly match the registered Delhivery warehouse name."
          />
          <CustomInput
            label="Expected Package Count"
            type="number"
            value={expectedPackageCount}
            onChange={(e) =>
              onExpectedPackageCountChange(Number((e.target as HTMLInputElement).value))
            }
            inputProps={{ min: 1, step: 1 }}
            error={Boolean(validationMessage) && Boolean(expectedPackageCount)}
          />
          {validationMessage ? (
            <Typography variant="caption" color="error">
              {validationMessage}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" onClick={onConfirm} disabled={Boolean(validationMessage)}>
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  )
}
