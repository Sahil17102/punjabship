import { ArrowBackIcon, DeleteIcon, EditIcon, RepeatIcon } from '@chakra-ui/icons'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  Flex,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  ScaleFade,
  Select,
  Spinner,
  Stack,
  Switch,
  Tag,
  Text,
  useToast,
} from '@chakra-ui/react'
import { IconFileImport } from '@tabler/icons-react'
import DownloadSampleCSVButton from 'components/CSV/DownloadSampleCSVButton'
import CustomModal from 'components/Modal/CustomModal'
import TableFilters from 'components/Tables/TableFilters'
import FileUploader from 'components/upload/FileUploader'
import { useLocations } from 'hooks/useLocations'
import { useZoneById, useZones } from 'hooks/useZones'
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min'
import { getExactLocation, normalizePincodeInput } from 'services/location.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'
import { useZoneMappings } from '../../hooks/useZoneMappings'

const ZoneMappingsPage = () => {
  const { zoneId } = useParams()
  const history = useHistory()
  const toast = useToast()

  // Pagination & Filters
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [filters, setFilters] = useState({
    pincode: '',
    city: '',
    state: '',
    is_oda: '',
    is_remote: '',
    is_mall: '',
    is_sez: '',
    is_airport: '',
    is_high_security: '',
    sortBy: 'pincode',
    sortOrder: 'asc', // Default to ascending for natural pincode order
  })

  const { data: specificZone, isLoading: loadingZone } = useZoneById(zoneId)
  const isB2B = specificZone?.business_type?.toUpperCase() === 'B2B'

  const booleanSelectOptions = [
    { label: 'Any', value: '' },
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
  ]

  const {
    mappings,
    isLoading,
    createMapping,
    updateMapping,
    deleteMapping,
    bulkMoveMappings,
    bulkDeleteMappings,
    bulkUpdateFlags,
    importMappings,
    total,
    remapZone,
  } = useZoneMappings(zoneId, page, perPage, filters, {
    businessType: specificZone?.business_type,
    // Zones are now global - no courier scope needed
    courierId: undefined,
    serviceProvider: undefined,
  })

  const { zones } = useZones(specificZone?.business_type, { include_global: true }) // fetch all zones for bulk move

  const appliedFilterOptions = isB2B
    ? [
        { key: 'pincode', label: 'Pincode', type: 'text' },
        { key: 'city', label: 'City', type: 'text' },
        {
          key: 'state',
          label: 'State',
          type: 'select',
          options: (specificZone?.states || []).map((state) => ({ label: state, value: state })),
        },
        { key: 'is_oda', label: 'ODA', type: 'select', options: booleanSelectOptions },
        { key: 'is_remote', label: 'Remote', type: 'select', options: booleanSelectOptions },
        { key: 'is_mall', label: 'Mall', type: 'select', options: booleanSelectOptions },
        { key: 'is_sez', label: 'SEZ / Port', type: 'select', options: booleanSelectOptions },
        { key: 'is_airport', label: 'Airport', type: 'select', options: booleanSelectOptions },
        {
          key: 'is_high_security',
          label: 'High Security',
          type: 'select',
          options: booleanSelectOptions,
        },
      ]
    : [
        { key: 'pincode', label: 'Pincode', type: 'text' },
        { key: 'city', label: 'City', type: 'text' },
        { key: 'state', label: 'State', type: 'text' },
      ]

  const [modalOpen, setModalOpen] = useState(false)
  const initialMappingState = {
    id: null,
    pincode: '',
    city: '',
    state: '',
    is_oda: false,
    is_remote: false,
    is_mall: false,
    is_sez: false,
    is_airport: false,
    is_high_security: false,
  }
  const [mappingForm, setMappingForm] = useState(initialMappingState)
  const [isEdit, setIsEdit] = useState(false)
  const [selectedRows, setSelectedRows] = useState([]) // selected row IDs
  const [targetZone, setTargetZone] = useState('') // for bulk move
  const [isBulkFlagsModalOpen, setIsBulkFlagsModalOpen] = useState(false)
  const [bulkFlags, setBulkFlags] = useState({
    is_oda: undefined,
    is_remote: undefined,
    is_mall: undefined,
    is_sez: undefined,
    is_airport: undefined,
    is_high_security: undefined,
  })
  const [isImportModalOpen, setImportModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState([])
  const [duplicateMappings, setDuplicateMappings] = useState([]) // duplicates from import
  const [selectedDuplicates, setSelectedDuplicates] = useState({})
  const [manualOverrides, setManualOverrides] = useState({ city: false, state: false })

  const { data: locationLookup, isFetching: loadingLocation } = useLocations(
    isB2B && mappingForm.pincode?.length === 6 ? { pincode: mappingForm.pincode, limit: 1 } : null,
    isB2B && mappingForm.pincode?.length === 6,
    ['b2b-zone-mapping', mappingForm.pincode],
  )

  const autoDetectedLocation = useMemo(() => {
    if (!locationLookup?.data?.length || mappingForm.pincode?.length !== 6) return null
    return getExactLocation(locationLookup, mappingForm.pincode)
  }, [locationLookup, mappingForm.pincode])

  useEffect(() => {
    if (!modalOpen || !isB2B) return
    if (!autoDetectedLocation) return

    setMappingForm((prev) => ({
      ...prev,
      city: manualOverrides.city ? prev.city : autoDetectedLocation.city || prev.city,
      state: manualOverrides.state ? prev.state : autoDetectedLocation.state || prev.state,
    }))
  }, [autoDetectedLocation, manualOverrides.city, manualOverrides.state, modalOpen, isB2B])

  useEffect(() => {
    if (!modalOpen) return
    setManualOverrides({ city: false, state: false })
  }, [mappingForm.pincode, modalOpen])

  const flagFieldMap = {
    is_oda: 'isOda',
    is_remote: 'isRemote',
    is_mall: 'isMall',
    is_sez: 'isSez',
    is_airport: 'isAirport',
    is_high_security: 'isHighSecurity',
  }

  const buildCurrentFlags = (row) => ({
    isOda: row.is_oda ?? row.isOda ?? false,
    isRemote: row.is_remote ?? row.isRemote ?? false,
    isMall: row.is_mall ?? row.isMall ?? false,
    isSez: row.is_sez ?? row.isSez ?? false,
    isAirport: row.is_airport ?? row.isAirport ?? false,
    isHighSecurity: row.is_high_security ?? row.isHighSecurity ?? false,
  })

  const handleFlagToggle = (row, key, checked) => {
    if (!isB2B) return
    const camelKey = flagFieldMap[key]
    if (!camelKey) return
    const flags = buildCurrentFlags(row)
    flags[camelKey] = checked

    updateMapping.mutate({
      mappingId: row.id,
      mappingData: {
        flags,
      },
    })
  }

  const renderFlagSwitch = (row, key) => (
    <HStack spacing={2} align="center">
      <Switch
        size="sm"
        isChecked={Boolean(row[key])}
        onChange={(e) => handleFlagToggle(row, key, e.target.checked)}
        isDisabled={updateMapping.isPending}
      />
      <Text fontSize="xs" color="gray.600">
        {row[key] ? 'Yes' : 'No'}
      </Text>
    </HStack>
  )

  // Open modals
  const openAddModal = () => {
    setIsEdit(false)
    setMappingForm(initialMappingState)
    setManualOverrides({ city: false, state: false })
    setModalOpen(true)
  }

  const openEditModal = (mapping) => {
    setIsEdit(true)
    setMappingForm({
      id: mapping.id,
      pincode: mapping.pincode,
      city: mapping.city,
      state: mapping.state,
      is_oda: mapping.is_oda ?? mapping.isOda ?? false,
      is_remote: mapping.is_remote ?? mapping.isRemote ?? false,
      is_mall: mapping.is_mall ?? mapping.isMall ?? false,
      is_sez: mapping.is_sez ?? mapping.isSez ?? false,
      is_airport: mapping.is_airport ?? mapping.isAirport ?? false,
      is_high_security: mapping.is_high_security ?? mapping.isHighSecurity ?? false,
    })
    setManualOverrides({ city: true, state: true })
    setModalOpen(true)
  }

  const handleSaveMapping = () => {
    if (!mappingForm.pincode) {
      toast({ title: 'Pincode is required', status: 'warning' })
      return
    }

    if (!mappingForm.city || !mappingForm.state) {
      toast({ title: 'City and state are required', status: 'warning' })
      return
    }

    const payload = {
      pincode: mappingForm.pincode.trim(),
      city: mappingForm.city.trim(),
      state: mappingForm.state.trim(),
      zone_id: zoneId,
    }

    if (isB2B) {
      payload.flags = {
        isOda: mappingForm.is_oda,
        isRemote: mappingForm.is_remote,
        isMall: mappingForm.is_mall,
        isSez: mappingForm.is_sez,
        isAirport: mappingForm.is_airport,
        isHighSecurity: mappingForm.is_high_security,
      }
    }

    if (isEdit) {
      updateMapping.mutate(
        { mappingId: mappingForm?.id, mappingData: payload },
        {
          onSuccess: () => {
            setModalOpen(false)
            setMappingForm(initialMappingState)
          },
        },
      )
    } else {
      createMapping.mutate(payload, {
        onSuccess: () => {
          setModalOpen(false)
          setMappingForm(initialMappingState)
        },
      })
    }
  }

  const handleDeleteMapping = (id) => deleteMapping.mutate(id)

  const handleBulkDelete = () => {
    if (selectedRows.length === 0) return
    bulkDeleteMappings.mutate(selectedRows, { onSuccess: () => setSelectedRows([]) })
  }

  const handleConfirmDuplicates = () => {
    if (!uploadedFiles.length) return

    setIsImporting(true)

    importMappings.mutate(
      { file: uploadedFiles[0]?.file, userChoices: selectedDuplicates },
      {
        onSuccess: (data) => {
          setIsImporting(false)
          setImportModalOpen(false)
          setUploadedFiles([])
          setSelectedDuplicates({})
          setDuplicateMappings([])

          if (data.overridden?.length) {
            toast({
              title: 'Duplicates overridden',
              description: `${data.overridden.length} mapping(s) overridden.`,
              status: 'info',
              duration: 4000,
              isClosable: true,
            })
          }

          if (data.skipped?.length) {
            toast({
              title: 'Duplicates skipped',
              description: `${data.skipped.length} mapping(s) skipped.`,
              status: 'warning',
              duration: 4000,
              isClosable: true,
            })
          }
          // Show success toast for inserted mappings
          toast({
            title: 'Mappings imported successfully!',
            description: `${data.inserted} mappings imported.`,
            status: 'success',
            duration: 4000,
            isClosable: true,
          })
        },
        onError: (err) => {
          setIsImporting(false)
          toast({
            title: 'Error importing mappings',
            description: err.message || 'Something went wrong',
            status: 'error',
          })
        },
      },
    )
  }

  const handleBulkMove = () => {
    if (!targetZone || selectedRows.length === 0) return
    bulkMoveMappings.mutate(
      { mappingIds: selectedRows, zoneId: targetZone },
      { onSuccess: () => setSelectedRows([]) },
    )
    setTargetZone('')
  }

  const handleBulkUpdateFlags = () => {
    if (selectedRows.length === 0) return

    // Only include flags that are explicitly set (not undefined)
    const flagsToUpdate = {}
    Object.entries(bulkFlags).forEach(([key, value]) => {
      if (value !== undefined) {
        // Convert snake_case to camelCase for API
        const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
        flagsToUpdate[camelKey] = value
      }
    })

    if (Object.keys(flagsToUpdate).length === 0) {
      toast({
        title: 'No flags selected',
        description: 'Please select at least one flag to update',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    bulkUpdateFlags.mutate(
      { mappingIds: selectedRows, flags: flagsToUpdate },
      {
        onSuccess: () => {
          setSelectedRows([])
          setIsBulkFlagsModalOpen(false)
          setBulkFlags({
            is_oda: undefined,
            is_remote: undefined,
            is_mall: undefined,
            is_sez: undefined,
            is_airport: undefined,
            is_high_security: undefined,
          })
        },
      },
    )
  }

  const handleCancelSelection = () => setSelectedRows([])

  // CSV headers for sample download - showing accepted format values
  // Backend accepts: '1', 'true', 'yes', 'y' (case insensitive) for true, anything else is false
  const csvHeaders = isB2B
    ? [
        {
          pincode: '',
          is_oda: '0/1 or true/false or yes/no',
          is_remote: '0/1 or true/false or yes/no',
          is_mall: '0/1 or true/false or yes/no',
          is_sez: '0/1 or true/false or yes/no',
          is_airport: '0/1 or true/false or yes/no',
          is_high_security: '0/1 or true/false or yes/no',
        },
      ]
    : [{ pincode: '', city: '', state: '' }]
  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={6}>
      {/* Header */}
      <Flex justify="space-between" align="center" mb={2}>
        <Button leftIcon={<ArrowBackIcon />} variant="outline" onClick={() => history.goBack()}>
          Back
        </Button>
        <Text fontSize="lg" fontWeight="bold" color="gray.700">
          Zone Mappings
        </Text>
      </Flex>

      {/* Zone Info Card */}
      <Box
        p={4}
        bgGradient="linear(to-r, blue.400, purple.500)"
        color="white"
        borderRadius="md"
        boxShadow="lg"
        borderColor="transparent"
      >
        <Flex justify="space-between" align="center">
          {loadingZone ? (
            <Spinner color="white" />
          ) : specificZone ? (
            <Flex direction="column">
              <Text fontSize="lg" fontWeight="bold">
                {specificZone?.name} ({specificZone?.code}){' '}
                {specificZone?.courier_name ? `- ${specificZone?.courier_name} ` : null}
              </Text>
              <Text fontSize="sm">{specificZone?.description || 'No description available'}</Text>
            </Flex>
          ) : (
            <Text>No zone data found.</Text>
          )}

          <Flex gap={2}>
            {isB2B && (
              <>
                <Button
                  leftIcon={<IconFileImport />}
                  colorScheme="whiteAlpha"
                  variant="solid"
                  onClick={() => setImportModalOpen(true)}
                  _hover={{ bg: 'whiteAlpha.800' }}
                >
                  Import CSV
                </Button>
                <Button
                  leftIcon={<RepeatIcon />}
                  colorScheme="whiteAlpha"
                  variant="solid"
                  onClick={() => remapZone.mutate()}
                  isLoading={remapZone.isPending}
                  _hover={{ bg: 'whiteAlpha.800' }}
                >
                  Remap From States
                </Button>
              </>
            )}
          </Flex>
        </Flex>
      </Box>

      {/* Filters */}
      <TableFilters
        filters={appliedFilterOptions}
        values={filters}
        onApply={(finalFilters) => {
          setFilters((prev) => ({ ...prev, ...finalFilters }))
          setPage(1)
        }}
      />

      <Alert status="info" variant="subtle" mb={3} borderRadius="md">
        <AlertIcon />
        <AlertDescription>
          {isB2B
            ? 'Toggle the switches to mark ODA, Remote, Mall, SEZ, Airport, or High Security for each pincode.'
            : 'Pro Tip: Select multiple rows in the table to quickly move mappings to another zone.'}
        </AlertDescription>
      </Alert>
      {/* Mappings Table */}
      <GenericTable
        title="Mappings"
        page={page}
        sortByComponent={
          <Flex gap={2} align="center">
            <Select
              size="sm"
              value={filters?.sortBy}
              onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
            >
              <option value="pincode">Pincode</option>
              <option value="city">City</option>
              <option value="state">State</option>
              <option value="created_at">Created At</option>
            </Select>

            <Select
              size="sm"
              value={filters?.sortOrder}
              onChange={(e) => setFilters({ ...filters, sortOrder: e.target.value })}
            >
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </Select>
          </Flex>
        }
        setPage={setPage}
        perPage={perPage}
        setPerPage={setPerPage}
        totalCount={total}
        data={mappings}
        captions={
          isB2B
            ? [
                'Pincode',
                'City',
                'State',
                'ODA',
                'Remote',
                'Mall',
                'SEZ / Port',
                'Airport',
                'High Security',
                'Actions',
              ]
            : ['Pincode', 'City', 'State', 'Actions']
        }
        columnKeys={
          isB2B
            ? [
                'pincode',
                'city',
                'state',
                'is_oda',
                'is_remote',
                'is_mall',
                'is_sez',
                'is_airport',
                'is_high_security',
              ]
            : ['pincode', 'city', 'state']
        }
        loading={isLoading}
        showCheckboxes
        selectedRows={selectedRows}
        onSelectionChange={(newSelection) => {
          setSelectedRows(newSelection)
        }}
        renderers={
          isB2B
            ? {
                is_oda: (_value, row) => renderFlagSwitch(row, 'is_oda'),
                is_remote: (_value, row) => renderFlagSwitch(row, 'is_remote'),
                is_mall: (_value, row) => renderFlagSwitch(row, 'is_mall'),
                is_sez: (_value, row) => renderFlagSwitch(row, 'is_sez'),
                is_airport: (_value, row) => renderFlagSwitch(row, 'is_airport'),
                is_high_security: (_value, row) => renderFlagSwitch(row, 'is_high_security'),
              }
            : undefined
        }
        renderActions={(row) => (
          <Flex gap={2}>
            {!isB2B && (
              <IconButton
                aria-label="Edit"
                icon={<EditIcon />}
                size="sm"
                colorScheme="yellow"
                onClick={() => openEditModal(row)}
              />
            )}
            <IconButton
              aria-label="Delete"
              icon={<DeleteIcon />}
              size="sm"
              colorScheme="red"
              onClick={() => handleDeleteMapping(row.id)}
            />
          </Flex>
        )}
      />

      {/* Floating Bulk Actions Panel */}
      <ScaleFade initialScale={0.9} in={selectedRows.length > 0}>
        <Flex
          direction="column"
          position="fixed"
          bottom="20px"
          right="20px"
          p={4}
          bg="white"
          boxShadow="2xl"
          borderRadius="lg"
          gap={3}
          zIndex={30}
          minW="220px"
        >
          <Text fontSize="sm" color="gray.500" fontWeight="semibold">
            {selectedRows.length} row{selectedRows.length > 1 ? 's' : ''} selected
          </Text>
          {isB2B && (
            <Button colorScheme="purple" onClick={() => setIsBulkFlagsModalOpen(true)}>
              Update Attributes
            </Button>
          )}
          <Button colorScheme="red" onClick={handleBulkDelete}>
            Delete
          </Button>
          <Popover placement="top-end">
            <PopoverTrigger>
              <Button colorScheme="blue">Move</Button>
            </PopoverTrigger>
            <PopoverContent w="250px">
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverHeader fontWeight="bold">Select Zone</PopoverHeader>
              <PopoverBody>
                <Stack spacing={3}>
                  <Select
                    placeholder="Choose Zone"
                    value={targetZone}
                    onChange={(e) => setTargetZone(e.target.value)}
                  >
                    {zones?.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} ({z.code})
                      </option>
                    ))}
                  </Select>
                  <Button colorScheme="blue" onClick={handleBulkMove} isDisabled={!targetZone}>
                    Confirm Move
                  </Button>
                </Stack>
              </PopoverBody>
            </PopoverContent>
          </Popover>
          <Button variant="outline" onClick={handleCancelSelection}>
            Cancel
          </Button>
        </Flex>
      </ScaleFade>

      {/* Bulk Update Flags Modal */}
      {isB2B && (
        <CustomModal
          isOpen={isBulkFlagsModalOpen}
          onClose={() => {
            setIsBulkFlagsModalOpen(false)
            setBulkFlags({
              is_oda: undefined,
              is_remote: undefined,
              is_mall: undefined,
              is_sez: undefined,
              is_airport: undefined,
              is_high_security: undefined,
            })
          }}
          title={`Update Attributes for ${selectedRows.length} Pincode${
            selectedRows.length > 1 ? 's' : ''
          }`}
          size="md"
          footer={
            <HStack justify="space-between" w="100%">
              <Button
                variant="ghost"
                onClick={() => {
                  setIsBulkFlagsModalOpen(false)
                  setBulkFlags({
                    is_oda: undefined,
                    is_remote: undefined,
                    is_mall: undefined,
                    is_sez: undefined,
                    is_airport: undefined,
                    is_high_security: undefined,
                  })
                }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="purple"
                onClick={handleBulkUpdateFlags}
                isLoading={bulkUpdateFlags.isPending}
              >
                Update {selectedRows.length} Pincode{selectedRows.length > 1 ? 's' : ''}
              </Button>
            </HStack>
          }
        >
          <Stack spacing={4}>
            <Alert status="info" variant="subtle" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                Select the attributes to update. Only selected attributes will be changed for all
                selected pincodes.
              </AlertDescription>
            </Alert>
            <Text fontSize="sm" color="gray.600" fontWeight="semibold">
              Select attributes to update:
            </Text>
            <Stack spacing={3}>
              <Flex align="center" justify="space-between">
                <Text fontSize="sm">ODA</Text>
                <Select
                  size="sm"
                  value={bulkFlags.is_oda === undefined ? '' : bulkFlags.is_oda ? 'true' : 'false'}
                  onChange={(e) =>
                    setBulkFlags({
                      ...bulkFlags,
                      is_oda: e.target.value === '' ? undefined : e.target.value === 'true',
                    })
                  }
                  w="120px"
                >
                  <option value="">No change</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </Flex>
              <Flex align="center" justify="space-between">
                <Text fontSize="sm">Remote</Text>
                <Select
                  size="sm"
                  value={
                    bulkFlags.is_remote === undefined ? '' : bulkFlags.is_remote ? 'true' : 'false'
                  }
                  onChange={(e) =>
                    setBulkFlags({
                      ...bulkFlags,
                      is_remote: e.target.value === '' ? undefined : e.target.value === 'true',
                    })
                  }
                  w="120px"
                >
                  <option value="">No change</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </Flex>
              <Flex align="center" justify="space-between">
                <Text fontSize="sm">Mall</Text>
                <Select
                  size="sm"
                  value={
                    bulkFlags.is_mall === undefined ? '' : bulkFlags.is_mall ? 'true' : 'false'
                  }
                  onChange={(e) =>
                    setBulkFlags({
                      ...bulkFlags,
                      is_mall: e.target.value === '' ? undefined : e.target.value === 'true',
                    })
                  }
                  w="120px"
                >
                  <option value="">No change</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </Flex>
              <Flex align="center" justify="space-between">
                <Text fontSize="sm">SEZ / Port</Text>
                <Select
                  size="sm"
                  value={bulkFlags.is_sez === undefined ? '' : bulkFlags.is_sez ? 'true' : 'false'}
                  onChange={(e) =>
                    setBulkFlags({
                      ...bulkFlags,
                      is_sez: e.target.value === '' ? undefined : e.target.value === 'true',
                    })
                  }
                  w="120px"
                >
                  <option value="">No change</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </Flex>
              <Flex align="center" justify="space-between">
                <Text fontSize="sm">Airport</Text>
                <Select
                  size="sm"
                  value={
                    bulkFlags.is_airport === undefined
                      ? ''
                      : bulkFlags.is_airport
                      ? 'true'
                      : 'false'
                  }
                  onChange={(e) =>
                    setBulkFlags({
                      ...bulkFlags,
                      is_airport: e.target.value === '' ? undefined : e.target.value === 'true',
                    })
                  }
                  w="120px"
                >
                  <option value="">No change</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </Flex>
              <Flex align="center" justify="space-between">
                <Text fontSize="sm">High Security</Text>
                <Select
                  size="sm"
                  value={
                    bulkFlags.is_high_security === undefined
                      ? ''
                      : bulkFlags.is_high_security
                      ? 'true'
                      : 'false'
                  }
                  onChange={(e) =>
                    setBulkFlags({
                      ...bulkFlags,
                      is_high_security:
                        e.target.value === '' ? undefined : e.target.value === 'true',
                    })
                  }
                  w="120px"
                >
                  <option value="">No change</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </Select>
              </Flex>
            </Stack>
          </Stack>
        </CustomModal>
      )}

      {!isB2B && (
        <CustomModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={isEdit ? 'Edit Mapping' : 'Add Mapping'}
          size="xl"
          footer={
            <HStack justify="space-between" w="100%">
              <Button
                variant="ghost"
                onClick={() => {
                  setModalOpen(false)
                  setMappingForm(initialMappingState)
                }}
              >
                Cancel
              </Button>
              <Button
                colorScheme="blue"
                onClick={handleSaveMapping}
                isLoading={createMapping.isPending}
              >
                {isEdit ? 'Update' : 'Save Mapping'}
              </Button>
            </HStack>
          }
        >
          <Stack spacing={4}>
            <InputGroup>
              <Input
                placeholder="Pincode"
                value={mappingForm.pincode}
                onChange={(e) =>
                  setMappingForm({
                    ...mappingForm,
                    pincode: normalizePincodeInput(e.target.value),
                    ...(isB2B ? { city: '', state: '' } : {}),
                  })
                }
                maxLength={6}
              />
              {isB2B && mappingForm.pincode?.length === 6 && (
                <InputRightElement width="3rem">
                  {loadingLocation ? <Spinner size="sm" /> : <Tag colorScheme="green">Auto</Tag>}
                </InputRightElement>
              )}
            </InputGroup>
            <Input
              placeholder="City"
              value={mappingForm.city}
              onChange={(e) => {
                setMappingForm({ ...mappingForm, city: e.target.value })
                if (isB2B) {
                  setManualOverrides((prev) => ({ ...prev, city: true }))
                }
              }}
            />
            <Input
              placeholder="State"
              value={mappingForm.state}
              onChange={(e) => {
                setMappingForm({ ...mappingForm, state: e.target.value })
                if (isB2B) {
                  setManualOverrides((prev) => ({ ...prev, state: true }))
                }
              }}
            />

            {isB2B && (
              <Box>
                <Text fontWeight="semibold" mb={2}>
                  Additional Flags
                </Text>
                <Flex gap={4} wrap="wrap">
                  <Checkbox
                    isChecked={mappingForm.is_oda}
                    onChange={(e) => setMappingForm({ ...mappingForm, is_oda: e.target.checked })}
                  >
                    ODA
                  </Checkbox>
                  <Checkbox
                    isChecked={mappingForm.is_remote}
                    onChange={(e) =>
                      setMappingForm({ ...mappingForm, is_remote: e.target.checked })
                    }
                  >
                    Remote
                  </Checkbox>
                  <Checkbox
                    isChecked={mappingForm.is_mall}
                    onChange={(e) => setMappingForm({ ...mappingForm, is_mall: e.target.checked })}
                  >
                    Mall
                  </Checkbox>
                  <Checkbox
                    isChecked={mappingForm.is_sez}
                    onChange={(e) => setMappingForm({ ...mappingForm, is_sez: e.target.checked })}
                  >
                    SEZ / Port
                  </Checkbox>
                  <Checkbox
                    isChecked={mappingForm.is_airport}
                    onChange={(e) =>
                      setMappingForm({ ...mappingForm, is_airport: e.target.checked })
                    }
                  >
                    Airport
                  </Checkbox>
                  <Checkbox
                    isChecked={mappingForm.is_high_security}
                    onChange={(e) =>
                      setMappingForm({ ...mappingForm, is_high_security: e.target.checked })
                    }
                  >
                    High Security
                  </Checkbox>
                </Flex>
              </Box>
            )}
          </Stack>
        </CustomModal>
      )}

        <CustomModal
          isOpen={isImportModalOpen}
          onClose={() => setImportModalOpen(false)}
        title={isB2B ? 'Update Pincode Attributes' : 'Import Mappings'}
          size="xl"
          footer={
            <Flex gap={2}>
              <Button
                variant="solid"
                colorScheme="blue"
                onClick={() => {
                  if (!uploadedFiles.length) return
                  setIsImporting(true)
                  const additionalFields = { userChoices: selectedDuplicates }

                  importMappings.mutate(
                    { file: uploadedFiles[0], additionalFields },
                    {
                      onSuccess: (data) => {
                        setIsImporting(false)

                      if (!isB2B && data.duplicates && data.duplicates.length > 0) {
                          setDuplicateMappings(data.duplicates)
                          const initialSelection = {}
                          data.duplicates.forEach((d) => {
                            initialSelection[d.existingMapping.id] = 'override'
                          })
                          setSelectedDuplicates(initialSelection)
                        } else {
                          setImportModalOpen(false)
                        let description = ''
                        if (isB2B && data) {
                          if (data.updated > 0) {
                            description = `${data.updated} pincode(s) updated with attributes`
                            if (data.skipped && data.skipped.length > 0) {
                              description += `. ${data.skipped.length} skipped (not found in zone)`
                            }
                          } else {
                            description = 'No existing pincodes found to update'
                            if (data.skipped && data.skipped.length > 0) {
                              description += `. ${data.skipped.length} pincode(s) skipped (not found in zone)`
                            }
                          }
                        }
                          toast({
                          title:
                            data?.updated > 0
                              ? 'Update completed successfully'
                              : 'No pincodes updated',
                          description: description || undefined,
                          status: data?.updated > 0 ? 'success' : 'warning',
                          duration: 4000,
                            isClosable: true,
                          })
                          setUploadedFiles([])
                        }
                      },
                    onError: (error) => {
                      setIsImporting(false)
                      toast({
                        title: 'Import failed',
                        description: error?.message || 'Failed to import mappings',
                        status: 'error',
                        duration: 4000,
                        isClosable: true,
                      })
                    },
                    },
                  )
                }}
                isLoading={isImporting || importMappings.isPending}
                isDisabled={!uploadedFiles.length}
              >
                Upload
              </Button>

              <Button onClick={() => setImportModalOpen(false)}>Cancel</Button>
            </Flex>
          }
          action={
          <DownloadSampleCSVButton
            headers={csvHeaders}
            filename={isB2B ? 'pincode_attributes_template.csv' : 'mappings_template.csv'}
            buttonText="Download Sample CSV"
            tooltip={
              isB2B
                ? 'Download a sample CSV file with example pincode and attribute values'
                : 'Download a sample CSV file with the required format'
            }
          />
        }
      >
        <Stack spacing={4}>
          {isB2B && (
            <Alert status="info" variant="subtle" borderRadius="md">
              <AlertIcon />
              <AlertDescription fontSize="sm">
                <Text fontWeight="semibold" mb={2}>
                  CSV Update for B2B Zones:
                </Text>
                <Text mb={2} fontSize="sm" color="blue.700">
                  <strong>Note:</strong> Only existing pincodes in this zone will be updated. New
                  pincodes will be skipped. City and state are already stored - you only need to
                  provide pincode and attributes.
                </Text>
                <Text mb={1}>
                  Required column: <strong>pincode</strong>
                </Text>
                <Text mb={1}>
                  Attribute columns (use <strong>true/false</strong>, <strong>yes/no</strong>, or{' '}
                  <strong>1/0</strong>):
                </Text>
                <Text as="span" fontSize="xs" display="block" ml={4}>
                  • is_oda • is_remote • is_mall • is_sez • is_airport • is_high_security
                </Text>
                <Text fontSize="xs" mt={2} color="gray.600">
                  Example: pincode=110001, is_oda=true, is_remote=false, is_mall=yes
                </Text>
                <Text fontSize="xs" mt={1} color="gray.500" fontStyle="italic">
                  Optional: You can include city and state to update them, but they're not required.
                </Text>
              </AlertDescription>
            </Alert>
          )}
          <FileUploader
            maxSizeMb={5}
            folderKey="mappings"
            uploadLoading={isImporting}
            showUploadButton={false}
            onUploaded={(files) => {
              setUploadedFiles(files)
            }}
          />
        </Stack>
        </CustomModal>

      {!isB2B && duplicateMappings?.length > 0 && (
        <CustomModal
          isOpen={true}
          onClose={() => setDuplicateMappings([])}
          title="Duplicate Mappings Found"
          size="4xl"
          footer={
            <Flex gap={2}>
              <Button colorScheme="blue" onClick={() => handleConfirmDuplicates()}>
                Confirm
              </Button>
              <Button onClick={() => setDuplicateMappings([])}>Cancel</Button>
            </Flex>
          }
        >
          {/* Friendly description */}
          <Box mb={4} p={3} bg="blue.50" borderRadius="md">
            <Text>
              Some of the mappings in your CSV file already exist in this zone. You can choose to
              <b> override </b> the existing data with the new values from your CSV, or
              <b> skip </b> them to keep the current values unchanged.
            </Text>
            <Text fontSize="sm" color="gray.600" mt={1}>
              Select your preferred action for each duplicate below.
            </Text>
          </Box>

          <Stack spacing={2} maxH="400px" overflowY="auto">
            {duplicateMappings.length > 0 && (
              <Flex fontWeight="bold" p={2} borderBottomWidth={1} bg="gray.50">
                <Box flex={1}>Pincode</Box>
                <Box flex={2}>Existing vs New</Box>
                <Box flex={1}>Action</Box>
              </Flex>
            )}

            {duplicateMappings.map((d) => (
              <Flex
                key={d.existingMapping.id}
                p={2}
                borderWidth={1}
                borderRadius="md"
                justify="space-between"
                align="center"
                bg="gray.50"
                _hover={{ bg: 'gray.100' }}
              >
                <Box flex={1}>
                  <Text fontWeight="bold">{d.newMapping.pincode}</Text>
                </Box>
                <Box flex={2}>
                  <Text>
                    <b>City:</b>{' '}
                    <span
                      style={{
                        color: d.existingMapping.city !== d.newMapping.city ? 'red' : 'black',
                      }}
                    >
                      {d.existingMapping.city}
                    </span>{' '}
                    → <span style={{ color: 'green' }}>{d.newMapping.city}</span>
                  </Text>
                  <Text>
                    <b>State:</b>{' '}
                    <span
                      style={{
                        color: d.existingMapping.state !== d.newMapping.state ? 'red' : 'black',
                      }}
                    >
                      {d.existingMapping.state}
                    </span>{' '}
                    → <span style={{ color: 'green' }}>{d.newMapping.state}</span>
                  </Text>
                </Box>
                <Box flex={1}>
                  <Select
                    size="sm"
                    value={selectedDuplicates[d.existingMapping.id] || 'skip'}
                    onChange={(e) => {
                      setSelectedDuplicates({
                        ...selectedDuplicates,
                        [d.existingMapping.id]: e.target.value,
                      })
                    }}
                  >
                    <option value="override">Override</option>
                    <option value="skip">Skip</option>
                  </Select>
                </Box>
              </Flex>
            ))}

            {duplicateMappings.length === 0 && (
              <Text textAlign="center" color="gray.500" p={2}>
                No duplicate mappings found.
              </Text>
            )}
          </Stack>
        </CustomModal>
      )}
    </Flex>
  )
}

export default ZoneMappingsPage
