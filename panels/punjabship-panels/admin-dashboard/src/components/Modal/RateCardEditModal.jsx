import {
  Badge,
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Select,
  SimpleGrid,
  Stack,
  Text,
} from '@chakra-ui/react'
import { useUpdateShippingRate } from 'hooks/useCouriers'
import { useEffect, useState } from 'react'
import CustomModal from './CustomModal'

const normalizeProvider = (value) => String(value || '').trim().toLowerCase()
const RATE_CARD_PROVIDER_ALLOWLIST = new Set(['delhivery', 'manual', 'velocity'])
const isCourierEnabled = (courier = {}) => courier.isEnabled !== false && courier.is_enabled !== false
const isRateCardAllowedCourier = (courier = {}) =>
  isCourierEnabled(courier) &&
  RATE_CARD_PROVIDER_ALLOWLIST.has(
    normalizeProvider(courier.serviceProvider || courier.service_provider || ''),
  )
const normalizeMode = (value) => {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  if (['air', 'a', 'express'].includes(raw)) return 'air'
  if (['surface', 's', 'ground'].includes(raw)) return 'surface'
  return raw
}
const makeCourierKey = (courierId, serviceProvider) =>
  `${courierId || ''}__${normalizeProvider(serviceProvider)}`

export const RateCardEditModal = ({
  isOpen,
  onClose,
  data,
  zones = [],
  onSave,
  businessType,
  planId,
  couriers = [], // 👈 pass from parent
  existingRates = [],
}) => {
  const { mutate: updateRate, isLoading } = useUpdateShippingRate()
  const [form, setForm] = useState({})
  const isB2C = businessType?.toLowerCase() === 'b2c'
  const hasValue = (value) => value !== undefined && value !== null && String(value).trim() !== ''

  const buildLegacySlabs = (zoneName, type, minWeight, ratesObj) => {
    const rate = ratesObj?.[zoneName]?.[type]
    if (rate === undefined || rate === null || rate === '') return []
    const parsedMinWeight = Number(minWeight)
    return [
      {
        weight_from: 0,
        weight_to: Number.isFinite(parsedMinWeight) && parsedMinWeight > 0 ? parsedMinWeight : '',
        rate,
      },
    ]
  }

  // Initialize form (new vs edit)
  useEffect(() => {
    const initialForm = {
      courier_name: data?.courier_name ?? '',
      courier_id: data?.courier_id ?? '',
      courier_key: makeCourierKey(
        data?.courier_id ?? '',
        data?.service_provider ?? data?.serviceProvider ?? '',
      ),
      min_weight: data?.min_weight ?? '',
      cod_charges: data?.cod_charges ?? '',
      cod_percent: data?.cod_percent ?? '',
      other_charges: data?.other_charges ?? '',
      mode: data?.mode ?? '',
      zone_slabs: {},
    }

    zones.forEach((zone) => {
      initialForm[zone.name] = {
        forward: data?.rates?.[zone.name]?.forward ?? '',
        rto: data?.rates?.[zone.name]?.rto ?? '',
      }
      initialForm.zone_slabs[zone.name] = {
        forward: data?.zone_slabs?.[zone.name]?.forward ?? [],
        rto: data?.zone_slabs?.[zone.name]?.rto ?? [],
      }
    })

    setForm(initialForm)
  }, [data, zones])

  const handleChange = (field, value, type = null) => {
    if (type && form[field]) {
      setForm((prev) => ({
        ...prev,
        [field]: { ...prev[field], [type]: value },
      }))
    } else {
      setForm((prev) => ({ ...prev, [field]: value }))
    }
  }

  const handleSlabChange = (zoneName, type, index, field, value) => {
    setForm((prev) => {
      const next = { ...prev, zone_slabs: { ...(prev.zone_slabs || {}) } }
      const zoneEntry = { ...(next.zone_slabs?.[zoneName] || {}) }
      const slabList = [...(zoneEntry[type] || [])]
      slabList[index] = { ...(slabList[index] || {}), [field]: value }
      zoneEntry[type] = slabList
      next.zone_slabs[zoneName] = zoneEntry
      return next
    })
  }

  const addSlab = (zoneName, type) => {
    setForm((prev) => {
      const next = { ...prev, zone_slabs: { ...(prev.zone_slabs || {}) } }
      const zoneEntry = { ...(next.zone_slabs?.[zoneName] || {}) }
      const slabList = [...(zoneEntry[type] || [])]
      slabList.push({
        weight_from: '',
        weight_to: '',
        rate: '',
        extra_rate: '',
        extra_weight_unit: '',
      })
      zoneEntry[type] = slabList
      next.zone_slabs[zoneName] = zoneEntry
      return next
    })
  }

  const removeSlab = (zoneName, type, index) => {
    setForm((prev) => {
      const next = { ...prev, zone_slabs: { ...(prev.zone_slabs || {}) } }
      const zoneEntry = { ...(next.zone_slabs?.[zoneName] || {}) }
      zoneEntry[type] = (zoneEntry[type] || []).filter((_, slabIndex) => slabIndex !== index)
      next.zone_slabs[zoneName] = zoneEntry
      return next
    })
  }

  const handleSave = () => {
    const hasZoneRate = zones.some((zone) => {
      if (isB2C) {
        return ['forward', 'rto'].some((type) =>
          (form.zone_slabs?.[zone.name]?.[type] || []).some((slab) => hasValue(slab.rate)),
        )
      }

      return hasValue(form[zone.name]?.forward) || hasValue(form[zone.name]?.rto)
    })

    if (!hasZoneRate) {
      alert('Add at least one zone rate or B2C slab before saving a rate card.')
      return
    }

    // Build rates per zone
    const rates = {}
    zones.forEach((zone) => {
      if (isB2C) {
        const forwardSlabs = form.zone_slabs?.[zone.name]?.forward || []
        const rtoSlabs = form.zone_slabs?.[zone.name]?.rto || []
        rates[zone.name] = {
          forward: forwardSlabs[0]?.rate ?? '',
          rto: rtoSlabs[0]?.rate ?? '',
        }
      } else {
        rates[zone.name] = { ...form[zone.name] }
      }
    })

    const selectedCourier = availableCouriers.find(
      (c) =>
        makeCourierKey(c?.id?.toString(), c?.serviceProvider || c?.service_provider || '') ===
        (form.courier_key ||
          makeCourierKey(
            form.courier_id || data?.courier_id,
            data?.service_provider || data?.serviceProvider || '',
          )),
    )

    // Always get service_provider from selectedCourier if available, otherwise from data
    const serviceProviderValue =
      selectedCourier?.serviceProvider ||
      selectedCourier?.service_provider ||
      data?.service_provider ||
      data?.serviceProvider ||
      ''

    const payload = {
      min_weight: isB2C ? undefined : form.min_weight,
      cod_charges: form.cod_charges,
      cod_percent: form.cod_percent,
      other_charges: form.other_charges,
      mode: normalizeProvider(serviceProviderValue) === 'manual' ? 'standard' : form.mode,
      previous_mode: data?.mode,
      courier_id: form.courier_id || data?.courier_id, // from form (create) or existing (edit)
      courier_name: form.courier_name || data?.courier_name,
      service_provider: serviceProviderValue, // Always send the service_provider
      previous_service_provider: data?.service_provider || data?.serviceProvider,
      rates,
      zone_slabs: isB2C ? form.zone_slabs : undefined,
      businessType,
    }

    if (onSave) onSave(payload)

    // Validate planId before making the request
    // Ensure planId is a valid string or number, not a boolean or empty string
    let validPlanId = null

    // Check if planId prop is valid (string or number, not boolean, not empty string)
    if (
      planId !== null &&
      planId !== undefined &&
      planId !== '' &&
      planId !== true &&
      planId !== false &&
      (typeof planId === 'string' || typeof planId === 'number')
    ) {
      validPlanId = planId
    } else if (
      data?.plan_id !== null &&
      data?.plan_id !== undefined &&
      data?.plan_id !== '' &&
      data?.plan_id !== true &&
      data?.plan_id !== false &&
      (typeof data.plan_id === 'string' || typeof data.plan_id === 'number')
    ) {
      validPlanId = data.plan_id
    }

    if (!validPlanId) {
      console.error('planId is required but not provided', {
        planId,
        planIdType: typeof planId,
        planIdValue: planId,
        dataPlanId: data?.plan_id,
        dataPlanIdType: typeof data?.plan_id,
        dataPlanIdValue: data?.plan_id,
        data,
      })
      alert('Plan ID is missing. Please select a plan first.')
      return
    }

    // Final safety check: ensure validPlanId is not a boolean
    if (validPlanId === true || validPlanId === false) {
      console.error('Invalid planId: boolean value detected', { validPlanId, planId, data })
      alert('Invalid Plan ID. Please select a plan first.')
      return
    }

    // Ensure planId is converted to string for the API
    const planIdString = String(validPlanId)

    // Final validation: ensure the string is not "true" or "false"
    if (planIdString === 'true' || planIdString === 'false') {
      console.error('Invalid planId: string "true" or "false" detected', {
        planIdString,
        planId,
        data,
      })
      alert('Invalid Plan ID. Please select a plan first.')
      return
    }

    updateRate(
      {
        id: (data?.courier_id ?? payload?.courier_id) || undefined, // pass id only in edit mode
        updates: payload,
        planId: planIdString,
      },
      {
        onSuccess: onClose,
        onError: (error) => {
          console.error('Failed to update shipping rate:', error)
        },
      },
    )
  }

  const isEdit = !!data

  // Filter out couriers that already have rates (based on courier_id + service_provider combination)
  // Create a set of existing combinations for quick lookup
  const existingCombinations = new Set(
    existingRates.map((r) => {
      const courierId = r.courier_id?.toString()
      const serviceProvider = normalizeProvider(r.service_provider || r.serviceProvider || '')
      const mode = normalizeMode(r.mode || '')
      return `${courierId}_${serviceProvider}_${mode}`
    }),
  )

  const rateCardCouriers = couriers.filter(isRateCardAllowedCourier)

  const availableCouriers = isEdit
    ? rateCardCouriers
    : rateCardCouriers.filter((c) => {
        if (isB2C) return true
        const courierId = c?.id?.toString()
        const serviceProvider = normalizeProvider(c?.serviceProvider || c?.service_provider || '')
        const combination = `${courierId}_${serviceProvider}_`
        return !existingCombinations.has(combination)
      })

  // Get selected courier info for display
  const selectedCourier = availableCouriers.find(
    (c) =>
      makeCourierKey(c?.id?.toString(), c?.serviceProvider || c?.service_provider || '') ===
      (form.courier_key ||
        makeCourierKey(
          form.courier_id || data?.courier_id,
          data?.service_provider || data?.serviceProvider || '',
        )),
  )
  const displayCourierName = form.courier_name || data?.courier_name || ''
  const displayServiceProvider =
    selectedCourier?.serviceProvider ||
    selectedCourier?.service_provider ||
    data?.service_provider ||
    data?.serviceProvider ||
    ''

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${isEdit ? 'Edit' : 'Add'} Rates`}
      width="min(1400px, 96vw)"
      footer={
        <Stack direction="row" gap={5}>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="green" variant="solid" onClick={handleSave} isLoading={isLoading}>
            {isEdit ? 'Save' : 'Add'}
          </Button>
        </Stack>
      }
    >
      {/* Display Selected Courier & Service Provider Info */}
      {(displayCourierName || isEdit) && (
        <Box
          mb={4}
          p={4}
          bg={isEdit ? 'purple.50' : 'blue.50'}
          borderRadius="md"
          border="1px solid"
          borderColor={isEdit ? 'purple.200' : 'blue.200'}
        >
          <Text fontWeight="bold" fontSize="md" mb={2} color={isEdit ? 'purple.700' : 'blue.700'}>
            {isEdit ? 'Current Rate Information' : 'Selected Courier Information'}
          </Text>
          <Stack spacing={2}>
            <Flex align="center" gap={2}>
              <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                Courier Name:
              </Text>
              <Badge colorScheme="blue" fontSize="sm" px={2} py={1}>
                {displayCourierName || 'Not selected'}
              </Badge>
            </Flex>
            <Flex align="center" gap={2}>
              <Text fontWeight="semibold" fontSize="sm" color="gray.700">
                Service Provider:
              </Text>
              <Badge colorScheme="green" fontSize="sm" px={2} py={1}>
                {displayServiceProvider || 'Not selected'}
              </Badge>
            </Flex>
          </Stack>
        </Box>
      )}

      {/* Courier Selector (Add Mode) */}
      {!isEdit && (
        <Box mb={6}>
          <FormControl isRequired>
            <FormLabel>Select Courier</FormLabel>
            <Select
              placeholder="Select a courier..."
              value={form.courier_key}
              onChange={(e) => {
                const courierKey = e.target.value
                const selectedCourier = rateCardCouriers.find(
                  (c) =>
                    makeCourierKey(c.id?.toString(), c.serviceProvider || c.service_provider || '') ===
                    courierKey,
                )
                const courierId = selectedCourier?.id?.toString() || ''
                const courierName = selectedCourier?.name || ''
                handleChange('courier_key', courierKey)
                handleChange('courier_id', courierId)
                handleChange('courier_name', courierName)
                // service_provider will be set from selectedCourier in handleSave
              }}
            >
              {availableCouriers.map((c) => (
                <option
                  key={makeCourierKey(c.id, c.serviceProvider || c.service_provider || '')}
                  value={makeCourierKey(c.id, c.serviceProvider || c.service_provider || '')}
                >
                  {c.name} {c.serviceProvider ? `(${c.serviceProvider})` : ''}
                </option>
              ))}
            </Select>
            <Text fontSize="xs" color="gray.500" mt={1}>
              Select the courier for which you want to add rates. Service provider will be
              automatically assigned.
            </Text>
          </FormControl>
        </Box>
      )}

      {/* Global fields */}
      <Box mb={6}>
        <Text fontWeight="bold" mb={2}>
          Courier Info
        </Text>
        <SimpleGrid columns={2} spacing={4}>
          {normalizeProvider(displayServiceProvider) !== 'manual' && (
            <FormControl>
              <FormLabel>Mode</FormLabel>
              <Input value={form.mode} onChange={(e) => handleChange('mode', e.target.value)} />
            </FormControl>
          )}
          {!isB2C && (
            <FormControl>
              <FormLabel>Min Weight (kg)</FormLabel>
              <Input
                type="number"
                value={form.min_weight}
                onChange={(e) => handleChange('min_weight', e.target.value)}
              />
            </FormControl>
          )}
          <FormControl>
            <FormLabel>COD Charges</FormLabel>
            <Input
              type="number"
              value={form.cod_charges}
              onChange={(e) => handleChange('cod_charges', e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>COD Percent</FormLabel>
            <Input
              type="number"
              value={form.cod_percent}
              onChange={(e) => handleChange('cod_percent', e.target.value)}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Other Charges</FormLabel>
            <Input
              type="number"
              value={form.other_charges}
              onChange={(e) => handleChange('other_charges', e.target.value)}
            />
          </FormControl>
        </SimpleGrid>
      </Box>

      <Divider mb={4} />

      {isB2C && (
        <Box
          mb={5}
          p={4}
          bg="orange.50"
          borderRadius="md"
          border="1px solid"
          borderColor="orange.200"
        >
          <Text fontWeight="bold" color="orange.800" mb={2}>
            How Slab Pricing Works
          </Text>
          <Stack spacing={1} fontSize="sm" color="orange.900">
            <Text>1. Add slabs in increasing order of weight.</Text>
            <Text>2. Slabs can have gaps, but overlapping slabs are not allowed.</Text>
            <Text>3. If order weight falls in a gap, this courier will not appear.</Text>
            <Text>
              4. If order weight goes above the last slab, extra charges are added using Extra Rate
              and Extra Unit of that last slab.
            </Text>
            <Text>5. Courier name shown to user will use that matched slab&apos;s max weight.</Text>
          </Stack>
        </Box>
      )}

      {/* Zone-wise grouped inputs */}
      <Stack spacing={4}>
        {zones.map((zone) => (
          <Box key={zone.code} p={3} border="1px solid" borderColor="gray.200" borderRadius="md">
            <Text fontWeight="bold" mb={2}>
              {zone.name}
            </Text>
            {isB2C ? (
              <Stack spacing={4}>
                {['forward', 'rto'].map((type) => (
                  <Box key={type} p={3} bg="gray.50" borderRadius="md">
                    <Flex align="center" justify="space-between" mb={3}>
                      <Box>
                        <Text fontWeight="semibold" textTransform="uppercase">
                          {type}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          Example: `0-0.5`, `0.5-2`, `5-10`
                        </Text>
                      </Box>
                      <Button size="xs" onClick={() => addSlab(zone.name, type)}>
                        Add Slab
                      </Button>
                    </Flex>
                    <Stack spacing={3}>
                      {(form.zone_slabs?.[zone.name]?.[type] || []).map((slab, index, slabList) => {
                        const isLastSlab = index === slabList.length - 1
                        return (
                        <SimpleGrid
                          key={`${zone.name}-${type}-${index}`}
                          columns={{ base: 1, md: 2, xl: 6 }}
                          spacing={3}
                        >
                          <FormControl>
                            <FormLabel>From Weight (kg)</FormLabel>
                            <Input
                              type="number"
                              value={slab.weight_from ?? ''}
                              onChange={(e) =>
                                handleSlabChange(zone.name, type, index, 'weight_from', e.target.value)
                              }
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>To Weight (kg)</FormLabel>
                            <Input
                              type="number"
                              value={slab.weight_to ?? ''}
                              onChange={(e) =>
                                handleSlabChange(zone.name, type, index, 'weight_to', e.target.value)
                              }
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Base Rate</FormLabel>
                            <Input
                              type="number"
                              value={slab.rate ?? ''}
                              onChange={(e) =>
                                handleSlabChange(zone.name, type, index, 'rate', e.target.value)
                              }
                            />
                          </FormControl>
                          <FormControl>
                            <FormLabel>Above Last Slab Charge</FormLabel>
                            <Input
                              type="number"
                              value={slab.extra_rate ?? ''}
                              isDisabled={!isLastSlab}
                              onChange={(e) =>
                                handleSlabChange(zone.name, type, index, 'extra_rate', e.target.value)
                              }
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {isLastSlab
                                ? 'Optional. Leave blank or 0 for a flat base rate.'
                                : 'Available only on the final slab.'}
                            </Text>
                          </FormControl>
                          <FormControl>
                            <FormLabel>Per Extra Weight (kg)</FormLabel>
                            <Input
                              type="number"
                              value={slab.extra_weight_unit ?? ''}
                              isDisabled={!isLastSlab}
                              onChange={(e) =>
                                handleSlabChange(
                                  zone.name,
                                  type,
                                  index,
                                  'extra_weight_unit',
                                  e.target.value,
                                )
                              }
                            />
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {isLastSlab
                                ? 'Required only when the extra charge is greater than 0.'
                                : 'Non-final slabs do not use extra weight pricing.'}
                            </Text>
                          </FormControl>
                          <FormControl>
                            <FormLabel>&nbsp;</FormLabel>
                            <Button
                              colorScheme="red"
                              variant="outline"
                              onClick={() => removeSlab(zone.name, type, index)}
                            >
                              Remove
                            </Button>
                          </FormControl>
                        </SimpleGrid>
                      )})}
                      {(!form.zone_slabs?.[zone.name]?.[type] ||
                        form.zone_slabs?.[zone.name]?.[type]?.length === 0) && (
                        <Text fontSize="sm" color="gray.500">
                          No slabs added.
                        </Text>
                      )}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            ) : (
              <SimpleGrid columns={2} spacing={4}>
                <FormControl>
                  <FormLabel>Forward</FormLabel>
                  <Input
                    type="number"
                    value={form[zone.name]?.forward ?? ''}
                    onChange={(e) => handleChange(zone.name, e.target.value, 'forward')}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>RTO</FormLabel>
                  <Input
                    type="number"
                    value={form[zone.name]?.rto ?? ''}
                    onChange={(e) => handleChange(zone.name, e.target.value, 'rto')}
                  />
                </FormControl>
              </SimpleGrid>
            )}
          </Box>
        ))}
      </Stack>
    </CustomModal>
  )
}
