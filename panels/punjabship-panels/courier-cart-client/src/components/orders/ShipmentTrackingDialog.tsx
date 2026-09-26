import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography, Divider } from '@mui/material'
import { useTracking } from '../../hooks/Orders/useTracking'
import { FaBoxOpen, FaBuilding, FaShippingFast, FaStore, FaTruck } from 'react-icons/fa'

const stages = [
  { label: 'Booked', icon: FaStore },
  { label: 'Pending Pickup', icon: FaBuilding },
  { label: 'In Transit', icon: FaTruck },
  { label: 'Out for Delivery', icon: FaShippingFast },
  { label: 'Delivered', icon: FaBoxOpen },
]

const normalizeStatus = (value?: string | null) =>
  String(value || '').trim().toLowerCase().replace(/[\s-]+/g, '_')

const getStageIndexFromStatus = (value?: string | null) => {
  const status = normalizeStatus(value)
  if (!status) return -1
  if (['dl', 'delivered', 'rto_delivered', 'rt_dl'].includes(status)) return 4
  if (['ofd', 'out_for_delivery', 'out_for_delivery_pending'].includes(status)) return 3
  if (['ndr', 'undelivered', 'exception', 'ex'].includes(status)) return 3
  if (['it', 'in_transit', 'rt', 'rto', 'rt_it', 'rto_in_transit'].includes(status)) return 2
  if (['pp', 'picked_up', 'pickup_done', 'pickup_initiated', 'manifested'].includes(status)) return 1
  if (['booked', 'new', 'pending', 'shipment_created', 'order_created'].includes(status)) return 0
  if (['can', 'cancelled', 'canceled'].includes(status)) return 0
  return -1
}

const getEventHub = (event: { hub_name?: string | null; location?: string }) =>
  String(event.hub_name || event.location || 'Hub unavailable').trim()

export default function ShipmentTrackingDialog({ awb, onClose }: { awb: string | null; onClose: () => void }) {
  const query = useTracking(awb)
  const currentStage = Math.max(
    getStageIndexFromStatus(query.data?.status),
    ...(query.data?.history || []).map((event) =>
      Math.max(getStageIndexFromStatus(event.status_code), getStageIndexFromStatus(event.message)),
    ),
    0,
  )
  const normalizedStatus = normalizeStatus(query.data?.status)
  const isCancelled = ['can', 'cancelled', 'canceled'].includes(normalizedStatus)

  return <Dialog open={Boolean(awb)} onClose={onClose} fullWidth maxWidth="md">
    <DialogTitle>Shipment tracking | {awb}</DialogTitle>
    <DialogContent dividers>
      {query.isLoading ? <CircularProgress size={28} /> : query.error ? <Alert severity="error">{query.error.message}</Alert> : query.data ? <Stack spacing={2}>
        <Typography fontWeight={700}>{query.data.courier_name} | {query.data.status}</Typography>
        <Typography variant="body2">Order: {query.data.order_number}{query.data.edd ? ` | Expected delivery: ${query.data.edd}` : ''}</Typography>
        <Divider />
        <Typography fontWeight={800}>Travel pipeline</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          {stages.map((stage, index) => {
            const StageIcon = stage.icon
            const active = !isCancelled && index <= currentStage
            return <Box key={stage.label} sx={{ flex: 1, p: 1, border: '1px solid', borderColor: active ? 'primary.light' : isCancelled && index === 0 ? 'error.light' : 'grey.300', borderRadius: 2, bgcolor: active ? 'primary.50' : 'background.paper' }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ width: 26, height: 26, borderRadius: '50%', display: 'grid', placeItems: 'center', bgcolor: active ? 'primary.main' : isCancelled && index === 0 ? 'error.main' : 'grey.300', color: active || (isCancelled && index === 0) ? 'white' : 'grey.700' }}>
                  <StageIcon size={13} />
                </Box>
                <Typography variant="caption" fontWeight={800}>
                  {isCancelled && index === 0 ? 'Cancelled' : stage.label}
                </Typography>
              </Stack>
            </Box>
          })}
        </Stack>
        {query.data.history?.length ? query.data.history.map((event, index) => <Stack key={`${event.event_time}-${index}`} direction="row" spacing={1.5}>
          <Box sx={{ width: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: index === 0 ? 'primary.main' : 'grey.400' }} />
            {index < (query.data.history?.length || 0) - 1 && <Box sx={{ width: 2, flex: 1, minHeight: 42, bgcolor: 'grey.300', mt: 0.5 }} />}
          </Box>
          <Stack spacing={0.5} sx={{ pb: 1.2 }}>
            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
              <Typography fontWeight={700}>{event.message || event.status_code}</Typography>
            </Stack>
            <Typography variant="body2" fontWeight={700}>Hub: {getEventHub(event)}</Typography>
            <Typography variant="caption" color="text.secondary">{event.event_time ? new Date(event.event_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'Time unavailable'}</Typography>
          </Stack>
        </Stack>) : <Typography>No tracking events recorded yet.</Typography>}
      </Stack> : null}
    </DialogContent>
    <DialogActions><Button onClick={() => query.refetch()} disabled={query.isFetching}>Refresh</Button><Button onClick={onClose}>Close</Button></DialogActions>
  </Dialog>
}
