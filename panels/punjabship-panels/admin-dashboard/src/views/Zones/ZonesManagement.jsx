// src/pages/ZonesManagement.jsx
import { AddIcon, DeleteIcon, EditIcon, LinkIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tag,
  Text,
  Tooltip,
  Wrap,
  WrapItem,
  useDisclosure,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import CustomModal from 'components/Modal/CustomModal'
import TableFilters from 'components/Tables/TableFilters'
import { useZones } from 'hooks/useZones'
import { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min'
import { b2bAdminService } from 'services/b2bAdmin.service'
import { zoneService } from 'services/zones.service'
import { COUNTRY_OPTIONS, getZoneCountries } from 'constants/countries'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

const ZonesManagement = ({ defaultBusinessType = null }) => {
  const history = useHistory()
  const { isOpen, onOpen, onClose } = useDisclosure()

  // If defaultBusinessType is provided, use it directly (no tabs)
  // Otherwise, show tabs to switch between B2C and B2B
  const [tabIndex, setTabIndex] = useState(0)
  const businessType = defaultBusinessType || (tabIndex === 0 ? 'B2C' : 'B2B')
  const showTabs = defaultBusinessType === null

  const [zoneForm, setZoneForm] = useState({
    id: null,
    code: '',
    name: '',
    description: '',
    business_type: businessType,
    country: 'India',
    countries: ['India'],
    states: [],
    postal_codes: [],
  })
  const [isEdit, setIsEdit] = useState(false)

  // Zones are always global - no courier filtering needed

  const { zones, isLoading, createZone, updateZone, deleteZone } = useZones(businessType, {})

  const isB2B = businessType === 'B2B'

  const { data: stateOptions = [], isLoading: isLoadingStates } = useQuery({
    queryKey: ['b2b-states'],
    queryFn: () => b2bAdminService.getStates(),
    enabled: isB2B,
    staleTime: 24 * 60 * 60 * 1000,
  })

  const [stateSearch, setStateSearch] = useState('')
  const [countrySearch, setCountrySearch] = useState('')
  const [postalSearch, setPostalSearch] = useState('')
  const [postalCountry, setPostalCountry] = useState('India')
  const [postalPage, setPostalPage] = useState(1)
  const filteredCountryOptions = COUNTRY_OPTIONS.filter((country) =>
    country.label.toLowerCase().includes(countrySearch.trim().toLowerCase()),
  )
  const filteredStateOptions = isB2B
    ? stateOptions.filter((state) =>
        state?.toLowerCase().includes(stateSearch.trim().toLowerCase()),
      )
    : []
  const activePostalCountry = zoneForm.countries?.includes(postalCountry)
    ? postalCountry
    : zoneForm.countries?.[0] || ''
  const { data: postalOptions = { data: [], total: 0, totalPages: 1 }, isFetching: isLoadingPostalOptions } = useQuery({
    queryKey: ['zone-postal-options', activePostalCountry, zoneForm.states, postalSearch, postalPage],
    queryFn: () => zoneService.getPostalOptions({
      country: activePostalCountry,
      states: activePostalCountry === 'India' && zoneForm.states?.length ? zoneForm.states.join('|') : '',
      search: postalSearch,
      page: postalPage,
      limit: 50,
    }),
    enabled: isOpen && Boolean(activePostalCountry),
    staleTime: 5 * 60 * 1000,
  })

  const postalKey = (item) => `${String(item.country || activePostalCountry).toLowerCase()}::${String(item.pincode).replace(/\s+/g, '').toUpperCase()}`
  const selectedPostalKeys = new Set((zoneForm.postal_codes || []).map(postalKey))
  const togglePostalCode = (location, checked) => {
    const normalized = {
      country: location.country || activePostalCountry,
      pincode: String(location.pincode || '').trim().toUpperCase(),
      city: location.city || '',
      state: location.state || '',
    }
    setZoneForm((current) => {
      const values = Array.isArray(current.postal_codes) ? current.postal_codes : []
      const key = postalKey(normalized)
      return {
        ...current,
        postal_codes: checked
          ? [...values.filter((item) => postalKey(item) !== key), normalized]
          : values.filter((item) => postalKey(item) !== key),
      }
    })
  }

  // Zones are always global - no courier filtering needed
  const zoneFilters = []

  // Validation state
  const [errors, setErrors] = useState({ code: '', name: '', countries: '', states: '' })

  useEffect(() => {
    // Reset form and errors when tab changes
    setZoneForm({
      id: null,
      code: '',
      name: '',
      description: '',
      business_type: businessType,
      is_global: true,
      country: 'India',
      countries: ['India'],
      states: [],
      postal_codes: [],
    })
    setErrors({ code: '', name: '', countries: '', states: '' })
    setStateSearch('')
    setCountrySearch('')
    setPostalSearch('')
    setPostalCountry('India')
    setPostalPage(1)
  }, [businessType])

  const openCreateModal = () => {
    setIsEdit(false)
    setZoneForm({
      id: null,
      code: '',
      name: '',
      description: '',
      business_type: businessType,
      is_global: true,
      country: 'India',
      countries: ['India'],
      states: [],
      postal_codes: [],
    })
    setErrors({ code: '', name: '', countries: '', states: '' })
    setStateSearch('')
    setCountrySearch('')
    setPostalSearch('')
    setPostalCountry('India')
    setPostalPage(1)
    onOpen()
  }

  const openEditModal = (zone) => {
    setIsEdit(true)
    setZoneForm({
      ...zone,
      country: getZoneCountries(zone)[0],
      countries: getZoneCountries(zone),
      states: Array.isArray(zone.states) ? zone.states : zone.states ? [zone.states] : [],
      postal_codes: Array.isArray(zone.postal_codes) ? zone.postal_codes : [],
    })
    // Zones are always global - no courier selection needed
    setErrors({ code: '', name: '', countries: '', states: '' })
    setStateSearch('')
    setCountrySearch('')
    setPostalSearch('')
    setPostalCountry(getZoneCountries(zone)[0] || 'India')
    setPostalPage(1)
    onOpen()
  }

  const validateForm = () => {
    const newErrors = { code: '', name: '', countries: '', states: '' }
    let valid = true

    if (!zoneForm.code.trim()) {
      newErrors.code = 'Zone code is required'
      valid = false
    }
    if (!zoneForm.name.trim()) {
      newErrors.name = 'Zone name is required'
      valid = false
    }
    if (!zoneForm.countries?.length) {
      newErrors.countries = 'Select at least one country for this zone'
      valid = false
    }
    // Zones are always global - no courier selection needed (industry standard)
    if (
      businessType === 'B2B' &&
      zoneForm.countries?.includes('India') &&
      (!zoneForm.states || zoneForm.states.length === 0)
    ) {
      newErrors.states = 'Select at least one state for this zone'
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSaveZone = () => {
    if (!validateForm()) return

    // Zones are always global (industry standard)
    // Courier selection is only for rates, not zones
    const payload = {
      ...zoneForm,
      country: zoneForm.countries[0],
      business_type: businessType,
    }

    const onSuccessHandler = () => {
      setZoneForm({
        id: null,
        code: '',
        name: '',
        description: '',
        business_type: businessType,
        country: 'India',
        countries: ['India'],
        states: [],
        postal_codes: [],
      })
      setErrors({ code: '', name: '', countries: '', states: '' })
      setStateSearch('')
      setCountrySearch('')
      setPostalSearch('')
      setPostalCountry('India')
      setPostalPage(1)
      onClose()
    }

    if (isEdit) {
      updateZone.mutate(payload, { onSuccess: onSuccessHandler })
    } else {
      createZone.mutate(payload, { onSuccess: onSuccessHandler })
    }
  }

  const handleDeleteZone = (id) => {
    deleteZone.mutate(id)
  }

  return (
    <Flex direction="column" pt={showTabs ? { base: '120px', md: '75px' } : 0}>
      {showTabs ? (
      <Tabs index={tabIndex} onChange={setTabIndex} colorScheme="brand" variant="unstyled">
        <Box bg="gray.50" borderRadius="xl" p={2} mb={6} borderWidth="1px" borderColor="gray.100">
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
                  <Tag colorScheme="purple" size="sm">
                    B2C
                  </Tag>
                  <Text fontWeight="semibold">Consumer Zones</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  Use for standard D2C pricing where pincodes are map-managed manually.
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
                  <Tag colorScheme="blue" size="sm">
                    B2B
                  </Tag>
                  <Text fontWeight="semibold">Enterprise Zones</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600">
                  State-driven zones that auto-map pincodes and tie into the rate matrix.
                </Text>
              </Stack>
            </Tab>
          </TabList>
        </Box>

        <TabPanels>
          {['B2C', 'B2B'].map((type) => (
            <TabPanel key={type}>
              <Flex
                justify={businessType === 'B2C' ? 'flex-end' : 'space-between'}
                align="center"
                mb={4}
              >
                {/* Zones are always global - no filters needed */}
              </Flex>

              <GenericTable
                title={`${type} Zones`}
                data={zones}
                titleActions={
                  <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={openCreateModal}>
                    Add {businessType} Zone
                  </Button>
                }
                captions={
                  businessType === 'B2B'
                    ? [
                        'id',
                        'Code',
                        'Name',
                        'Description',
                        'Countries',
                        'States',
                        'Created At',
                      ]
                    : ['id', 'Code', 'Name', 'Description', 'Countries', 'Created At']
                }
                columnKeys={
                  businessType === 'B2B'
                    ? [
                        'id',
                        'code',
                        'name',
                        'description',
                        'countries',
                        'states',
                        'created_at',
                      ]
                    : ['id', 'code', 'name', 'description', 'countries', 'created_at']
                }
                loading={isLoading}
                renderActions={(row) => (
                  <Flex gap={2}>
                    <IconButton
                      aria-label="Edit"
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="yellow"
                      onClick={() => openEditModal(row)}
                    />
                    <IconButton
                      aria-label="Delete"
                      icon={<DeleteIcon />}
                      size="sm"
                      colorScheme="red"
                      onClick={() => handleDeleteZone(row.id)}
                    />
                    {businessType === 'B2B' ? (
                      <Button
                        size="sm"
                        colorScheme="blue"
                        leftIcon={<LinkIcon boxSize={4} />}
                        borderRadius="md"
                        _hover={{ bg: 'blue.600', transform: 'scale(1.05)' }}
                        onClick={() => history.push(`/admin/zones-mappings/${row.id}`)}
                      >
                        Mappings
                      </Button>
                    ) : null}
                  </Flex>
                )}
                paginated={false}
                renderers={{
                  created_at: (row) =>
                    new Date(row).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                  name: (row) => <Text fontStyle="italic">{row}</Text>,
                  countries: (value, row) => {
                    const countries = Array.isArray(value) && value.length ? value : [row?.country || 'India']
                    return countries.join(', ')
                  },
                  states: (value) => {
                    if (!Array.isArray(value) || value.length === 0) return '-'
                    const visible = value.slice(0, 3)
                    const extraCount = value.length - visible.length
                    return (
                      <HStack spacing={1} flexWrap="wrap">
                        {visible.map((state) => (
                          <Tag key={state} size="sm" colorScheme="blue">
                            {state}
                          </Tag>
                        ))}
                        {extraCount > 0 && (
                          <Tooltip label={value.join(', ')}>
                            <Tag size="sm" colorScheme="gray">
                              +{extraCount}
                            </Tag>
                          </Tooltip>
                        )}
                      </HStack>
                    )
                  },
                }}
                w="100%"
              />
            </TabPanel>
          ))}
        </TabPanels>
      </Tabs>
      ) : (
        <Box>
          <Flex
            justify={businessType === 'B2C' ? 'flex-end' : 'space-between'}
            align="center"
            mb={4}
          >
            {/* Zones are always global - no filters needed */}
          </Flex>

          <GenericTable
            title={`${businessType} Zones`}
            data={zones}
            titleActions={
              <Button leftIcon={<AddIcon />} colorScheme="brand" onClick={openCreateModal}>
                Add {businessType} Zone
              </Button>
            }
            captions={
              businessType === 'B2B'
                ? [
                    'id',
                    'Code',
                    'Name',
                    'Description',
                    'Countries',
                    'States',
                    'Created At',
                  ]
                : ['id', 'Code', 'Name', 'Description', 'Countries', 'Created At']
            }
            columnKeys={
              businessType === 'B2B'
                ? [
                    'id',
                    'code',
                    'name',
                    'description',
                    'countries',
                    'states',
                    'created_at',
                  ]
                : ['id', 'code', 'name', 'description', 'countries', 'created_at']
            }
            loading={isLoading}
            renderActions={(row) => (
              <Flex gap={2}>
                <IconButton
                  aria-label="Edit"
                  icon={<EditIcon />}
                  size="sm"
                  colorScheme="yellow"
                  onClick={() => openEditModal(row)}
                />
                <IconButton
                  aria-label="Delete"
                  icon={<DeleteIcon />}
                  size="sm"
                  colorScheme="red"
                  onClick={() => handleDeleteZone(row.id)}
                />
                {businessType === 'B2B' ? (
                  <Button
                    size="sm"
                    colorScheme="blue"
                    leftIcon={<LinkIcon boxSize={4} />}
                    borderRadius="md"
                    _hover={{ bg: 'blue.600', transform: 'scale(1.05)' }}
                    onClick={() => history.push(`/admin/zones-mappings/${row.id}`)}
                  >
                    Mappings
                  </Button>
                ) : null}
              </Flex>
            )}
            paginated={false}
            renderers={{
              created_at: (row) =>
                new Date(row).toLocaleString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                }),
              name: (row) => <Text fontStyle="italic">{row}</Text>,
              countries: (value, row) => {
                const countries = Array.isArray(value) && value.length ? value : [row?.country || 'India']
                return countries.join(', ')
              },
              states: (value) => {
                if (!Array.isArray(value) || value.length === 0) return '-'
                const visible = value.slice(0, 3)
                const extraCount = value.length - visible.length
                return (
                  <HStack spacing={1} flexWrap="wrap">
                    {visible.map((state) => (
                      <Tag key={state} size="sm" colorScheme="blue">
                        {state}
                      </Tag>
                    ))}
                    {extraCount > 0 && (
                      <Tooltip label={value.join(', ')}>
                        <Tag size="sm" colorScheme="gray">
                          +{extraCount}
                        </Tag>
                      </Tooltip>
                    )}
                  </HStack>
                )
              },
            }}
            w="100%"
          />
        </Box>
      )}

      {/* Add/Edit Zone Modal */}
      <CustomModal
        isOpen={isOpen}
        onClose={onClose}
        title={isEdit ? 'Edit Zone' : 'Add New Zone'}
        footer={
          <>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleSaveZone}
              isLoading={isEdit ? updateZone.isPending : createZone.isPending}
            >
              {isEdit ? 'Update' : 'Create'}
            </Button>
          </>
        }
      >
        <Stack spacing={6}>
          <FormControl isRequired isInvalid={Boolean(errors.code)}>
            <FormLabel>Zone Code</FormLabel>
            <Input
              placeholder="e.g. A"
              value={zoneForm.code}
              onChange={(e) => setZoneForm({ ...zoneForm, code: e.target.value.toUpperCase() })}
            />
            <FormErrorMessage>{errors.code}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={Boolean(errors.name)}>
            <FormLabel>Zone Name</FormLabel>
            <Input
              placeholder="e.g. Central Metro"
              value={zoneForm.name}
              onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
            />
            <FormErrorMessage>{errors.name}</FormErrorMessage>
          </FormControl>

          <FormControl>
            <FormLabel>Description</FormLabel>
            <Input
              placeholder="Optional note that the ops team will see"
              value={zoneForm.description}
              onChange={(e) => setZoneForm({ ...zoneForm, description: e.target.value })}
            />
            <FormHelperText>Helps teammates understand what this zone represents.</FormHelperText>
          </FormControl>

          <FormControl isRequired isInvalid={Boolean(errors.countries)}>
            <Flex align="center" justify="space-between" mb={2}>
              <FormLabel m={0}>Countries in this zone</FormLabel>
              <Text fontSize="sm" color="gray.500">
                Selected: {zoneForm.countries?.length || 0}
              </Text>
            </Flex>
            <Input
              placeholder="Search countries..."
              size="sm"
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              mb={3}
            />
            <Box borderWidth="1px" borderRadius="md" maxH="220px" overflowY="auto" p={3}>
              <CheckboxGroup
                value={zoneForm.countries || []}
                onChange={(values) => {
                  const countries = Array.isArray(values) ? values.map(String) : []
                  if (!countries.includes(postalCountry)) setPostalCountry(countries[0] || '')
                  setPostalPage(1)
                  setZoneForm((current) => ({
                    ...current,
                    country: countries[0] || '',
                    countries,
                    states: countries.includes('India') ? current.states : [],
                    postal_codes: (current.postal_codes || []).filter((item) => countries.includes(item.country)),
                  }))
                }}
              >
                <SimpleGrid columns={{ base: 1, sm: 2 }} spacingY={2} spacingX={3}>
                  {filteredCountryOptions.map((country) => (
                    <Checkbox key={country.value} value={country.value}>
                      {country.label}
                    </Checkbox>
                  ))}
                </SimpleGrid>
              </CheckboxGroup>
            </Box>
            <FormHelperText>
              Select India for domestic zones, or one or more destination countries for international rates.
            </FormHelperText>
            <FormErrorMessage>{errors.countries}</FormErrorMessage>
          </FormControl>

          {businessType === 'B2B' && zoneForm.countries?.includes('India') && (
            <Stack spacing={5} borderWidth="1px" borderRadius="lg" p={5} bg="blue.50">
              <Text fontWeight="semibold" fontSize="lg" color="blue.700">
                B2B Zone Coverage
              </Text>
              <Text fontSize="sm" color="gray.600">
                Zones are shared across all couriers. Each courier will have different rates for the same zone pairs.
                You'll select the courier when creating rates.
              </Text>

              <FormControl isRequired isInvalid={Boolean(errors.states)}>
                <Flex align="center" justify="space-between" mb={2}>
                  <FormLabel m={0}>States in this zone</FormLabel>
                  {isLoadingStates && <Spinner size="sm" />}
                </Flex>

                <Input
                  placeholder="Quick search…"
                  size="sm"
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  mb={3}
                />

                {zoneForm.states?.length > 0 && (
                  <Box mb={3}>
                    <Text fontSize="sm" color="gray.600" mb={1}>
                      Selected ({zoneForm.states.length}):
                    </Text>
                    <Wrap spacing={2}>
                      {zoneForm.states.map((state) => (
                        <WrapItem key={state}>
                          <Tag size="sm" colorScheme="blue">
                            {state}
                          </Tag>
                        </WrapItem>
                      ))}
                    </Wrap>
                  </Box>
                )}

                <Box
                  borderWidth="1px"
                  borderRadius="md"
                  maxH="250px"
                  overflowY="auto"
                  px={3}
                  py={3}
                  bg="white"
                >
                  <CheckboxGroup
                    value={zoneForm.states || []}
                    onChange={(values) =>
                      setZoneForm((current) => {
                        const states = Array.isArray(values) ? values.map((val) => String(val)) : []
                        const stateSet = new Set(states.map((state) => state.toLowerCase()))
                        return {
                          ...current,
                          states,
                          postal_codes: (current.postal_codes || []).filter((item) => (
                            item.country !== 'India' || stateSet.has(String(item.state || '').toLowerCase())
                          )),
                        }
                      })
                    }
                  >
                    {filteredStateOptions.length > 0 ? (
                      <SimpleGrid columns={{ base: 1, sm: 2 }} spacingY={2} spacingX={3}>
                        {filteredStateOptions.map((state) => (
                          <Checkbox key={state} value={state} isDisabled={isLoadingStates}>
                            {state}
                          </Checkbox>
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Text fontSize="sm" color="gray.500">
                        {stateSearch ? 'No states match your search.' : 'States list unavailable.'}
                      </Text>
                    )}
                  </CheckboxGroup>
                </Box>
                <FormHelperText>
                  We will auto-map every pincode from the selected states to this zone. Adjust
                  special pincodes later from Pincode Management.
                </FormHelperText>
                <FormErrorMessage>{errors.states}</FormErrorMessage>
              </FormControl>
            </Stack>
          )}

          {zoneForm.countries?.length > 0 && (
            <Stack spacing={4} borderWidth="1px" borderRadius="lg" p={5} bg="gray.50">
              <Flex align="center" justify="space-between" gap={3} wrap="wrap">
                <Box>
                  <Text fontWeight="semibold" fontSize="lg" color="gray.800">
                    Pincodes / Postal codes in this zone
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Search and tick the exact delivery codes that should use this zone.
                  </Text>
                </Box>
                <Tag colorScheme={(zoneForm.postal_codes || []).length ? 'blue' : 'green'}>
                  {(zoneForm.postal_codes || []).length
                    ? `${zoneForm.postal_codes.length} selected`
                    : 'All matching codes'}
                </Tag>
              </Flex>

              {zoneForm.countries.length > 1 && (
                <FormControl>
                  <FormLabel>Country to browse</FormLabel>
                  <Select
                    value={activePostalCountry}
                    onChange={(e) => {
                      setPostalCountry(e.target.value)
                      setPostalPage(1)
                    }}
                    bg="white"
                  >
                    {zoneForm.countries.map((country) => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Input
                placeholder="Search pincode, city or state..."
                value={postalSearch}
                onChange={(e) => {
                  setPostalSearch(e.target.value)
                  setPostalPage(1)
                }}
                bg="white"
              />

              {(zoneForm.postal_codes || []).length > 0 && (
                <Box>
                  <Text fontSize="sm" color="gray.600" mb={2}>Selected postal codes:</Text>
                  <Wrap spacing={2}>
                    {zoneForm.postal_codes.slice(0, 20).map((item) => (
                      <WrapItem key={postalKey(item)}>
                        <Tag size="sm" colorScheme="blue">
                          {item.pincode} · {item.country}
                        </Tag>
                      </WrapItem>
                    ))}
                    {zoneForm.postal_codes.length > 20 && (
                      <WrapItem><Tag size="sm">+{zoneForm.postal_codes.length - 20} more</Tag></WrapItem>
                    )}
                  </Wrap>
                </Box>
              )}

              <Box borderWidth="1px" borderRadius="md" bg="white" maxH="300px" overflowY="auto">
                {isLoadingPostalOptions ? (
                  <Flex justify="center" p={6}><Spinner /></Flex>
                ) : postalOptions.data?.length ? (
                  <Stack spacing={0} divider={<Divider />}>
                    {postalOptions.data.map((location) => (
                      <Checkbox
                        key={postalKey(location)}
                        isChecked={selectedPostalKeys.has(postalKey(location))}
                        onChange={(e) => togglePostalCode(location, e.target.checked)}
                        px={4}
                        py={3}
                        alignItems="flex-start"
                      >
                        <Text as="span" fontWeight="bold">{location.pincode}</Text>
                        <Text as="span" color="gray.600">
                          {' '}— {[location.city, location.state, location.country].filter(Boolean).join(', ')}
                        </Text>
                      </Checkbox>
                    ))}
                  </Stack>
                ) : (
                  <Text p={5} color="gray.500">No postal codes match this search.</Text>
                )}
              </Box>

              <Flex justify="space-between" align="center">
                <Button
                  size="sm"
                  onClick={() => setPostalPage((page) => Math.max(1, page - 1))}
                  isDisabled={postalPage <= 1}
                >
                  Previous
                </Button>
                <Text fontSize="sm" color="gray.600">
                  Page {postalPage} of {postalOptions.totalPages || 1} · {postalOptions.total || 0} codes
                </Text>
                <Button
                  size="sm"
                  onClick={() => setPostalPage((page) => page + 1)}
                  isDisabled={postalPage >= (postalOptions.totalPages || 1)}
                >
                  Next
                </Button>
              </Flex>

              <FormHelperText>
                With no individual ticks, the zone covers every matching code from its selected countries/states.
                Once codes are ticked, this zone is restricted to those codes.
              </FormHelperText>
            </Stack>
          )}
        </Stack>
      </CustomModal>
    </Flex>
  )
}

export default ZonesManagement
