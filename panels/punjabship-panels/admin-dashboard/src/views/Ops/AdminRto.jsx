import {
  Button,
  Flex,
  HStack,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Tag,
  Text,
} from '@chakra-ui/react'
import TableFilters from 'components/Tables/TableFilters'
import { SellerAutocomplete } from 'components/Input/SellerAutocomplete'
import { useAdminRto, useAdminRtoKpis } from 'hooks/useOps'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { exportAdminRto } from 'services/ops.service'
import { GenericTable } from 'views/Dashboard/Tables/components/GenericTable'

export default function AdminRto() {
  const location = useLocation()
  const routeSearch = new URLSearchParams(location.search).get('search') || ''
  const [filters, setFilters] = useState({ search: routeSearch, fromDate: '', toDate: '' })
  const [page, setPage] = useState(1)
  const [userId, setUserId] = useState('')
  const [perPage, setPerPage] = useState(20)

  useEffect(() => {
    setFilters((current) => ({
      ...current,
      search: new URLSearchParams(location.search).get('search') || '',
    }))
    setPage(1)
  }, [location.search])

  const { data, isLoading } = useAdminRto({
    userId: userId || undefined,
    courier: filters.courier || undefined,
    page,
    limit: perPage,
    search: filters.search,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
  })
  const { data: kpisData } = useAdminRtoKpis({
    userId: userId || undefined,
    courier: filters.courier || undefined,
    search: filters.search,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
  })
  const rows = data?.data || []

  const filterOptions = [
    { key: 'search', label: 'Search', type: 'text', placeholder: 'AWB / Order / Reason' },
    { key: 'fromDate', label: 'From', type: 'date' },
    { key: 'toDate', label: 'To', type: 'date' },
    { key: 'courier', label: 'Courier name', type: 'text', placeholder: 'Search courier name' },
  ]

  const totalCount = data?.totalCount || 0

  const captions = [
    'AWB',
    'Seller Name',
    'Product',
    'Order',
    'Status',
    'Reason',
    'Remarks',
    'RTO Charges',
    'Created',
  ]
  const columnKeys = [
    'awb_number',
    'merchant_name',
    'product_summary',
    'order_id',
    'status',
    'reason',
    'remarks',
    'rto_charges',
    'created_at',
  ]

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }} gap={4}>
      <HStack justify="space-between">
        <HStack spacing={6}>
          <Stat>
            <StatLabel>Total RTO Events</StatLabel>
            <StatNumber>{kpisData?.data?.total ?? 0}</StatNumber>
            <StatHelpText>All statuses</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>RTO Charges</StatLabel>
            <StatNumber>₹{Number(kpisData?.data?.totalCharges || 0).toFixed(2)}</StatNumber>
            <StatHelpText>Sum of RTO charges</StatHelpText>
          </Stat>
        </HStack>
        <Button
          onClick={() =>
            exportAdminRto({
              userId: userId || undefined,
              courier: filters.courier || undefined,
              search: filters.search,
              fromDate: filters.fromDate || undefined,
              toDate: filters.toDate || undefined,
            })
          }
          colorScheme="blue"
          variant="solid"
        >
          Export CSV
        </Button>
      </HStack>

      <TableFilters
        key={userId}
        filters={filterOptions}
        values={filters}
        onApply={(f) => {
          setFilters(f)
          setPage(1)
        }}
      />
      <SellerAutocomplete value={userId} onChange={(value) => { setUserId(value); setPage(1) }} placeholder="Filter by seller" />

      <GenericTable
        paginated
        loading={isLoading}
        page={page}
        setPage={setPage}
        totalCount={totalCount}
        perPage={perPage}
        isLoading={isLoading}
        setPerPage={setPerPage}
        title="RTO Events"
        data={rows}
        captions={captions}
        columnKeys={columnKeys}
        renderers={{
          merchant_name: (v) => (
            <Text fontSize="sm" fontWeight="600" maxW="220px" noOfLines={2}>
              {v || '—'}
            </Text>
          ),
          product_summary: (v) => (
            <Text fontSize="sm" maxW="320px" noOfLines={2}>
              {v || '—'}
            </Text>
          ),
          status: (v) => <Tag>{v}</Tag>,
          rto_charges: (v) => (
            <Text fontSize="sm" fontWeight="600">
              {v ? `₹${Number(v).toFixed(2)}` : '—'}
            </Text>
          ),
          created_at: (v) => <Text fontSize="xs">{v ? new Date(v).toLocaleString() : '—'}</Text>,
        }}
        columnWidths={{
          awb_number: '160px',
          merchant_name: '220px',
          product_summary: '320px',
          order_id: '180px',
          status: '120px',
          reason: '260px',
          remarks: '260px',
          rto_charges: '140px',
          created_at: '180px',
        }}
      />
    </Flex>
  )
}
