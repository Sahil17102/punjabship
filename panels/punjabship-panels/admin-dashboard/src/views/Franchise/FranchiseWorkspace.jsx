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
  GridItem,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBuildingStore,
  IconCheck,
  IconChevronRight,
  IconClipboardCheck,
  IconCoinRupee,
  IconFileDescription,
  IconMapPin,
  IconMapPins,
  IconPackage,
  IconPlus,
  IconRefresh,
  IconReportMoney,
  IconRoute,
  IconSearch,
  IconShieldCheck,
  IconUserCircle,
  IconUsersGroup,
  IconWallet,
} from '@tabler/icons-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { franchiseService } from 'services/franchise.service'

const pageCopy = {
  requests: {
    eyebrow: 'Franchise Network / Requests',
    title: 'Franchise requests',
    description:
      'Review applicant identity, territory, payment, and agreement gates before portal activation.',
  },
  overview: {
    eyebrow: 'Franchise Network / Overview',
    title: 'Network control center',
    description:
      'Monitor onboarding demand, territory coverage, commission liability, and open exceptions.',
  },
  products: {
    eyebrow: 'Franchise Network / Territory Pricing',
    title: 'Territory pricing',
    description:
      'Set franchise fees, deposits, agreement terms, and default commission shares by territory tier.',
  },
  territories: {
    eyebrow: 'Franchise Network / Territories',
    title: 'Territory inventory',
    description:
      'View canonical hierarchy, current availability, effective ownership, and mapping versions.',
  },
  franchises: {
    eyebrow: 'Franchise Network / Franchises',
    title: 'Franchise organizations',
    description:
      'Review active organizations, compliance state, territory scope, and agreement health.',
  },
  agreements: {
    eyebrow: 'Franchise Network / Agreements',
    title: 'Agreements',
    description:
      'Track accepted versions, commercial terms, effective periods, and upcoming expiry.',
  },
  rules: {
    eyebrow: 'Franchise Network / Commission Rules',
    title: 'Commission rules',
    description:
      'Version, cap, review, and publish profit-share rules used by the franchise ledger.',
  },
  settlements: {
    eyebrow: 'Franchise Network / Settlements',
    title: 'Settlement review',
    description:
      'Review gross, holds, withholding, net payable, and reconciled payout evidence.',
  },
  reports: {
    eyebrow: 'Franchise Network / Reports',
    title: 'Network reports',
    description:
      'Read operational scale and financial liability from the same scoped source records.',
  },
  exceptions: {
    eyebrow: 'Franchise Network / Exceptions',
    title: 'Exception queue',
    description:
      'Investigate geography, cost, ledger, compliance, dispute, and payout issues by severity.',
  },
  audit: {
    eyebrow: 'Franchise Network / Audit',
    title: 'Franchise audit trail',
    description:
      'Trace sensitive actions with actor, reason, entity, request ID, and timestamp.',
  },
}

const workspaceCopy = {
  insights: {
    eyebrow: 'Franchise Network',
    title: 'Network insights',
    description: 'Monitor performance, coverage, demand, and financial health from one compact view.',
  },
  onboarding: {
    eyebrow: 'Franchise Network',
    title: 'Onboarding & organizations',
    description: 'Move applicants from review to an active franchise and maintain their agreements.',
  },
  territory: {
    eyebrow: 'Franchise Network',
    title: 'Territories & pricing',
    description: 'Manage territory ownership, availability, franchise fees, and commercial terms together.',
  },
  finance: {
    eyebrow: 'Franchise Network',
    title: 'Finance & controls',
    description: 'Run commission rules, settlement review, exception handling, and audit oversight.',
  },
}

const tabLabels = {
  overview: 'Overview',
  reports: 'Reports',
  requests: 'Requests',
  franchises: 'Organizations',
  agreements: 'Agreements',
  territories: 'Territories',
  products: 'Pricing',
  rules: 'Commission rules',
  settlements: 'Settlements',
  exceptions: 'Exceptions',
  audit: 'Audit trail',
}

const statusColors = {
  active: 'green',
  available: 'teal',
  approved: 'green',
  accepted: 'green',
  verified: 'green',
  paid: 'green',
  published: 'green',
  ready: 'cyan',
  earned: 'cyan',
  submitted: 'purple',
  under_review: 'blue',
  in_review: 'blue',
  agreement_pending: 'blue',
  approved_for_payment: 'orange',
  payment_verified: 'green',
  payment_pending: 'orange',
  pending: 'orange',
  provisional: 'orange',
  reserved: 'orange',
  open: 'red',
  high: 'red',
  medium: 'orange',
  rejected: 'red',
  reversed: 'red',
  suspended: 'red',
  draft: 'gray',
  low: 'gray',
}

const labelize = (value) =>
  String(value || 'not set')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())

const money = (paise) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(Number(paise || 0) / 100)

const date = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : 'Not set'

const Status = ({ value }) => (
  <Badge
    colorScheme={statusColors[value] || 'gray'}
    borderRadius="6px"
    px={2.5}
    py={1}
    textTransform="none"
    whiteSpace="nowrap"
  >
    {labelize(value)}
  </Badge>
)

const Surface = ({ children, ...props }) => (
  <Box
    bg="white"
    border="1px solid"
    borderColor="#E9E6EE"
    borderRadius="8px"
    boxShadow="0 12px 28px rgba(33, 27, 45, 0.05)"
    {...props}
  >
    {children}
  </Box>
)

const Metric = ({ label, value, detail, icon: Icon, accent = '#0877C9' }) => (
  <Surface p={5} minH="132px">
    <Flex justify="space-between" gap={4}>
      <Box minW="0">
        <Text color="#77727E" fontSize="11px" fontWeight="800" textTransform="uppercase">
          {label}
        </Text>
        <Text mt={3} color="#17171A" fontSize="2xl" fontWeight="800">
          {value}
        </Text>
        <Text mt={1} color="#77727E" fontSize="xs">
          {detail}
        </Text>
      </Box>
      <Flex
        w="40px"
        h="40px"
        flex="0 0 40px"
        align="center"
        justify="center"
        color={accent}
        bg={`${accent}14`}
        borderRadius="8px"
      >
        <Icon size={20} />
      </Flex>
    </Flex>
  </Surface>
)

const Header = ({ mode, workspace, actions }) => {
  const copy = workspaceCopy[workspace] || pageCopy[mode]
  return (
    <Flex
      justify="space-between"
      align={{ base: 'flex-start', lg: 'center' }}
      direction={{ base: 'column', lg: 'row' }}
      gap={5}
      pb={5}
      borderBottom="1px solid #E9E6EE"
    >
      <Box maxW="800px">
        <Text color="#0877C9" fontSize="11px" fontWeight="800" textTransform="uppercase">
          {copy.eyebrow}
        </Text>
        <Text mt={2} color="#17171A" fontSize={{ base: '2xl', md: '3xl' }} fontWeight="800">
          {copy.title}
        </Text>
        <Text mt={2} color="#68666F" fontSize="sm" lineHeight="1.7">
          {copy.description}
        </Text>
      </Box>
      {actions}
    </Flex>
  )
}

const Loading = () => (
  <Flex minH="320px" align="center" justify="center">
    <Stack align="center" spacing={3}>
      <Spinner color="#0877C9" thickness="3px" />
      <Text color="#68666F" fontSize="sm">
        Loading franchise workspace
      </Text>
    </Stack>
  </Flex>
)

const Empty = ({ label }) => (
  <Flex minH="220px" align="center" justify="center" direction="column" textAlign="center">
    <IconRoute size={28} color="#9B97A1" />
    <Text mt={3} color="#17171A" fontWeight="700">
      No {label} found
    </Text>
    <Text mt={1} color="#77727E" fontSize="sm">
      Records will appear here when the workflow creates them.
    </Text>
  </Flex>
)

