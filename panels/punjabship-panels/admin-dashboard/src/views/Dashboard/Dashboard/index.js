import {
  Box,
  Button,
  Flex,
  Grid,
  Heading,
  HStack,
  Input,
  Progress,
  Select,
  SimpleGrid,
  Spinner,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  IconAlertTriangle,
  IconArrowRight,
  IconCheck,
  IconClockHour4,
  IconCoinRupee,
  IconMapPin,
  IconPackageExport,
  IconRefresh,
  IconTruckDelivery,
  IconUsers,
} from '@tabler/icons-react'
import AdminStatusChart from 'components/Charts/AdminStatusChart'
import CodMovementChart from 'components/Charts/CodMovementChart'
import Card from 'components/Card/Card'
import OrdersLineChart from 'components/Charts/OrdersLineChart'
import RevenueBarChart from 'components/Charts/RevenueBarChart'
import { useDashboardStats } from 'hooks/useDashboardStats'
import { useHistory } from 'react-router-dom'
import { useState } from 'react'

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)

const toNum = (value) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const SectionHeading = ({ title, detail, action, accent = '#0877C9', dark = false }) => (
  <Flex align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={3} mb={4}>
    <Box minW={0} borderLeft="3px solid" borderColor={accent} pl={3}>
      <Heading color={dark ? 'white' : 'gray.900'} fontSize="18px" fontWeight="620" lineHeight="1.25">{title}</Heading>
      {detail ? <Text color={dark ? 'whiteAlpha.700' : 'gray.600'} fontFamily="'Andada Pro Variable', Georgia, serif" fontSize="13px" lineHeight="1.45" mt={1}>{detail}</Text> : null}
    </Box>
    {action}
  </Flex>
)

const StatCard = ({ label, value, note, icon, color, onClick }) => (
  <Card
    p={4}
    cursor={onClick ? 'pointer' : 'default'}
    onClick={onClick}
    boxShadow="0 3px 0 rgba(31,35,48,0.06), 0 10px 22px rgba(31,35,48,0.06)"
    _hover={{ transform: 'translateY(-4px)', boxShadow: '0 7px 0 rgba(31,35,48,0.07), 0 17px 30px rgba(31,35,48,0.12)', borderColor: `${color}.300` }}
  >
    <Flex justify="space-between" align="flex-start" gap={3}>
      <Box minW={0}>
        <Text color="gray.600" fontSize="xs" fontWeight="650">{label}</Text>
        <Text color="gray.900" fontFamily="'Hahmlet Variable', Georgia, serif" fontSize={{ base: '2xl', md: '28px' }} fontWeight="650" lineHeight="1.15" mt={2}>{value}</Text>
        <Text color="gray.500" fontSize="xs" mt={1.5} noOfLines={1}>{note}</Text>
      </Box>
      <Flex w="34px" h="34px" flexShrink={0} align="center" justify="center" borderRadius="4px" bg={`${color}.50`} color={`${color}.600`}>
        {icon}
      </Flex>
    </Flex>
  </Card>
)

