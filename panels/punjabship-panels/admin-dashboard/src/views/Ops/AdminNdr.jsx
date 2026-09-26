import { QuestionOutlineIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Flex,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Stack,
  Tag,
  Text,
  Textarea,
  Tooltip,
  useDisclosure,
} from '@chakra-ui/react'
import CustomDatePicker from 'components/Input/CustomDatePicker'
import CustomModal from 'components/Modal/CustomModal'
import TableFilters from 'components/Tables/TableFilters'
import {
  useDelhiveryPickupReschedule,
  useNdrBulk,
  useNdrChangeAddress,
  useNdrChangePhone,
  useNdrReattempt,
} from 'hooks/useNdr'
import { useAdminNdr } from 'hooks/useOps'
import { useEffect, useState } from 'react'
import { FiClock, FiMapPin, FiPhone, FiRotateCw } from 'react-icons/fi'
import { FiTruck } from 'react-icons/fi'
import { useLocation } from 'react-router-dom'
import ShipmentTrackingModal from 'components/Orders/ShipmentTrackingModal'
import { exportAdminNdr, getAdminNdrKpis, getNdrTimeline } from 'services/ops.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

export default function AdminNdr() {
  const location = useLocation()
  const routeSearch = new URLSearchParams(location.search).get('search') || ''
  const [filters, setFilters] = useState({
    search: routeSearch,
    fromDate: undefined,
    toDate: undefined,
    courier: '',
    integration_type: '',
    attempt_count: '',
    status: '',
  })
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(20)
  const [selected, setSelected] = useState([])
  const [kpis, setKpis] = useState(null)
  const [timeline, setTimeline] = useState(null)
  const timelineModal = useDisclosure()
  const reattemptModal = useDisclosure()
  const changePhoneModal = useDisclosure()
  const changeAddressModal = useDisclosure()
  const [activeRow, setActiveRow] = useState(null)
  const [trackingAwb, setTrackingAwb] = useState(null)
  const [form, setForm] = useState({
    nextAttemptDate: '',
    comments: '',
    phone: '',
    name: '',
    address_1: '',
    address_2: '',
    pincode: '',
  })
  const { mutate: reattemptMutate } = useNdrReattempt()
  const { mutate: changePhoneMutate } = useNdrChangePhone()
  const { mutate: changeAddressMutate } = useNdrChangeAddress()
  const { mutate: bulkMutate } = useNdrBulk()
  const { mutate: rescheduleMutate } = useDelhiveryPickupReschedule()

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      search: new URLSearchParams(location.search).get('search') || '',
    }))
    setPage(1)
  }, [location.search])

  const { data, isLoading } = useAdminNdr({
    page,
    limit: perPage,
    search: filters.search,
    fromDate: filters.fromDate,
    toDate: filters.toDate,
    courier: filters.courier || undefined,
    integration_type: filters.integration_type || undefined,
    attempt_count: filters.attempt_count ? Number(filters.attempt_count) : undefined,
    status: filters.status || undefined,
  })
  const rows = data?.data || []

  const filterOptions = [
    {
      key: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'AWB / Order No / Customer / Reason',
    },
    { key: 'fromDate', label: 'From', type: 'date' },
    { key: 'toDate', label: 'To', type: 'date' },
    { key: 'courier', label: 'Courier', type: 'text', placeholder: 'Delhivery' },
    {
      key: 'integration_type',
      label: 'Integration',
      type: 'text',
      placeholder: 'delhivery',
    },
    { key: 'attempt_count', label: 'Attempts', type: 'number', min: 0 },
    {
      key: 'status',
      label: 'Status',
      type: 'text',
      placeholder: 'ndr / undelivered / address_issue',
    },
  ]

  const totalCount = data?.totalCount || 0

  const captions = [
    'AWB',
    'Order',
    'Customer',
    'Seller',
    'Courier',
    'Status/NSL',
    'Current Section',
    'Reason/Remarks',
    'Attempts',
    'Last event time',
  ]
  const columnKeys = [
    'awb_number',
    'order_number',
    'buyer_name',
    'merchant_id',
    'courier_partner',
    'status',
    'current_section',
    'remarks',
    'attempt_no',
    'last_event_time',
  ]

  useEffect(() => {
    ;(async () => {
      try {
        const resp = await getAdminNdrKpis()
        setKpis(resp?.data || null)
      } catch (e) {}
    })()
  }, [])

  const actionsBar = (
    <HStack>
      <Button
        size="sm"
        onClick={() => exportAdminNdr({ ...filters, limit: perPage, page })}
        variant="outline"
      >
        Export CSV
      </Button>
      {/* <Button
        size="sm"
        colorScheme="blue"
        isDisabled={selected.length === 0}
        onClick={() => {
          const items = selected
            .map((id) => rows.find((r) => r.id === id))
            .filter(Boolean)
            .map((r) => ({
              awb: r.awb_number,
              provider: r.integration_type,
              action: 're-attempt',
              data: {},
            }))
          bulkMutate(items)
          setSelected([])
          setPage(1)
        }}
      >
        Bulk Reattempt
      </Button> */}
      {/* <Button
        size="sm"
        variant="outline"
        isDisabled={selected.length === 0}
        onClick={() => {
          const awbs = selected
            .map((id) => rows.find((r) => r.id === id))
            .filter((r) => r?.courier_partner?.toLowerCase?.() === 'delhivery')
            .map((r) => r.awb_number)
          if (awbs.length) rescheduleMutate(awbs)
          setSelected([])
        }}
      >
        Delhivery Pickup Reschedule
      </Button> */}
    </HStack>
  )

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      <TableFilters
        filters={filterOptions}
        values={filters}
        onApply={(f) => {
          setFilters(f)
          setPage(1)
        }}
      />

      {kpis && (
        <Stack direction={{ base: 'column', md: 'row' }} gap={4}>
          <StatCard label="Total NDRs" value={kpis.total} />
          <StatCard
            label="Orders Affected"
            value={kpis.ordersAffected}
            tooltip="Number of unique orders that have at least one NDR event within the applied filters."
          />
        </Stack>
      )}

      <GenericTable
        paginated
        loading={isLoading}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        perPage={perPage}
        setPerPage={setPerPage}
        title="NDR Events"
        data={rows}
        captions={captions}
        columnKeys={columnKeys}
        actionsColumnWidth="220px"
        // actionsStickyLeft
        // showCheckboxes
        selectedRows={selected}
        onSelectionChange={setSelected}
        renderActions={(row) => {
          const isNSL = String(row?.status || '')
            .toLowerCase()
            .includes('nsl')
          const attempts = row?.attempt_no ? parseInt(String(row.attempt_no), 10) || 0 : 0
          const provider = String(row?.integration_type || row?.courier_partner || '').toLowerCase()
          const supportsEdits = ['delhivery', 'ekart', 'shadowfax', 'xpressbees'].includes(
            provider,
          )
          const reattemptTooltip = isNSL
            ? 'Reattempt disabled for NSL status'
            : attempts >= 3
            ? 'Reattempt limit reached'
            : 'Reattempt shipment'
          const phoneTooltip = isNSL ? 'Phone change disabled for NSL status' : 'Change phone'
          const addressTooltip =
            isNSL ? 'Address change disabled for NSL status' : 'Change address'
          return (
            <HStack spacing={1}>
              <Tooltip label="Track shipment" hasArrow placement="top">
                <IconButton aria-label="Track shipment" icon={<FiTruck />} size="sm" variant="ghost" colorScheme="blue" isDisabled={!row.awb_number} onClick={() => setTrackingAwb(row.awb_number)} />
              </Tooltip>
              <Tooltip label="View timeline" hasArrow placement="top">
                <IconButton
                  aria-label="Timeline"
                  icon={<FiClock />}
                  size="sm"
                  variant="ghost"
                  onClick={async () => {
                    const resp = await getNdrTimeline({ awb: row.awb_number, orderId: row.order_id })
                    setTimeline(resp?.data)
                    timelineModal.onOpen()
                  }}
                />
              </Tooltip>
              <Tooltip label={reattemptTooltip} hasArrow placement="top">
                <Box>
                  <IconButton
                    aria-label="Reattempt"
                    icon={<FiRotateCw />}
                    size="sm"
                    variant="ghost"
                    isDisabled={isNSL || attempts >= 3}
                    colorScheme={isNSL || attempts >= 3 ? undefined : 'blue'}
                    onClick={() => {
                      setActiveRow(row)
                      setForm((f) => ({
                        ...f,
                        nextAttemptDate: new Date().toISOString().slice(0, 10),
                        comments: '',
                      }))
                      reattemptModal.onOpen()
                    }}
                  />
                </Box>
              </Tooltip>
              {supportsEdits && (
                <Tooltip label={phoneTooltip} hasArrow placement="top">
                  <Box>
                    <IconButton
                      aria-label="Change Phone"
                      icon={<FiPhone />}
                      size="sm"
                      variant="ghost"
                      isDisabled={isNSL}
                      colorScheme={isNSL ? undefined : 'green'}
                      onClick={() => {
                        setActiveRow(row)
                        setForm((f) => ({ ...f, phone: '' }))
                        changePhoneModal.onOpen()
                      }}
                    />
                  </Box>
                </Tooltip>
              )}
              {supportsEdits && (
                <Tooltip label={addressTooltip} hasArrow placement="top">
                  <Box>
                    <IconButton
                      aria-label="Change Address"
                      icon={<FiMapPin />}
                      size="sm"
                      variant="ghost"
                      isDisabled={isNSL}
                      colorScheme={isNSL ? undefined : 'purple'}
                      onClick={() => {
                        setActiveRow(row)
                        setForm((f) => ({
                          ...f,
                          name: row?.buyer_name || '',
                          address_1: '',
                          address_2: '',
                          pincode: '',
                        }))
                        changeAddressModal.onOpen()
                      }}
                    />
                  </Box>
                </Tooltip>
              )}
            </HStack>
          )
        }}
        sortByComponent={actionsBar}
        renderers={{
          status: (v) => <Tag colorScheme="yellow">{v}</Tag>,
          current_section: (v) => {
            const value = String(v || 'NDR')
            const colorScheme =
              value === 'Shipment'
                ? 'blue'
                : value === 'Cancelled'
                ? 'red'
                : value === 'RTO'
                ? 'orange'
                : value === 'Delivered'
                ? 'green'
                : value === 'NDR'
                ? 'yellow'
                : 'gray'
            return (
              <Tag colorScheme={colorScheme} variant="subtle">
                {value}
              </Tag>
            )
          },
          order_number: (v, row) => (
            <Stack spacing={0}>
              <Text fontWeight="600">{v || '—'}</Text>
              <Text noOfLines={1} color="gray.500" fontSize="xs">
                {row?.order_id || '—'}
              </Text>
            </Stack>
          ),
          buyer_name: (v, row) => (
            <Stack spacing={0}>
              <Text noOfLines={1}>{v || '—'}</Text>
              <Text noOfLines={1} color="gray.500" fontSize="xs">
                {row?.buyer_phone || '—'}
              </Text>
            </Stack>
          ),
          merchant_id: (v, row) => {
            const id = v
            const name = row?.merchant_name || 'View Merchant'
            const href = `${window.location.origin}/admin/users-management/${id}/overview`
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#3182ce', textDecoration: 'underline' }}
              >
                {name}
              </a>
            )
          },
          last_event_time: (v) => (
            <Text fontSize="xs">{v ? new Date(v).toLocaleString() : '—'}</Text>
          ),
          remarks: (v, row) => (
            <Stack spacing={0}>
              <HStack spacing={2}>
                <Tooltip
                  label={row?.source === 'admin' ? 'Created by admin action' : 'Created from webhook/courier update'}
                  hasArrow
                  placement="top-start"
                  openDelay={250}
                >
                  <Tag size="sm" colorScheme={row?.source === 'admin' ? 'purple' : 'blue'}>
                    {row?.source === 'admin' ? 'Admin' : 'Webhook'}
                  </Tag>
                </Tooltip>
              </HStack>
              <Tooltip
                label={row?.reason || '—'}
                hasArrow
                placement="top-start"
                openDelay={250}
              >
                <Text noOfLines={1}>{row?.reason || '—'}</Text>
              </Tooltip>
              <Tooltip
                label={row?.remarks || '—'}
                hasArrow
                placement="top-start"
                openDelay={250}
              >
                <Text noOfLines={1} color="gray.500" fontSize="xs">
                  {row?.remarks || '—'}
                </Text>
              </Tooltip>
            </Stack>
          ),
        }}
      />

      {timelineModal.isOpen && timeline && (
        <TimelineDrawer
          isOpen={timelineModal.isOpen}
          onClose={timelineModal.onClose}
          data={timeline}
        />
      )}
      <ShipmentTrackingModal awb={trackingAwb} onClose={() => setTrackingAwb(null)} />

      {/* Reattempt modal */}
      <CustomModal
        isOpen={reattemptModal.isOpen}
        onClose={reattemptModal.onClose}
        title={`Reattempt - ${activeRow?.awb_number || ''}`}
        footer={
          <HStack>
            <Button onClick={reattemptModal.onClose} variant="outline">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              isDisabled={!form.nextAttemptDate}
              onClick={() => {
                reattemptMutate({
                  awb: activeRow?.awb_number,
                  nextAttemptDate: form.nextAttemptDate,
                  comments: form.comments,
                })
                reattemptModal.onClose()
              }}
            >
              Submit
            </Button>
          </HStack>
        }
      >
        <Stack gap={3}>
          <FormControl>
            <FormLabel>Next Attempt Date</FormLabel>
            <CustomDatePicker
              selectedDate={form.nextAttemptDate ? new Date(form.nextAttemptDate) : undefined}
              onChange={(d) =>
                setForm((f) => ({ ...f, nextAttemptDate: d ? d.toISOString().slice(0, 10) : '' }))
              }
            />
          </FormControl>
          <FormControl>
            <FormLabel>Comments</FormLabel>
            <Textarea
              value={form.comments}
              onChange={(e) => setForm((f) => ({ ...f, comments: e.target.value }))}
            />
          </FormControl>
        </Stack>
      </CustomModal>

      {/* Change phone modal */}
      <CustomModal
        isOpen={changePhoneModal.isOpen}
        onClose={changePhoneModal.onClose}
        title={`Change Phone - ${activeRow?.awb_number || ''}`}
        footer={
          <HStack>
            <Button onClick={changePhoneModal.onClose} variant="outline">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              isDisabled={!/^\d{10,}$/.test(form.phone || '')}
              onClick={() => {
                changePhoneMutate({ awb: activeRow?.awb_number, phone: form.phone })
                changePhoneModal.onClose()
              }}
            >
              Submit
            </Button>
          </HStack>
        }
      >
        <FormControl>
          <FormLabel>Phone</FormLabel>
          <Input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="10+ digits"
          />
        </FormControl>
      </CustomModal>

      {/* Change address modal */}
      <CustomModal
        isOpen={changeAddressModal.isOpen}
        onClose={changeAddressModal.onClose}
        title={`Change Address - ${activeRow?.awb_number || ''}`}
        footer={
          <HStack>
            <Button onClick={changeAddressModal.onClose} variant="outline">
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              isDisabled={!form.address_1}
              onClick={() => {
                changeAddressMutate({
                  awb: activeRow?.awb_number,
                  name: form.name || undefined,
                  address_1: form.address_1,
                  address_2: form.address_2 || undefined,
                  pincode: form.pincode || undefined,
                })
                changeAddressModal.onClose()
              }}
            >
              Submit
            </Button>
          </HStack>
        }
      >
        <Stack gap={3}>
          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Address line 1</FormLabel>
            <Input
              value={form.address_1}
              onChange={(e) => setForm((f) => ({ ...f, address_1: e.target.value }))}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Address line 2</FormLabel>
            <Input
              value={form.address_2}
              onChange={(e) => setForm((f) => ({ ...f, address_2: e.target.value }))}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Pincode</FormLabel>
            <Input
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
              placeholder="Optional"
            />
          </FormControl>
        </Stack>
      </CustomModal>
    </Flex>
  )
}

