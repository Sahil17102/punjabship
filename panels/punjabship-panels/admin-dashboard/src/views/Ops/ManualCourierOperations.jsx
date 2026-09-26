import { RepeatIcon, SearchIcon, ViewIcon } from '@chakra-ui/icons'
import {
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  Tabs,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tooltip,
  Tr,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useLocation } from 'react-router-dom'
import {
  addManualTracking,
  assignManualFulfilment,
  getManualProviderOptions,
  getManualShipment,
  getManualShipments,
  getManualShipmentStats,
  rebookManualShipment,
  reconcileManualAwb,
  releaseManualProviderBooking,
} from 'services/manualCourier.service'

const HUB_FIELDS = [
  ['warehouse_name', 'Hub name'],
  ['name', 'Contact name'],
  ['phone', 'Phone'],
  ['address', 'Address'],
  ['city', 'City'],
  ['state', 'State'],
  ['pincode', 'Pincode'],
]
const TRACKING_STATUSES = [
  ['booked', 'Booked'],
  ['picked_up', 'Picked up'],
  ['in_transit', 'In transit'],
  ['out_for_delivery', 'Out for delivery'],
  ['ndr', 'NDR'],
  ['delivered', 'Delivered'],
  ['rto', 'RTO initiated'],
  ['rto_in_transit', 'RTO in transit'],
  ['rto_delivered', 'RTO delivered'],
  ['cancelled', 'Cancelled'],
]
const money = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(value || 0))
const dateTime = (value) => (value ? new Date(value).toLocaleString('en-IN') : '-')
const modeColor = (mode) => (mode === 'integrated' ? 'blue' : mode === 'manual' ? 'orange' : 'gray')
const createIdempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() ||
  `manual-${Date.now()}-${Math.random().toString(16).slice(2)}`
const actionDetails = (event) => {
  if (event?.source !== 'customer' || !event.raw || typeof event.raw !== 'object') return ''
  return Object.entries(event.raw)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim())
    .map(
      ([key, value]) =>
        `${key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')}: ${String(value)}`,
    )
    .join(' / ')
}

const Metric = ({ label, value, moneyValue = false, danger = false }) => (
  <Stat border="1px solid" borderColor={danger ? 'red.200' : 'gray.200'} bg="white" p={4} borderRadius="md">
    <StatLabel color={danger ? 'red.600' : 'gray.500'} fontSize="sm">
      {label}
    </StatLabel>
    <StatNumber fontSize="xl">{moneyValue ? money(value) : Number(value || 0).toLocaleString('en-IN')}</StatNumber>
  </Stat>
)

