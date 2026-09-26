import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  Select,
  Stack,
  Tab,
  TabList,
  Tabs,
  Tag,
  Text,
  useToast,
} from '@chakra-ui/react'
import { IconUpload } from '@tabler/icons-react'
import Papa from 'papaparse'
import { useEffect, useMemo, useState } from 'react'

import CustomModal from 'components/Modal/CustomModal'
import { RateCardEditModal } from 'components/Modal/RateCardEditModal'
import FileUploader from 'components/upload/FileUploader'
import ZoneRateMatrix from 'views/B2B/ZoneRateMatrix'
import { RateCardTable } from './RateCardTable'

import { AddIcon } from '@chakra-ui/icons'
import { useQuery } from '@tanstack/react-query'
import { useImportShippingRates, useShippingRates } from 'hooks/useCouriers'
import { useZones } from 'hooks/useZones'
import { fetchAllCouriersList } from 'services/courier.service'
import { PlansService } from 'services/plan.service'

const normalizeProvider = (value) => String(value || '').trim().toLowerCase()
const RATE_CARD_PROVIDER_ALLOWLIST = new Set(['delhivery', 'manual', 'velocity'])
const isCourierEnabled = (courier = {}) => courier.isEnabled !== false && courier.is_enabled !== false
const isRateCardAllowedCourier = (courier = {}) =>
  isCourierEnabled(courier) &&
  RATE_CARD_PROVIDER_ALLOWLIST.has(
    normalizeProvider(courier.serviceProvider || courier.service_provider || ''),
  )
const makeCourierKey = (courierId, serviceProvider) =>
  `${courierId || ''}__${normalizeProvider(serviceProvider)}`

const normalizeMode = (value) => {
  const raw = String(value || '').trim().toLowerCase()
  if (!raw) return ''
  if (['air', 'a', 'express'].includes(raw)) return 'air'
  if (['surface', 's', 'ground'].includes(raw)) return 'surface'
  return raw
}

const findMatchingRateRow = (existingRows = [], courier = {}, businessType = '', planId = '') =>
  existingRows.find(
    (row) =>
      row.business_type === businessType &&
      (!planId || row.plan_id === planId) &&
      Number(row.courier_id) === Number(courier.id) &&
      normalizeProvider(row.service_provider || row.serviceProvider || '') ===
        normalizeProvider(courier.serviceProvider || courier.service_provider || '') &&
      normalizeMode(row.mode || '') === normalizeMode(courier.mode || ''),
  ) || null

// Default slab weights used in the B2C sample template
const DEFAULT_B2C_SLABS = [
  { label: '250 GM', weight: 0.25 },
  { label: '500 GM', weight: 0.5 },
  { label: '1 KG', weight: 1.0 },
  { label: '2 Kg', weight: 2.0 },
  { label: '5 Kg', weight: 5.0 },
  { label: '10 Kg', weight: 10.0 },
]

const weightLabel = (kg) => {
  if (kg < 1) return `${Math.round(kg * 1000)} GM`
  return `${kg} Kg`
}

