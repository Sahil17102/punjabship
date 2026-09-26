import { CheckIcon, DownloadIcon, EditIcon, WarningTwoIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Spinner,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useColorModeValue,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import Papa from 'papaparse'
import { useEffect, useState } from 'react'
import { BiUpload } from 'react-icons/bi'
import { useCouriers } from '../../hooks/useCouriers'
import { b2bAdminService } from '../../services/b2bAdmin.service'
import { PlansService } from '../../services/plan.service'
import DownloadSampleCSVButton from '../CSV/DownloadSampleCSVButton'
import CustomModal from '../Modal/CustomModal'

const B2BRateMatrix = ({
  planId,
  courierId: propCourierId = '',
  serviceProvider: propServiceProvider = '',
}) => {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const {
    isOpen: isAddModalOpen,
    onOpen: onAddModalOpen,
    onClose: onAddModalClose,
  } = useDisclosure()
  const {
    isOpen: isImportModalOpen,
    onOpen: onImportModalOpen,
    onClose: onImportModalClose,
  } = useDisclosure()
  const [selectedCell, setSelectedCell] = useState(null)
  const [localPlanId, setLocalPlanId] = useState('')
  const [localCourierId, setLocalCourierId] = useState('')
  const [localServiceProvider, setLocalServiceProvider] = useState('')
  const [importFile, setImportFile] = useState(null)
  const effectivePlanId = planId || localPlanId
  const courierId = propCourierId || localCourierId
  const serviceProvider = propServiceProvider || localServiceProvider
  const isCourierScopeLocked = Boolean(propCourierId || propServiceProvider)

  const { data: b2bPlans = [] } = useQuery({
    queryKey: ['plans', { businessType: 'b2b', status: 'active' }],
    queryFn: () => PlansService.getPlans({ businessType: 'b2b', status: 'active' }),
  })

  const { data: couriers = [] } = useCouriers(
    isCourierScopeLocked
      ? { businessType: 'b2b', serviceProvider: propServiceProvider || undefined }
      : { businessType: 'b2b' },
  )

  // Handle combined courier-service provider selection
  const handleCourierServiceChange = (value) => {
    if (!value) {
      setLocalCourierId('')
      setLocalServiceProvider('')
      return
    }
    // Value format: "courierId|serviceProvider"
    const [id, provider] = value.split('|')
    setLocalCourierId(id)
    setLocalServiceProvider(provider || '')
  }

  // Get current combined value for the dropdown
  const getCombinedCourierValue = () => {
    if (!courierId) return ''
    return `${courierId}|${serviceProvider || ''}`
  }

  useEffect(() => {
    if (planId || localPlanId || !b2bPlans.length) {
      return
    }

    const basicPlan =
      b2bPlans.find((plan) => String(plan.name || '').trim().toLowerCase() === 'basic') ||
      b2bPlans[0]

    if (basicPlan?.id) {
      setLocalPlanId(basicPlan.id)
    }
  }, [b2bPlans, localPlanId, planId])

  useEffect(() => {
    if (isCourierScopeLocked || courierId || !couriers.length) {
      return
    }

    const preferredCourier =
      couriers.find((courier) => {
        const provider = String(courier.serviceProvider || courier.service_provider || '')
          .trim()
          .toLowerCase()
        const name = String(courier.name || '').trim().toLowerCase()
        return provider === 'delhivery' && name.includes('surface')
      }) ||
      couriers.find((courier) => {
        const provider = courier.serviceProvider || courier.service_provider || ''
        return String(provider).trim().toLowerCase() === 'delhivery'
      }) || couriers[0]

    if (preferredCourier) {
      const provider =
        preferredCourier.serviceProvider || preferredCourier.service_provider || ''
      setLocalCourierId(String(preferredCourier.id))
      setLocalServiceProvider(provider)
    }
  }, [courierId, couriers, isCourierScopeLocked])

  const { data: zones = [], isLoading: isLoadingZones } = useQuery({
    queryKey: ['b2b-zones', courierId, serviceProvider],
    queryFn: () =>
      b2bAdminService.getZones({
        courier_id: courierId || undefined,
        service_provider: serviceProvider || undefined,
      }),
    enabled: true, // Zones can be fetched anytime (they're global)
  })

  const { data: rates = [], isLoading: isLoadingRates } = useQuery({
    queryKey: ['b2b-zone-rates', courierId, serviceProvider, effectivePlanId],
    queryFn: () =>
      b2bAdminService.getZoneRates({
        courier_id: courierId || undefined,
        service_provider: serviceProvider || undefined,
        plan_id: effectivePlanId,
      }),
    enabled: !!effectivePlanId,
  })

  // Create a map for quick lookup
  const rateMap = new Map()
  rates.forEach((rate) => {
    const key = `${rate.originZoneId}-${rate.destinationZoneId}`
    rateMap.set(key, rate)
  })

  const updateRateMutation = useMutation({
    mutationFn: (data) => b2bAdminService.upsertZoneRate(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['b2b-zone-rates'])
      toast({
        title: 'Rate saved successfully',
        status: 'success',
        duration: 3000,
      })
      onClose()
      onAddModalClose()
    },
    onError: (error) => {
      toast({
        title: 'Failed to update rate',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    },
  })

  const importRatesMutation = useMutation({
    mutationFn: (formData) => b2bAdminService.importZoneRates(formData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['b2b-zone-rates'])
      toast({
        title: 'Rates imported successfully',
        description: data.message || 'CSV file has been processed',
        status: 'success',
        duration: 5000,
      })
      setImportFile(null)
      onImportModalClose()
    },
    onError: (error) => {
      toast({
        title: 'Failed to import rates',
        description:
          error.response?.data?.message || error.message || 'Please check your CSV format',
        status: 'error',
        duration: 5000,
      })
    },
  })

  const handleImportCSV = () => {
    if (!importFile) {
      toast({
        title: 'No file selected',
        description: 'Please select a CSV file to import',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    const formData = new FormData()
    formData.append('file', importFile)
    if (planId) formData.append('plan_id', planId)
    if (courierId) formData.append('courier_id', courierId)
    if (serviceProvider) formData.append('service_provider', serviceProvider)

    importRatesMutation.mutate(formData)
  }

  const handleExportCSV = (isTemplate = false) => {
    if (!zones.length) {
      toast({
        title: 'No zones available',
        description: 'Please configure zones before exporting',
        status: 'warning',
        duration: 3000,
      })
      return
    }

    // Create zone code map for easier lookup
    const zoneMap = new Map()
    zones.forEach((zone) => {
      zoneMap.set(zone.id, zone.code)
    })

    // Match the backend CSV import format
    const headers = ['origin_zone_code', 'destination_zone_code', 'rate_per_kg']

    let rows = []

    if (isTemplate || !rates.length) {
      // Generate template with all zone combinations
      zones.forEach((originZone) => {
        zones.forEach((destZone) => {
          rows.push([originZone.code, destZone.code, ''])
        })
      })
    } else {
      // Build rows from rates data
      rows = rates.map((rate) => {
        const originCode = zoneMap.get(rate.origin_zone_id || rate.originZoneId) || 'Unknown'
        const destCode =
          zoneMap.get(rate.destination_zone_id || rate.destinationZoneId) || 'Unknown'
        return [
          originCode,
          destCode,
          rate.rate_per_kg || rate.ratePerKg || '', // Rate Per Kg only
        ]
      })
    }

    // Generate CSV
    const csv = Papa.unparse({ fields: headers, data: rows })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    const filename = isTemplate
      ? `b2b_rates_template_${new Date().toISOString().split('T')[0]}.csv`
      : `b2b_rates_${planId || 'export'}_${new Date().toISOString().split('T')[0]}.csv`
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: isTemplate ? 'Template downloaded successfully' : 'CSV exported successfully',
      status: 'success',
      duration: 3000,
    })
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select a CSV file',
        status: 'error',
        duration: 3000,
      })
      return
    }

    setImportFile(file)
  }

  // Sample CSV headers for template download
  // Use first zone if available, otherwise use placeholder
  const sampleCSVHeaders = [
    {
      origin_zone_code: zones.length > 0 ? zones[0].code : 'N1',
      destination_zone_code: zones.length > 0 ? zones[0].code : 'N1',
      rate_per_kg: '100',
    },
  ]

  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const matrixHeaderBg = useColorModeValue('gray.100', 'gray.700')
  const matrixHeaderText = useColorModeValue('gray.800', 'gray.100')
  const configuredBg = useColorModeValue('green.50', 'green.900')
  const configuredHoverBg = useColorModeValue('green.100', 'green.800')
  const emptyHoverBg = useColorModeValue('gray.100', 'gray.700')
  const configuredIconColor = useColorModeValue('green.500', 'green.300')
  const warningIconColor = useColorModeValue('orange.400', 'orange.300')

  const handleCellClick = (originZone, destZone) => {
    const key = `${originZone.id}-${destZone.id}`
    const existingRate = rateMap.get(key)
    setSelectedCell({ originZone, destZone, rate: existingRate })
    onOpen()
  }

  const handleSave = (formData) => {
    // Handle both edit (from cell click) and add (from add modal) scenarios
    const payload = {
      id: selectedCell?.rate?.id,
      originZoneId: formData.originZoneId || selectedCell?.originZone?.id,
      destinationZoneId: formData.destinationZoneId || selectedCell?.destZone?.id,
      ratePerKg: formData.ratePerKg, // Only rate per kg needed
      planId: effectivePlanId,
      courier_id: formData.courier_id || courierId || undefined,
      service_provider: formData.service_provider || serviceProvider || undefined,
    }

    updateRateMutation.mutate(payload)
  }

  const bgColor = useColorModeValue('gray.50', 'gray.700')
  const cellBg = useColorModeValue('white', 'gray.800')

  const selectedPlan = b2bPlans.find((plan) => plan.id === effectivePlanId)
  const planDisplayName = selectedPlan?.name || effectivePlanId || 'Current Plan'
  const scopeLabel =
    courierId || serviceProvider
      ? (() => {
          const courier = couriers.find((c) => c.id?.toString() === courierId?.toString())
          return `${courier?.name || 'Unknown'}${serviceProvider ? ` (${serviceProvider})` : ''}`
        })()
      : 'Global (All Couriers)'

  if (isLoadingZones || isLoadingRates) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" />
      </Flex>
    )
  }

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={4}>
        <HStack spacing={4}>
          {!isCourierScopeLocked && (
            <FormControl width="300px">
              <FormLabel fontSize="sm">Courier - Service Provider</FormLabel>
              <Select
                placeholder="All Couriers (Global)"
                value={getCombinedCourierValue()}
                onChange={(e) => handleCourierServiceChange(e.target.value)}
              >
                {couriers.map((courier) => {
                  const provider = courier.serviceProvider || courier.service_provider || ''
                  const displayText = provider ? `${courier.name} - ${provider}` : courier.name
                  const value = `${courier.id}|${provider}`
                  return (
                    <option key={courier.id} value={value}>
                      {displayText}
                    </option>
                  )
                })}
              </Select>
            </FormControl>
          )}
        </HStack>
        <HStack>
          <Button colorScheme="blue" onClick={onAddModalOpen} size="sm">
            Add Rate
          </Button>
          <Button leftIcon={<BiUpload />} size="sm" onClick={onImportModalOpen}>
            Import CSV
          </Button>
          <Button leftIcon={<DownloadIcon />} size="sm" onClick={() => handleExportCSV(false)}>
            Export CSV
          </Button>
        </HStack>
      </Flex>

      <Box mb={3} px={1}>
        <Text fontSize="xs" color="gray.600">
          Click any cell to configure the <strong>Rate Per Kg</strong> for that{' '}
          <strong>Origin → Destination</strong> zone pair.
        </Text>
      </Box>

      {zones.length === 0 ? (
        <Flex justify="center" align="center" py={12}>
          <VStack spacing={2}>
            <Text fontSize="md" color="gray.600" fontWeight="medium">
              No B2B zones configured yet
            </Text>
            <Text fontSize="sm" color="gray.500" maxW="380px" textAlign="center">
              Create B2B zones first, then return here to configure zone‑to‑zone rates for each
              courier.
            </Text>
          </VStack>
        </Flex>
      ) : (
        <Box
          overflowX="auto"
          borderRadius="md"
          borderWidth="1px"
          borderColor={borderColor}
          bg={cellBg}
        >
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th
                  bg={matrixHeaderBg}
                  color={matrixHeaderText}
                  position="sticky"
                  left={0}
                  zIndex={1}
                  fontWeight="semibold"
                  borderRight="1px solid"
                  borderColor={borderColor}
                >
                  Origin \ Destination
                </Th>
                {zones.map((destZone) => (
                  <Th
                    key={destZone.id}
                    bg={matrixHeaderBg}
                    color={matrixHeaderText}
                    fontWeight="semibold"
                    textAlign="center"
                  >
                    {destZone.code}
                  </Th>
                ))}
              </Tr>
            </Thead>
            <Tbody>
              {zones.map((originZone) => (
                <Tr key={originZone.id}>
                  <Td
                    bg={bgColor}
                    position="sticky"
                    left={0}
                    zIndex={1}
                    fontWeight="semibold"
                    borderRight="1px solid"
                    borderColor={borderColor}
                  >
                    {originZone.code}
                  </Td>
                  {zones.map((destZone) => {
                    const key = `${originZone.id}-${destZone.id}`
                    const rate = rateMap.get(key)

                    // Support both legacy snake_case and new camelCase keys
                    const perKg = rate && (rate.rate_per_kg ?? rate.ratePerKg ?? rate.rate_perKg)
                    const minChargeVal =
                      rate && (rate.min_charge ?? rate.minCharge ?? rate.min_charge_amount)
                    const minChargeWeightVal =
                      rate && (rate.min_charge_weight ?? rate.minChargeWeight)
                    const maxWeightLimitVal = rate && (rate.max_weight_limit ?? rate.maxWeightLimit)

                    const hasPerKg =
                      perKg !== undefined && perKg !== null && perKg !== '' && perKg !== 0
                    const isConfigured = !!rate && hasPerKg

                    return (
                      <Td
                        key={destZone.id}
                        bg={isConfigured ? configuredBg : cellBg}
                        cursor="pointer"
                        _hover={{
                          bg: isConfigured ? configuredHoverBg : emptyHoverBg,
                        }}
                        onClick={() => handleCellClick(originZone, destZone)}
                      >
                        <Tooltip label="Click to view or edit this rate" hasArrow>
                          <HStack justify="space-between" align="center" spacing={2}>
                            {rate && hasPerKg ? (
                              <HStack spacing={1}>
                                <CheckIcon boxSize={3} color={configuredIconColor} />
                                <Text fontSize="sm" fontWeight="semibold">
                                  ₹{Number(perKg || 0).toFixed(2)}/kg
                                </Text>
                              </HStack>
                            ) : (
                              <HStack spacing={1}>
                                <WarningTwoIcon boxSize={3} color={warningIconColor} />
                                <Text fontSize="xs" color="gray.400">
                                  Not configured
                                </Text>
                              </HStack>
                            )}
                            <EditIcon boxSize={3} color="gray.400" />
                          </HStack>
                        </Tooltip>
                      </Td>
                    )
                  })}
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      <RateCellModal
        isOpen={isOpen}
        onClose={onClose}
        selectedCell={selectedCell}
        onSave={handleSave}
        isLoading={updateRateMutation.isPending}
        courierId={courierId}
        serviceProvider={serviceProvider}
        couriers={couriers}
      />

      <AddRateModal
        isOpen={isAddModalOpen}
        onClose={onAddModalClose}
        zones={zones}
        couriers={couriers}
        onSave={handleSave}
        isLoading={updateRateMutation.isPending}
        lockedCourierId={courierId}
        lockedServiceProvider={serviceProvider}
        isCourierScopeLocked={isCourierScopeLocked}
      />

      {/* CSV Import Modal */}
      <CustomModal
        isOpen={isImportModalOpen}
        onClose={() => {
          onImportModalClose()
          setImportFile(null)
        }}
        title="Import B2B Rates from CSV"
        size="xl"
        action={
          <DownloadSampleCSVButton
            headers={sampleCSVHeaders}
            filename={`b2b_rates_template_${new Date().toISOString().split('T')[0]}.csv`}
            buttonText="Download Template"
            size="sm"
            colorScheme="blue"
            tooltip="Download a sample CSV file with the correct format"
          />
        }
        footer={
          <HStack spacing={3}>
            <Button
              variant="ghost"
              onClick={() => {
                onImportModalClose()
                setImportFile(null)
              }}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleImportCSV}
              isLoading={importRatesMutation.isPending}
              isDisabled={!importFile}
              leftIcon={<BiUpload />}
            >
              Import CSV
            </Button>
          </HStack>
        }
      >
        <VStack spacing={4} align="stretch">
          <Box p={4} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
            <Text fontSize="sm" fontWeight="semibold" color="blue.700" mb={2}>
              CSV Format Requirements:
            </Text>
            <VStack align="stretch" spacing={1} fontSize="xs" color="blue.600">
              <Text>• Columns: Origin Zone, Destination Zone, Rate Per Kg</Text>
              <Text>• Zone names must match existing zone names exactly</Text>
              <Text>• Rate Per Kg should be a number only (no currency symbols)</Text>
              <Text>• Empty cells will be treated as null/not set</Text>
            </VStack>
          </Box>

          <Box
            borderWidth="2px"
            borderStyle="dashed"
            borderColor={importFile ? 'green.300' : 'gray.300'}
            borderRadius="lg"
            p={6}
            textAlign="center"
            bg={importFile ? 'green.50' : 'gray.50'}
            transition="all 0.2s"
          >
            <input
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input">
              <VStack spacing={2} cursor="pointer">
                <BiUpload size={32} color={importFile ? '#38A169' : '#718096'} />
                <Text fontSize="sm" fontWeight="medium" color="gray.700">
                  {importFile ? importFile.name : 'Click to select CSV file'}
                </Text>
                {!importFile && (
                  <Text fontSize="xs" color="gray.500">
                    Supported format: .csv
                  </Text>
                )}
              </VStack>
            </label>
          </Box>

          {importFile && (
            <Box p={3} bg="green.50" borderRadius="md" borderWidth="1px" borderColor="green.200">
              <HStack spacing={2}>
                <CheckIcon color="green.500" />
                <Text fontSize="sm" color="green.700">
                  File selected: <strong>{importFile.name}</strong> (
                  {(importFile.size / 1024).toFixed(2)} KB)
                </Text>
              </HStack>
            </Box>
          )}

          <Box p={3} bg="orange.50" borderRadius="md" borderWidth="1px" borderColor="orange.200">
            <Text fontSize="xs" color="orange.700">
              <strong>Note:</strong> Imported rates will be applied to the current plan (
              {planDisplayName}){courierId && ` and courier scope (${scopeLabel})`}.
            </Text>
          </Box>
        </VStack>
      </CustomModal>
    </Box>
  )
}

const RateCellModal = ({
  isOpen,
  onClose,
  selectedCell,
  onSave,
  isLoading,
  courierId,
  serviceProvider,
  couriers,
}) => {
  const [formData, setFormData] = useState({
    ratePerKg: '', // Only rate per kg needed
  })

  // Get courier info if courier is selected
  const selectedCourier = courierId
    ? couriers.find((c) => c.id?.toString() === courierId?.toString())
    : null
  const courierScope =
    courierId || serviceProvider
      ? `${selectedCourier?.name || 'Unknown'}${serviceProvider ? ` (${serviceProvider})` : ''}`
      : 'Global (All Couriers)'

  useEffect(() => {
    if (selectedCell?.rate) {
      setFormData({
        ratePerKg:
          selectedCell.rate.rate_per_kg ||
          selectedCell.rate.ratePerKg ||
          selectedCell.rate.rate_perKg ||
          '',
      })
    } else {
      setFormData({
        ratePerKg: '',
      })
    }
  }, [selectedCell])

  const handleSubmit = () => {
    onSave(formData)
  }

  if (!selectedCell) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Edit Rate: {selectedCell.originZone.code} → {selectedCell.destZone.code}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch" mb={4}>
            <Box p={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
              <Text fontSize="sm" fontWeight="semibold" color="blue.700" mb={2}>
                Zone & Courier Scope
              </Text>
              <VStack spacing={1} align="stretch">
                <HStack>
                  <Text fontSize="sm" color="gray.600" minW="100px">
                    Origin Zone:
                  </Text>
                  <Badge colorScheme="blue">{selectedCell.originZone.code}</Badge>
                  <Text fontSize="sm" color="gray.500">
                    {selectedCell.originZone.name}
                  </Text>
                </HStack>
                <HStack>
                  <Text fontSize="sm" color="gray.600" minW="100px">
                    Destination Zone:
                  </Text>
                  <Badge colorScheme="green">{selectedCell.destZone.code}</Badge>
                  <Text fontSize="sm" color="gray.500">
                    {selectedCell.destZone.name}
                  </Text>
                </HStack>
                <HStack>
                  <Text fontSize="sm" color="gray.600" minW="100px">
                    Courier Scope:
                  </Text>
                  <Badge colorScheme={courierId ? 'purple' : 'gray'}>{courierScope}</Badge>
                </HStack>
              </VStack>
            </Box>
          </VStack>
          <FormControl isRequired>
            <FormLabel>Rate per Kg (₹)</FormLabel>
            <NumberInput
              value={formData.ratePerKg}
              onChange={(_, value) => setFormData({ ...formData, ratePerKg: value })}
            >
              <NumberInputField />
            </NumberInput>
            <FormHelperText fontSize="xs">
              Enter the rate per kilogram for this zone pair
            </FormHelperText>
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading}>
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// Add Rate Modal Component
const AddRateModal = ({
  isOpen,
  onClose,
  zones,
  couriers,
  onSave,
  isLoading,
  lockedCourierId,
  lockedServiceProvider,
  isCourierScopeLocked,
}) => {
  const [formData, setFormData] = useState({
    originZoneId: '',
    destinationZoneId: '',
    courierId: lockedCourierId || '',
    serviceProvider: lockedServiceProvider || '',
    ratePerKg: '', // Only rate per kg needed
  })

  useEffect(() => {
    setFormData((current) => ({
      ...current,
      courierId: lockedCourierId || current.courierId,
      serviceProvider: lockedServiceProvider || current.serviceProvider,
    }))
  }, [lockedCourierId, lockedServiceProvider])

  const handleSubmit = () => {
    if (!formData.originZoneId || !formData.destinationZoneId) {
      return
    }
    if (!formData.ratePerKg) {
      return
    }

    onSave({
      originZoneId: formData.originZoneId,
      destinationZoneId: formData.destinationZoneId,
      ratePerKg: formData.ratePerKg, // Only rate per kg needed
      courier_id: formData.courierId || undefined,
      service_provider: formData.serviceProvider || undefined,
    })

    // Reset form and close modal
    setFormData({
      originZoneId: '',
      destinationZoneId: '',
      courierId: lockedCourierId || '',
      serviceProvider: lockedServiceProvider || '',
      ratePerKg: '',
    })
    onClose()
  }

  const selectedOriginZone = zones.find((z) => z.id === formData.originZoneId)
  const selectedDestZone = zones.find((z) => z.id === formData.destinationZoneId)
  const selectedCourier = formData.courierId
    ? couriers.find((c) => c.id?.toString() === formData.courierId?.toString())
    : null

  const courierScope =
    formData.courierId || formData.serviceProvider
      ? `${selectedCourier?.name || 'Unknown'}${
          formData.serviceProvider ? ` (${formData.serviceProvider})` : ''
        }`
      : 'Global (All Couriers)'

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add New Zone-to-Zone Rate</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            {/* Zone Selection */}
            <Box p={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
              <Text fontSize="sm" fontWeight="semibold" color="blue.700" mb={3}>
                Select Zones
              </Text>
              <SimpleGrid columns={2} spacing={4}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Origin Zone</FormLabel>
                  <Select
                    placeholder="Select origin zone"
                    value={formData.originZoneId}
                    onChange={(e) => setFormData({ ...formData, originZoneId: e.target.value })}
                  >
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.code} - {zone.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Destination Zone</FormLabel>
                  <Select
                    placeholder="Select destination zone"
                    value={formData.destinationZoneId}
                    onChange={(e) =>
                      setFormData({ ...formData, destinationZoneId: e.target.value })
                    }
                  >
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.code} - {zone.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              </SimpleGrid>
              {(selectedOriginZone || selectedDestZone) && (
                <Box mt={3} pt={3} borderTop="1px solid" borderColor="blue.200">
                  <VStack spacing={1} align="stretch">
                    {selectedOriginZone && (
                      <HStack>
                        <Text fontSize="sm" color="gray.600" minW="120px">
                          Origin:
                        </Text>
                        <Badge colorScheme="blue">{selectedOriginZone.code}</Badge>
                        <Text fontSize="sm" color="gray.500">
                          {selectedOriginZone.name}
                        </Text>
                      </HStack>
                    )}
                    {selectedDestZone && (
                      <HStack>
                        <Text fontSize="sm" color="gray.600" minW="120px">
                          Destination:
                        </Text>
                        <Badge colorScheme="green">{selectedDestZone.code}</Badge>
                        <Text fontSize="sm" color="gray.500">
                          {selectedDestZone.name}
                        </Text>
                      </HStack>
                    )}
                  </VStack>
                </Box>
              )}
            </Box>

            {/* Courier Selection (Required) */}
            <Box p={3} bg="purple.50" borderRadius="md" borderWidth="1px" borderColor="purple.200">
              <Text fontSize="sm" fontWeight="semibold" color="purple.700" mb={3}>
                Courier Selection
              </Text>
              {isCourierScopeLocked ? (
                <Text fontSize="xs" color="gray.600" mb={3}>
                  This rate will be saved only under the currently selected Delhivery B2B courier
                  scope.
                </Text>
              ) : (
                <Text fontSize="xs" color="gray.600" mb={3}>
                  Each courier has different rates for the same zone pairs. Select the courier for
                  this rate.
                </Text>
              )}
              {!isCourierScopeLocked && (
                <FormControl isRequired>
                  <FormLabel fontSize="sm">Courier - Service Provider</FormLabel>
                  <Select
                    placeholder="Select courier"
                    value={
                      formData.courierId
                        ? `${formData.courierId}|${formData.serviceProvider || ''}`
                        : ''
                    }
                    onChange={(e) => {
                      if (!e.target.value) {
                        setFormData({
                          ...formData,
                          courierId: '',
                          serviceProvider: '',
                        })
                        return
                      }
                      // Value format: "courierId|serviceProvider"
                      const [id, provider] = e.target.value.split('|')
                      setFormData({
                        ...formData,
                        courierId: id,
                        serviceProvider: provider || '',
                      })
                    }}
                  >
                    {couriers.map((courier) => {
                      const provider = courier.serviceProvider || courier.service_provider || ''
                      const displayText = provider ? `${courier.name} - ${provider}` : courier.name
                      const value = `${courier.id}|${provider}`
                      return (
                        <option key={courier.id} value={value}>
                          {displayText}
                        </option>
                      )
                    })}
                  </Select>
                </FormControl>
              )}
              {(formData.courierId || formData.serviceProvider) && (
                <Box mt={3} pt={3} borderTop="1px solid" borderColor="purple.200">
                  <HStack>
                    <Text fontSize="sm" color="gray.600" minW="120px">
                      Scope:
                    </Text>
                    <Badge colorScheme="purple">{courierScope}</Badge>
                  </HStack>
                </Box>
              )}
            </Box>

            {/* Rate Details */}
            <Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.700" mb={3}>
                Rate Details
              </Text>
              <FormControl isRequired>
                <FormLabel fontSize="sm">Rate per Kg (₹)</FormLabel>
                <NumberInput
                  value={formData.ratePerKg}
                  onChange={(_, value) => setFormData({ ...formData, ratePerKg: value })}
                >
                  <NumberInputField />
                </NumberInput>
                <FormHelperText fontSize="xs">
                  Enter the rate per kilogram for this zone pair
                </FormHelperText>
              </FormControl>
            </Box>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isLoading}
            isDisabled={
              !formData.originZoneId ||
              !formData.destinationZoneId ||
              !formData.ratePerKg ||
              (!formData.courierId && !lockedCourierId)
            }
          >
            Add Rate
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default B2BRateMatrix
