import { alpha, Box, Button, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { FiDownload, FiSettings } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { exportWeightDiscrepancies } from '../../api/weightReconciliation'
import type { WeightDiscrepancy } from '../../api/weightReconciliation'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'
import StatusChip from '../../components/UI/chip/StatusChip'
import DataTable, { type Column } from '../../components/UI/table/DataTable'
import {
  useBulkAcceptDiscrepancies,
  useBulkRejectDiscrepancies,
  useWeightDiscrepancies,
  useWeightReconciliationSummary,
} from '../../hooks/useWeightReconciliation'

const statusColorMap: Record<string, 'success' | 'error' | 'info' | 'pending'> = {
  pending: 'pending',
  accepted: 'success',
  disputed: 'info',
  resolved: 'success',
  rejected: 'error',
  closed: 'info',
}

type WeightReconciliationFilters = {
  status?: string
  courierPartner?: string
  fromDate?: string
  toDate?: string
  search?: string
}

export default function WeightReconciliation() {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filters, setFilters] = useState<WeightReconciliationFilters>({
    status: undefined,
    courierPartner: undefined,
    fromDate: undefined,
    toDate: undefined,
    search: undefined,
  })
  const [selectedDiscrepancies, setSelectedDiscrepancies] = useState<string[]>([])

  const apiFilters: Record<string, unknown> = { page, limit: rowsPerPage }
  if (filters.status) apiFilters.status = [filters.status]
  if (filters.courierPartner) apiFilters.courierPartner = [filters.courierPartner]
  if (filters.fromDate) apiFilters.fromDate = filters.fromDate
  if (filters.toDate) apiFilters.toDate = filters.toDate

  const { data: discrepanciesData, refetch } = useWeightDiscrepancies(apiFilters)
  const { data: summary } = useWeightReconciliationSummary(filters.fromDate, filters.toDate)
  const bulkAccept = useBulkAcceptDiscrepancies()
  const bulkReject = useBulkRejectDiscrepancies()

  const discrepancies = discrepanciesData?.discrepancies || []
  const totalCount = discrepanciesData?.pagination?.total || 0

  const filteredDiscrepancies = filters.search
    ? discrepancies.filter((d: WeightDiscrepancy) => {
        const query = String(filters.search || '').toLowerCase()
        return (
          d.order_number.toLowerCase().includes(query) ||
          d.awb_number?.toLowerCase().includes(query) ||
          d.courier_partner?.toLowerCase().includes(query)
        )
      })
    : discrepancies
  const summaryStats = summary?.summary

  const handleExport = async () => {
    try {
      const blob = await exportWeightDiscrepancies({
        status: filters.status ? [filters.status] : undefined,
        courierPartner: filters.courierPartner ? [filters.courierPartner] : undefined,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `weight-discrepancies-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export weight discrepancies:', error)
      alert('Failed to export CSV. Please try again.')
    }
  }

  const handleBulkAccept = () => {
    if (selectedDiscrepancies.length === 0) return
    if (confirm(`Accept ${selectedDiscrepancies.length} selected discrepancies?`)) {
      bulkAccept.mutate(
        { discrepancyIds: selectedDiscrepancies, notes: 'Bulk accepted from dashboard' },
        {
          onSuccess: () => {
            setSelectedDiscrepancies([])
            refetch()
          },
        },
      )
    }
  }

  const handleBulkReject = () => {
    if (selectedDiscrepancies.length === 0) return
    const reason = prompt('Enter reason for rejecting these discrepancies:')
    if (!reason) return

    bulkReject.mutate(
      { discrepancyIds: selectedDiscrepancies, reason },
      {
        onSuccess: () => {
          setSelectedDiscrepancies([])
          refetch()
        },
      },
    )
  }

  const columns: Column<WeightDiscrepancy>[] = [
    { id: 'order_number', label: 'Order #' },
    { id: 'awb_number', label: 'AWB #' },
    { id: 'courier_partner', label: 'Courier' },
    {
      id: 'declared_weight',
      label: 'Declared (kg)',
      render: (value: string) => `${(Number(value) / 1000).toFixed(2)}`,
    },
    {
      id: 'charged_weight',
      label: 'Charged (kg)',
      render: (value: string) => `${(Number(value) / 1000).toFixed(2)}`,
    },
    {
      id: 'weight_difference',
      label: 'Difference (kg)',
      render: (value: string) => (
        <Typography component="span" sx={{ color: Number(value) > 0 ? '#D73A49' : '#059669', fontWeight: 700 }}>
          {Number(value) > 0 ? '+' : ''}
          {(Number(value) / 1000).toFixed(3)}
        </Typography>
      ),
    },
    {
      id: 'additional_charge',
      label: 'Extra Charge',
      render: (value: string) => `₹${Number(value || 0).toFixed(2)}`,
    },
    {
      id: 'status',
      label: 'Status',
      render: (value: string, row: WeightDiscrepancy) => {
        let displayLabel = value
        if (value === 'resolved') {
          if (row.has_dispute && row.resolution_notes?.includes('rejected')) {
            displayLabel = 'Resolved (Dispute Rejected)'
          } else if (row.has_dispute && row.resolution_notes?.includes('approved')) {
            displayLabel = 'Resolved (Dispute Approved)'
          } else {
            displayLabel = 'Resolved'
          }
        }
        return <StatusChip label={displayLabel} status={statusColorMap[value] || 'success'} />
      },
    },
  ]

  const filterFields: FilterField[] = [
    { name: 'search', label: 'Search', type: 'text', placeholder: 'Order # / AWB / Courier' },
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Disputed', value: 'disputed' },
        { label: 'Resolved', value: 'resolved' },
        { label: 'Rejected', value: 'rejected' },
      ],
      isAdvanced: true,
    },
    { name: 'fromDate', label: 'From Date', type: 'date', placeholder: 'YYYY-MM-DD' },
    { name: 'toDate', label: 'To Date', type: 'date', placeholder: 'YYYY-MM-DD' },
  ]

  const summaryCards = (
    <Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
        {[
          { label: 'Pending', value: summaryStats?.pendingCount || 0 },
          { label: 'Disputed', value: summaryStats?.disputedCount || 0 },
          {
            label: 'Recovered',
            value: `₹${Number(summaryStats?.totalAdditionalCharges || 0).toFixed(2)}`,
          },
        ].map((item) => (
          <Box
            key={item.label}
            sx={{
              flex: 1,
              p: 2.2,
              borderRadius: 4,
              bgcolor: '#fff',
              border: '1px solid rgba(217, 4, 22, 0.12)',
              boxShadow: '0 14px 30px rgba(20, 20, 20, 0.06)',
            }}
          >
            <Typography sx={{ color: '#6E6763', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
              {item.label}
            </Typography>
            <Typography sx={{ color: '#17171A', fontSize: '1.7rem', fontWeight: 800, mt: 0.8 }}>
              {item.value}
            </Typography>
          </Box>
        ))}
    </Stack>
  )

  const controls = (
    <Box sx={{ px: 2 }}>
      <FilterBar
        fields={filterFields}
        onApply={(newFilters) => {
          setFilters({
            status: newFilters.status || undefined,
            courierPartner: newFilters.courierPartner || undefined,
            fromDate: newFilters.fromDate || undefined,
            toDate: newFilters.toDate || undefined,
            search: newFilters.search || undefined,
          })
          setPage(1)
        }}
        defaultValues={{
          status: '',
          courierPartner: '',
          fromDate: '',
          toDate: '',
          search: '',
        }}
        mode="button"
        buttonLabel="Filters"
        appliedCount={Object.values(filters).filter(Boolean).length}
      />
    </Box>
  )

  const selectionInfo = selectedDiscrepancies.length > 0 && (
    <Box
      sx={{
        p: 1.6,
        borderRadius: 4,
        bgcolor: alpha('#0877C9', 0.06),
        border: '1px solid rgba(217, 4, 22, 0.12)',
      }}
    >
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} gap={1.5}>
        <Typography sx={{ fontWeight: 700, color: '#17171A' }}>
          {selectedDiscrepancies.length} discrepancies selected
        </Typography>
        <Stack direction="row" gap={1}>
          <Button variant="outlined" color="error" onClick={handleBulkReject} disabled={bulkReject.isPending} sx={{ borderRadius: 1.5 }}>
            Reject Selected
          </Button>
          <Button variant="contained" onClick={handleBulkAccept} disabled={bulkAccept.isPending} sx={{ borderRadius: 1.5 }}>
            Accept Selected
          </Button>
        </Stack>
      </Stack>
    </Box>
  )

  return (
    <ListPageLayout
      title="Weight Reconciliation"
      description="Review courier weight discrepancies, accept or dispute charges, and export records."
      actions={[
        {
          label: 'Export CSV',
          onClick: handleExport,
          icon: <FiDownload />,
          variant: 'outlined',
        },
        {
          label: 'Settings',
          onClick: () => navigate('/reconciliation/weight/settings'),
          icon: <FiSettings />,
          variant: 'outlined',
        },
      ]}
      controls={controls}
      selectionInfo={selectionInfo}
    >
      <Box sx={{ px: 2, mb: 2 }}>{summaryCards}</Box>
      <DataTable
        rows={filteredDiscrepancies.map((row) => ({ ...row, id: row.id }))}
        columns={columns}
        title="Discrepancies"
        subTitle="Detailed weight mismatch records from courier billing"
        selectable
        selectedRowIds={selectedDiscrepancies}
        onSelectRows={(ids) => setSelectedDiscrepancies(ids as string[])}
        pagination
        currentPage={page - 1}
        onPageChange={(nextPage) => setPage(nextPage + 1)}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value)
          setPage(1)
        }}
        totalCount={totalCount}
        defaultRowsPerPage={rowsPerPage}
        onRowClick={(row) => navigate(`/reconciliation/weight/${row.id}`)}
      />
    </ListPageLayout>
  )
}
