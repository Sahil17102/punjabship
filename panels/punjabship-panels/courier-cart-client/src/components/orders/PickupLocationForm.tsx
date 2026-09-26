import {
  alpha,
  Button,
  Chip,
  Collapse,
  Divider,
  Grid,
  Paper,
  Radio,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BiCheckCircle } from 'react-icons/bi'
import { usePickupAddresses } from '../../hooks/Pickup/usePickupAddresses'
import { getDefaultPickupSlot } from '../../utils/pickupSchedule'
import type { B2BFormData } from './b2b/B2BOrderForm'
import type { B2CFormData } from './b2c/B2COrderForm'

const ACCENT = '#0877C9'
const TEXT_PRIMARY = '#17171A'
const TEXT_MUTED = '#496189'

const PickupLocationForm = ({ compact = false }: { compact?: boolean }) => {
  const { control, setValue, watch } = useFormContext<B2BFormData | B2CFormData>()
  const {
    data: locations,
    isLoading,
    isError,
  } = usePickupAddresses({ isPickupEnabled: 'active' as unknown as boolean })

  const [openRto, setOpenRto] = useState<Record<string, boolean>>({})
  const [useWarehouse, setUseWarehouse] = useState(true)

  const pickupDate = watch('pickupDate') as string | undefined
  const pickupTime = watch('pickupTime') as string | undefined

  const toggleRto = (id: string) => {
    setOpenRto((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const primaryLocation = locations?.pickupAddresses?.find((l) => l.isPrimary)

  useEffect(() => {
    const defaultPickupSlot = getDefaultPickupSlot()
    if (!pickupDate) {
      setValue('pickupDate', defaultPickupSlot.pickupDate)
    }
    if (!pickupTime) {
      setValue('pickupTime', defaultPickupSlot.pickupTime)
    }
  }, [pickupDate, pickupTime, setValue])

  useEffect(() => {
    if (primaryLocation) {
      setValue('pickupLocationId', primaryLocation?.pickupId)
      setValue('pickupLocationPincode', primaryLocation.pickup?.pincode)
      setValue('pickupLocationName', primaryLocation.pickup?.addressNickname)
      setValue('pickupLocationPOCName', primaryLocation.pickup?.contactName)
      setValue('pickupLocationPOCPhone', primaryLocation.pickup?.contactPhone)
      setValue('pickupAddress', primaryLocation.pickup?.addressLine1)
      setValue('pickupCity', primaryLocation.pickup?.city)
      setValue('pickupState', primaryLocation.pickup?.state)

      if (primaryLocation?.isRTOSame) {
        setValue('isRtoSame', true)
        setValue('rtoLocationPincode', primaryLocation.pickup?.pincode)
        setValue('rtoLocationName', primaryLocation.pickup?.addressNickname)
        setValue('rtoLocationPOCName', primaryLocation.pickup?.contactName)
        setValue('rtoLocationPOCPhone', primaryLocation.pickup?.contactPhone)
        setValue('rtoAddress', primaryLocation.pickup?.addressLine1)
        setValue('rtoCity', primaryLocation.pickup?.city)
        setValue('rtoState', primaryLocation.pickup?.state)
      } else if (primaryLocation?.rto) {
        setValue('isRtoSame', false)
        setValue('rtoLocationPincode', primaryLocation?.rto?.pincode)
        setValue('rtoLocationName', primaryLocation.rto?.addressNickname)
        setValue('rtoLocationPOCName', primaryLocation?.rto?.contactName)
        setValue('rtoLocationPOCPhone', primaryLocation?.rto?.contactPhone)
        setValue('rtoAddress', primaryLocation?.rto?.addressLine1)
        setValue('rtoCity', primaryLocation?.rto?.city)
        setValue('rtoState', primaryLocation?.rto?.state)
      } else {
        setValue('isRtoSame', false)
        setValue('rtoLocationPincode', '')
        setValue('rtoLocationName', '')
        setValue('rtoLocationPOCName', '')
        setValue('rtoLocationPOCPhone', '')
        setValue('rtoAddress', '')
        setValue('rtoCity', '')
        setValue('rtoState', '')
      }
    }
  }, [primaryLocation, setValue])

  if (isLoading) return <Typography>Loading pickup locations...</Typography>
  if (isError) return <Typography color="error">Failed to load pickup locations</Typography>
  if (!locations?.pickupAddresses || locations.pickupAddresses.length === 0)
    return <Typography>No pickup locations found</Typography>

  return (
    <Controller
      name="pickupLocationId"
      control={control}
      rules={{ required: 'Please select a pickup location' }}
      render={({ field, fieldState }) => (
        <Stack gap={compact ? 0.55 : 1.25}>
          {/* Pickup Option Selection */}
          <Stack gap={compact ? 0.5 : 1}>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={compact ? 0.5 : 1} sx={{ width: '100%' }}>
              {/* Use Warehouse Option */}
              <Paper
                onClick={() => {
                  setUseWarehouse(true)
                  if (primaryLocation) {
                    field.onChange(primaryLocation.pickupId)
                    setValue('pickupLocationPincode', primaryLocation.pickup?.pincode)
                    setValue('pickupLocationName', primaryLocation.pickup?.addressNickname)
                    setValue('pickupLocationPOCName', primaryLocation.pickup?.contactName)
                    setValue('pickupLocationPOCPhone', primaryLocation.pickup?.contactPhone)
                    setValue('pickupAddress', primaryLocation.pickup?.addressLine1)
                    setValue('pickupCity', primaryLocation.pickup?.city)
                    setValue('pickupState', primaryLocation.pickup?.state)
                  }
                }}
                sx={{
                  flex: 1,
                  p: compact ? 0.65 : 1.25,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: useWarehouse ? `2px solid ${ACCENT}` : `1px solid ${alpha(ACCENT, 0.2)}`,
                  background: useWarehouse ? alpha(ACCENT, 0.04) : '#ffffff',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    borderColor: ACCENT,
                  },
                }}
              >
                <Stack direction="row" gap={compact ? 0.5 : 1} alignItems="center">
                  <Radio
                    checked={useWarehouse}
                    onChange={() => setUseWarehouse(true)}
                    size="small"
                    sx={{ p: compact ? 0.25 : 0.5 }}
                    disableRipple
                  />
                  <Stack spacing={0.1} flex={1}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: TEXT_PRIMARY, fontSize: compact ? '0.78rem' : undefined }}
                    >
                      Use my warehouse
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: TEXT_MUTED,
                        lineHeight: 1.2,
                        fontSize: compact ? '0.68rem' : undefined,
                      }}
                    >
                      Ship from your default pickup location
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>

              {/* Use Different Location Option */}
              <Paper
                onClick={() => setUseWarehouse(false)}
                sx={{
                  flex: 1,
                  p: compact ? 0.65 : 1.25,
                  borderRadius: 2,
                  cursor: 'pointer',
                  border: !useWarehouse ? `2px solid ${ACCENT}` : `1px solid ${alpha(ACCENT, 0.2)}`,
                  background: !useWarehouse ? alpha(ACCENT, 0.04) : '#ffffff',
                  transition: 'all 200ms ease',
                  '&:hover': {
                    borderColor: ACCENT,
                  },
                }}
              >
                <Stack direction="row" gap={compact ? 0.5 : 1} alignItems="center">
                  <Radio
                    checked={!useWarehouse}
                    onChange={() => setUseWarehouse(false)}
                    size="small"
                    sx={{ p: compact ? 0.25 : 0.5 }}
                    disableRipple
                  />
                  <Stack spacing={0.1} flex={1}>
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      sx={{ color: TEXT_PRIMARY, fontSize: compact ? '0.78rem' : undefined }}
                    >
                      Use different location
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: TEXT_MUTED,
                        lineHeight: 1.2,
                        fontSize: compact ? '0.68rem' : undefined,
                      }}
                    >
                      Enter a different pickup address
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Stack>

          {/* Primary Warehouse - Show when "Use my warehouse" selected */}
          {useWarehouse && primaryLocation && (
            <Paper
              sx={{
                p: compact ? 0.7 : 1.25,
                borderRadius: 2,
                border: `2px solid ${ACCENT}`,
                background: alpha(ACCENT, 0.04),
                mb: 0.5,
              }}
            >
              <Stack spacing={compact ? 0.35 : 0.8}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Stack>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ color: TEXT_PRIMARY, fontSize: compact ? '0.8rem' : undefined }}
                    >
                      {primaryLocation.pickup?.addressNickname}
                    </Typography>
                    <Chip
                      label="Primary Warehouse"
                      size="small"
                      variant="outlined"
                      sx={{
                        width: 'fit-content',
                        borderColor: alpha(ACCENT, 0.35),
                        color: ACCENT,
                        bgcolor: alpha(ACCENT, 0.03),
                        mt: compact ? 0.25 : 0.5,
                        height: compact ? 20 : undefined,
                      }}
                    />
                  </Stack>
                  <BiCheckCircle style={{ fontSize: compact ? 18 : 24, color: ACCENT }} />
                </Stack>
                <Typography
                  variant="body2"
                  sx={{
                    color: TEXT_MUTED,
                    fontSize: compact ? '0.74rem' : undefined,
                    lineHeight: compact ? 1.25 : undefined,
                  }}
                >
                  {primaryLocation.pickup?.addressLine1}
                  {primaryLocation.pickup?.addressLine2 &&
                    `, ${primaryLocation.pickup?.addressLine2}`}
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={compact ? 0.6 : 1.5}>
                  <Typography variant="caption" sx={{ color: TEXT_MUTED, fontSize: compact ? '0.68rem' : undefined }}>
                    📍 {primaryLocation.pickup?.city}, {primaryLocation.pickup?.state} -{' '}
                    {primaryLocation.pickup?.pincode}
                  </Typography>
                  <Typography variant="caption" sx={{ color: TEXT_MUTED, fontSize: compact ? '0.68rem' : undefined }}>
                    📞 {primaryLocation.pickup?.contactName} •{' '}
                    {primaryLocation.pickup?.contactPhone}
                  </Typography>
                </Stack>
              </Stack>
            </Paper>
          )}

          {/* All Locations - Show when "Use different location" selected */}
          {!useWarehouse && (
            <Grid container spacing={compact ? 0.9 : 1.25} mb={0.5}>
              {locations.pickupAddresses.map((loc) => {
                const isSelected = field.value === loc.pickupId
                const isOpen = openRto[loc.id] || false

                return (
                  <Grid
                    size={{ xs: 12, sm: compact ? 12 : 6, md: compact ? 12 : 4 }}
                    key={loc.id}
                    display="flex"
                  >
                    <Paper
                      onClick={() => {
                        field.onChange(loc?.pickupId)

                        // 🔹 Update pickup fields
                        setValue('pickupLocationPincode', loc?.pickup?.pincode)
                        setValue('pickupLocationName', loc?.pickup?.addressNickname)
                        setValue('pickupLocationPOCName', loc?.pickup?.contactName)
                        setValue('pickupLocationPOCPhone', loc?.pickup?.contactPhone)
                        setValue('pickupAddress', loc?.pickup?.addressLine1)
                        setValue('pickupCity', loc?.pickup?.city)
                        setValue('pickupState', loc?.pickup?.state)

                        // 🔹 Update RTO fields
                        if (loc?.isRTOSame) {
                          setValue('isRtoSame', true)
                          setValue('rtoLocationPincode', loc?.pickup?.pincode)
                          setValue('rtoLocationName', loc?.pickup?.addressNickname)
                          setValue('rtoLocationPOCName', loc?.pickup?.contactName)
                          setValue('rtoLocationPOCPhone', loc?.pickup?.contactPhone)
                          setValue('rtoAddress', loc?.pickup?.addressLine1)
                          setValue('rtoCity', loc?.pickup?.city)
                          setValue('rtoState', loc?.pickup?.state)
                        } else if (loc?.rto) {
                          setValue('isRtoSame', false)
                          setValue('rtoLocationPincode', loc?.rto?.pincode)
                          setValue('rtoLocationName', loc.rto?.addressNickname)
                          setValue('rtoLocationPOCName', loc?.rto?.contactName)
                          setValue('rtoLocationPOCPhone', loc?.rto?.contactPhone)
                          setValue('rtoAddress', loc?.rto?.addressLine1)
                          setValue('rtoCity', loc?.rto?.city)
                          setValue('rtoState', loc?.rto?.state)
                        } else {
                          setValue('isRtoSame', false)
                          setValue('rtoLocationPincode', '')
                          setValue('rtoLocationName', '')
                          setValue('rtoLocationPOCName', '')
                          setValue('rtoLocationPOCPhone', '')
                          setValue('rtoAddress', '')
                          setValue('rtoCity', '')
                          setValue('rtoState', '')
                        }
                      }}
                      sx={{
                        p: compact ? 1 : 1.4,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative',
                        cursor: 'pointer',
                        border: isSelected
                          ? `2px solid ${alpha(ACCENT, 0.55)}`
                          : `1px solid ${alpha(ACCENT, 0.2)}`,
                        borderRadius: 3,
                        bgcolor: isSelected ? alpha(ACCENT, 0.06) : '#ffffff',
                        transition: 'all 0.25s ease',
                      }}
                    >
                      {/* Pickup info */}
                      <Stack spacing={0.5} mb={1}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography
                            variant="subtitle1"
                            fontWeight="bold"
                            sx={{ color: TEXT_PRIMARY }}
                          >
                            {loc.pickup?.addressNickname}
                          </Typography>
                          {loc.isPrimary && (
                            <Chip
                              label="Primary"
                              size="small"
                              variant="outlined"
                              sx={{
                                borderColor: alpha(ACCENT, 0.35),
                                color: ACCENT,
                                bgcolor: alpha(ACCENT, 0.03),
                              }}
                            />
                          )}
                        </Stack>
                        <Typography variant="body2">{loc.pickup?.addressLine1}</Typography>
                        {loc.pickup?.addressLine2 && (
                          <Typography variant="body2">{loc.pickup?.addressLine2}</Typography>
                        )}
                        <Typography variant="body2">
                          {loc.pickup?.city}, {loc.pickup?.state} - {loc.pickup?.pincode}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {loc.pickup?.contactName} • {loc.pickup?.contactPhone}
                        </Typography>
                      </Stack>

                      {/* Divider */}
                      <Divider sx={{ my: 1 }} />

                      {/* RTO section */}
                      {loc.isRTOSame ? (
                        <Chip
                          label="RTO same as pickup"
                          size="small"
                          variant="outlined"
                          sx={{ borderColor: alpha(ACCENT, 0.32), color: ACCENT }}
                        />
                      ) : loc.rto ? (
                        <>
                          <Button
                            size="small"
                            variant="text"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleRto(loc.id)
                            }}
                            sx={{
                              alignSelf: 'flex-start',
                              textTransform: 'none',
                              fontSize: 13,
                              color: ACCENT,
                            }}
                          >
                            {isOpen ? 'Hide RTO details' : 'Show RTO details'}
                          </Button>
                          <Collapse in={isOpen} timeout="auto" unmountOnExit>
                            <Stack spacing={0.5} mt={1}>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {loc.rto?.addressNickname}
                              </Typography>
                              <Typography variant="body2">{loc.rto?.addressLine1}</Typography>
                              {loc.rto?.addressLine2 && (
                                <Typography variant="body2">{loc.rto?.addressLine2}</Typography>
                              )}
                              <Typography variant="body2">
                                {loc.rto?.city}, {loc.rto?.state} - {loc.rto?.pincode}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {loc.rto?.contactName} • {loc.rto?.contactPhone}
                              </Typography>
                            </Stack>
                          </Collapse>
                        </>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No RTO address set
                        </Typography>
                      )}

                      {isSelected && (
                        <BiCheckCircle
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            fontSize: 22,
                            color: ACCENT,
                          }}
                        />
                      )}
                    </Paper>
                  </Grid>
                )
              })}
            </Grid>
          )}

          {/* Pickup Date & Time */}
          <Grid container spacing={compact ? 0.55 : 1.25}>
            <Grid size={{ xs: 12, sm: compact ? 6 : 12, md: 6 }}>
              <Controller
                name="pickupDate"
                control={control}
                rules={{ required: 'Pickup date is required' }}
                render={({ field: dateField, fieldState: dateState }) => (
                  <TextField
                    {...dateField}
                    type="date"
                    label="Preferred Pickup Date"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    error={!!dateState.error}
                    helperText={dateState.error?.message}
                    sx={{
                      '& .MuiInputBase-input': { py: compact ? 0.55 : undefined, fontSize: compact ? '0.8rem' : undefined },
                      '& .MuiInputLabel-root': { fontSize: compact ? '0.76rem' : undefined },
                      '& .MuiFormHelperText-root': { mt: compact ? 0.25 : undefined },
                    }}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: compact ? 6 : 12, md: 6 }}>
              <Controller
                name="pickupTime"
                control={control}
                rules={{ required: 'Pickup time window is required' }}
                render={({ field: timeField, fieldState: timeState }) => (
                  <TextField
                    {...timeField}
                    type="time"
                    label="Preferred Pickup Time"
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    error={!!timeState.error}
                    helperText={timeState.error?.message ?? 'Use local warehouse timezone'}
                    sx={{
                      '& .MuiInputBase-input': { py: compact ? 0.55 : undefined, fontSize: compact ? '0.8rem' : undefined },
                      '& .MuiInputLabel-root': { fontSize: compact ? '0.76rem' : undefined },
                      '& .MuiFormHelperText-root': { mt: compact ? 0.25 : undefined },
                    }}
                  />
                )}
              />
            </Grid>
            {fieldState.error && (
              <Grid size={12}>
                <Typography color="error" fontSize={12}>
                  {fieldState.error.message}
                </Typography>
              </Grid>
            )}
          </Grid>
        </Stack>
      )}
    />
  )
}

export default PickupLocationForm