const triggerDownload = (csv, filename) => {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// CSV exporter — slab-per-row format for B2C, flat for B2B
const downloadCSV = (
  allCouriers = [],
  allZones = [],
  existingData = [],
  filters = {},
  selectedCourier = null,
) => {
  if (!allCouriers?.length || !allZones?.length) return
  const type = filters?.businessType?.toLowerCase()

  if (type === 'b2c') {
    const couriers = selectedCourier
      ? [selectedCourier]
      : allCouriers.filter(isRateCardAllowedCourier)
    if (!couriers.length) return
    const headers = [
      'Slab', 'Courier ID', 'Courier', 'Service Provider', 'Mode', 'Weight (KG)', 'Slab Type',
      ...allZones.map((z) => z.name),
      'COD Rs', 'COD %', 'RTO %',
    ]

    const rows = []

    couriers.forEach((courier) => {
      const existing = findMatchingRateRow(existingData, courier, type, filters.planId) || {}
      const serviceProvider =
        courier.serviceProvider || courier.service_provider || existing.service_provider || ''
      const mode =
        normalizeProvider(serviceProvider) === 'manual'
          ? 'standard'
          : normalizeMode(courier.mode || existing.mode || '') || 'surface'

      // Derive RTO% from first zone slab pair
      let rtoPercent = ''
      const firstZone = allZones[0]
      const exFwd = existing.zone_slabs?.[firstZone?.name]?.forward || []
      const exRto = existing.zone_slabs?.[firstZone?.name]?.rto || []
      if (exFwd.length && exRto.length) {
        const fRate = Number(exFwd[0]?.rate || 0)
        const rRate = Number(exRto[0]?.rate || 0)
        if (fRate > 0) rtoPercent = String(Math.round((rRate / fRate) * 100))
      }

      // Build slab list from existing forward slabs or defaults
      const slabDefs = exFwd.length
        ? exFwd.map((s) => ({ label: weightLabel(Number(s.weight_to || s.weight_from || 0)), weight: Number(s.weight_to || s.weight_from || 0) }))
        : DEFAULT_B2C_SLABS

      const codRs = existing.cod_charges ?? '0'
      const codPct = existing.cod_percent ?? '0'

      for (let i = 0; i < slabDefs.length; i++) {
        const slab = slabDefs[i]
        const firstZoneRates = allZones.map((z) => {
          const slabs = existing.zone_slabs?.[z.name]?.forward || []
          return slabs[i]?.rate ?? ''
        })
        rows.push([slab.label, courier.id ?? '', courier.name ?? '', serviceProvider, mode, slab.weight, 'First', ...firstZoneRates, codRs, codPct, rtoPercent])
      }
    })

    triggerDownload(
      Papa.unparse({ fields: headers, data: rows }),
      selectedCourier
        ? `shipping_rate_card_b2c_${selectedCourier.name || selectedCourier.id}.csv`
        : 'shipping_rate_card_b2c_all_couriers.csv',
    )
    return
  }

  if (type === 'b2b') {
    const baseHeaders = ['Courier ID', 'Courier Name', 'Service Provider', 'Mode', 'Business Type']
    const headers = [
      ...baseHeaders, 'Min Weight',
      ...allZones.flatMap((z) => [`${z.name} (Per Kg Forward)`, `${z.name} (Per Kg RTO)`]),
      'COD Charges', 'COD Percent', 'Other Charges',
    ]
    const rows = allCouriers.map((courier) => {
      const row = findMatchingRateRow(existingData, courier, type, filters.planId) || {}
      const zoneValues = allZones.flatMap((zone) => {
        const zr = row.rates?.[zone.name] || {}
        return [zr.forward_per_kg ?? '', zr.rto_per_kg ?? '']
      })
      return [courier.id ?? row.courier_id ?? '', courier.name ?? row.courier_name ?? '', courier.serviceProvider || row.service_provider || '', normalizeMode(courier.mode || row.mode || ''), type, row.min_weight || '', ...zoneValues, row.cod_charges ?? '', row.cod_percent ?? '', row.other_charges ?? '']
    })
    triggerDownload(Papa.unparse({ fields: headers, data: rows }), 'shipping_rate_card_b2b.csv')
    return
  }
}

export const RateCardContainer = ({ forceBusinessType = null, embedded = false }) => {
  const toast = useToast()

  const businessTypes = ['B2B', 'B2C']
  // If forceBusinessType is provided, use it; otherwise allow switching
  const forcedIndex = forceBusinessType
    ? businessTypes.indexOf(forceBusinessType.toUpperCase())
    : -1
  const [businessTypeIndex, setBusinessTypeIndex] = useState(forcedIndex >= 0 ? forcedIndex : 0)

  const selectedBusinessType = businessTypes[businessTypeIndex].toLowerCase()
  const isB2BSelected = selectedBusinessType === 'b2b'

  const { data: courierList } = useQuery({
    queryKey: ['all-couriers', selectedBusinessType],
    queryFn: () => fetchAllCouriersList({ businessType: selectedBusinessType }),
  })

  const { data: plans = [] } = useQuery({
    queryKey: ['plans', { businessType: selectedBusinessType, status: 'active' }],
    queryFn: () =>
      PlansService.getPlans({ businessType: selectedBusinessType, status: 'active' }),
  })

  const { mutate: importRates, isPending: isImporting } = useImportShippingRates()

  // Prevent changing business type if forced
  useEffect(() => {
    if (forceBusinessType && businessTypeIndex !== forcedIndex) {
      setBusinessTypeIndex(forcedIndex)
    }
  }, [forceBusinessType, forcedIndex, businessTypeIndex])
  const { zones } = useZones(businessTypes[businessTypeIndex])
  const [selectedRate, setSelectedRate] = useState(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [isImportModalOpen, setImportModalOpen] = useState(false)
  const [b2cImportScope, setB2cImportScope] = useState('single')
  const [selectedImportCourierKey, setSelectedImportCourierKey] = useState('')

  // Default to first plan if available
  const [selectedPlanId, setSelectedPlanId] = useState('')

  // Update selectedPlanId when plans load - default to first plan
  useEffect(() => {
    if (plans?.length > 0) {
      // Always set to first plan if not set, or if current selection is invalid
      if (!selectedPlanId || !plans.find((p) => p.id === selectedPlanId)) {
        setSelectedPlanId(plans[0].id)
      }
    }
  }, [plans, selectedPlanId])

  // Combine user filters with internal query constraints for API
  const queryFilters = useMemo(() => {
    const combined = { businessType: selectedBusinessType }
    if (selectedBusinessType === 'b2c' && selectedPlanId) {
      combined.planId = selectedPlanId
    }
    return combined
  }, [selectedBusinessType, selectedPlanId])

  const { data, isLoading } = useShippingRates(queryFilters)
  const rateCardCouriers = useMemo(
    () => (courierList || []).filter(isRateCardAllowedCourier),
    [courierList],
  )
  const selectedImportCourier = useMemo(
    () =>
      rateCardCouriers.find(
        (courier) =>
          makeCourierKey(courier?.id, courier?.serviceProvider || courier?.service_provider || '') ===
          selectedImportCourierKey,
      ) || null,
    [rateCardCouriers, selectedImportCourierKey],
  )

  useEffect(() => {
    if (selectedBusinessType !== 'b2c') return
    if (!rateCardCouriers.length) {
      setSelectedImportCourierKey('')
      return
    }
    const stillAvailable = rateCardCouriers.some(
      (courier) =>
        makeCourierKey(courier?.id, courier?.serviceProvider || courier?.service_provider || '') ===
        selectedImportCourierKey,
    )
    if (!stillAvailable) {
      const first = rateCardCouriers[0]
      setSelectedImportCourierKey(
        makeCourierKey(first?.id, first?.serviceProvider || first?.service_provider || ''),
      )
    }
  }, [rateCardCouriers, selectedBusinessType, selectedImportCourierKey])

  const openEditModal = (row) => {
    setSelectedRate(row)
    setModalOpen(true)
  }

  const openAddModal = () => {
    // Ensure planId is set before opening modal for new rate
    if (!selectedPlanId && plans?.length > 0) {
      setSelectedPlanId(plans[0].id)
    }
    setSelectedRate(null)
    setModalOpen(true)
  }

  const handleImportRates = () => setImportModalOpen(true)

  return (
    <Flex
      direction="column"
      pt={embedded ? 0 : { base: '120px', md: '75px' }}
      gap={embedded ? 3 : 4}
    >
      {/* Business Type Tabs - Only show if not forced */}
      {!forceBusinessType && (
        <Tabs
          variant="solid-rounded"
          colorScheme="brand"
          index={businessTypeIndex}
          onChange={setBusinessTypeIndex}
          mb={2}
        >
          <TabList gap={2}>
            <Tab
              flex={1}
              px={6}
              py={4}
              borderRadius="lg"
              alignItems="flex-start"
              _selected={{ bg: 'white', shadow: 'md', color: 'brand.600', cursor: 'pointer' }}
              _focus={{ boxShadow: 'none' }}
            >
              <Stack spacing={1} align="flex-start" width="100%">
                <HStack spacing={2}>
                  <Tag colorScheme="blue" size="sm">
                    B2B
                  </Tag>
                  <Text fontWeight="semibold">Enterprise Rate Card</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Zone-based pricing that maps by state and integrates with your matrix rates.
                </Text>
              </Stack>
            </Tab>

            <Tab
              flex={1}
              px={6}
              py={4}
              borderRadius="lg"
              alignItems="flex-start"
              _selected={{ bg: 'white', shadow: 'md', color: 'brand.600', cursor: 'pointer' }}
              _focus={{ boxShadow: 'none' }}
            >
              <Stack spacing={1} align="flex-start" width="100%">
                <HStack spacing={2}>
                  <Tag colorScheme="purple" size="sm">
                    B2C
                  </Tag>
                  <Text fontWeight="semibold">Retail Rate Card</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Standard pricing for direct-to-consumer shipments, managed by serviceable
                  pincodes.
                </Text>
              </Stack>
            </Tab>
          </TabList>
        </Tabs>
      )}

      {!isB2BSelected && (
        <>
          {/* Plan Selector */}
          {plans?.length > 0 && (
            <Box mb={4}>
              <HStack spacing={3} align="center">
                <Text fontSize="sm" fontWeight="medium" color="gray.700" minW="80px">
                  Select Plan:
                </Text>
                <Select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  maxW="200px"
                >
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.name}
                    </option>
                  ))}
                </Select>
              </HStack>
              <Divider mt={4} />
            </Box>
          )}

          {/* Filters and actions */}
          <Flex justify="flex-end" gap={2} flexWrap="wrap" mb={4}>
            <Button
              size="sm"
              colorScheme="brand"
              leftIcon={<AddIcon />}
              onClick={openAddModal}
              isDisabled={!selectedPlanId || plans?.length === 0}
            >
              Add Rate
            </Button>
            <Button
              size="sm"
              colorScheme="pink"
              leftIcon={<IconUpload />}
              onClick={handleImportRates}
              isDisabled={!selectedPlanId || plans?.length === 0}
            >
              Import Rate Card
            </Button>
          </Flex>

          {/* Rate Card Table */}
          <RateCardTable
            data={data || []}
            zones={zones}
            planId={selectedPlanId || queryFilters?.planId}
            businessType={selectedBusinessType}
            onEdit={openEditModal}
            loading={isLoading}
          />

          {/* Edit Rate Modal */}
          <RateCardEditModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
            data={selectedRate}
            existingRates={data}
            zones={zones}
            planId={queryFilters?.planId}
            couriers={rateCardCouriers || []}
            businessType={selectedBusinessType}
          />

          {/* Import Modal */}
          <CustomModal
            isOpen={isImportModalOpen}
            onClose={() => setImportModalOpen(false)}
            title="Import Rates"
            size="xl"
            action={
              <Button
                size="sm"
                colorScheme="blue"
                onClick={() =>
                  downloadCSV(
                    rateCardCouriers || [],
                    zones || [],
                    data || [],
                    queryFilters,
                    b2cImportScope === 'single' ? selectedImportCourier : null,
                  )
                }
                isDisabled={
                  selectedBusinessType === 'b2c' &&
                  b2cImportScope === 'single' &&
                  !selectedImportCourier
                }
              >
                Download CSV
              </Button>
            }
          >
            {selectedBusinessType === 'b2c' && (
              <Stack spacing={4} mb={4}>
                <FormControl isRequired>
                  <FormLabel>Import Scope</FormLabel>
                  <Select
                    value={b2cImportScope}
                    onChange={(event) => setB2cImportScope(event.target.value)}
                  >
                    <option value="single">Single courier rate card</option>
                    <option value="all">All enabled couriers rate card</option>
                  </Select>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Single import locks the file to one courier. All-courier import expects a
                    Courier ID, Service Provider and Mode on every row.
                  </Text>
                </FormControl>

                {b2cImportScope === 'single' && (
                  <FormControl isRequired>
                    <FormLabel>Select Courier</FormLabel>
                    <Select
                      value={selectedImportCourierKey}
                      onChange={(event) => setSelectedImportCourierKey(event.target.value)}
                    >
                      {rateCardCouriers.map((courier) => (
                        <option
                          key={makeCourierKey(
                            courier?.id,
                            courier?.serviceProvider || courier?.service_provider || '',
                          )}
                          value={makeCourierKey(
                            courier?.id,
                            courier?.serviceProvider || courier?.service_provider || '',
                          )}
                        >
                          {courier.name} ({courier.serviceProvider || courier.service_provider})
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </Stack>
            )}
            <FileUploader
              maxSizeMb={5}
              folderKey="rates"
              accept=".csv,.xlsx,.xls"
              uploadLoading={isImporting}
              onUploaded={(files) => {
                if (!files.length) return
                if (
                  selectedBusinessType === 'b2c' &&
                  b2cImportScope === 'single' &&
                  !selectedImportCourier
                ) {
                  toast({
                    title: 'Select a courier first',
                    description: 'Choose a courier or switch the import scope to all couriers.',
                    status: 'warning',
                    duration: 3000,
                    isClosable: true,
                  })
                  return
                }
                importRates(
                  {
                    file: files[0],
                    planId: selectedPlanId || queryFilters?.planId,
                    businessType: queryFilters?.businessType || selectedBusinessType,
                    importScope:
                      selectedBusinessType === 'b2c' ? b2cImportScope : undefined,
                    courierId:
                      selectedBusinessType === 'b2c' && b2cImportScope === 'single'
                        ? selectedImportCourier?.id
                        : undefined,
                    courierName:
                      selectedBusinessType === 'b2c' && b2cImportScope === 'single'
                        ? selectedImportCourier?.name
                        : undefined,
                    serviceProvider:
                      selectedBusinessType === 'b2c' && b2cImportScope === 'single'
                        ? selectedImportCourier?.serviceProvider ||
                          selectedImportCourier?.service_provider
                        : undefined,
                  },
                  {
                    onSuccess: (result) => {
                      toast({
                        title: 'Imported successfully',
                        description: result?.data?.savedRows
                          ? `${result.data.savedRows} rate rows saved.`
                          : undefined,
                        status: 'success',
                        duration: 3000,
                        isClosable: true,
                      })
                      setImportModalOpen(false)
                    },
                    onError: (err) => {
                      toast({
                        title: 'Failed to upload rate card',
                        description: err?.message,
                        status: 'error',
                        duration: 4000,
                        isClosable: true,
                      })
                    },
                  },
                )
              }}
            />
          </CustomModal>
        </>
      )}

      {isB2BSelected && (
        <Box pt={4}>
          <ZoneRateMatrix embedded />
        </Box>
      )}
    </Flex>
  )
}
