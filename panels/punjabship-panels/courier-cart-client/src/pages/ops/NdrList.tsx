import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, Stack, Typography, Box } from '@mui/material'
import moment from 'moment'
import CustomInput from '../../components/UI/inputs/CustomInput'
import { useEffect, useMemo, useState } from 'react'
import { fetchMyNdr, submitNdrReattempt, fetchMyNdrTimeline, submitNdrChangePhone, submitNdrChangeAddress } from '../../api/ndr'
import { FilterBar, type FilterField } from '../../components/FilterBar'
import DataTable, { type Column } from '../../components/UI/table/DataTable'
import ShipmentTrackingDialog from '../../components/orders/ShipmentTrackingDialog'
import { toast } from '../../components/UI/Toast'
import ListPageLayout from '../../components/UI/layout/ListPageLayout'

type NdrRow = {
  awb_number?: string
  order_id?: string
  order_number?: string
  buyer_name?: string
  buyer_phone?: string
  status?: string
  current_section?: string
  reason?: string
  remarks?: string
  last_event_time?: string
  integration_type?: string
  courier_partner?: string
  attempt_no?: string
}
type TableRow = NdrRow & { id: string | number }

export default function NdrList() {
  const [rows, setRows] = useState<NdrRow[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [filters, setFilters] = useState<{ search?: string; fromDate?: string; toDate?: string }>({})
  const [reattemptOpen, setReattemptOpen] = useState(false)
  const [timelineOpen, setTimelineOpen] = useState(false)
  const [selectedAwb, setSelectedAwb] = useState<string | null>(null)
  const [trackingAwb, setTrackingAwb] = useState<string | null>(null)
  const [nextAttemptDate, setNextAttemptDate] = useState<string>('')
  const [comments, setComments] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [timeline, setTimeline] = useState<{ events?: Array<{ at?: string; status?: string; remarks?: string }> } | null>(null)
  const [changePhoneOpen, setChangePhoneOpen] = useState(false)
  const [changeAddressOpen, setChangeAddressOpen] = useState(false)
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')
  const [pincode, setPincode] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const resp = await fetchMyNdr({
          page,
          limit: rowsPerPage,
          search: filters.search,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
        })
        setRows(resp?.data || [])
        setTotalCount(resp?.totalCount || 0)
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } }; message?: string }
        const msg = error?.response?.data?.message || error?.message || 'Failed to load NDR events'
        toast.open({ message: msg, severity: 'error' })
      } finally {
        setLoading(false)
      }
    })()
  }, [page, rowsPerPage, filters])

  const columns: Column<TableRow>[] = useMemo(
    () => [
      { id: 'awb_number', label: 'AWB' },
      {
        id: 'order_number',
        label: 'Order',
        render: (_, row) => (
          <Stack spacing={0}>
            <Typography variant="body2" fontWeight={600}>
              {row.order_number || '—'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.order_id || '—'}
            </Typography>
          </Stack>
        ),
      },
      {
        id: 'buyer_name',
        label: 'Customer',
        render: (_, row) => (
          <Stack spacing={0}>
            <Typography variant="body2">{row.buyer_name || '—'}</Typography>
            <Typography variant="caption" color="text.secondary">
              {row.buyer_phone || '—'}
            </Typography>
          </Stack>
        ),
      },
      { id: 'status', label: 'Status' },
      { id: 'current_section', label: 'Current Section' },
      {
        id: 'last_event_time',
        label: 'Last Tracking Update',
        render: (value) => (
          <Typography variant="body2">
            {value ? moment(value).format('DD MMM YYYY, hh:mm A') : '-'}
          </Typography>
        ),
      },
      { id: 'reason', label: 'NDR Reason' },
      {
        id: 'attempt_no',
        label: 'Delivery Attempts',
        render: (value) => <Typography variant="body2">{value ?? ''}</Typography>,
      },
      { id: 'remarks', label: 'Remarks' },
      {
        id: 'actions' as keyof TableRow,
        label: 'Actions',
        minWidth: 380,
        truncate: false,
        render: (_, row) => {
          const provider = String(row.integration_type || row.courier_partner || '').toLowerCase()
          const supportsEdits = ['delhivery', 'ekart', 'shadowfax', 'xpressbees'].some((p) =>
            provider.includes(p),
          )
          const isNSL = String(row.status || '').toLowerCase().includes('nsl')
          const attempts = row.attempt_no ? parseInt(String(row.attempt_no), 10) || 0 : 0
          return (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button size="small" variant="outlined" disabled={!row.awb_number} onClick={() => setTrackingAwb(row.awb_number || null)}>Track</Button>
            <Button
              size="small"
              variant="outlined"
              onClick={async () => {
                try {
                  setSelectedAwb(row.awb_number || null)
                  const resp = await fetchMyNdrTimeline({ awb: row.awb_number })
                  setTimeline(resp?.data || null)
                  setTimelineOpen(true)
                } catch (e: unknown) {
                  const error = e as { response?: { data?: { message?: string } } }
                  toast.open({ message: error?.response?.data?.message || 'Failed to load timeline', severity: 'error' })
                }
              }}
            >
              Timeline
            </Button>
            <Button
              size="small"
              variant="contained"
              disabled={isNSL || attempts >= 3}
              title={isNSL ? 'Not serviceable (NSL)' : attempts >= 3 ? 'Max attempts reached' : ''}
              onClick={() => {
                setSelectedAwb(row.awb_number || null)
                setNextAttemptDate('')
                setComments('')
                setReattemptOpen(true)
              }}
            >
              Reattempt
            </Button>
            {supportsEdits && (
            <Button
              size="small"
              variant="outlined"
              disabled={isNSL}
              title={isNSL ? 'Not serviceable (NSL)' : ''}
              onClick={() => {
                setSelectedAwb(row.awb_number || null)
                setPhone('')
                setChangePhoneOpen(true)
              }}
            >
              Change Phone
            </Button>) }
            {supportsEdits && (
            <Button
              size="small"
              variant="outlined"
              disabled={isNSL}
              title={isNSL ? 'Not serviceable (NSL)' : ''}
              onClick={() => {
                setSelectedAwb(row.awb_number || null)
                setName('')
                setAddress1('')
                setAddress2('')
                setPincode('')
                setChangeAddressOpen(true)
              }}
            >
              Change Address
            </Button>) }
          </Stack>
        )},
      },
    ],
    [],
  )

  const filterFields: FilterField[] = [
    { name: 'search', label: 'Search', type: 'text', placeholder: 'AWB / Order / Customer / Reason' },
    { name: 'fromDate', label: 'From', type: 'date' },
    { name: 'toDate', label: 'To', type: 'date' },
  ]

  const tableRows: TableRow[] = useMemo(
    () => rows.map((r, idx) => ({ id: r.awb_number || r.order_id || idx, ...r })),
    [rows],
  )

  const controls = (
    <Box sx={{ px: 2 }}>
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
        <Typography p={3}>Loading NDRs...</Typography>
      ) : (
        <DataTable
          rows={tableRows}
          columns={columns}
          title="NDR Events"
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
    <>
      <ShipmentTrackingDialog awb={trackingAwb} onClose={() => setTrackingAwb(null)} />
      <ListPageLayout
        title="NDR Events"
        description="Manage non-delivery reports and reattempts"
        controls={controls}
      >
        {table}
      </ListPageLayout>

      {/* Timeline Drawer (simple) */}
      <Dialog open={timelineOpen} onClose={() => setTimelineOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>NDR Timeline</DialogTitle>
        <DialogContent>
          <Stack gap={1} mt={1}>
            {(timeline?.events || []).map((e: { at?: string; status?: string; remarks?: string }, idx: number) => (
              <Stack key={idx} gap={0} borderLeft="2px solid #E2E8F0" pl={1}>
                <Typography variant="caption" color="text.secondary">
                  {e?.at ? new Date(e.at).toLocaleString() : '—'}
                </Typography>
                <Typography variant="body2">{e?.status || '—'}</Typography>
                {e?.remarks && (
                  <Typography variant="caption" color="text.secondary">
                    {e.remarks}
                  </Typography>
                )}
              </Stack>
            ))}
            {!timeline?.events?.length && (
              <Typography variant="body2" color="text.secondary">
                No events found.
              </Typography>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTimelineOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={reattemptOpen} onClose={() => setReattemptOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Request Reattempt</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <CustomInput label="AWB" value={selectedAwb || ''} disabled topMargin={false} />
            <CustomInput
              label="Next Attempt Date"
              type="date"
              value={nextAttemptDate}
              onChange={(e) => setNextAttemptDate((e.target as HTMLInputElement).value)}
            />
            <CustomInput
              label="Comments"
              value={comments}
              placeholder="Add a note (optional)"
              onChange={(e) => setComments((e.target as HTMLInputElement).value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReattemptOpen(false)} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selectedAwb || !nextAttemptDate || submitting}
            onClick={async () => {
              try {
                setSubmitting(true)
                await submitNdrReattempt({ awb: selectedAwb || undefined, nextAttemptDate, comments })
                toast.open({ message: 'Reattempt requested successfully', severity: 'success' })
                setReattemptOpen(false)
                // refresh
                setPage(1)
              } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } }; message?: string }
                const msg = error?.response?.data?.message || error?.message || 'Failed to request reattempt'
                toast.open({ message: msg, severity: 'error' })
              } finally {
                setSubmitting(false)
              }
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Phone */}
      <Dialog open={changePhoneOpen} onClose={() => setChangePhoneOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Phone</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <CustomInput label="AWB" value={selectedAwb || ''} disabled topMargin={false} />
            <CustomInput label="Phone" value={phone} onChange={(e) => setPhone((e.target as HTMLInputElement).value)} placeholder="10+ digits" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangePhoneOpen(false)} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selectedAwb || !/^\d{10,}$/.test(phone) || submitting}
            onClick={async () => {
              try {
                setSubmitting(true)
                await submitNdrChangePhone({ awb: selectedAwb || undefined, phone })
                toast.open({ message: 'Phone update submitted', severity: 'success' })
                setChangePhoneOpen(false)
                setPage(1)
              } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } }; message?: string }
                const msg = error?.response?.data?.message || error?.message || 'Failed to update phone'
                toast.open({ message: msg, severity: 'error' })
              } finally {
                setSubmitting(false)
              }
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Address */}
      <Dialog open={changeAddressOpen} onClose={() => setChangeAddressOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Change Address</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={1}>
            <CustomInput label="AWB" value={selectedAwb || ''} disabled topMargin={false} />
            <CustomInput label="Name" value={name} onChange={(e) => setName((e.target as HTMLInputElement).value)} />
            <CustomInput label="Address line 1" value={address1} onChange={(e) => setAddress1((e.target as HTMLInputElement).value)} />
            <CustomInput label="Address line 2" value={address2} onChange={(e) => setAddress2((e.target as HTMLInputElement).value)} />
            <CustomInput label="Pincode" value={pincode} onChange={(e) => setPincode((e.target as HTMLInputElement).value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChangeAddressOpen(false)} disabled={submitting}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!selectedAwb || !address1 || submitting}
            onClick={async () => {
              try {
                setSubmitting(true)
                await submitNdrChangeAddress({ awb: selectedAwb || undefined, name: name || undefined, address_1: address1, address_2: address2 || undefined, pincode: pincode || undefined })
                toast.open({ message: 'Address update submitted', severity: 'success' })
                setChangeAddressOpen(false)
                setPage(1)
              } catch (err: unknown) {
                const error = err as { response?: { data?: { message?: string } }; message?: string }
                const msg = error?.response?.data?.message || error?.message || 'Failed to update address'
                toast.open({ message: msg, severity: 'error' })
              } finally {
                setSubmitting(false)
              }
            }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