export default function Dashboard() {
  const history = useHistory()
  const [dashboardFilters, setDashboardFilters] = useState({ fromDate: '', toDate: '', courier: '', userId: '', status: '' })
  const { data: statsData, isLoading, error, refetch, isRefetching } = useDashboardStats(dashboardFilters)
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.200')
  const subtleBg = useColorModeValue('gray.50', 'whiteAlpha.100')
  const textPrimary = useColorModeValue('gray.800', 'white')
  const textMuted = useColorModeValue('gray.500', 'gray.400')

  const stats = statsData?.data || {}
  const todayOps = stats.todayOperations || {}
  const financial = stats.financial || {}
  const operational = stats.operational || {}
  const alerts = stats.alerts || {}
  const couriers = stats.couriers || {}
  const geographic = stats.geographic || {}
  const filterOptions = stats.filters || {}
  const charts = stats.charts || {}
  const merchantAlerts = alerts.merchantAccounts || {}
  const pickupAlerts = alerts.shipmentPickups || {}
  const codStats = financial.codStats || {}
  const codPayableSummary = financial.codPayableSummary || {}
  const topCodPayables = financial.topCodPayables || []
  const recentActivity = stats.recentActivity || []
  const isAllTime = stats.isAllTime !== false && !dashboardFilters.fromDate && !dashboardFilters.toDate
  const chartScopeLabel = isAllTime ? 'all time' : 'selected range'
  const pickupAttention =
    toNum(pickupAlerts.pendingForPickup) +
    toNum(pickupAlerts.notScheduled ?? pickupAlerts.pickupNotScheduled)

  const topCouriers = Object.entries(couriers.performance || {})
    .map(([name, value]) => ({ name, count: toNum(value?.count), deliveryRate: toNum(value?.deliveryRate), revenue: toNum(value?.revenue) }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  const totalOrders = toNum(operational.totalOrders) || toNum(todayOps.orders)
  const delivered = toNum(operational.deliveredOrders) || toNum(todayOps.delivered)
  const inTransit = toNum(todayOps.inTransit)
  const pending = toNum(todayOps.pending)
  const ndr = toNum(operational.ndrOrders) || toNum(operational.ndrCount)
  const statusTotal = Math.max(totalOrders, delivered + inTransit + pending + ndr, 1)
  const prepaidOrders = toNum(stats.metrics?.totalPrepaidOrders)
  const codOrders = toNum(stats.metrics?.totalCodOrders)
  const paymentTotal = Math.max(prepaidOrders + codOrders, 1)
  const averageFreight = totalOrders ? toNum(financial.totalFreightCharges) / totalOrders : 0

  const statusRows = [
    { label: 'Delivered', value: delivered, color: 'green' },
    { label: 'In transit', value: inTransit, color: 'blue' },
    { label: 'Pending dispatch', value: pending, color: 'orange' },
    { label: 'NDR', value: ndr, color: 'red' },
  ]
  const actionItems = [
    { title: 'Merchant approvals', note: 'Accounts waiting for approval', value: toNum(merchantAlerts.accountPendingApproval), route: '/admin/users-management?approved=false' },
    { title: 'KYC review', note: 'Missing or incomplete documents', value: toNum(merchantAlerts.documentsNotUploaded) + toNum(merchantAlerts.partialDocumentsUploaded), route: '/admin/users-management?kycStatus=pending' },
    { title: 'Pickup exceptions', note: 'Awaiting pickup or schedule', value: pickupAttention, route: '/admin/orders' },
    { title: 'Support tickets', note: `${toNum(alerts.overdueTickets)} overdue`, value: toNum(alerts.openTickets) + toNum(alerts.inProgressTickets), route: '/admin/support' },
  ]
  const commercialSignals = [
    ['Average order value', formatCurrency(stats.metrics?.avgOrderValue)],
    ['Prepaid share', `${Math.round((prepaidOrders / paymentTotal) * 100)}%`],
    ['COD share', `${Math.round((codOrders / paymentTotal) * 100)}%`],
    ['RTO rate', `${toNum(operational.rtoRate)}%`],
    ['Freight per order', formatCurrency(averageFreight)],
  ]

  if (isLoading) {
    return <Flex minH="65vh" align="center" justify="center"><Stack align="center" spacing={3}><Spinner color="brand.500" /><Text color="gray.500" fontSize="sm">Loading operations data...</Text></Stack></Flex>
  }

  if (error) {
    return <Flex minH="65vh" align="center" justify="center"><Stack align="center" spacing={3}><Text color="red.600" fontWeight="700">Dashboard data could not be loaded.</Text><Button size="sm" onClick={() => refetch()} leftIcon={<IconRefresh size={16} />}>Try again</Button></Stack></Flex>
  }

  return (
    <Box maxW="1800px" mx="auto">
      <Box
        p={{ base: 4, md: 5 }}
        mb={4}
        bg="#FFF2A8"
        border="1px solid"
        borderColor="#E5D170"
        borderRadius="8px"
        boxShadow="0 5px 0 rgba(70,58,20,0.10), 0 18px 36px rgba(70,58,20,0.10)"
        backgroundImage={'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'48\' height=\'48\' viewBox=\'0 0 48 48\'%3E%3Cpath d=\'M0 47.5H48M47.5 0V48\' fill=\'none\' stroke=\'%23887820\' stroke-opacity=\'.12\'/%3E%3C/svg%3E")'}
      >
      <Grid templateColumns={{ base: '1fr', xl: 'minmax(280px, 0.75fr) minmax(420px, 1.2fr) auto' }} alignItems="end" gap={{ base: 2, xl: 10 }} mb={4}>
        <Heading color="gray.900" fontFamily="'Hahmlet Variable', Georgia, serif" fontSize={{ base: '26px', md: '30px' }} lineHeight="1.12" fontWeight="620">Operations overview</Heading>
        <Text color="#594E22" fontFamily="'Andada Pro Variable', Georgia, serif" fontSize="15px" lineHeight="1.55" maxW="680px">Shipment flow, cash position, courier performance and work requiring attention.</Text>
        <HStack spacing={2} justifySelf={{ xl: 'end' }}>
          <Button size="sm" variant="outline" leftIcon={isRefetching ? <Spinner size="xs" /> : <IconRefresh size={15} />} onClick={() => refetch()}>Refresh</Button>
          <Button size="sm" colorScheme="purple" rightIcon={<IconArrowRight size={15} />} onClick={() => history.push('/admin/orders')}>Open orders</Button>
        </HStack>
      </Grid>

      <Box mb={4} p={3} bg="#FFFFFF" border="1px solid" borderColor="#D9D3EC" borderRadius="8px" boxShadow="0 3px 0 rgba(55,45,96,0.05)">
        <Text fontSize="xs" fontWeight="800" color="gray.600" mb={2}>Dashboard filters</Text>
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 5 }} spacing={2}>
          <Input size="sm" type="date" value={dashboardFilters.fromDate} onChange={(event) => setDashboardFilters((current) => ({ ...current, fromDate: event.target.value }))} aria-label="From date" />
          <Input size="sm" type="date" value={dashboardFilters.toDate} onChange={(event) => setDashboardFilters((current) => ({ ...current, toDate: event.target.value }))} aria-label="To date" />
          <Select size="sm" value={dashboardFilters.courier} onChange={(event) => setDashboardFilters((current) => ({ ...current, courier: event.target.value }))} aria-label="Courier wise filter"><option value="">All couriers</option>{(filterOptions.couriers || []).map((courier) => <option key={courier} value={courier}>{courier}</option>)}</Select>
          <Select size="sm" value={dashboardFilters.userId} onChange={(event) => setDashboardFilters((current) => ({ ...current, userId: event.target.value }))} aria-label="User wise filter"><option value="">All users</option>{(filterOptions.users || []).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</Select>
          <Select size="sm" value={dashboardFilters.status} onChange={(event) => setDashboardFilters((current) => ({ ...current, status: event.target.value }))} aria-label="Status wise filter"><option value="">All statuses</option>{['pending', 'pickup_initiated', 'in_transit', 'out_for_delivery', 'delivered', 'ndr', 'rto_in_transit', 'rto_delivered', 'cancelled'].map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}</Select>
        </SimpleGrid>
      </Box>
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 5, '2xl': 9 }} spacing={3} mb={3}>
        <StatCard label="Total orders" value={toNum(operational.totalOrders).toLocaleString()} note="Orders in selected view" color="purple" icon={<IconPackageExport size={19} />} onClick={() => history.push('/admin/orders')} />
        <StatCard label="Active merchants" value={toNum(stats.users?.active).toLocaleString()} note="Merchants with activity" color="cyan" icon={<IconUsers size={19} />} onClick={() => history.push('/admin/users-management')} />
        <StatCard label="Revenue" value={formatCurrency(financial.totalRevenue)} note={`${formatCurrency(financial.todayRevenue)} ${chartScopeLabel}`} color="blue" icon={<IconCoinRupee size={19} />} onClick={() => history.push('/admin/wallets')} />
        <StatCard label="COD pending" value={formatCurrency(codStats.pendingRemittance)} note={`${toNum(codStats.pendingOrders)} orders pending`} color="yellow" icon={<IconClockHour4 size={19} />} onClick={() => history.push('/admin/cod-remittance')} />
        <StatCard label="Delivered orders" value={toNum(operational.deliveredOrders).toLocaleString()} note={`${toNum(operational.deliverySuccessRate)}% success rate`} color="green" icon={<IconCheck size={19} />} />
        <StatCard label="RTO orders" value={toNum(operational.rtoOrders).toLocaleString()} note={`${toNum(operational.rtoRate)}% return rate`} color="red" icon={<IconPackageExport size={19} />} onClick={() => history.push('/admin/ops/rto')} />
        <StatCard label="NDR orders" value={ndr.toLocaleString()} note={`${toNum(operational.ndrRate)}% of orders`} color="orange" icon={<IconAlertTriangle size={19} />} onClick={() => history.push('/admin/orders')} />
        <StatCard label="High risk pincodes" value={toNum(geographic.highRiskPincodes?.length).toLocaleString()} note="Pincodes with NDR/RTO" color="red" icon={<IconMapPin size={19} />} onClick={() => history.push('/admin/orders')} />
        <StatCard label="Top destination" value={geographic.topDestinationCities?.[0]?.city || '—'} note={`${toNum(geographic.topDestinationCities?.[0]?.count)} orders`} color="blue" icon={<IconMapPin size={19} />} />
      </SimpleGrid>
      </Box>
      <Card bg="#FFF1F2" borderColor="#E5BBC1" p={4} mb={4}>
        <SectionHeading title="Return to origin" detail="Shipment returns and their share of order volume" accent="#A33249" action={<Button size="sm" onClick={() => history.push('/admin/ops/rto')}>RTO reports</Button>} />
        <Flex justify="space-between" mb={2}><Text fontWeight={700}>{toNum(operational.rtoCount ?? operational.rtoOrders)} RTO shipments</Text><Text>{toNum(operational.rtoRate)}% return rate</Text></Flex>
        <Progress value={toNum(operational.rtoRate)} colorScheme="red" bg="#F1D8DE" size="sm" />
      </Card>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1.65fr) minmax(300px, 0.75fr)' }} gap={4} mb={4}>
        <Card bg="#E8F7F1" borderColor="#A9D8C7" p={4}>
          <SectionHeading title="Order volume" detail={`Shipment volume for ${chartScopeLabel}`} accent="#168D68" />
          <Box h={{ base: '220px', md: '270px' }}><OrdersLineChart data={charts.ordersByDate || []} /></Box>
        </Card>
        <Card bg="#F1EDFF" borderColor="#C9BEF7" p={4}>
          <SectionHeading title="Shipment status" detail={`${totalOrders.toLocaleString()} shipments in view`} accent="#0877C9" />
          <Stack spacing={3.5}>
            {statusRows.map((row) => (
              <Box key={row.label}>
                <Flex justify="space-between" mb={1.5}>
                  <Text color={textPrimary} fontSize="sm" fontWeight="650">{row.label}</Text>
                  <Text color={textPrimary} fontSize="sm" fontWeight="750">{row.value.toLocaleString()}</Text>
                </Flex>
                <Progress value={(row.value / statusTotal) * 100} colorScheme={row.color} size="xs" borderRadius="0" bg={subtleBg} />
              </Box>
            ))}
          </Stack>
          <Flex mt={4} pt={3} borderTop="1px solid" borderColor={borderColor} justify="space-between">
            <Text color={textMuted} fontSize="xs">Average delivery time</Text>
            <Text color={textPrimary} fontSize="sm" fontWeight="750">{toNum(operational.avgDeliveryTime).toFixed(1)} days</Text>
          </Flex>
        </Card>
      </Grid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1.55fr) minmax(320px, 0.65fr)' }} gap={4} mb={4}>
        <Card bg="#EEF3FF" borderColor="#BCCAEA" p={4}>
          <SectionHeading title="Order movement" detail={`Created orders and latest shipment events for ${chartScopeLabel}`} accent="#3569C8" action={<Button size="xs" bg="white" variant="outline" onClick={() => history.push('/admin/orders')}>View orders</Button>} />
          <Box h={{ base: '270px', md: '315px' }}><AdminStatusChart data={charts.statusActivityByDate || []} /></Box>
        </Card>
        <Card bg="#F4EDFF" borderColor="#CDBBEA" p={4}>
          <SectionHeading title="Recent activity" detail="Latest shipment and support movement" accent="#8A55B5" />
          <Stack spacing={0} divider={<Box borderTop="1px solid" borderColor="#D9CCE9" />}>
            {recentActivity.length ? recentActivity.slice(0, 7).map((activity) => (
              <Flex key={activity.id} py={2.5} gap={3} align="flex-start" cursor="pointer" onClick={() => history.push(activity.route)} _hover={{ bg: '#E8DCF7' }} px={2} mx={-2} borderRadius="4px" transition="background 160ms ease">
                <Flex w="26px" h="26px" flexShrink={0} align="center" justify="center" bg={activity.type === 'support' ? '#FBE0D8' : '#DCE6FF'} color={activity.type === 'support' ? '#A64731' : '#355EB0'} borderRadius="4px">
                  {activity.type === 'support' ? <IconAlertTriangle size={14} /> : <IconPackageExport size={14} />}
                </Flex>
                <Box minW={0} flex="1">
                  <Text color="gray.900" fontSize="xs" fontWeight="750" noOfLines={1}>{activity.title}</Text>
                  <Text color="gray.600" fontSize="11px" mt={0.5} textTransform="capitalize" noOfLines={1}>{activity.detail}</Text>
                </Box>
                <Text color="gray.500" fontSize="10px" whiteSpace="nowrap">{new Date(activity.occurredAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
              </Flex>
            )) : <Text color="gray.600" fontSize="sm" py={8} textAlign="center">Activity will appear as sellers and shipments move.</Text>}
          </Stack>
        </Card>
      </Grid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1.15fr) minmax(380px, 0.85fr)' }} gap={4} mb={4}>
        <Card bg="#FFF5D8" borderColor="#E4CB77" p={4}>
          <SectionHeading title="COD cash movement" detail={`Collected versus remitted amounts for ${chartScopeLabel}`} accent="#C98900" action={<Button size="xs" bg="white" variant="outline" onClick={() => history.push('/admin/cod-remittance')}>Open remittance</Button>} />
          <Box h={{ base: '225px', md: '255px' }}><CodMovementChart data={charts.codMovementByDate || []} /></Box>
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={0} mt={2} borderTop="1px solid" borderColor="#E2CB82">
            {[
              ['Pending payable', codPayableSummary.codPayableAmount],
              ['Wallet adjustment', codPayableSummary.negativeWalletAdjustment],
              ['Net payable', codPayableSummary.netPayableBalance],
            ].map(([label, value], index) => (
              <Box key={label} pt={3} px={{ base: 0, sm: 3 }} borderLeft={{ base: '0', sm: index ? '1px solid' : '0' }} borderColor="#E2CB82">
                <Text color="#766533" fontSize="xs">{label}</Text><Text color="#2A2518" mt={1} fontSize="sm" fontWeight="800">{formatCurrency(value)}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Card>
        <Card bg="#EAF7F3" borderColor="#AED6C8" p={4}>
          <SectionHeading title="Pending COD by seller" detail={`${toNum(codPayableSummary.customerCount)} sellers currently payable`} accent="#168D68" />
          <TableContainer overflowX="auto">
            <Table size="sm" minW="430px">
              <Thead><Tr><Th pl={2}>Seller</Th><Th isNumeric>Orders</Th><Th isNumeric>Net payable</Th></Tr></Thead>
              <Tbody>
                {topCodPayables.length ? topCodPayables.map((seller) => (
                  <Tr key={seller.customerId} cursor="pointer" onClick={() => history.push('/admin/cod-remittance')} _hover={{ bg: '#D4EDE4' }}>
                    <Td pl={2}><Text color="gray.900" fontWeight="750" fontSize="xs" noOfLines={1}>{seller.customerName || seller.customerEmail || 'Seller'}</Text><Text color="gray.600" fontSize="10px" noOfLines={1}>{seller.customerEmail}</Text></Td>
                    <Td isNumeric color="gray.700" fontWeight="650">{toNum(seller.codOrderCount)}</Td>
                    <Td isNumeric color="#116D51" fontWeight="800">{formatCurrency(seller.netPayableBalance)}</Td>
                  </Tr>
                )) : <Tr><Td colSpan={3}><Text color="gray.600" fontSize="sm" py={8} textAlign="center">No pending seller remittances.</Text></Td></Tr>}
              </Tbody>
            </Table>
          </TableContainer>
          {topCodPayables.length ? <Button mt={3} w="full" size="sm" variant="outline" colorScheme="green" rightIcon={<IconUsers size={15} />} onClick={() => history.push('/admin/cod-remittance')}>Review all seller payables</Button> : null}
        </Card>
      </Grid>

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 1.35fr) minmax(320px, 0.85fr)' }} gap={4} mb={4}>
        <Card bg="#FFF3CE" borderColor="#E9CF75" p={4}>
          <SectionHeading title="Revenue movement" detail="Net revenue by day" accent="#C98900" action={<Button size="xs" bg="whiteAlpha.800" onClick={() => history.push('/admin/wallets')}>Wallets</Button>} />
          <Box h={{ base: '205px', md: '235px' }}><RevenueBarChart data={charts.revenueByDate || []} /></Box>
          <SimpleGrid columns={{ base: 1, sm: 3 }} spacing={0} mt={3} borderTop="1px solid" borderColor={borderColor}>
            {[['COD outstanding', financial.codRemittanceDue], ['COD value', financial.codAmount], ['Freight charges', financial.totalFreightCharges]].map(([label, value], index) => (
              <Box key={label} pt={3} px={{ base: 0, sm: 3 }} borderLeft={{ base: '0', sm: index ? '1px solid' : '0' }} borderColor={borderColor}>
                <Text color={textMuted} fontSize="xs">{label}</Text><Text color={textPrimary} mt={1} fontSize="sm" fontWeight="750">{formatCurrency(value)}</Text>
              </Box>
            ))}
          </SimpleGrid>
        </Card>
        <Card bg="#29282E" borderColor="#29282E" p={4} boxShadow="0 6px 0 rgba(25,24,29,0.18), 0 18px 36px rgba(25,24,29,0.20)">
          <SectionHeading title="Attention queue" detail="Items that need an admin decision" accent="#FFD94A" dark />
          <Stack spacing={0} divider={<Box borderTop="1px solid" borderColor="whiteAlpha.200" />}>
            {actionItems.map((item) => (
              <Flex key={item.title} py={3} px={2} mx={-2} align="center" justify="space-between" gap={3} cursor="pointer" onClick={() => history.push(item.route)} borderRadius="4px" transition="background 160ms ease, transform 160ms ease" _hover={{ bg: '#3B3942', transform: 'translateX(3px)' }}>
                <Box minW={0}><Text color="white" fontSize="sm" fontWeight="650">{item.title}</Text><Text color="rgba(255,255,255,0.68)" fontSize="xs" mt={0.5}>{item.note}</Text></Box>
                <HStack flexShrink={0} spacing={2} color="white"><Text color={item.value ? '#FFD94A' : 'whiteAlpha.600'} fontWeight="800">{item.value}</Text><IconArrowRight size={14} /></HStack>
              </Flex>
            ))}
          </Stack>
        </Card>
      </Grid>

      <Card bg="#EDF5FF" borderColor="#BDD3EE" p={4} mb={4}>
        <SectionHeading title="Courier performance" detail="Volume, delivery rate and revenue by provider" accent="#2D6FB7" action={<Button size="xs" bg="white" variant="outline" onClick={() => history.push('/admin/couriers')}>Manage couriers</Button>} />
        <SimpleGrid columns={{ base: 2, md: 5 }} spacing={0} mb={3} border="1px solid" borderColor={borderColor}>
          {commercialSignals.map(([label, value], index) => (
            <Box key={label} px={3} py={2.5} borderLeft={{ base: index % 2 ? '1px solid' : '0', md: index ? '1px solid' : '0' }} borderColor={borderColor}>
              <Text color={textMuted} fontSize="xs">{label}</Text><Text color={textPrimary} mt={0.5} fontSize="sm" fontWeight="750">{value}</Text>
            </Box>
          ))}
        </SimpleGrid>
        <TableContainer overflowX="auto">
          <Table variant="simple" size="sm" minW="680px">
            <Thead><Tr><Th>Courier</Th><Th isNumeric>Shipments</Th><Th>Share</Th><Th>Delivery rate</Th><Th isNumeric>Revenue</Th></Tr></Thead>
            <Tbody>
              {topCouriers.length ? topCouriers.map((courier) => {
                const share = totalOrders ? Math.round((courier.count / totalOrders) * 100) : 0
                return (
                  <Tr key={courier.name} _hover={{ bg: subtleBg }}>
                    <Td fontWeight="650" color={textPrimary}>{courier.name}</Td>
                    <Td isNumeric fontWeight="650">{courier.count.toLocaleString()}</Td>
                    <Td><HStack><Progress w="70px" value={share} colorScheme="purple" size="xs" borderRadius="0" /><Text fontSize="xs">{share}%</Text></HStack></Td>
                    <Td><HStack><Box w="7px" h="7px" borderRadius="full" bg={courier.deliveryRate >= 80 ? 'green.500' : 'orange.500'} /><Text fontSize="sm">{courier.deliveryRate}%</Text></HStack></Td>
                    <Td isNumeric fontWeight="650">{formatCurrency(courier.revenue)}</Td>
                  </Tr>
                )
              }) : <Tr><Td colSpan={5}><Text py={5} textAlign="center" color={textMuted}>Courier performance will appear after shipments are processed.</Text></Td></Tr>}
            </Tbody>
          </Table>
        </TableContainer>
      </Card>

      <Card bg="#FFF0ED" borderColor="#E9C0B6" p={4}>
        <SectionHeading title="Shipment geography" detail="Highest-volume origin and destination cities" accent="#C65D43" />
        <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={{ base: 4, md: 0 }}>
          {[['Origin', geographic.topOriginCities || []], ['Destination', geographic.topDestinationCities || []]].map(([title, items], columnIndex) => (
            <Box key={title} pl={{ md: columnIndex ? 5 : 0 }} pr={{ md: columnIndex ? 0 : 5 }} borderLeft={{ md: columnIndex ? '1px solid' : '0' }} borderColor={borderColor}>
              <Text color={textPrimary} fontSize="sm" fontWeight="700" mb={2}>{title}</Text>
              <Stack spacing={0}>
                {items.length ? items.slice(0, 5).map((item, index) => (
                  <Flex key={`${title}-${item.city}`} py={2} borderTop={index ? '1px solid' : '0'} borderColor={borderColor} justify="space-between">
                    <HStack spacing={2}><Text color={textMuted} fontSize="xs" w="18px">{index + 1}</Text><Text color={textPrimary} fontSize="sm">{item.city}</Text></HStack>
                    <Text color={textPrimary} fontSize="sm" fontWeight="700">{toNum(item.count)}</Text>
                  </Flex>
                )) : <Text color={textMuted} fontSize="sm">No geographic data yet.</Text>}
              </Stack>
            </Box>
          ))}
        </Grid>
      </Card>
    </Box>
  )
}
