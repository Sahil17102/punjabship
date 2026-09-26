import {
  alpha,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  Link,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import moment from 'moment'
import { useMemo, useState } from 'react'
import {
  MdAccessTime,
  MdAccountBalanceWallet,
  MdBolt,
  MdCheckCircle,
  MdClose,
  MdDownload,
  MdEdit,
  MdHourglassEmpty,
  MdTrendingUp,
} from 'react-icons/md'
import { getCodCycles, getMyCodCycle, selectMyCodCycle, type CodCycle } from '../../api/codRemittance'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import AWBLink from '../../components/UI/AWBLink'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'
import DataTable, { type Column } from '../../components/UI/table/DataTable'
import {
  handleCodRemittancesExport,
  useCodRemittances,
  useCodStats,
} from '../../hooks/useCodRemittance'

const BRAND_SURFACE = '#16181D'
const BRAND_PRIMARY = '#0877C9'
const BRAND_ORANGE = '#B8D719'

function formatMoney(value: number | string | undefined | null) {
  return `₹${Number(value || 0).toLocaleString('en-IN')}`
}

interface SummaryCardProps {
  title: string
  value: number
  helper: string
  icon: React.ReactNode
  tone: 'dark' | 'primary' | 'wine' | 'light'
}

function SummaryCard({ title, value, helper, icon, tone }: SummaryCardProps) {
  const toneStyles = {
    dark: {
      background: BRAND_SURFACE,
      border: '1px solid rgba(255,255,255,0.06)',
      titleColor: '#D8DEE8',
      valueColor: '#FFFFFF',
      helperColor: '#C7D0DD',
      iconBg: 'rgba(255,255,255,0.08)',
      iconColor: '#FFFFFF',
    },
    primary: {
      background: '#FFFFFF',
      border: `1px solid ${alpha(BRAND_PRIMARY, 0.14)}`,
      titleColor: '#4B5563',
      valueColor: BRAND_PRIMARY,
      helperColor: '#6B7280',
      iconBg: alpha(BRAND_PRIMARY, 0.08),
      iconColor: BRAND_PRIMARY,
    },
    wine: {
      background: '#FFFFFF',
      border: `1px solid ${alpha(BRAND_ORANGE, 0.16)}`,
      titleColor: '#4B5563',
      valueColor: BRAND_ORANGE,
      helperColor: '#6B7280',
      iconBg: alpha(BRAND_ORANGE, 0.1),
      iconColor: BRAND_ORANGE,
    },
    light: {
      background: '#F8FAFC',
      border: '1px solid rgba(15, 23, 42, 0.08)',
      titleColor: '#4B5563',
      valueColor: '#111827',
      helperColor: '#6B7280',
      iconBg: '#FFFFFF',
      iconColor: '#111827',
    },
  }[tone]

  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        p: 2.2,
        borderRadius: 0,
        background: toneStyles.background,
        border: toneStyles.border,
        boxShadow: 'none',
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.78rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: toneStyles.titleColor,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              mt: 1.1,
              fontSize: { xs: '1.55rem', md: '1.9rem' },
              fontWeight: 800,
              lineHeight: 1.05,
              color: toneStyles.valueColor,
            }}
          >
            {formatMoney(value)}
          </Typography>
          <Typography sx={{ mt: 1.1, fontSize: '0.84rem', color: toneStyles.helperColor }}>
            {helper}
          </Typography>
        </Box>

        <Box
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            borderRadius: 0,
            bgcolor: toneStyles.iconBg,
            color: toneStyles.iconColor,
            border: `1px solid ${alpha('#111827', tone === 'dark' ? 0.04 : 0.08)}`,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  )
}

