import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  Select,
  useToast,
} from '@chakra-ui/react'
import PageHeader from 'components/Admin/PageHeader'
import ShipmentStageFilter from 'components/Orders/ShipmentStageFilter'
import OrdersTable from 'components/Tables/OrdersTable'
import TableFilters from 'components/Tables/TableFilters'
import { useOrders } from 'hooks/useOrders'
import { useEffect, useMemo, useState } from 'react'
import { FiDownload, FiRefreshCw } from 'react-icons/fi'
import { useLocation } from 'react-router-dom'
import { exportOrdersToCSV } from 'services/order.service'

const getRouteFiltersFromSearch = (search) => {
  const params = new URLSearchParams(search)
  return {
    status: params.get('status') || '',
    pickupAlert: params.get('pickupAlert') || '',
    search: params.get('search') || '',
    fromDate: params.get('fromDate') || '',
    toDate: params.get('toDate') || '',
  }
}

const Orders = () => {
  const location = useLocation()
  const initialRouteFilters = getRouteFiltersFromSearch(location.search)
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [filters, setFilters] = useState({
    status: '',
    pickupAlert: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    search: '',
    fromDate: '',
    toDate: '',
    ...initialRouteFilters,
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportReport, setExportReport] = useState('orders')

  const { data: ordersData, isLoading, isFetching, refetch } = useOrders(page, limit, filters)
  const toast = useToast()

  useEffect(() => {
    const nextRouteFilters = getRouteFiltersFromSearch(location.search)
    setFilters((prev) => {
      return {
        ...prev,
        ...nextRouteFilters,
      }
    })
    setPage(1)
  }, [location.search])

  // Calculate statistics
  const stats = useMemo(() => {
    const orders = ordersData?.orders || []
    return {
      total: ordersData?.totalCount || 0,
      pending: orders.filter((o) => o.order_status === 'pending').length,
      delivered: orders.filter((o) => o.order_status === 'delivered').length,
    }
  }, [ordersData])

  const handleStatusFilter = (statusValue = '') => {
    setFilters((prev) => ({
      ...prev,
      status: statusValue,
    }))
    setPage(1)
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await exportOrdersToCSV(filters, exportReport)
      toast({
        title: 'Export successful',
        description: `${exportReport === 'orders' ? 'Orders' : exportReport === 'user-wise' ? 'User-wise' : 'Order'} report exported to CSV`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: error.message || 'Failed to export orders',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsExporting(false)
    }
  }

  const filterOptions = [
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search by Order ID, AWB, or Customer...',
    },
    {
      key: 'status',
      label: 'Order Status',
      type: 'select',
      placeholder: 'All Statuses',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'pickup_initiated', label: 'Pickup Initiated' },
        { value: 'shipment_created', label: 'Shipment Created' },
        { value: 'manifest_failed', label: 'Manifest Failed' },
        { value: 'in_transit', label: 'In Transit' },
        { value: 'out_for_delivery', label: 'Out for Delivery' },
        { value: 'ndr', label: 'NDR' },
        { value: 'undelivered', label: 'Undelivered' },
        { value: 'delivered', label: 'Delivered' },
        { value: 'cancellation_requested', label: 'Cancellation Requested' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'rto', label: 'RTO' },
        { value: 'rto_in_transit', label: 'RTO In Transit' },
        { value: 'rto_delivered', label: 'RTO Delivered' },
      ],
    },
    {
      key: 'fromDate',
      label: 'From Date',
      type: 'date',
      placeholder: 'Start Date',
    },
    {
      key: 'toDate',
      label: 'To Date',
      type: 'date',
      placeholder: 'End Date',
    },
    {
      key: 'pickupAlert',
      label: 'Pickup Alert',
      type: 'select',
      placeholder: 'All Pickup Alerts',
      options: [
        { value: 'pending_for_pickup', label: 'Pending for pickup' },
        { value: 'not_scheduled', label: 'Pickup not scheduled' },
      ],
    },
  ]

  return (
    <Box pt={{ base: '120px', md: '75px' }}>
      <Box mb={4}>
        <PageHeader
          eyebrow="Orders"
          title="Shipment desk for every live order"
          description="Review order flow, surface risky shipments early and move from investigation to action without leaving the queue."
          meta={[
            { label: 'Total orders', value: stats.total.toLocaleString() },
            { label: 'Pending', value: stats.pending.toLocaleString() },
            { label: 'Delivered', value: stats.delivered.toLocaleString() },
          ]}
          actions={
            <HStack spacing={3} flexWrap="wrap">
              <Select
                size="sm"
                width="190px"
                borderRadius="14px"
                value={exportReport}
                onChange={(event) => setExportReport(event.target.value)}
                aria-label="Export report type"
              >
                <option value="orders">Detailed Orders</option>
                <option value="user-wise">User Wise Report</option>
                <option value="order-report">Order Report</option>
              </Select>
              <Button
                leftIcon={<FiRefreshCw />}
                onClick={() => refetch()}
                isLoading={isFetching}
                variant="outline"
                size="sm"
                borderRadius="14px"
              >
                Refresh
              </Button>
              <Button
                leftIcon={<FiDownload />}
                onClick={handleExport}
                isLoading={isExporting}
                loadingText="Exporting..."
                bg="brand.500"
                color="white"
                size="sm"
                borderRadius="14px"
                _hover={{ bg: 'brand.600' }}
              >
                Export CSV
              </Button>
            </HStack>
          }
        />
      </Box>

      <Box
        mb={3}
        px={{ base: 3, md: 4 }}
        py={2.5}
        bg="#F8F7FC"
        border="1px solid"
        borderColor="#D9D3EC"
        borderRadius="8px"
        boxShadow="0 3px 0 rgba(55, 45, 96, 0.05)"
      >
        <ShipmentStageFilter
          value={filters.status}
          onChange={handleStatusFilter}
          counts={ordersData?.statusCounts}
        />
      </Box>

      <Flex justify="space-between" align={{ base: 'stretch', md: 'center' }} direction={{ base: 'column', md: 'row' }} gap={3} mb={4}>
        <Text fontSize="sm" color="gray.500">
          Use the shipment stages for quick triage, then narrow the queue with filters below.
        </Text>
        <HStack spacing={3} align="center">
          <Text fontSize="sm" color="gray.500">
            Sort by Created At
          </Text>
          <Select
            size="sm"
            w="180px"
            borderRadius="14px"
            value={filters.sortOrder}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                sortBy: 'created_at',
                sortOrder: e.target.value,
              }))
              setPage(1)
            }}
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </Select>
        </HStack>
      </Flex>

      <Box
        mb={4}
        px={{ base: 3, md: 4 }}
        py={2.5}
        bg="#F8F7FC"
        border="1px solid"
        borderColor="#D9D3EC"
        borderRadius="8px"
        boxShadow="0 3px 0 rgba(55, 45, 96, 0.05)"
      >
          <TableFilters
            filters={filterOptions}
            values={filters}
            onApply={(appliedFilters) => {
              setFilters((prev) => ({
                ...appliedFilters,
                sortBy: prev.sortBy || 'created_at',
                sortOrder: prev.sortOrder || 'desc',
              }))
              setPage(1)
            }}
            actions={[]}
            showActiveFiltersCount={true}
            cardStyle={false}
            compact
          />
      </Box>
      <OrdersTable
        orders={ordersData?.orders}
        totalCount={ordersData?.totalCount}
        page={page}
        setPage={setPage}
        perPage={limit}
        setPerPage={setLimit}
        loading={isLoading || isFetching}
        onRefresh={refetch}
      />
    </Box>
  )
}

export default Orders
