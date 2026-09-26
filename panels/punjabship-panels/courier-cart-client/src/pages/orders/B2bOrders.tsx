import { useMediaQuery, useTheme, Box, Button } from '@mui/material'
import { useState } from 'react'
import { FiPlusCircle } from 'react-icons/fi'
import { MdDownload } from 'react-icons/md'
import Papa from 'papaparse'
import moment from 'moment'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import CustomDrawer from '../../components/UI/drawer/CustomDrawer'
import CustomInput from '../../components/UI/inputs/CustomInput'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'
import B2BOrderForm from '../../components/orders/b2b/B2BOrderForm'
import B2BOrdersList from '../../components/orders/b2b/B2bOrdersList'
import ShipmentStageFilter, {
  b2bShipmentStageGroups,
} from '../../components/orders/ShipmentStageFilter'
import { useKycVerification } from '../../hooks/User/useKycVerification'
import { useB2BOrdersByUser } from '../../hooks/Orders/useOrders'
import { toast } from '../../components/UI/Toast'
import type { B2BOrder } from '../../types/generic.types'
import { fetchOrdersForCsvExport } from '../../api/order.service'
import {
  CLIENT_ORDER_ADDED_HEADERS,
  downloadClientOrdersCsv,
} from '../../utils/orderCsvExport'

const B2bOrders = () => {
  const [page, setPage] = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [exportingCsv, setExportingCsv] = useState(false)
  const [filters, setFilters] = useState<{
    status?: string
    fromDate?: string
    toDate?: string
    search?: string
  }>({})

  const filterFields: FilterField[] = [
    {
      name: 'search',
      label: 'Search',
      type: 'text',
      placeholder: 'AWB, customer, phone, order',
    },
    {
      name: 'fromDate',
      label: 'From Date',
      type: 'date',
      placeholder: 'From',
    },
    {
      name: 'toDate',
      label: 'To Date',
      type: 'date',
      placeholder: 'To',
    },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleApplyFilters = (appliedFilters: any) => {
    setFilters(appliedFilters)
    setPage(1)
  }

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const { checkKycBeforeAction } = useKycVerification()
  const { data } = useB2BOrdersByUser(page, rowsPerPage, filters)

  const handleCreateB2BOrder = () => {
    checkKycBeforeAction(() => {
      setDrawerOpen(true)
    })
  }

  const handleExportCSV = async () => {
    if (exportingCsv) return

    setExportingCsv(true)
    try {
      const exportOrders = await fetchOrdersForCsvExport('b2b', filters)
      if (!exportOrders.length) {
        toast.open({ message: 'No orders to export', severity: 'warning' })
        return
      }

      downloadClientOrdersCsv(exportOrders, 'b2b')
      toast.open({
        message: `Exported ${exportOrders.length} B2B orders with ${CLIENT_ORDER_ADDED_HEADERS.length} added columns.`,
        severity: 'success',
      })
    } catch {
      toast.open({ message: 'Failed to export orders', severity: 'error' })
    } finally {
      setExportingCsv(false)
    }

    if (Date.now() < 0) {
    const orders = data?.orders || []
    if (!orders.length) {
      toast.open({ message: 'No orders to export', severity: 'warning' })
      return
    }

    const csvData = orders.map((order: B2BOrder) => ({
      'Order #': order.order_number || order.id,
      'AWB': order.awb_number || '—',
      'Buyer Name': order.buyer_name || '—',
      'Amount': `₹${Number(order.order_amount ?? 0).toFixed(2)}`,
      'Courier': order.courier_partner || '—',
      'Source': order.is_external_api ? 'API' : 'Local',
      'Status': order.order_status || '—',
      'Created At': moment(order.order_date).format('DD MMM YYYY'),
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `b2b-orders-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    toast.open({ message: 'Orders exported successfully', severity: 'success' })
    }
  }

  const handleSearchChange = (value: string) => {
    setFilters((previous) => ({ ...previous, search: value }))
    setPage(1)
  }

  const controls = (
    <Box
      sx={{
        px: 2,
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 360px) auto auto' },
        gap: 1.5,
        alignItems: 'end',
        width: '100%',
      }}
    >
      <CustomInput
        label="Search"
        placeholder="AWB, customer, phone, order"
        value={filters.search || ''}
        onChange={(event) => handleSearchChange(event.target.value)}
        fullWidth
      />
      <Button
        size="small"
        variant="outlined"
        startIcon={<MdDownload />}
        onClick={handleExportCSV}
        disabled={exportingCsv}
        sx={{
          textTransform: 'none',
          borderRadius: 1.5,
          fontSize: '0.9rem',
        }}
      >
        {exportingCsv ? 'Exporting...' : 'Export'}
      </Button>
      <FilterBar
        fields={filterFields}
        onApply={handleApplyFilters}
        defaultValues={{ status: '', fromDate: '', toDate: '', search: '' }}
        mode="button"
        buttonLabel="Filters"
        appliedCount={Object.values(filters).filter(Boolean).length}
      />
    </Box>
  )

  return (
    <>
      <ListPageLayout
        title="My B2B Orders"
        description="Manage and track business-to-business orders"
        actions={[
          {
            label: 'Create B2B Order',
            onClick: handleCreateB2BOrder,
            icon: <FiPlusCircle />,
            variant: 'contained',
          },
        ]}
        controls={controls}
      >
        <ShipmentStageFilter
          ariaLabel="B2B shipment stage"
          groups={b2bShipmentStageGroups}
          value={filters.status || ''}
          counts={data?.statusCounts}
          onChange={(status) => {
            setFilters((previous) => ({ ...previous, status: status || undefined }))
            setPage(1)
          }}
        />
        <B2BOrdersList
          page={page}
          rowsPerPage={rowsPerPage}
          setPage={setPage}
          setRowsPerPage={setRowsPerPage}
          filters={filters}
        />
      </ListPageLayout>

      <CustomDrawer
        width={isMobile ? '100%' : 1400}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Create New B2B Order"
      >
        <B2BOrderForm onClose={() => setDrawerOpen(false)} />
      </CustomDrawer>
    </>
  )
}

export default B2bOrders