export default function CodRemittancesList() {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [cycleDialogOpen, setCycleDialogOpen] = useState(false)
  const [acceptedCycleId, setAcceptedCycleId] = useState('')
  const [filters, setFilters] = useState<{
    status?: string
    fromDate?: Date
    toDate?: Date
  }>({})
  const queryClient = useQueryClient()

  // Convert Date objects to ISO strings for API
  const apiFilters = {
    status: filters.status,
    fromDate: filters.fromDate?.toISOString(),
    toDate: filters.toDate?.toISOString(),
  }

  // Use custom hooks
  const { data: stats } = useCodStats()
  const { data, isLoading } = useCodRemittances(page, rowsPerPage, apiFilters)
  const cyclesQuery = useQuery({
    queryKey: ['cod-remittance-cycles'],
    queryFn: getCodCycles,
  })
  const currentCycleQuery = useQuery({
    queryKey: ['my-cod-remittance-cycle'],
    queryFn: getMyCodCycle,
  })
  const currentCycle = currentCycleQuery.data
  const mustSelectCycle = !currentCycleQuery.isLoading && !currentCycle
  const isCycleDialogOpen = cycleDialogOpen || mustSelectCycle

  const cycleMutation = useMutation({
    mutationFn: selectMyCodCycle,
    onSuccess: (cycle) => {
      queryClient.setQueryData(['my-cod-remittance-cycle'], cycle)
      queryClient.invalidateQueries({ queryKey: ['my-cod-remittance-cycle'] })
      setAcceptedCycleId('')
      setCycleDialogOpen(false)
    },
  })

  const sortedCycles = useMemo(
    () => [...(cyclesQuery.data || [])].sort((a, b) => Number(a.days) - Number(b.days)),
    [cyclesQuery.data],
  )

  const handleExport = async () => {
    try {
      await handleCodRemittancesExport(apiFilters)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'credited' ? 'success' : 'info'
  }

  const getStatusIcon = (status: string) => {
    return status === 'credited' ? <MdCheckCircle /> : <MdHourglassEmpty />
  }

  const filterFields: FilterField[] = [
    {
      name: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Processing', value: 'pending' },
        { label: 'Settled', value: 'credited' },
      ],
      placeholder: 'Select status',
    },
    {
      name: 'fromDate',
      label: 'From Date',
      type: 'date',
      placeholder: 'Start date',
    },
    {
      name: 'toDate',
      label: 'To Date',
      type: 'date',
      placeholder: 'End date',
    },
  ]

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: Column<any>[] = [
    {
      id: 'referenceId',
      label: 'Reference ID',
      minWidth: 190,
      render: (val, row) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {val || row.id || 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'bankHolderName',
      label: 'Bank Holder Name',
      minWidth: 170,
      render: (val) => <Typography variant="body2">{val || 'N/A'}</Typography>,
    },
    {
      id: 'amount',
      label: 'Amount',
      minWidth: 110,
      render: (val, row) => (
        <Typography variant="body2" fontWeight={700}>
          {formatMoney(val ?? row.remittableAmount)}
        </Typography>
      ),
    },
    {
      id: 'dateTime',
      label: 'Date & Time',
      minWidth: 160,
      render: (val, row) => (
        <Typography variant="body2">
          {val
            ? moment(val).format('DD MMM YYYY HH:mm')
            : row.creditedAt
              ? moment(row.creditedAt).format('DD MMM YYYY HH:mm')
              : row.collectedAt
                ? moment(row.collectedAt).format('DD MMM YYYY HH:mm')
                : 'N/A'}
        </Typography>
      ),
    },
    {
      id: 'orderNumber',
      label: 'Order Number',
      minWidth: 150,
      render: (_, row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>
            {row.orderNumber}
          </Typography>
          {row.awbNumber && (
            <Typography variant="caption" color="text.secondary">
              AWB: <AWBLink awb={row.awbNumber} />
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'courierPartner',
      label: 'Courier',
      minWidth: 120,
      render: (val) => <Typography variant="body2">{val || 'N/A'}</Typography>,
    },
    {
      id: 'cycleName',
      label: 'Cycle / Fee',
      minWidth: 150,
      render: (val, row) => (
        <Box>
          <Typography variant="body2" fontWeight={600}>{val || 'Legacy'}</Typography>
          <Typography variant="caption" color="text.secondary">
            {Number(row.cycleFee || 0).toFixed(2)}% fee
            {row.eligibleAt ? ` | Due ${moment(row.eligibleAt).format('DD MMM YYYY')}` : ''}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'codAmount',
      label: 'COD Amount',
      minWidth: 120,
      render: (val) => (
        <Typography variant="body2" fontWeight={600}>
          {formatMoney(val)}
        </Typography>
      ),
    },
    {
      id: 'deductions',
      label: 'Settlement Adjustments',
      minWidth: 120,
      render: (val) => (
        <Typography variant="body2" color="error.main">
          -{formatMoney(val)}
        </Typography>
      ),
    },
    {
      id: 'remittableAmount',
      label: 'Remittable',
      minWidth: 130,
      render: (val) => (
        <Typography variant="body2" fontWeight={700} color="success.main">
          {formatMoney(val)}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 130,
      render: (val) => (
        <Chip label={val} color={getStatusColor(val)} size="small" icon={getStatusIcon(val)} />
      ),
    },
    {
      id: 'collectedAt',
      label: 'Collected',
      minWidth: 120,
      render: (val) => (
        <Typography variant="body2">{val ? moment(val).format('DD MMM YYYY') : 'N/A'}</Typography>
      ),
    },
    {
      id: 'creditedAt',
      label: 'Settled At',
      minWidth: 150,
      render: (val) => (
        <Typography variant="body2">
          {val ? moment(val).format('DD MMM YYYY HH:mm') : '-'}
        </Typography>
      ),
    },
  ]

  const summaryCardsSection = (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="Remitted Till Date"
          value={stats?.remittedTillDate || 0}
          helper={`${stats?.creditedCount || 0} settled remittances`}
          icon={<MdTrendingUp size={24} />}
          tone="dark"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="Last Remittance"
          value={stats?.lastRemittance || 0}
          helper="Most recent settlement"
          icon={<MdCheckCircle size={24} />}
          tone="primary"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="Next Remittance"
          value={stats?.nextRemittance || 0}
          helper={`${stats?.pendingCount || 0} orders pending`}
          icon={<MdAccountBalanceWallet size={24} />}
          tone="wine"
        />
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="Total Remittance Due"
          value={stats?.totalDue || 0}
          helper="Awaiting settlement"
          icon={<MdAccessTime size={24} />}
          tone="light"
        />
      </Grid>
    </Grid>
  )

  const controls = (
    <Box sx={{ px: 2 }}>
      <FilterBar
        fields={filterFields}
        onApply={(appliedFilters) => {
          setFilters(appliedFilters)
          setPage(1)
        }}
        mode="button"
        buttonLabel="Filters"
        defaultValues={{
          status: '',
          fromDate: undefined,
          toDate: undefined,
        }}
        appliedCount={Object.values(filters).filter(Boolean).length}
      />
    </Box>
  )

  const table = (
    <>
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <Typography>Loading remittances...</Typography>
        </Box>
      ) : (
        <DataTable
          rows={data?.remittances || []}
          columns={columns}
          title="All Remittances"
          pagination
          currentPage={page}
          defaultRowsPerPage={rowsPerPage}
          totalCount={data?.totalCount || 0}
          onPageChange={(newPage) => setPage(newPage)}
          onRowsPerPageChange={(newRowsPerPage) => {
            setRowsPerPage(newRowsPerPage)
            setPage(1)
          }}
        />
      )}
    </>
  )

  return (
    <ListPageLayout
      title="COD Remittance"
      description="Track your Cash on Delivery settlements"
      actions={[
        {
          label: currentCycle ? `Cycle: ${currentCycle.name}` : 'Select COD Cycle',
          onClick: () => setCycleDialogOpen(true),
          icon: <MdEdit />,
          variant: 'outlined',
          minWidth: 244,
        },
        {
          label: 'Export CSV',
          onClick: handleExport,
          icon: <MdDownload />,
          variant: 'contained',
          minWidth: 184,
        },
      ]}
      controls={controls}
    >
      <Box sx={{ px: 2 }}>{summaryCardsSection}</Box>
      {table}
      <Dialog
        open={isCycleDialogOpen}
        onClose={() => {
          if (currentCycle) setCycleDialogOpen(false)
        }}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '8px',
            border: `1px solid ${alpha('#111827', 0.1)}`,
            overflow: 'hidden',
          },
        }}
      >
        <DialogTitle sx={{ px: { xs: 2, md: 3 }, py: 2.25, borderBottom: '1px solid #E5E7EB' }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
            <Box>
              <Typography component="span" sx={{ fontSize: '1.35rem', fontWeight: 900, color: '#111827' }}>
                Select COD remittance cycle
              </Typography>
              <Typography sx={{ mt: 0.55, color: '#5B6472', fontSize: '0.9rem' }}>
                Choose when delivered COD becomes eligible for settlement. You can change this cycle later.
              </Typography>
            </Box>
            {currentCycle && (
              <IconButton
                aria-label="Close cycle selection"
                onClick={() => setCycleDialogOpen(false)}
                size="small"
                sx={{ color: '#4B5563', mt: -0.25 }}
              >
                <MdClose />
              </IconButton>
            )}
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#F6F8FA', p: { xs: 2, md: 3 } }}>
          {cyclesQuery.isLoading ? (
            <Stack alignItems="center" py={4}>
              <CircularProgress size={28} />
            </Stack>
          ) : sortedCycles.length ? (
            <Grid container spacing={2} alignItems="stretch">
              {sortedCycles.map((cycle: CodCycle) => {
                const isCurrent = currentCycle?.id === cycle.id
                const accepted = acceptedCycleId === cycle.id
                const fee = Number(cycle.fee || 0)
                const isSaving = cycleMutation.isPending && cycleMutation.variables === cycle.id
                return (
                  <Grid key={cycle.id} size={{ xs: 12, sm: 6, lg: 3 }} sx={{ display: 'flex' }}>
                    <Paper
                      elevation={0}
                      sx={{
                        position: 'relative',
                        width: '100%',
                        minHeight: 370,
                        p: 2.25,
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: '8px',
                        border: `2px solid ${isCurrent ? '#14966A' : accepted ? BRAND_PRIMARY : '#E2E8F0'}`,
                        bgcolor: '#FFFFFF',
                        boxShadow: isCurrent
                          ? `0 12px 28px ${alpha('#14966A', 0.12)}`
                          : '0 8px 20px rgba(15, 23, 42, 0.04)',
                      }}
                    >
                      {isCurrent && (
                        <Chip
                          label="Current Cycle"
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 10,
                            right: 10,
                            height: 24,
                            bgcolor: '#DCFCE7',
                            color: '#08734F',
                            fontWeight: 800,
                          }}
                        />
                      )}

                      <Typography sx={{ pr: isCurrent ? 9 : 0, fontSize: '1.08rem', fontWeight: 900, color: '#111827' }}>
                        {cycle.name}
                      </Typography>
                      <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 2 }}>
                        <Typography sx={{ fontSize: '2.15rem', lineHeight: 1, fontWeight: 900, color: isCurrent ? '#08734F' : '#315FB6' }}>
                          {fee === 0 ? '0' : fee.toFixed(2).replace(/\.00$/, '')}
                        </Typography>
                        <Typography sx={{ color: '#111827', fontWeight: 800 }}>%</Typography>
                        {fee === 0 && (
                          <Typography sx={{ color: '#08734F', fontWeight: 900, ml: 0.75 }}>Free</Typography>
                        )}
                      </Stack>
                      <Typography sx={{ mt: 0.4, color: '#536173', fontSize: '0.84rem' }}>
                        of settled COD amount
                      </Typography>

                      <Divider sx={{ my: 2 }} />

                      <Stack spacing={1.15} sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={0.8} alignItems="flex-start">
                          <MdCheckCircle color="#14966A" size={17} style={{ marginTop: 2, flexShrink: 0 }} />
                          <Typography sx={{ color: '#374151', fontSize: '0.82rem', lineHeight: 1.45 }}>
                            Eligibility: Delivered + {Number(cycle.days || 0)} {Number(cycle.days || 0) === 1 ? 'day' : 'days'}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.8} alignItems="flex-start">
                          <MdCheckCircle color="#14966A" size={17} style={{ marginTop: 2, flexShrink: 0 }} />
                          <Typography sx={{ color: '#374151', fontSize: '0.82rem', lineHeight: 1.45 }}>
                            {fee === 0 ? 'No transaction charges' : `Transaction charge: ${fee.toFixed(2)}% of COD amount`}
                          </Typography>
                        </Stack>
                        <Stack direction="row" spacing={0.8} alignItems="flex-start">
                          <MdCheckCircle color="#14966A" size={17} style={{ marginTop: 2, flexShrink: 0 }} />
                          <Typography sx={{ color: '#374151', fontSize: '0.82rem', lineHeight: 1.45 }}>
                            Settlement processing starts after eligibility
                          </Typography>
                        </Stack>
                      </Stack>

                      {isCurrent ? (
                        <Button
                          fullWidth
                          disabled
                          startIcon={<MdCheckCircle />}
                          sx={{ mt: 2, bgcolor: '#E7F7F0 !important', color: '#08734F !important' }}
                        >
                          Current Cycle
                        </Button>
                      ) : (
                        <>
                          <FormControlLabel
                            sx={{ mt: 1.5, mr: 0, alignItems: 'flex-start' }}
                            control={(
                              <Checkbox
                                size="small"
                                checked={accepted}
                                onChange={(event) => setAcceptedCycleId(event.target.checked ? cycle.id : '')}
                                sx={{ pt: 0.1 }}
                              />
                            )}
                            label={(
                              <Typography sx={{ color: '#4B5563', fontSize: '0.76rem', lineHeight: 1.4 }}>
                                I agree to the{' '}
                                <Link href="/terms-of-service" target="_blank" rel="noopener noreferrer" sx={{ color: '#1F2937', fontWeight: 800 }}>
                                  Terms and Conditions
                                </Link>
                              </Typography>
                            )}
                          />
                          <Button
                            fullWidth
                            variant="contained"
                            disabled={!accepted || cycleMutation.isPending}
                            startIcon={<MdBolt />}
                            onClick={() => cycleMutation.mutate(cycle.id)}
                            sx={{ mt: 1.5, bgcolor: '#0D6B7C', '&:hover': { bgcolor: '#095665' } }}
                          >
                            {isSaving ? 'Activating...' : 'Activate'}
                          </Button>
                        </>
                      )}
                    </Paper>
                  </Grid>
                )
              })}
            </Grid>
          ) : (
            <Typography sx={{ color: '#4B5563' }}>
              No COD cycles are available yet. Please contact support.
            </Typography>
          )}
          {cycleMutation.isError && (
            <Typography sx={{ mt: 2, color: '#B42318', fontSize: '0.86rem', fontWeight: 700 }}>
              The remittance cycle could not be updated. Please try again.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </ListPageLayout>
  )
}
