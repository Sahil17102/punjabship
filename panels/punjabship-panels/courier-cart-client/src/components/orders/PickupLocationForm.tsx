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
import { useCallback, useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import { BiCheckCircle } from 'react-icons/bi'
import { usePickupAddresses } from '../../hooks/Pickup/usePickupAddresses'
import { getDefaultPickupSlot } from '../../utils/pickupSchedule'
import type { HydratedPickup } from '../../types/generic.types'
import AddPickupAddressForm from '../pickups/AddPickupAddressForm'
import CustomDrawer from '../UI/drawer/CustomDrawer'
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
  const [addLocationOpen, setAddLocationOpen] = useState(false)

  const pickupDate = watch('pickupDate') as string | undefined
  const pickupTime = watch('pickupTime') as string | undefined
  const selectedPickupLocationId = watch('pickupLocationId') as string | undefined

  const toggleRto = (id: string) => {
    setOpenRto((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const primaryLocation = locations?.pickupAddresses?.find((l) => l.isPrimary)
  const alternateLocations = locations?.pickupAddresses?.filter((location) => !location.isPrimary) ?? []

  const applyLocation = useCallback((location: HydratedPickup) => {
    setValue('pickupLocationId', location.pickupId)
    setValue('pickupLocationPincode', location.pickup?.pincode)
    setValue('pickupLocationName', location.pickup?.addressNickname)
    setValue('pickupLocationPOCName', location.pickup?.contactName)
    setValue('pickupLocationPOCPhone', location.pickup?.contactPhone)
    setValue('pickupAddress', location.pickup?.addressLine1)
    setValue('pickupCity', location.pickup?.city)
    setValue('pickupState', location.pickup?.state)

    if (location.isRTOSame) {
      setValue('isRtoSame', true)
      setValue('rtoLocationPincode', location.pickup?.pincode)
      setValue('rtoLocationName', location.pickup?.addressNickname)
      setValue('rtoLocationPOCName', location.pickup?.contactName)
      setValue('rtoLocationPOCPhone', location.pickup?.contactPhone)
      setValue('rtoAddress', location.pickup?.addressLine1)
      setValue('rtoCity', location.pickup?.city)
      setValue('rtoState', location.pickup?.state)
    } else if (location.rto) {
      setValue('isRtoSame', false)
      setValue('rtoLocationPincode', location.rto.pincode)
      setValue('rtoLocationName', location.rto.addressNickname)
      setValue('rtoLocationPOCName', location.rto.contactName)
      setValue('rtoLocationPOCPhone', location.rto.contactPhone)
      setValue('rtoAddress', location.rto.addressLine1)
      setValue('rtoCity', location.rto.city)
      setValue('rtoState', location.rto.state)
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
  }, [setValue])

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
    if (useWarehouse && primaryLocation && !selectedPickupLocationId) {
      applyLocation(primaryLocation)
    }
  }, [applyLocation, primaryLocation, selectedPickupLocationId, useWarehouse])

  if (isLoading) return <Typography>Loading pickup locations...</Typography>
  if (isError) return <Typography color="error">Failed to load pickup locations</Typography>
  if (!locations?.pickupAddresses || locations.pickupAddresses.length === 0)
    return <Typography>No pickup locations found</Typography>

  return (
    <>
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
                  if (primaryLocation) applyLocation(primaryLocation)
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
                onClick={() => {
                  setUseWarehouse(false)
                  if (field.value === primaryLocation?.pickupId) field.onChange('')
                }}
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
                    onChange={() => {
                      setUseWarehouse(false)
                      if (field.value === primaryLocation?.pickupId) field.onChange('')
                    }}
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
              <Grid size={12}>
                <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  <Stack spacing={0.2}>
                    <Typography fontWeight={700}>Choose another pickup location</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Select a saved location or add a new pickup address.
                    </Typography>
                  </Stack>
                  <Button
                    variant="contained"
                    onClick={() => setAddLocationOpen(true)}
                    sx={{ textTransform: 'none', alignSelf: { xs: 'stretch', sm: 'center' } }}
                  >
                    + Add new location
                  </Button>
                </Stack>
              </Grid>

              {alternateLocations.length === 0 && (
                <Grid size={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: compact ? 1.25 : 2,
                      textAlign: 'center',
                      borderStyle: 'dashed',
                      borderColor: alpha(ACCENT, 0.35),
                    }}
                  >
                    <Typography fontWeight={700}>No other pickup location added yet</Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.4}>
                      Add a location once, then select it here for this order.
                    </Typography>
                  </Paper>
                </Grid>
              )}

              {alternateLocations.map((loc) => {
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
      <CustomDrawer
        width={980}
        open={addLocationOpen}
        onClose={() => setAddLocationOpen(false)}
        title="Add pickup location"
      >
        <AddPickupAddressForm
          setDrawer={setAddLocationOpen}
          onSaved={(address) => {
            setUseWarehouse(false)
            applyLocation(address)
          }}
        />
      </CustomDrawer>
    </>
  )
}

export default PickupLocationForm
