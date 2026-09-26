import {
  Alert,
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material'
import { useMemo, useState } from 'react'
import { MdKeyboardReturn, MdRefresh } from 'react-icons/md'
import { useB2COrdersByUser, useCreateReverseShipment } from '../../hooks/Orders/useOrders'
import type { B2COrder } from '../../types/generic.types'
import DataTable, { type Column } from '../../components/UI/table/DataTable'
import { SmartTabs, type TabItem } from '../../components/UI/tab/Tabs'
import StatusChip from '../../components/UI/chip/StatusChip'
import ReverseModal, {
  type OrderForReverse,
  type ReverseCreatePayload,
} from '../../components/orders/reverse/ReverseModal'

type ReversePickupTab = 'eligible' | 'created'

const SUPPORTED_REVERSE_PROVIDERS = new Set([
  'delhivery',
  'shadowfax',
  'xpressbees',
  'ekart',
  'amazon',
])
const REVERSE_ORIGINAL_TAG_PREFIX = 'reverse_original_id='

const formatDate = (value?: string | null) => {
  if (!value) return '-'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '-'
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const money = (value: unknown) => `Rs. ${Number(value || 0).toFixed(2)}`

const getProviderKey = (order: Pick<B2COrder, 'integration_type'>) =>
  String(order.integration_type || '').trim().toLowerCase()

const isReverseProviderSupported = (order: Pick<B2COrder, 'integration_type'>) =>
  SUPPORTED_REVERSE_PROVIDERS.has(getProviderKey(order))

const extractReverseOriginalId = (tags?: string | null) => {
  const parts = String(tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)

  const marker = parts.find((tag) =>
    tag.toLowerCase().startsWith(REVERSE_ORIGINAL_TAG_PREFIX),
  )

  return marker ? marker.slice(REVERSE_ORIGINAL_TAG_PREFIX.length) : null
}

export default function ReversePickups() {
  const [tab, setTab] = useState<ReversePickupTab>('eligible')
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<OrderForReverse | null>(null)

  const filters =
    tab === 'eligible'
      ? { status: 'delivered', search: search || undefined, sortBy: 'created_at' as const, sortOrder: 'desc' as const }
      : { type: 'reverse', search: search || undefined, sortBy: 'created_at' as const, sortOrder: 'desc' as const }

  const { data, isLoading, isFetching, refetch } = useB2COrdersByUser(page, rowsPerPage, filters)
  const { data: reverseData } = useB2COrdersByUser(1, 5000, {
    type: 'reverse',
    fetchAll: true,
    sortBy: 'created_at',
    sortOrder: 'desc',
  })
  const { mutateAsync: createReversePickup, isPending: creatingReversePickup } =
    useCreateReverseShipment()

  const orders: B2COrder[] = data?.orders || []
  const reverseOriginalIds = useMemo(() => {
    const ids = new Set<string>()
    ;(reverseData?.orders || []).forEach((order: B2COrder) => {
      const originalId = extractReverseOriginalId(order.tags)
      if (originalId) ids.add(originalId)
    })
    return ids
  }, [reverseData?.orders])
  const reverseOrderNumberPrefixes = useMemo(() => {
    const prefixes = new Set<string>()
    ;(reverseData?.orders || []).forEach((order: B2COrder) => {
      const orderNumber = String(order.order_number || '').trim()
      const reverseSuffixIndex = orderNumber.toLowerCase().indexOf('-r')
      if (reverseSuffixIndex > 0) {
        prefixes.add(orderNumber.slice(0, reverseSuffixIndex).toLowerCase())
      }
    })
    return prefixes
  }, [reverseData?.orders])

  const tabs: TabItem<ReversePickupTab>[] = [
    { label: 'Eligible Orders', value: 'eligible' },
    { label: 'Reverse Pickups', value: 'created' },
  ]

  const handleTabChange = (nextTab: ReversePickupTab) => {
    setTab(nextTab)
    setPage(1)
  }

  const handleSearch = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleCreateReversePickup = async (payload: ReverseCreatePayload) => {
    await createReversePickup(payload)
    setSelectedOrder(null)
    await refetch()
  }

  const columns: Column<B2COrder>[] = [
    {
      id: 'order_number',
      label: tab === 'eligible' ? 'Original Order' : 'Reverse Order',
      minWidth: 170,
      render: (_, row) => (
        <Stack spacing={0.25}>
          <Typography fontWeight={700}>{row.order_number}</Typography>
          <Typography variant="caption" color="text.secondary">
            {row.awb_number || (row as any).provider_reference || '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'buyer_name',
      label: tab === 'eligible' ? 'Customer Pickup' : 'Return Destination',
      minWidth: 220,
      render: (_, row) => (
        <Stack spacing={0.25}>
          <Typography fontWeight={600}>{row.buyer_name || '-'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {[row.city, row.state, row.pincode].filter(Boolean).join(', ') || '-'}
          </Typography>
        </Stack>
      ),
    },
    {
      id: 'integration_type',
      label: 'Courier',
      minWidth: 140,
      render: (_, row) => {
        const supported = isReverseProviderSupported(row)
        return (
          <Stack spacing={0.5} alignItems="flex-start">
            <Typography fontWeight={600}>
              {row.courier_partner || row.integration_type || '-'}
            </Typography>
            {tab === 'eligible' && (
              <Chip
                size="small"
                label={supported ? 'Reverse supported' : 'Not supported'}
                color={supported ? 'success' : 'default'}
                variant={supported ? 'filled' : 'outlined'}
              />
            )}
          </Stack>
        )
      },
    },
    {
      id: 'order_status',
      label: 'Status',
      minWidth: 140,
      render: (value) => <StatusChip label={String(value || '-')} status="info" />,
    },
    {
      id: 'shipping_charges',
      label: tab === 'eligible' ? 'Original Freight' : 'Reverse Freight',
      align: 'right',
      minWidth: 140,
      render: (value, row) => (
        <Typography fontWeight={700}>{money((row as any).freight_charges ?? value)}</Typography>
      ),
    },
    {
      id: 'created_at',
      label: tab === 'eligible' ? 'Delivered Order Date' : 'Created Date',
      minWidth: 150,
      render: (value) => formatDate(String(value || '')),
    },
    {
      id: 'id',
      label: 'Action',
      align: 'right',
      minWidth: 190,
      stickyRight: true,
      render: (_, row) => {
        if (tab === 'created') {
          return (
            <Button size="small" variant="outlined" disabled>
              Created
            </Button>
          )
        }

        const supported = isReverseProviderSupported(row)
        const alreadyCreated =
          reverseOriginalIds.has(String(row.id)) ||
          reverseOrderNumberPrefixes.has(String(row.order_number || '').trim().toLowerCase())
        return (
          <Button
            size="small"
            variant="contained"
            startIcon={<MdKeyboardReturn size={16} />}
            disabled={!supported || alreadyCreated}
            onClick={() => setSelectedOrder(row as unknown as OrderForReverse)}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {alreadyCreated ? 'Already Created' : 'Create Pickup'}
          </Button>
        )
      },
    },
  ]

  return (
    <Stack spacing={2.2} sx={{ py: { xs: 2, md: 1 } }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', md: 'center' }}
        gap={1.5}
      >
        <Box>
          <Typography sx={{ fontSize: { xs: '1.25rem', md: '1.55rem' }, fontWeight: 800 }}>
            Reverse Pickups
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Delhivery, Shadowfax, Xpressbees, Ekart, and Amazon reverse pickups are available.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} gap={1} alignItems="stretch">
          <TextField
            size="small"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSearch()
            }}
            placeholder="Search order, AWB, customer"
            sx={{ minWidth: { xs: '100%', sm: 260 } }}
          />
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
          <Button variant="outlined" startIcon={<MdRefresh />} onClick={() => refetch()}>
            Refresh
          </Button>
        </Stack>
      </Stack>

      <SmartTabs tabs={tabs} value={tab} onChange={handleTabChange} showDivider={false} />

      {tab === 'eligible' && (
        <Alert
          severity="info"
          sx={{
            border: `1px solid ${alpha('#0288d1', 0.16)}`,
          }}
        >
          Reverse pickup can be created for delivered B2C orders on supported couriers.
        </Alert>
      )}

      <DataTable<B2COrder>
        rows={orders}
        columns={columns}
        loading={isLoading || isFetching}
        loadingLabel="Loading reverse pickups..."
        emptyMessage={
          tab === 'eligible'
            ? 'No delivered B2C orders are available for reverse pickup.'
            : 'No reverse pickups have been created yet.'
        }
        pagination
        currentPage={page - 1}
        defaultRowsPerPage={rowsPerPage}
        totalCount={data?.totalCount || 0}
        onPageChange={(newPage) => setPage(newPage + 1)}
        onRowsPerPageChange={(newLimit) => {
          setRowsPerPage(newLimit)
          setPage(1)
        }}
      />

      <ReverseModal
        open={Boolean(selectedOrder)}
        order={selectedOrder}
        confirming={creatingReversePickup}
        onClose={() => setSelectedOrder(null)}
        onConfirm={handleCreateReversePickup}
      />
    </Stack>
  )
}