export default function ManualCourierOperations() {
  const toast = useToast()
  const drawer = useDisclosure()
  const location = useLocation()
  const routeSearch = useMemo(
    () => new URLSearchParams(location.search).get('search') || '',
    [location.search],
  )
  const [rows, setRows] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [detail, setDetail] = useState(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    search: routeSearch,
    status: '',
    fulfilmentMode: '',
  })
  const [activeTab, setActiveTab] = useState(0)
  const [tracking, setTracking] = useState({
    statusCode: 'in_transit',
    statusText: 'Shipment in transit',
    location: '',
    remarks: '',
    eventAt: new Date().toISOString().slice(0, 16),
  })
  const [hub, setHub] = useState({})
  const [providerOptions, setProviderOptions] = useState([])
  const [selectedOption, setSelectedOption] = useState('')
  const [providerAttemptKey, setProviderAttemptKey] = useState(createIdempotencyKey)
  const [reconcile, setReconcile] = useState({
    integrationType: 'delhivery',
    actualAwb: '',
    courierPartner: '',
    providerReference: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [shipments, metrics] = await Promise.all([
        getManualShipments({ ...filters, page, limit: 20 }),
        getManualShipmentStats(),
      ])
      setRows(shipments.data || [])
      setTotal(shipments.totalCount || 0)
      setStats(metrics || {})
    } catch (error) {
      toast({
        title: 'Could not load manual courier operations',
        description: error?.response?.data?.message,
        status: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [filters, page, toast])

  useEffect(() => {
    const timeout = setTimeout(load, 250)
    return () => clearTimeout(timeout)
  }, [load])

  useEffect(() => {
    setPage(1)
    setFilters((current) => ({ ...current, search: routeSearch }))
  }, [routeSearch])

  const openDetail = async (row) => {
    drawer.onOpen()
    setDetail(null)
    setProviderOptions([])
    setSelectedOption('')
    setActiveTab(0)
    setProviderAttemptKey(createIdempotencyKey())
    try {
      const response = await getManualShipment(row.id)
      setDetail(response)
      const pickup = response.order?.pickup_details
      setHub(pickup && typeof pickup === 'object' ? pickup : {})
    } catch (error) {
      toast({
        title: 'Could not load shipment',
        description: error?.response?.data?.message || error.message,
        status: 'error',
      })
    }
  }

  const refreshDetail = async () => {
    if (!detail?.shipment?.id) return
    setDetail(await getManualShipment(detail.shipment.id))
    await load()
  }

  const runAction = async (action, title) => {
    setBusy(true)
    try {
      await action()
      toast({ title, status: 'success' })
      await refreshDetail()
      return true
    } catch (error) {
      toast({
        title: 'Operation failed',
        description: error?.response?.data?.message || error.message,
        status: 'error',
      })
      return false
    } finally {
      setBusy(false)
    }
  }

  const selectedProvider = useMemo(
    () =>
      providerOptions.find(
        (option) =>
          String(option.courier_option_key || `${option.id}__${option.integration_type}`) ===
          selectedOption,
      ),
    [providerOptions, selectedOption],
  )

  const loadProviderOptions = async () => {
    setBusy(true)
    try {
      const options = await getManualProviderOptions(detail.shipment.id, hub)
      setProviderOptions(options || [])
      const first = options?.[0]
      setSelectedOption(
        first ? String(first.courier_option_key || `${first.id}__${first.integration_type}`) : '',
      )
      setProviderAttemptKey(createIdempotencyKey())
      if (!first) toast({ title: 'No integrated courier is available for this route', status: 'warning' })
    } catch (error) {
      toast({
        title: 'Could not fetch integrated couriers',
        description: error?.response?.data?.message,
        status: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  const bookProvider = () => {
    if (!selectedProvider) return
    const provider = selectedProvider
    return runAction(
      () =>
        rebookManualShipment(detail.shipment.id, {
          idempotencyKey: providerAttemptKey,
          hubPickup: hub,
          integrationType: provider.integration_type || provider.serviceProvider,
          courierId: provider.id || provider.courier_id,
          courierPartner: provider.name || provider.displayName,
          shippingRateId: provider.rate_card_id || provider.localRates?.forward?.shipping_rate_id,
          courierOptionKey: provider.courier_option_key,
          zoneId: provider.zone_id || provider.localRates?.forward?.zone_id,
          selectedMaxSlabWeight: provider.max_slab_weight,
          amazonRequestToken: provider.amazon_request_token,
          amazonRateId: provider.amazon_rate_id,
          amazonCarrierId: provider.amazon_carrier_id,
          amazonServiceId: provider.amazon_service_id,
        }),
      'Provider AWB linked successfully',
    )
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={5}>
      <Flex
        justify="space-between"
        align={{ base: 'stretch', md: 'center' }}
        direction={{ base: 'column', md: 'row' }}
        gap={3}
      >
        <Box>
          <Text fontSize="2xl" fontWeight="700">Manual Courier Shipments</Text>
          <Text color="gray.500" fontSize="sm">
            Customer orders remain in the main order list and are handled here as an operations queue.
          </Text>
        </Box>
        <HStack>
          <Button as={RouterLink} to="/admin/manual-courier/setup" variant="outline">
            Courier setup
          </Button>
          <Tooltip label="Refresh queue">
            <IconButton aria-label="Refresh queue" icon={<RepeatIcon />} onClick={load} />
          </Tooltip>
        </HStack>
      </Flex>

      <SimpleGrid columns={{ base: 2, lg: 5 }} spacing={4}>
        <Metric label="Total" value={stats.total} />
        <Metric label="Unassigned" value={stats.unassigned} />
        <Metric label="Fully manual" value={stats.manual} />
        <Metric label="Provider mapped" value={stats.integrated} />
        <Metric label="Action required" value={stats.actionRequired} danger />
      </SimpleGrid>

      <Flex gap={3} direction={{ base: 'column', md: 'row' }}>
        <InputGroup maxW={{ md: '420px' }}>
          <InputLeftElement pointerEvents="none"><SearchIcon color="gray.400" /></InputLeftElement>
          <Input
            bg="white"
            placeholder="Search AWB, courier or merchant"
            value={filters.search}
            onChange={(event) => {
              setPage(1)
              setFilters({ ...filters, search: event.target.value })
            }}
          />
        </InputGroup>
        <Select
          bg="white"
          maxW={{ md: '210px' }}
          value={filters.fulfilmentMode}
          onChange={(event) => {
            setPage(1)
            setFilters({ ...filters, fulfilmentMode: event.target.value })
          }}
        >
          <option value="">All fulfilment modes</option>
          <option value="unassigned">Unassigned</option>
          <option value="manual">Fully manual</option>
          <option value="integrated">Provider mapped</option>
        </Select>
        <Select
          bg="white"
          maxW={{ md: '210px' }}
          value={filters.status}
          onChange={(event) => {
            setPage(1)
            setFilters({ ...filters, status: event.target.value })
          }}
        >
          <option value="">All statuses</option>
          <option value="booked">Booked</option>
          <option value="manual_processing">Manual processing</option>
          <option value="provider_booking">Provider booking</option>
          <option value="provider_booked">Provider booked</option>
          <option value="action_required">Action required</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </Flex>

      <Box bg="white" border="1px solid" borderColor="gray.200" borderRadius="md" overflowX="auto">
        {loading ? (
          <Flex p={12} justify="center"><Spinner /></Flex>
        ) : (
          <Table size="sm">
            <Thead bg="gray.50">
              <Tr>
                <Th>Local AWB</Th><Th>Order</Th><Th>Courier</Th><Th>Merchant</Th>
                <Th>Customer</Th><Th>Mode</Th><Th>Status</Th><Th>Booked</Th><Th />
              </Tr>
            </Thead>
            <Tbody>
              {rows.map((row) => (
                <Tr key={row.id}>
                  <Td><Text fontFamily="mono" fontWeight="600">{row.localAwb}</Text><Badge>{row.orderType.toUpperCase()}</Badge></Td>
                  <Td><Text fontWeight="600">{row.orderNumber}</Text><Text fontSize="xs" color="gray.500">{row.paymentType?.toUpperCase()} / {money(row.orderAmount)}</Text></Td>
                  <Td>{row.commercialCourierName}</Td>
                  <Td>{row.merchantEmail}</Td>
                  <Td>{row.buyerName}<Text fontSize="xs" color="gray.500">{row.destinationPincode}</Text></Td>
                  <Td><Badge colorScheme={modeColor(row.fulfilmentMode)}>{row.fulfilmentMode}</Badge></Td>
                  <Td><Badge colorScheme={row.operationStatus === 'action_required' ? 'red' : 'gray'}>{row.operationStatus.replaceAll('_', ' ')}</Badge></Td>
                  <Td whiteSpace="nowrap">{dateTime(row.createdAt)}</Td>
                  <Td>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<ViewIcon />}
                      onClick={() => openDetail(row)}
                    >
                      Manage
                    </Button>
                  </Td>
                </Tr>
              ))}
              {!rows.length && <Tr><Td colSpan={9} py={10} textAlign="center" color="gray.500">No shipments match these filters.</Td></Tr>}
            </Tbody>
          </Table>
        )}
      </Box>
      <Flex justify="space-between">
        <Text color="gray.500" fontSize="sm">{total.toLocaleString('en-IN')} shipments</Text>
        <HStack>
          <Button size="sm" isDisabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <Text fontSize="sm">Page {page}</Text>
          <Button size="sm" isDisabled={page * 20 >= total} onClick={() => setPage(page + 1)}>Next</Button>
        </HStack>
      </Flex>

      <Drawer isOpen={drawer.isOpen} onClose={drawer.onClose} size="xl">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Shipment operations</DrawerHeader>
          <DrawerBody pb={8}>
            {!detail ? <Spinner /> : (
              <VStack align="stretch" spacing={5}>
                <Box>
                  <Text fontFamily="mono" fontSize="lg" fontWeight="700">{detail.shipment.localAwb}</Text>
                  <Text color="gray.500">{detail.order.order_number} / {detail.shipment.commercialCourierName}</Text>
                </Box>
                <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
                  <Metric label="Order value" value={detail.order.order_amount} moneyValue />
                  <Metric label="Freight" value={detail.order.freight_charges} moneyValue />
                  <Metric label="Wallet debit" value={detail.order.wallet_debit_amount} moneyValue />
                  <Metric label="Transactions" value={detail.transactions.length} />
                </SimpleGrid>
                <Box border="1px solid" borderColor="gray.200" borderRadius="md" p={4}>
                  <Text fontWeight="700" mb={1}>Choose fulfilment workflow</Text>
                  <Text color="gray.500" fontSize="sm" mb={4}>
                    Keep the local AWB for the customer and choose how PunjabShip will complete this shipment.
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    <Button
                      colorScheme="orange"
                      variant="outline"
                      isLoading={busy}
                      isDisabled={detail.shipment.fulfilmentMode === 'integrated'}
                      onClick={async () => {
                        if (detail.shipment.fulfilmentMode === 'manual') {
                          setActiveTab(1)
                          return
                        }
                        const succeeded = await runAction(
                          () => assignManualFulfilment(detail.shipment.id),
                          'Assigned for fully manual fulfilment',
                        )
                        if (succeeded) setActiveTab(1)
                      }}
                    >
                      {detail.shipment.fulfilmentMode === 'manual'
                        ? 'Open manual tracking'
                        : 'Handle fully manually'}
                    </Button>
                    <Button
                      colorScheme="brand"
                      isDisabled={
                        detail.shipment.orderType !== 'b2c' ||
                        detail.legs.some((leg) => leg.isActive)
                      }
                      onClick={() => setActiveTab(2)}
                    >
                      Book with integrated provider
                    </Button>
                  </SimpleGrid>
                  {detail.shipment.orderType !== 'b2c' && (
                    <Text color="gray.500" fontSize="sm" mt={3}>
                      Integrated provider booking is available for B2C shipments. Process this B2B shipment fully manually.
                    </Text>
                  )}
                  {detail.shipment.operationStatus === 'provider_booking' && (
                    <Box mt={4} pt={4} borderTop="1px solid" borderColor="gray.200">
                      <Text fontWeight="600" color="red.600">Provider booking needs review</Text>
                      <Text color="gray.500" fontSize="sm" mb={3}>
                        Check the provider first. Release this state only when no AWB was linked automatically.
                      </Text>
                      <Button
                        colorScheme="red"
                        variant="outline"
                        isLoading={busy}
                        onClick={() =>
                          runAction(async () => {
                            await releaseManualProviderBooking(detail.shipment.id)
                            setProviderAttemptKey(createIdempotencyKey())
                          }, 'Provider booking released for review')
                        }
                      >
                        Release stuck provider booking
                      </Button>
                    </Box>
                  )}
                </Box>
                <Tabs colorScheme="green" isLazy index={activeTab} onChange={setActiveTab}>
                  <TabList overflowX="auto"><Tab>Overview</Tab><Tab>Tracking</Tab><Tab>Provider booking</Tab><Tab>Reconcile AWB</Tab></TabList>
                  <TabPanels>
                    <TabPanel px={0}>
                      <VStack align="stretch" spacing={4}>
                        <Grid templateColumns="140px 1fr" gap={2} fontSize="sm">
                          <Text color="gray.500">Merchant</Text><Text>{detail.merchant.email}</Text>
                          <Text color="gray.500">Customer</Text><Text>{detail.order.buyer_name} / {detail.order.buyer_phone}</Text>
                          <Text color="gray.500">Destination</Text><Text>{detail.order.city}, {detail.order.state} {detail.order.pincode}</Text>
                          <Text color="gray.500">Fulfilment</Text><Badge w="fit-content" colorScheme={modeColor(detail.shipment.fulfilmentMode)}>{detail.shipment.fulfilmentMode}</Badge>
                        </Grid>
                        <Divider />
                        <Text fontWeight="700">Provider legs</Text>
                        {detail.legs.map((leg) => (
                          <Box key={leg.id} borderBottom="1px solid" borderColor="gray.100" pb={3}>
                            <HStack justify="space-between"><Text fontWeight="600">{leg.providerCourierName || leg.provider}</Text><Badge colorScheme={leg.isActive ? 'green' : 'gray'}>{leg.status}</Badge></HStack>
                            <Text fontFamily="mono" fontSize="sm">{leg.actualAwb || 'AWB not returned'}</Text>
                            {leg.providerLabelUrl && <Button as="a" href={leg.providerLabelUrl} target="_blank" rel="noreferrer" size="xs" mt={2} variant="outline">Open provider label</Button>}
                            {leg.errorMessage && <Text color="red.600" fontSize="sm">{leg.errorMessage}</Text>}
                          </Box>
                        ))}
                        {!detail.legs.length && <Text color="gray.500">No onward provider booking.</Text>}
                      </VStack>
                    </TabPanel>
                    <TabPanel px={0}>
                      <VStack align="stretch" spacing={4}>
                        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                          <FormControl><FormLabel>Status</FormLabel><Select value={tracking.statusCode} onChange={(event) => {
                            const option = TRACKING_STATUSES.find(([value]) => value === event.target.value)
                            setTracking({ ...tracking, statusCode: event.target.value, statusText: option?.[1] || tracking.statusText })
                          }}>{TRACKING_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></FormControl>
                          <FormControl><FormLabel>Event time</FormLabel><Input type="datetime-local" value={tracking.eventAt} onChange={(event) => setTracking({ ...tracking, eventAt: event.target.value })} /></FormControl>
                          <FormControl><FormLabel>Customer message</FormLabel><Input value={tracking.statusText} onChange={(event) => setTracking({ ...tracking, statusText: event.target.value })} /></FormControl>
                          <FormControl><FormLabel>Location</FormLabel><Input value={tracking.location} onChange={(event) => setTracking({ ...tracking, location: event.target.value })} /></FormControl>
                        </Grid>
                        <FormControl><FormLabel>Remarks</FormLabel><Textarea value={tracking.remarks} onChange={(event) => setTracking({ ...tracking, remarks: event.target.value })} /></FormControl>
                        <Button alignSelf="flex-start" colorScheme="brand" isLoading={busy} onClick={() => runAction(() => addManualTracking(detail.shipment.id, { ...tracking, eventAt: new Date(tracking.eventAt).toISOString() }), 'Tracking update published')}>Publish tracking update</Button>
                        <Divider />
                        {detail.events.map((event) => <Box key={event.id} borderLeft="2px solid" borderColor="green.400" pl={3}><Text fontWeight="600">{event.statusText}</Text><Text fontSize="sm" color="gray.500">{event.location || 'Location not supplied'} / {dateTime(event.eventAt)}</Text>{event.remarks && <Text fontSize="sm">{event.remarks}</Text>}{actionDetails(event) && <Text fontSize="sm" color="gray.600">{actionDetails(event)}</Text>}</Box>)}
                      </VStack>
                    </TabPanel>
                    <TabPanel px={0}>
                      <VStack align="stretch" spacing={4}>
                        <Text color="gray.600" fontSize="sm">Use the PunjabShip hub address where the integrated provider will receive the manually collected parcel.</Text>
                        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={3}>
                          {HUB_FIELDS.map(([key, label]) => <FormControl key={key}><FormLabel>{label}</FormLabel><Input value={hub[key] || ''} onChange={(event) => setHub({ ...hub, [key]: event.target.value })} /></FormControl>)}
                        </Grid>
                        <Button
                          alignSelf="flex-start"
                          variant="outline"
                          isLoading={busy}
                          isDisabled={detail.shipment.orderType !== 'b2c'}
                          onClick={loadProviderOptions}
                        >
                          Check integrated couriers
                        </Button>
                        {!!providerOptions.length && <>
                          <FormControl><FormLabel>Integrated courier</FormLabel><Select value={selectedOption} onChange={(event) => {
                            setSelectedOption(event.target.value)
                            setProviderAttemptKey(createIdempotencyKey())
                          }}>
                            {providerOptions.map((option) => {
                              const key = String(option.courier_option_key || `${option.id}__${option.integration_type}`)
                              return <option key={key} value={key}>{option.displayName || option.name} / {money(option.wallet_debit_amount || option.total_charges_with_gst || option.total_charges)}</option>
                            })}
                          </Select></FormControl>
                          <Button alignSelf="flex-start" colorScheme="brand" isLoading={busy} isDisabled={detail.legs.some((leg) => leg.isActive)} onClick={bookProvider}>Book and link provider AWB</Button>
                        </>}
                      </VStack>
                    </TabPanel>
                    <TabPanel px={0}>
                      <VStack align="stretch" spacing={4}>
                        <Text color="gray.600" fontSize="sm">Use only when provider booking succeeded but automatic AWB mapping failed.</Text>
                        <FormControl><FormLabel>Provider</FormLabel><Select value={reconcile.integrationType} onChange={(event) => setReconcile({ ...reconcile, integrationType: event.target.value })}><option value="delhivery">Delhivery</option><option value="ekart">Ekart</option><option value="xpressbees">Xpressbees</option><option value="shadowfax">Shadowfax</option><option value="amazon">Amazon Shipping</option></Select></FormControl>
                        <FormControl isRequired><FormLabel>Actual provider AWB</FormLabel><Input value={reconcile.actualAwb} onChange={(event) => setReconcile({ ...reconcile, actualAwb: event.target.value })} /></FormControl>
                        <FormControl><FormLabel>Provider courier name</FormLabel><Input value={reconcile.courierPartner} onChange={(event) => setReconcile({ ...reconcile, courierPartner: event.target.value })} /></FormControl>
                        <FormControl><FormLabel>Provider reference</FormLabel><Input value={reconcile.providerReference} onChange={(event) => setReconcile({ ...reconcile, providerReference: event.target.value })} /></FormControl>
                        <Button alignSelf="flex-start" colorScheme="red" variant="outline" isLoading={busy} onClick={() => runAction(() => reconcileManualAwb(detail.shipment.id, reconcile), 'Provider AWB reconciled')}>Link provider AWB</Button>
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </VStack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Flex>
  )
}