const TableShell = ({ children }) => (
  <Surface overflow="hidden">
    <Box overflowX="auto">{children}</Box>
  </Surface>
)

const DataTable = ({ columns, rows, emptyLabel }) => {
  if (!rows?.length) return <Surface><Empty label={emptyLabel} /></Surface>
  return (
    <TableShell>
      <Table size="sm">
        <Thead bg="#F8F7FA">
          <Tr>
            {columns.map((column) => (
              <Th
                key={column.key}
                color="#68666F"
                fontSize="10px"
                letterSpacing="0"
                textTransform="uppercase"
                whiteSpace="nowrap"
                py={4}
              >
                {column.label}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr key={row.id} _hover={{ bg: '#FBFAFC' }}>
              {columns.map((column) => (
                <Td key={column.key} py={4} color="#34343B" whiteSpace={column.wrap ? 'normal' : 'nowrap'}>
                  {column.render ? column.render(row) : row[column.key] || 'Not set'}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableShell>
  )
}

const InventoryStatus = ({ row, onBooked }) =>
  row.status === 'booked' && row.geoUnitId ? (
    <Button
      size="xs"
      h="27px"
      px={2.5}
      colorScheme="green"
      variant="outline"
      borderRadius="6px"
      onClick={(event) => {
        event.stopPropagation()
        onBooked(row)
      }}
    >
      Booked
    </Button>
  ) : (
    <Status value={row.status} />
  )

const TerritoryMetric = ({ label, data, icon: Icon, accent }) => (
  <Surface p={5}>
    <Flex justify="space-between" align="flex-start" gap={4}>
      <Box>
        <Text color="#77727E" fontSize="11px" fontWeight="800" textTransform="uppercase">
          {label}
        </Text>
        <Text mt={2} color="#17171A" fontSize="2xl" fontWeight="800">
          {Number(data?.total || 0).toLocaleString('en-IN')}
        </Text>
        <Text color="#77727E" fontSize="xs">
          Total inventory
        </Text>
      </Box>
      <Flex
        w="40px"
        h="40px"
        flex="0 0 40px"
        align="center"
        justify="center"
        color={accent}
        bg={`${accent}14`}
        borderRadius="8px"
      >
        <Icon size={20} />
      </Flex>
    </Flex>
    <SimpleGrid mt={5} columns={3} spacing={3}>
      {[
        ['Booked', data?.booked, '#16794B'],
        ['Reserved', data?.reserved, '#B95F00'],
        ['Available', data?.available, '#3563C8'],
      ].map(([status, count, color]) => (
        <Box key={status} minW="0">
          <Text color={color} fontSize="sm" fontWeight="800">
            {Number(count || 0).toLocaleString('en-IN')}
          </Text>
          <Text color="#88828E" fontSize="10px">
            {status}
          </Text>
        </Box>
      ))}
    </SimpleGrid>
  </Surface>
)

const ClickableRows = ({ columns, rows, onSelect, emptyLabel }) => {
  if (!rows?.length) return <Empty label={emptyLabel} />
  return (
    <Box overflowX="auto">
      <Table size="sm">
        <Thead bg="#F8F7FA">
          <Tr>
            {columns.map((column) => (
              <Th key={column.key} color="#68666F" fontSize="10px" letterSpacing="0" py={3}>
                {column.label}
              </Th>
            ))}
            <Th />
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row) => (
            <Tr
              key={row.id}
              cursor="pointer"
              _hover={{ bg: '#F8F6FF' }}
              onClick={() => onSelect(row)}
            >
              {columns.map((column) => (
                <Td key={column.key} py={3} whiteSpace="nowrap">
                  {column.render ? column.render(row) : row[column.key] || 'Not set'}
                </Td>
              ))}
              <Td textAlign="right">
                <IconChevronRight size={16} color="#77727E" />
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  )
}

const RecordDetail = ({ record }) => {
  if (!record) return null
  const ignored = new Set(['calculationSnapshot'])
  return (
    <Box mt={4} p={4} bg="#F8F7FA" borderLeft="3px solid #0877C9">
      <Flex justify="space-between" align="center" gap={4}>
        <Box>
          <Text color="#0877C9" fontSize="10px" fontWeight="800" textTransform="uppercase">
            Selected {record.kind}
          </Text>
          <Text mt={1} fontSize="sm" fontWeight="800">
            {record.item.settlementNumber ||
              record.item.awbMasked ||
              record.item.providerReference ||
              record.item.sourceEventId ||
              record.item.id}
          </Text>
        </Box>
        {record.item.state || record.item.status || record.item.orderStatus ? (
          <Status value={record.item.state || record.item.status || record.item.orderStatus} />
        ) : null}
      </Flex>
      <SimpleGrid mt={4} columns={{ base: 1, md: 3 }} spacing={4}>
        {Object.entries(record.item)
          .filter(
            ([key, value]) =>
              !ignored.has(key) &&
              value !== null &&
              value !== undefined &&
              typeof value !== 'object',
          )
          .slice(0, 12)
          .map(([key, value]) => (
            <Box key={key}>
              <Text color="#88828E" fontSize="10px">
                {labelize(key)}
              </Text>
              <Text mt={1} color="#34343B" fontSize="xs" fontWeight="700" wordBreak="break-word">
                {key.toLowerCase().includes('paise')
                  ? money(value)
                  : /(?:at|date|start|end)$/i.test(key)
                    ? date(value)
                    : String(value)}
              </Text>
            </Box>
          ))}
      </SimpleGrid>
      {record.item.calculationSnapshot && (
        <Box mt={4}>
          <Text color="#88828E" fontSize="10px">
            Calculation snapshot
          </Text>
          <Text mt={1} color="#34343B" fontSize="xs">
            {Object.entries(record.item.calculationSnapshot)
              .map(([key, value]) => `${labelize(key)}: ${value}`)
              .join(' · ')}
          </Text>
        </Box>
      )}
    </Box>
  )
}

const TerritoryOwnerModal = ({ territory, onClose }) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [record, setRecord] = useState(null)

  useEffect(() => {
    if (!territory?.geoUnitId) return
    let active = true
    setLoading(true)
    setError('')
    setRecord(null)
    franchiseService
      .getTerritoryDetails(territory.geoUnitId)
      .then((result) => active && setData(result))
      .catch((requestError) => {
        if (active) {
          setError(requestError.response?.data?.message || 'Owner details could not be loaded.')
        }
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [territory])

  const selectRecord = (kind) => (item) => setRecord({ kind, item })

  return (
    <Drawer
      isOpen={Boolean(territory)}
      onClose={onClose}
      placement="right"
      size="full"
      preserveScrollBarGap
    >
      <DrawerOverlay bg="rgba(19, 16, 28, 0.58)" />
      <DrawerContent maxW={{ base: '100%', xl: '1040px' }}>
        <DrawerHeader borderBottom="1px solid #E9E6EE">
          <Text color="#0877C9" fontSize="10px" fontWeight="800" textTransform="uppercase">
            Franchise operations
          </Text>
          <Text mt={1} fontSize="xl">
            {territory?.name}
          </Text>
        </DrawerHeader>
        <DrawerCloseButton />
        <DrawerBody p={0}>
          {loading ? (
            <Loading />
          ) : error ? (
            <Box p={8}>
              <Text color="red.500" fontWeight="700">
                {error}
              </Text>
            </Box>
          ) : data ? (
            <>
              <Box px={6} py={5} borderBottom="1px solid #E9E6EE">
                <Flex
                  justify="space-between"
                  align={{ base: 'flex-start', md: 'center' }}
                  direction={{ base: 'column', md: 'row' }}
                  gap={5}
                >
                  <HStack spacing={3}>
                    <Flex
                      w="42px"
                      h="42px"
                      align="center"
                      justify="center"
                      bg="#F0ECFF"
                      color="#0877C9"
                      borderRadius="8px"
                    >
                      <IconUserCircle size={23} />
                    </Flex>
                    <Box>
                      <Text fontWeight="800">{data.owner.tradeName}</Text>
                      <Text color="#77727E" fontSize="xs">
                        {data.owner.email} · {data.owner.phone}
                      </Text>
                    </Box>
                  </HStack>
                  <HStack spacing={2}>
                    <Status value={data.owner.kycStatus} />
                    <Status value={data.owner.bankStatus} />
                    <Status value={data.agreement.status} />
                  </HStack>
                </Flex>
                <SimpleGrid mt={5} columns={{ base: 2, lg: 4 }} spacing={5}>
                  {[
                    ['Agreement', data.agreement.agreementNumber],
                    ['Pricing plan', data.agreement.productName],
                    ['Commission share', `${Number(data.agreement.shareBps || 0) / 100}%`],
                    ['Agreement ends', date(data.agreement.endsAt)],
                  ].map(([label, value]) => (
                    <Box key={label}>
                      <Text color="#88828E" fontSize="10px">
                        {label}
                      </Text>
                      <Text mt={1} fontSize="sm" fontWeight="700">
                        {value}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>

              <SimpleGrid
                px={6}
                py={5}
                columns={{ base: 2, md: 3, xl: 6 }}
                spacing={4}
                borderBottom="1px solid #E9E6EE"
              >
                {[
                  ['Attributed orders', data.summary.totalOrders, IconPackage, '#3563C8'],
                  ['Active orders', data.summary.activeOrders, IconCheck, '#16794B'],
                  ['Ledger total', money(data.summary.totalLedgerPaise), IconReportMoney, '#34343B'],
                  ['Provisional', money(data.summary.provisionalPaise), IconRefresh, '#B95F00'],
                  ['Approved earnings', money(data.summary.approvedPaise), IconCoinRupee, '#0877C9'],
                  ['Paid earnings', money(data.summary.paidPaise), IconWallet, '#B95F00'],
                ].map(([label, value, Icon, color]) => (
                  <Box key={label} borderLeft={`3px solid ${color}`} pl={3} py={1}>
                    <HStack spacing={2}>
                      <Icon size={16} color={color} />
                      <Text color="#77727E" fontSize="10px">
                        {label}
                      </Text>
                    </HStack>
                    <Text mt={2} fontSize="lg" fontWeight="800">
                      {value}
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>

              <Tabs colorScheme="purple" isLazy onChange={() => setRecord(null)}>
                <TabList px={6} overflowX="auto">
                  <Tab fontSize="sm">Orders</Tab>
                  <Tab fontSize="sm">Ledger</Tab>
                  <Tab fontSize="sm">Settlements</Tab>
                  <Tab fontSize="sm">Payouts</Tab>
                  <Tab fontSize="sm">Disputes</Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px={6}>
                    <ClickableRows
                      rows={data.orders}
                      emptyLabel="attributed orders"
                      onSelect={selectRecord('order')}
                      columns={[
                        { key: 'awbMasked', label: 'AWB' },
                        { key: 'courierProvider', label: 'Courier' },
                        { key: 'originPincode', label: 'Origin' },
                        { key: 'orderStatus', label: 'Order', render: (row) => <Status value={row.orderStatus} /> },
                        { key: 'attributionStatus', label: 'Attribution', render: (row) => <Status value={row.attributionStatus} /> },
                        { key: 'bookedAt', label: 'Booked', render: (row) => date(row.bookedAt) },
                      ]}
                    />
                    <RecordDetail record={record} />
                  </TabPanel>
                  <TabPanel px={6}>
                    <ClickableRows
                      rows={data.ledger}
                      emptyLabel="ledger transactions"
                      onSelect={selectRecord('ledger transaction')}
                      columns={[
                        { key: 'sourceEventId', label: 'Source event' },
                        { key: 'awbMasked', label: 'AWB' },
                        { key: 'entryType', label: 'Type', render: (row) => labelize(row.entryType) },
                        { key: 'amountPaise', label: 'Amount', render: (row) => money(row.amountPaise) },
                        { key: 'state', label: 'State', render: (row) => <Status value={row.state} /> },
                        { key: 'occurredAt', label: 'Occurred', render: (row) => date(row.occurredAt) },
                      ]}
                    />
                    <RecordDetail record={record} />
                  </TabPanel>
                  <TabPanel px={6}>
                    <ClickableRows
                      rows={data.settlements}
                      emptyLabel="settlements"
                      onSelect={selectRecord('settlement')}
                      columns={[
                        { key: 'settlementNumber', label: 'Settlement' },
                        { key: 'periodEnd', label: 'Period end', render: (row) => date(row.periodEnd) },
                        { key: 'grossPaise', label: 'Gross', render: (row) => money(row.grossPaise) },
                        { key: 'netPaise', label: 'Net', render: (row) => money(row.netPaise) },
                        { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
                      ]}
                    />
                    <RecordDetail record={record} />
                  </TabPanel>
                  <TabPanel px={6}>
                    <ClickableRows
                      rows={data.payouts}
                      emptyLabel="payouts"
                      onSelect={selectRecord('payout')}
                      columns={[
                        { key: 'providerReference', label: 'Provider reference' },
                        { key: 'amountPaise', label: 'Amount', render: (row) => money(row.amountPaise) },
                        { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
                        { key: 'processedAt', label: 'Processed', render: (row) => date(row.processedAt) },
                      ]}
                    />
                    <RecordDetail record={record} />
                  </TabPanel>
                  <TabPanel px={6}>
                    <ClickableRows
                      rows={data.disputes}
                      emptyLabel="disputes"
                      onSelect={selectRecord('dispute')}
                      columns={[
                        { key: 'subject', label: 'Subject' },
                        { key: 'type', label: 'Type', render: (row) => labelize(row.type) },
                        { key: 'priority', label: 'Priority', render: (row) => <Status value={row.priority} /> },
                        { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
                        { key: 'createdAt', label: 'Opened', render: (row) => date(row.createdAt) },
                      ]}
                    />
                    <RecordDetail record={record} />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </>
          ) : null}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  )
}

const TerritoryInventory = ({ data }) => {
  const toast = useToast()
  const [inventory, setInventory] = useState(data)
  const [busy, setBusy] = useState(false)
  const [ownerTerritory, setOwnerTerritory] = useState(null)
  const [selectedPincodeId, setSelectedPincodeId] = useState(data.selection?.pincodeId || '')

  useEffect(() => {
    setInventory(data)
    setSelectedPincodeId('')
  }, [data])

  const loadSelection = async (params) => {
    setBusy(true)
    try {
      const next = await franchiseService.listTerritories(params)
      setInventory(next)
      setSelectedPincodeId('')
    } catch (requestError) {
      toast({
        title: 'Unable to load territory inventory',
        description: requestError.response?.data?.message || 'Please try again.',
        status: 'error',
        duration: 4000,
      })
    } finally {
      setBusy(false)
    }
  }

  const selectedState = inventory.states.find(
    (state) => state.id === inventory.selection.stateId,
  )
  const selectedDistrict = inventory.districts.find(
    (district) => district.id === inventory.selection.districtId,
  )
  const selectedPincode = inventory.pincodes.find(
    (pincode) => pincode.id === selectedPincodeId,
  )

  return (
    <Stack spacing={5}>
      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={4}>
        <TerritoryMetric
          label="States"
          data={inventory.summary.state}
          icon={IconMapPins}
          accent="#0877C9"
        />
        <TerritoryMetric
          label="Districts / Cities"
          data={inventory.summary.district_city}
          icon={IconBuildingStore}
          accent="#3563C8"
        />
        <TerritoryMetric
          label="Pincodes"
          data={inventory.summary.pincode}
          icon={IconMapPin}
          accent="#16794B"
        />
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(300px, 0.7fr) minmax(0, 1.3fr)' }} gap={5}>
        <Surface overflow="hidden">
          <Box px={5} py={4} borderBottom="1px solid #E9E6EE">
            <Text fontWeight="800">All states</Text>
            <Text mt={1} color="#77727E" fontSize="xs">
              {inventory.states.length} states and territories in the franchise inventory
            </Text>
          </Box>
          <Stack maxH={{ base: '420px', xl: '720px' }} overflowY="auto" spacing={0}>
            {inventory.states.map((state) => (
              <Flex
                key={state.id}
                role="button"
                tabIndex={0}
                w="100%"
                align="center"
                justify="space-between"
                gap={3}
                px={5}
                py={3.5}
                textAlign="left"
                bg={state.id === inventory.selection.stateId ? '#F5F2FF' : 'white'}
                borderBottom="1px solid #F0EDF3"
                borderLeft={
                  state.id === inventory.selection.stateId
                    ? '3px solid #0877C9'
                    : '3px solid transparent'
                }
                _hover={{ bg: '#F8F7FA' }}
                onClick={() => loadSelection({ stateId: state.id })}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    loadSelection({ stateId: state.id })
                  }
                }}
              >
                <Box minW="0">
                  <Text fontSize="sm" fontWeight="800" noOfLines={1}>
                    {state.name}
                  </Text>
                  <Text mt={1} color="#88828E" fontSize="10px">
                    {state.districtCount} districts · {state.pincodeCount} pincodes
                  </Text>
                </Box>
                <InventoryStatus row={state} onBooked={setOwnerTerritory} />
              </Flex>
            ))}
          </Stack>
        </Surface>

        <Stack spacing={5} minW="0">
          <Surface p={5}>
            <Flex
              align={{ base: 'flex-start', md: 'center' }}
              justify="space-between"
              direction={{ base: 'column', md: 'row' }}
              gap={4}
            >
              <Box>
                <Text color="#0877C9" fontSize="10px" fontWeight="800" textTransform="uppercase">
                  Selected state
                </Text>
                <Text mt={1} fontSize="xl" fontWeight="800">
                  {selectedState?.name || 'No state selected'}
                </Text>
              </Box>
              {selectedState && (
                <InventoryStatus row={selectedState} onBooked={setOwnerTerritory} />
              )}
            </Flex>

            <SimpleGrid mt={5} columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel color="#68666F" fontSize="xs">
                  District / City
                </FormLabel>
                <Select
                  value={inventory.selection.districtId || ''}
                  isDisabled={busy || !inventory.districts.length}
                  onChange={(event) =>
                    loadSelection({
                      stateId: inventory.selection.stateId,
                      districtId: event.target.value,
                    })
                  }
                >
                  {inventory.districts.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.name} · {labelize(district.status)}
                    </option>
                  ))}
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel color="#68666F" fontSize="xs">
                  Individual pincode
                </FormLabel>
                <Select
                  value={selectedPincodeId}
                  isDisabled={busy || !inventory.pincodes.length}
                  placeholder="Choose a pincode"
                  onChange={(event) => setSelectedPincodeId(event.target.value)}
                >
                  {inventory.pincodes.map((pincode) => (
                    <option key={pincode.id} value={pincode.id}>
                      {pincode.pincode} · {labelize(pincode.status)}
                    </option>
                  ))}
                </Select>
              </FormControl>
            </SimpleGrid>

            {selectedDistrict && (
              <Flex
                mt={5}
                pt={5}
                borderTop="1px solid #E9E6EE"
                align={{ base: 'flex-start', md: 'center' }}
                justify="space-between"
                direction={{ base: 'column', md: 'row' }}
                gap={4}
              >
                <Box>
                  <Text fontSize="sm" fontWeight="800">
                    {selectedDistrict.name}
                  </Text>
                  <Text mt={1} color="#77727E" fontSize="xs">
                    {selectedDistrict.pincodeCount} pincodes ·{' '}
                    {selectedDistrict.bookedPincodes} booked ·{' '}
                    {selectedDistrict.reservedPincodes} reserved
                  </Text>
                </Box>
                <InventoryStatus row={selectedDistrict} onBooked={setOwnerTerritory} />
              </Flex>
            )}

            {selectedPincode && (
              <Flex
                mt={4}
                p={4}
                bg="#F8F7FA"
                align="center"
                justify="space-between"
                gap={4}
              >
                <Box>
                  <Text fontSize="sm" fontWeight="800">
                    {selectedPincode.pincode}
                  </Text>
                  <Text mt={1} color="#77727E" fontSize="xs">
                    {selectedPincode.city}, {selectedPincode.state}
                  </Text>
                </Box>
                <InventoryStatus row={selectedPincode} onBooked={setOwnerTerritory} />
              </Flex>
            )}
          </Surface>

          <Surface overflow="hidden">
            <Flex px={5} py={4} align="center" justify="space-between" gap={4}>
              <Box>
                <Text fontWeight="800">Pincode inventory</Text>
                <Text mt={1} color="#77727E" fontSize="xs">
                  {selectedDistrict?.name || 'Select a district or city'}
                </Text>
              </Box>
              {busy && <Spinner size="sm" color="#0877C9" />}
            </Flex>
            <Box maxH="520px" overflowY="auto" overflowX="auto">
              <Table size="sm">
                <Thead bg="#F8F7FA" position="sticky" top={0} zIndex={1}>
                  <Tr>
                    <Th fontSize="10px" letterSpacing="0" py={3}>
                      Pincode
                    </Th>
                    <Th fontSize="10px" letterSpacing="0">
                      City
                    </Th>
                    <Th fontSize="10px" letterSpacing="0">
                      Status
                    </Th>
                    <Th fontSize="10px" letterSpacing="0">
                      Owner
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {inventory.pincodes.map((pincode) => (
                    <Tr
                      key={pincode.id}
                      bg={pincode.id === selectedPincodeId ? '#F5F2FF' : 'white'}
                      _hover={{ bg: '#FBFAFC' }}
                    >
                      <Td py={3} fontWeight="800">
                        {pincode.pincode}
                      </Td>
                      <Td>{pincode.city}</Td>
                      <Td>
                        <InventoryStatus row={pincode} onBooked={setOwnerTerritory} />
                      </Td>
                      <Td color="#68666F">{pincode.ownerName || 'Unowned'}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
              {!inventory.pincodes.length && <Empty label="pincodes" />}
            </Box>
          </Surface>
        </Stack>
      </Grid>

      <TerritoryOwnerModal
        territory={ownerTerritory}
        onClose={() => setOwnerTerritory(null)}
      />
    </Stack>
  )
}

const FranchiseOrganizations = ({ data }) => {
  const [selectedFranchise, setSelectedFranchise] = useState(null)
  const columns = [
    {
      key: 'tradeName',
      label: 'Organization',
      render: (row) => (
        <Box>
          {row.geoUnitId ? (
            <Button
              variant="link"
              color="#0564AD"
              fontSize="sm"
              fontWeight="800"
              textAlign="left"
              onClick={() =>
                setSelectedFranchise({
                  name: row.tradeName,
                  geoUnitId: row.geoUnitId,
                })
              }
            >
              {row.tradeName}
            </Button>
          ) : (
            <Text fontWeight="700">{row.tradeName}</Text>
          )}
          <Text mt={1} color="#77727E" fontSize="xs">
            {row.email}
          </Text>
        </Box>
      ),
    },
    { key: 'territory', label: 'Territory', render: (row) => row.territory || 'Pending' },
    { key: 'tier', label: 'Tier', render: (row) => <Status value={row.tier} /> },
    { key: 'kycStatus', label: 'KYC', render: (row) => <Status value={row.kycStatus} /> },
    { key: 'bankStatus', label: 'Bank', render: (row) => <Status value={row.bankStatus} /> },
    {
      key: 'agreementEndsAt',
      label: 'Agreement ends',
      render: (row) => date(row.agreementEndsAt),
    },
    { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
  ]

  return (
    <>
      <DataTable columns={columns} rows={data} emptyLabel="franchise organizations" />
      <TerritoryOwnerModal
        territory={selectedFranchise}
        onClose={() => setSelectedFranchise(null)}
      />
    </>
  )
}

const nextApplicationActions = (application) => {
  if (application.status === 'submitted') return ['start_review']
  if (application.status === 'info_requested') return ['start_review']
  if (application.status === 'under_review') {
    return application.kycStatus === 'verified'
      ? ['approve_for_payment', 'request_info', 'reject']
      : ['verify_kyc', 'request_info', 'reject']
  }
  if (['approved_for_payment', 'payment_pending'].includes(application.status)) {
    return ['verify_payment']
  }
  if (application.status === 'payment_verified') return ['generate_agreement']
  if (application.status === 'agreement_pending' && application.agreementStatus === 'ready') {
    return ['accept_agreement']
  }
  if (application.status === 'agreement_pending' && application.agreementStatus === 'accepted') {
    return ['activate']
  }
  return []
}

const Applications = ({ data, reload }) => {
  const toast = useToast()
  const [busyId, setBusyId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')

  const rows = useMemo(
    () =>
      data.filter((application) => {
        const matchesStatus = statusFilter === 'all' || application.status === statusFilter
        const haystack = [
          application.applicationNumber,
          application.applicantName,
          application.applicantEmail,
          application.applicantPhone,
          application.tradeName,
          application.territoryName,
          application.source,
        ]
          .join(' ')
          .toLowerCase()
        return matchesStatus && haystack.includes(search.trim().toLowerCase())
      }),
    [data, search, statusFilter],
  )

  const runAction = async (application, action) => {
    let reason
    let paymentReference
    if (['request_info', 'reject'].includes(action)) {
      reason = window.prompt(`Reason for ${labelize(action).toLowerCase()}:`)
      if (!reason) return
    }
    if (action === 'approve_for_payment') {
      reason = window.prompt('Commercial approval note (optional):') || undefined
    }
    if (action === 'verify_payment') {
      paymentReference = window.prompt('Payment reference:')
      if (!paymentReference) return
    }
    if (action === 'activate') {
      const confirmed = window.confirm(
        'Activate this franchise, create portal access, and email a temporary password?',
      )
      if (!confirmed) return
    }

    setBusyId(`${application.id}:${action}`)
    try {
      const response = await franchiseService.updateApplication(application.id, {
        action,
        reason,
        paymentReference,
      })
      toast({
        title: `${labelize(action)} completed`,
        description: response.temporaryPassword
          ? 'Portal access was created and the invitation email was queued.'
          : undefined,
        status: 'success',
        duration: 3500,
        isClosable: true,
      })
      reload()
    } catch (error) {
      toast({
        title: 'Request update failed',
        description: error.response?.data?.message || 'Please try again.',
        status: 'error',
        duration: 4500,
        isClosable: true,
      })
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Stack spacing={4}>
      <Surface p={4}>
        <Flex gap={3} direction={{ base: 'column', md: 'row' }}>
          <HStack
            flex="1"
            h="42px"
            px={3}
            border="1px solid #DED9E5"
            borderRadius="7px"
            bg="#FCFBFD"
          >
            <IconSearch size={17} color="#77727E" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search applicant, email, territory, or request ID"
              variant="unstyled"
              fontSize="sm"
            />
          </HStack>
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            w={{ base: '100%', md: '230px' }}
            h="42px"
            borderRadius="7px"
            borderColor="#DED9E5"
            fontSize="sm"
          >
            <option value="all">All request states</option>
            {[
              'submitted',
              'under_review',
              'info_requested',
              'approved_for_payment',
              'payment_verified',
              'agreement_pending',
              'active',
              'rejected',
            ].map((status) => (
              <option key={status} value={status}>
                {labelize(status)}
              </option>
            ))}
          </Select>
        </Flex>
      </Surface>

      {rows.length === 0 ? (
        <Surface><Empty label="requests" /></Surface>
      ) : (
        rows.map((application) => {
          const actions = nextApplicationActions(application)
          return (
            <Surface key={application.id} p={{ base: 4, md: 5 }}>
              <Flex
                align={{ base: 'flex-start', xl: 'center' }}
                justify="space-between"
                direction={{ base: 'column', xl: 'row' }}
                gap={5}
              >
                <Grid
                  flex="1"
                  w="100%"
                  templateColumns={{ base: '1fr', md: '1.4fr 1fr 1fr 1fr' }}
                  gap={5}
                >
                  <GridItem>
                    <HStack spacing={2} mb={2}>
                      <Text color="#0877C9" fontSize="xs" fontWeight="800">
                        {application.applicationNumber}
                      </Text>
                      <Status value={application.status} />
                    </HStack>
                    <Text color="#17171A" fontWeight="800">
                      {application.tradeName}
                    </Text>
                    <Text mt={1} color="#68666F" fontSize="xs">
                      {application.applicantName} - {application.applicantEmail}
                    </Text>
                  </GridItem>
                  <GridItem>
                    <Text color="#88828E" fontSize="10px" fontWeight="800" textTransform="uppercase">
                      Territory
                    </Text>
                    <Text mt={2} color="#34343B" fontSize="sm" fontWeight="700">
                      {application.territoryName}
                    </Text>
                    <Text mt={1} color="#77727E" fontSize="xs">
                      {labelize(application.tier)}
                    </Text>
                  </GridItem>
                  <GridItem>
                    <Text color="#88828E" fontSize="10px" fontWeight="800" textTransform="uppercase">
                      Compliance
                    </Text>
                    <HStack mt={2} spacing={2}>
                      <Status value={application.kycStatus} />
                    </HStack>
                    <Text mt={2} color="#77727E" fontSize="xs">
                      PAN {application.pan || 'pending'} - GST {application.gstin || 'pending'}
                    </Text>
                  </GridItem>
                  <GridItem>
                    <Text color="#88828E" fontSize="10px" fontWeight="800" textTransform="uppercase">
                      Commercial
                    </Text>
                    <Text mt={2} color="#34343B" fontSize="sm" fontWeight="700">
                      {money(application.commercialAmountPaise || application.productPricePaise)}
                    </Text>
                    <HStack mt={1} spacing={2}>
                      <Status value={application.paymentStatus} />
                      <Status value={application.agreementStatus} />
                    </HStack>
                  </GridItem>
                </Grid>
                <HStack flexWrap="wrap" justify={{ base: 'flex-start', xl: 'flex-end' }}>
                  {actions.map((action, index) => (
                    <Button
                      key={action}
                      size="sm"
                      h="38px"
                      borderRadius="7px"
                      bg={index === 0 ? '#0877C9' : '#F3F1F6'}
                      color={index === 0 ? 'white' : '#34343B'}
                      rightIcon={index === 0 ? <IconArrowRight size={15} /> : undefined}
                      isLoading={busyId === `${application.id}:${action}`}
                      onClick={() => runAction(application, action)}
                      _hover={{ bg: index === 0 ? '#0564AD' : '#E9E6EE' }}
                    >
                      {labelize(action)}
                    </Button>
                  ))}
                  {actions.length === 0 && (
                    <Text color="#88828E" fontSize="xs">
                      No pending action
                    </Text>
                  )}
                </HStack>
              </Flex>
              <Divider my={4} borderColor="#E8E4EC" />
              <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={5}>
                <Box>
                  <Text color="#88828E" fontSize="10px" fontWeight="800" textTransform="uppercase">
                    Contact
                  </Text>
                  <Text mt={2} color="#34343B" fontSize="sm" fontWeight="700">
                    {application.applicantPhone || 'Not provided'}
                  </Text>
                  <Text mt={1} color="#77727E" fontSize="xs">
                    Prefers {labelize(application.applicationData?.preferredContactMethod || 'phone')}
                  </Text>
                </Box>
                <Box>
                  <Text color="#88828E" fontSize="10px" fontWeight="800" textTransform="uppercase">
                    Business profile
                  </Text>
                  <Text mt={2} color="#34343B" fontSize="sm" fontWeight="700">
                    {application.applicationData?.businessType || 'Not specified'}
                  </Text>
                  <Text mt={1} color="#77727E" fontSize="xs">
                    {[application.applicationData?.currentCity, application.applicationData?.currentState]
                      .filter(Boolean)
                      .join(', ') || 'Location not provided'}
                  </Text>
                  <Text mt={1} color="#77727E" fontSize="xs">
                    Legal name: {application.legalName}
                  </Text>
                </Box>
                <Box>
                  <Text color="#88828E" fontSize="10px" fontWeight="800" textTransform="uppercase">
                    Expected volume
                  </Text>
                  <Text mt={2} color="#34343B" fontSize="sm" fontWeight="700">
                    {application.applicationData?.expectedMonthlyShipments || 'Not specified'}
                  </Text>
                  <Text mt={1} color="#77727E" fontSize="xs">
                    Source: {labelize(application.source || 'admin')}
                  </Text>
                </Box>
                <Box>
                  <Text color="#88828E" fontSize="10px" fontWeight="800" textTransform="uppercase">
                    Experience and note
                  </Text>
                  <Text mt={2} color="#34343B" fontSize="xs" lineHeight="1.6">
                    {application.applicationData?.experience || 'No experience provided'}
                  </Text>
                  {application.applicantNotes && (
                    <Text mt={1} color="#77727E" fontSize="xs" lineHeight="1.6">
                      Note: {application.applicantNotes}
                    </Text>
                  )}
                </Box>
              </SimpleGrid>
            </Surface>
          )
        })
      )}
    </Stack>
  )
}

const ProductModal = ({ isOpen, onClose, onSaved }) => {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '',
    name: '',
    tier: 'pincode',
    description: '',
    priceRupees: '',
    securityDepositRupees: '',
    durationMonths: 12,
    defaultSharePercent: '',
    agreementVersion: 'v1',
  })

  const submit = async () => {
    setSaving(true)
    try {
      await franchiseService.createProduct(form)
      toast({ title: 'Territory pricing plan created', status: 'success', duration: 3000 })
      onSaved()
      onClose()
    } catch (error) {
      toast({
        title: 'Unable to create pricing plan',
        description: error.response?.data?.message || 'Check the pricing details.',
        status: 'error',
        duration: 4000,
      })
    } finally {
      setSaving(false)
    }
  }

  const field = (key) => ({
    value: form[key],
    onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
  })

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent borderRadius="8px">
        <ModalHeader>Create territory pricing plan</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Pricing code</FormLabel>
              <Input {...field('code')} placeholder="PINCODE_PREMIUM" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Plan name</FormLabel>
              <Input {...field('name')} placeholder="Pincode Premium" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Tier</FormLabel>
              <Select {...field('tier')}>
                <option value="state">State</option>
                <option value="district_city">District / City</option>
                <option value="pincode">Pincode</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Agreement version</FormLabel>
              <Input {...field('agreementVersion')} />
            </FormControl>
            <FormControl>
              <FormLabel>Franchise fee (INR)</FormLabel>
              <Input type="number" {...field('priceRupees')} />
            </FormControl>
            <FormControl>
              <FormLabel>Security deposit (INR)</FormLabel>
              <Input type="number" {...field('securityDepositRupees')} />
            </FormControl>
            <FormControl>
              <FormLabel>Duration (months)</FormLabel>
              <Input type="number" {...field('durationMonths')} />
            </FormControl>
            <FormControl>
              <FormLabel>Default share (%)</FormLabel>
              <Input type="number" step="0.01" {...field('defaultSharePercent')} />
            </FormControl>
          </SimpleGrid>
          <FormControl mt={4}>
            <FormLabel>Description</FormLabel>
            <Textarea {...field('description')} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button bg="#0877C9" color="white" onClick={submit} isLoading={saving}>
            Create pricing plan
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const RuleModal = ({ isOpen, onClose, onSaved }) => {
  const toast = useToast()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    code: '',
    label: '',
    tier: 'state',
    businessType: 'all',
    courierProvider: 'all',
    mode: 'all',
    sharePercent: '',
    capPercent: 30,
    priority: 100,
  })
  const field = (key) => ({
    value: form[key],
    onChange: (event) => setForm((current) => ({ ...current, [key]: event.target.value })),
  })

  const submit = async () => {
    setSaving(true)
    try {
      await franchiseService.createRule(form)
      toast({ title: 'Draft commission rule created', status: 'success', duration: 3000 })
      onSaved()
      onClose()
    } catch (error) {
      toast({
        title: 'Unable to create rule',
        description: error.response?.data?.message || 'Check the rule values.',
        status: 'error',
        duration: 4000,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent borderRadius="8px">
        <ModalHeader>Create commission rule version</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            <FormControl isRequired>
              <FormLabel>Rule code</FormLabel>
              <Input {...field('code')} placeholder="DEFAULT_STATE" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Label</FormLabel>
              <Input {...field('label')} placeholder="State all-courier share" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Tier</FormLabel>
              <Select {...field('tier')}>
                <option value="state">State</option>
                <option value="district_city">District / City</option>
                <option value="pincode">Pincode</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Business type</FormLabel>
              <Select {...field('businessType')}>
                <option value="all">All</option>
                <option value="b2c">B2C</option>
                <option value="b2b">B2B</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Courier provider</FormLabel>
              <Input {...field('courierProvider')} />
            </FormControl>
            <FormControl>
              <FormLabel>Mode</FormLabel>
              <Input {...field('mode')} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Share (%)</FormLabel>
              <Input type="number" step="0.01" {...field('sharePercent')} />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Platform cap (%)</FormLabel>
              <Input type="number" step="0.01" {...field('capPercent')} />
            </FormControl>
          </SimpleGrid>
          <Text mt={4} color="#68666F" fontSize="xs" lineHeight="1.6">
            Publishing is a separate audited action. Draft creation does not change live commission
            calculations.
          </Text>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button bg="#0877C9" color="white" onClick={submit} isLoading={saving}>
            Save draft
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const Overview = ({ data }) => (
  <Stack spacing={6}>
    <SimpleGrid columns={{ base: 1, md: 2, xl: 4 }} spacing={4}>
      <Metric
        label="Pending requests"
        value={data.metrics.applicationsPending}
        detail="Need franchise operations review"
        icon={IconClipboardCheck}
      />
      <Metric
        label="Active franchises"
        value={data.metrics.activeFranchises}
        detail={`${data.metrics.activeTerritories} active territories`}
        icon={IconUsersGroup}
        accent="#0C8D72"
      />
      <Metric
        label="Approved liability"
        value={money(data.metrics.approvedLiabilityPaise)}
        detail={`${money(data.metrics.provisionalLiabilityPaise)} provisional`}
        icon={IconReportMoney}
        accent="#D97706"
      />
      <Metric
        label="Open exceptions"
        value={data.metrics.openExceptions}
        detail="Pilot queue requiring ownership"
        icon={IconAlertTriangle}
        accent="#D83C50"
      />
    </SimpleGrid>
    <Grid templateColumns={{ base: '1fr', xl: '1.35fr 0.65fr' }} gap={4}>
      <Surface p={5}>
        <HStack justify="space-between" mb={5}>
          <Box>
            <Text fontWeight="800">Recent request activity</Text>
            <Text mt={1} color="#77727E" fontSize="xs">
              Latest applications entering the controlled workflow
            </Text>
          </Box>
          <Status value={data.rollout.stage} />
        </HStack>
        <Stack spacing={0} divider={<Divider borderColor="#EEEAF2" />}>
          {data.recentApplications.map((item) => (
            <Flex key={item.id} py={4} justify="space-between" align="center" gap={4}>
              <Box minW="0">
                <Text fontSize="sm" fontWeight="700" noOfLines={1}>
                  {item.tradeName}
                </Text>
                <Text mt={1} color="#77727E" fontSize="xs">
                  {item.applicationNumber} - {date(item.submittedAt)}
                </Text>
              </Box>
              <Status value={item.status} />
            </Flex>
          ))}
        </Stack>
      </Surface>
      <Surface p={5}>
        <Text fontWeight="800">Operational controls</Text>
        <Text mt={1} color="#77727E" fontSize="xs">
          Current production posture for franchise operations
        </Text>
        <Stack mt={5} spacing={4}>
          {[
            ['Attribution ledger', true, 'Eligible activity is recorded from live shipment events'],
            ['Manual settlement review', data.rollout.manualSettlementReview, 'Finance review is required before payouts'],
            ['Automated payouts', data.rollout.automatedPayouts, 'Enable only after payout operations are approved'],
          ].map(([label, enabled, detail]) => (
            <Flex key={label} gap={3} align="flex-start">
              <Flex
                w="28px"
                h="28px"
                flex="0 0 28px"
                align="center"
                justify="center"
                borderRadius="7px"
                bg={enabled ? '#E9FFF3' : '#FFF2E6'}
                color={enabled ? '#0C8D72' : '#B95F00'}
              >
                {enabled ? <IconCheck size={16} /> : <IconShieldCheck size={16} />}
              </Flex>
              <Box>
                <Text fontSize="sm" fontWeight="700">{label}</Text>
                <Text mt={1} color="#77727E" fontSize="xs">{detail}</Text>
              </Box>
            </Flex>
          ))}
        </Stack>
      </Surface>
    </Grid>
  </Stack>
)

const Reports = ({ data }) => (
  <Stack spacing={5}>
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
      <Metric
        label="Active network"
        value={data.network.activeFranchises}
        detail={`${data.network.activeTerritories} territories`}
        icon={IconBuildingStore}
      />
      <Metric
        label="Attributed orders"
        value={data.network.attributedOrders}
        detail="Privacy-masked franchise records"
        icon={IconRoute}
        accent="#0C8D72"
      />
      <Metric
        label="Approved margin"
        value={money(data.finance.approvedPaise)}
        detail={`${money(data.finance.provisionalPaise)} provisional`}
        icon={IconCoinRupee}
        accent="#D97706"
      />
    </SimpleGrid>
    <Surface p={5}>
      <Text fontWeight="800">Financial bridge</Text>
      <SimpleGrid mt={5} columns={{ base: 1, md: 4 }} spacing={4}>
        {[
          ['Provisional', data.finance.provisionalPaise],
          ['Approved', data.finance.approvedPaise],
          ['Settled', data.finance.settledPaise],
          ['Paid', data.finance.paidPaise],
        ].map(([label, value]) => (
          <Box key={label} borderLeft="3px solid #0877C9" pl={4} py={1}>
            <Text color="#77727E" fontSize="xs">{label}</Text>
            <Text mt={1} fontSize="lg" fontWeight="800">{money(value)}</Text>
          </Box>
        ))}
      </SimpleGrid>
    </Surface>
  </Stack>
)

const FranchiseWorkspace = ({ mode: initialMode, modes = [], workspace }) => {
  const toast = useToast()
  const modal = useDisclosure()
  const workspaceModes = modes.length ? modes : [initialMode]
  const [mode, setMode] = useState(initialMode)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const loaders = {
        overview: franchiseService.getOverview,
        requests: franchiseService.listApplications,
        products: franchiseService.listProducts,
        territories: franchiseService.listTerritories,
        franchises: franchiseService.listFranchises,
        agreements: franchiseService.listAgreements,
        rules: franchiseService.listRules,
        settlements: franchiseService.listSettlements,
        reports: franchiseService.getReports,
        exceptions: franchiseService.listExceptions,
        audit: franchiseService.listAudit,
      }
      setData(await loaders[mode]())
    } catch (requestError) {
      const message =
        requestError.response?.data?.message || 'The franchise workspace could not be loaded.'
      setError(message)
      toast({ title: 'Unable to load page', description: message, status: 'error', duration: 4000 })
    } finally {
      setLoading(false)
    }
  }, [mode, toast])

  useEffect(() => {
    load()
  }, [load])

  const action =
    mode === 'products' || mode === 'rules' ? (
      <Button
        leftIcon={<IconPlus size={17} />}
        h="42px"
        borderRadius="7px"
        bg="#0877C9"
        color="white"
        onClick={modal.onOpen}
        _hover={{ bg: '#0564AD' }}
      >
        {mode === 'products' ? 'New pricing plan' : 'New rule version'}
      </Button>
    ) : (
      <Button
        leftIcon={<IconRefresh size={17} />}
        h="40px"
        borderRadius="7px"
        variant="outline"
        borderColor="#DED9E5"
        onClick={load}
      >
        Refresh
      </Button>
    )

  const publish = async (rule) => {
    const reason = window.prompt('Reason for publishing this rule version:')
    if (!reason) return
    try {
      await franchiseService.publishRule(rule.id, reason)
      toast({ title: 'Commission rule published', status: 'success', duration: 3000 })
      load()
    } catch (requestError) {
      toast({
        title: 'Rule publication failed',
        description: requestError.response?.data?.message || 'Please try again.',
        status: 'error',
        duration: 4000,
      })
    }
  }

  const columns = {
    products: [
      { key: 'name', label: 'Pricing plan', render: (row) => <Box><Text fontWeight="700">{row.name}</Text><Text color="#77727E" fontSize="xs">{row.code}</Text></Box> },
      { key: 'tier', label: 'Tier', render: (row) => <Status value={row.tier} /> },
      { key: 'pricePaise', label: 'Franchise fee', render: (row) => money(row.pricePaise) },
      { key: 'securityDepositPaise', label: 'Deposit', render: (row) => money(row.securityDepositPaise) },
      { key: 'defaultShareBps', label: 'Default share', render: (row) => `${Number(row.defaultShareBps) / 100}%` },
      { key: 'durationMonths', label: 'Term', render: (row) => `${row.durationMonths} months` },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
    ],
    territories: [
      { key: 'name', label: 'Territory', render: (row) => <Box><Text fontWeight="700">{row.name}</Text><Text color="#77727E" fontSize="xs">{row.code}</Text></Box> },
      { key: 'type', label: 'Tier', render: (row) => <Status value={row.type} /> },
      { key: 'state', label: 'State' },
      { key: 'district', label: 'District' },
      { key: 'status', label: 'Availability', render: (row) => <Status value={row.status} /> },
      { key: 'owner', label: 'Effective owner', render: (row) => row.owner || 'Unowned' },
      { key: 'mappingVersion', label: 'Map version', render: (row) => `v${row.mappingVersion}` },
    ],
    franchises: [
      { key: 'tradeName', label: 'Organization', render: (row) => <Box><Text fontWeight="700">{row.tradeName}</Text><Text color="#77727E" fontSize="xs">{row.email}</Text></Box> },
      { key: 'territory', label: 'Territory', render: (row) => row.territory || 'Pending' },
      { key: 'tier', label: 'Tier', render: (row) => <Status value={row.tier} /> },
      { key: 'kycStatus', label: 'KYC', render: (row) => <Status value={row.kycStatus} /> },
      { key: 'bankStatus', label: 'Bank', render: (row) => <Status value={row.bankStatus} /> },
      { key: 'agreementEndsAt', label: 'Agreement ends', render: (row) => date(row.agreementEndsAt) },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
    ],
    agreements: [
      { key: 'agreementNumber', label: 'Agreement', render: (row) => <Text fontWeight="700">{row.agreementNumber}</Text> },
      { key: 'organization', label: 'Organization' },
      { key: 'territory', label: 'Territory' },
      { key: 'version', label: 'Version' },
      { key: 'shareBps', label: 'Share', render: (row) => `${Number(row.shareBps) / 100}%` },
      { key: 'startsAt', label: 'Starts', render: (row) => date(row.startsAt) },
      { key: 'endsAt', label: 'Ends', render: (row) => date(row.endsAt) },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
    ],
    rules: [
      { key: 'label', label: 'Rule', render: (row) => <Box><Text fontWeight="700">{row.label}</Text><Text color="#77727E" fontSize="xs">{row.code} - v{row.version}</Text></Box> },
      { key: 'tier', label: 'Tier', render: (row) => <Status value={row.tier} /> },
      { key: 'businessType', label: 'Business' },
      { key: 'courierProvider', label: 'Courier' },
      { key: 'valueBps', label: 'Share', render: (row) => `${Number(row.valueBps) / 100}%` },
      { key: 'capBps', label: 'Cap', render: (row) => `${Number(row.capBps) / 100}%` },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
      { key: 'action', label: 'Action', render: (row) => row.status === 'draft' ? <Button size="xs" borderRadius="6px" bg="#0877C9" color="white" onClick={() => publish(row)}>Publish</Button> : <Text color="#88828E" fontSize="xs">Live version</Text> },
    ],
    settlements: [
      { key: 'settlementNumber', label: 'Settlement', render: (row) => <Text fontWeight="700">{row.settlementNumber}</Text> },
      { key: 'organization', label: 'Franchise' },
      { key: 'periodEnd', label: 'Period', render: (row) => `${date(row.periodStart)} - ${date(row.periodEnd)}` },
      { key: 'grossPaise', label: 'Gross', render: (row) => money(row.grossPaise) },
      { key: 'holdPaise', label: 'Hold', render: (row) => money(row.holdPaise) },
      { key: 'withholdingPaise', label: 'Withholding', render: (row) => money(row.withholdingPaise) },
      { key: 'netPaise', label: 'Net', render: (row) => <Text fontWeight="700">{money(row.netPaise)}</Text> },
      { key: 'status', label: 'State', render: (row) => <Status value={row.status} /> },
    ],
    exceptions: [
      { key: 'title', label: 'Exception', wrap: true, render: (row) => <Box maxW="320px"><Text fontWeight="700">{row.title}</Text><Text mt={1} color="#77727E" fontSize="xs" noOfLines={2}>{row.description}</Text></Box> },
      { key: 'type', label: 'Type', render: (row) => labelize(row.type) },
      { key: 'severity', label: 'Severity', render: (row) => <Status value={row.severity} /> },
      { key: 'owner', label: 'Owner' },
      { key: 'financialValuePaise', label: 'Value', render: (row) => money(row.financialValuePaise) },
      { key: 'createdAt', label: 'Opened', render: (row) => date(row.createdAt) },
      { key: 'status', label: 'Status', render: (row) => <Status value={row.status} /> },
    ],
    audit: [
      { key: 'action', label: 'Action', render: (row) => <Text fontWeight="700">{labelize(row.action)}</Text> },
      { key: 'actorEmail', label: 'Actor', render: (row) => row.actorEmail || row.actorRole },
      { key: 'entityType', label: 'Entity', render: (row) => labelize(row.entityType) },
      { key: 'reason', label: 'Reason', wrap: true, render: (row) => <Text maxW="300px" noOfLines={2}>{row.reason || 'System workflow action'}</Text> },
      { key: 'requestId', label: 'Request ID', render: (row) => row.requestId || 'Not recorded' },
      { key: 'createdAt', label: 'Timestamp', render: (row) => date(row.createdAt) },
    ],
  }

  const renderContent = () => {
    if (loading) return <Loading />
    if (error) {
      return (
        <Surface><Flex minH="260px" align="center" justify="center" direction="column">
          <IconAlertTriangle size={30} color="#D83C50" />
          <Text mt={3} fontWeight="700">Franchise data is unavailable</Text>
          <Text mt={1} color="#77727E" fontSize="sm">{error}</Text>
          <Button mt={5} leftIcon={<IconRefresh size={16} />} onClick={load}>Try again</Button>
        </Flex></Surface>
      )
    }
    if (mode === 'overview') return <Overview data={data} />
    if (mode === 'requests') return <Applications data={data} reload={load} />
    if (mode === 'territories') return <TerritoryInventory data={data} />
    if (mode === 'franchises') return <FranchiseOrganizations data={data} />
    if (mode === 'reports') return <Reports data={data} />
    if (mode === 'settlements') {
      return (
        <Stack spacing={4}>
          <HStack align="flex-start" p={4} bg="#FFF8EA" border="1px solid #F4D7A0" borderRadius="8px">
            <IconShieldCheck size={20} color="#B95F00" />
            <Box>
              <Text color="#744000" fontSize="sm" fontWeight="700">Automated payouts are disabled.</Text>
              <Text mt={1} color="#865514" fontSize="xs">Review and reconcile settlements manually before enabling payout instructions.</Text>
            </Box>
          </HStack>
          <DataTable columns={columns.settlements} rows={data.data} emptyLabel="settlements" />
        </Stack>
      )
    }
    return <DataTable columns={columns[mode]} rows={data} emptyLabel={pageCopy[mode].title.toLowerCase()} />
  }

  return (
    <Flex direction="column" pb={8} w="100%">
      <Header mode={mode} workspace={workspace} actions={action} />
      {workspaceModes.length > 1 && (
        <Tabs
          index={Math.max(0, workspaceModes.indexOf(mode))}
          onChange={(index) => {
            modal.onClose()
            setMode(workspaceModes[index])
          }}
          mt={5}
          variant="unstyled"
        >
          <TabList
            gap={1}
            p="5px"
            overflowX="auto"
            bg="#F2EFF8"
            border="1px solid #E3DDEC"
            borderRadius="8px"
          >
            {workspaceModes.map((tabMode) => (
              <Tab
                key={tabMode}
                flexShrink={0}
                minH="38px"
                px={4}
                color="#625D69"
                fontSize="sm"
                fontWeight="700"
                borderRadius="6px"
                _selected={{ bg: 'white', color: '#4D34C9', boxShadow: '0 2px 8px rgba(48, 35, 87, 0.12)' }}
                _hover={{ color: '#4D34C9', bg: 'rgba(255,255,255,0.7)' }}
              >
                {tabLabels[tabMode]}
              </Tab>
            ))}
          </TabList>
        </Tabs>
      )}
      <Box mt={4}>{renderContent()}</Box>
      {mode === 'products' && (
        <ProductModal isOpen={modal.isOpen} onClose={modal.onClose} onSaved={load} />
      )}
      {mode === 'rules' && (
        <RuleModal isOpen={modal.isOpen} onClose={modal.onClose} onSaved={load} />
      )}
    </Flex>
  )
}

export default FranchiseWorkspace