function StatCard({ label, value, tooltip }) {
  return (
    <Stack border="1px solid" borderColor="gray.200" rounded="md" p={4} minW="200px" spacing={0}>
      <HStack spacing={1} align="center">
        <Text fontSize="sm" color="gray.500">
          {label}
        </Text>
        {tooltip ? (
          <QuestionOutlineIcon title={tooltip} color="gray.400" style={{ cursor: 'help' }} />
        ) : null}
      </HStack>
      <Text fontSize="2xl" fontWeight="bold">
        {value ?? '—'}
      </Text>
    </Stack>
  )
}

function TimelineDrawer({ isOpen, onClose, data }) {
  const events = Array.isArray(data?.events) ? data.events : []
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>NDR Timeline</DrawerHeader>
        <DrawerBody>
          <Stack spacing={3}>
            {events.map((e, idx) => (
              <Stack key={idx} spacing={0} borderLeft="2px solid #E2E8F0" pl={3}>
                <Text fontSize="xs" color="gray.500">
                  {e?.at ? new Date(e.at).toLocaleString() : '—'}
                </Text>
                <Text fontWeight="600">{e?.status || '—'}</Text>
                {e?.remarks && (
                  <Text color="gray.700" fontSize="sm">
                    {e.remarks}
                  </Text>
                )}
                {e?.location && (
                  <Text color="gray.500" fontSize="xs">
                    {e.location}
                  </Text>
                )}
              </Stack>
            ))}
            {events.length === 0 && <Text color="gray.500">No events found.</Text>}
          </Stack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}
