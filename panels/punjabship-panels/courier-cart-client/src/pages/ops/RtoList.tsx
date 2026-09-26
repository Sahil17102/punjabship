import { Paper, Typography, Box, Button, Alert } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { fetchMyRto, exportMyRto } from '../../api/rto'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import DataTable, { type Column } from '../../components/UI/table/DataTable'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'

type RtoRow = {
  awb_number?: string
  order_id?: string
  merchant_name?: string
  status?: string
  reason?: string
  remarks?: string
  rto_charges?: number | string
}
type TableRow = RtoRow & { id: string | number }

export default function RtoList() {
  const [rows, setRows] = useState<RtoRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filters, setFilters] = useState<{ search?: string; fromDate?: string; toDate?: string; courier?: string }>({})
  const [exportError, setExportError] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const resp = await fetchMyRto({
          courier: filters.courier,
          page,
          limit: rowsPerPage,
          search: filters.search,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
        })
        setRows(resp?.data || [])
        setTotalCount(resp?.totalCount || 0)
      } finally {
        setLoading(false)
      }
    })()
  }, [page, rowsPerPage, filters])

  const columns: Column<TableRow>[] = useMemo(
    () => [
      { id: 'awb_number', label: 'AWB' },
      {
        id: 'merchant_name',
        label: 'Seller Name',
        render: (value) => (
          <Typography variant="body2" fontWeight={600}>
            {String(value || 'Seller')}
          </Typography>
        ),
      },
      { id: 'order_id', label: 'Order ID' },
      { id: 'status', label: 'Status' },
      { id: 'reason', label: 'Reason' },
      { id: 'remarks', label: 'Remarks' },
      { id: 'rto_charges', label: 'RTO Charges' },
    ],
    [],
  )

  const filterFields: FilterField[] = [
    { name: 'search', label: 'Search', type: 'text', placeholder: 'AWB / Order ID / Reason' },
    { name: 'fromDate', label: 'From', type: 'date' },
    { name: 'toDate', label: 'To', type: 'date' },
    { name: 'courier', label: 'Courier name', type: 'text', placeholder: 'Search courier name' },
  ]

  const tableRows: TableRow[] = useMemo(
    () => rows.map((r, idx) => ({ id: r.awb_number || r.order_id || idx, ...r })),
    [rows],
  )

  const controls = (
    <Box sx={{ px: 2 }}>
      <Button onClick={async () => { try { setExportError(''); await exportMyRto(filters) } catch { setExportError('Could not download the RTO report. Please retry.') } }}>Download RTO report</Button>
      {exportError && <Alert severity="error">{exportError}</Alert>}
      <FilterBar
        fields={filterFields}
        defaultValues={filters}
        onApply={(f) => {
          setFilters(f)
          setPage(1)
        }}
        mode="button"
        buttonLabel="Filters"
        appliedCount={Object.values(filters).filter(Boolean).length}
      />
    </Box>
  )

  const table = (
    <Paper sx={{ borderRadius: 2, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
      {loading ? (
        <Typography p={3}>Loading RTO events...</Typography>
      ) : (
        <DataTable
          rows={tableRows}
          columns={columns}
          title="RTO Events"
          pagination
          currentPage={page}
          onPageChange={setPage}
          onRowsPerPageChange={(n) => {
            setRowsPerPage(n)
            setPage(1)
          }}
          defaultRowsPerPage={rowsPerPage}
          totalCount={totalCount}
        />
      )}
    </Paper>
  )

  return (
    <ListPageLayout
      title="RTO Events"
      description="Manage return-to-origin shipments and charges"
      controls={controls}
    >
      {table}
    </ListPageLayout>
  )
}
