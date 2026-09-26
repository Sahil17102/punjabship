import { Box, Button, Card, CardContent, Chip, Paper, Stack, Typography } from '@mui/material'
import { MdContentCopy } from 'react-icons/md'
import CustomDialog from '../../../components/UI/modal/CustomModal'
import { toast } from '../../../components/UI/Toast'

const WEBHOOK_EVENTS = [
  'order.created',
  'order.updated',
  'order.shipped',
  'order.delivered',
  'order.failed',
  'order.rto',
  'order.cancelled',
  'order.return_created',
  'order.ndr',
  'shipment.label_generated',
  'shipment.manifest_generated',
  'tracking.updated',
]

interface WebhookPayload {
  event: string
  timestamp: string
  data: Record<string, unknown>
}

const SAMPLE_PAYLOADS: Record<string, WebhookPayload> = {
  'order.created': {
    event: 'order.created',
    timestamp: '2024-01-15T10:30:00.000Z',
    data: {
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      order_number: 'ORD-2024-001234',
      awb_number: 'AWB123456789',
      status: 'booked',
      courier_partner: 'Delhivery',
      integration_type: 'delhivery',
      payment_type: 'prepaid',
      created_at: '2024-01-15T10:30:00.000Z',
    },
  },
  'order.updated': {
    event: 'order.updated',
    timestamp: '2024-01-15T11:45:00.000Z',
    data: {
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      order_number: 'ORD-2024-001234',
      awb_number: 'AWB123456789',
      status: 'in_transit',
      previous_status: 'booked',
      updated_at: '2024-01-15T11:45:00.000Z',
    },
  },
  'order.shipped': {
    event: 'order.shipped',
    timestamp: '2024-01-15T12:00:00.000Z',
    data: {
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      order_number: 'ORD-2024-001234',
      awb_number: 'AWB123456789',
      status: 'shipped',
      courier_partner: 'Delhivery',
      shipped_at: '2024-01-15T12:00:00.000Z',
    },
  },
  'order.delivered': {
    event: 'order.delivered',
    timestamp: '2024-01-18T14:30:00.000Z',
    data: {
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      order_number: 'ORD-2024-001234',
      awb_number: 'AWB123456789',
      status: 'delivered',
      delivered_at: '2024-01-18T14:30:00.000Z',
      delivery_location: 'Mumbai, Maharashtra',
      delivery_message: 'Delivered to recipient',
    },
  },
  'order.failed': {
    event: 'order.failed',
    timestamp: '2024-01-15T13:00:00.000Z',
    data: {
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      order_number: 'ORD-2024-001234',
      awb_number: 'AWB123456789',
      status: 'failed',
      reason: 'Invalid address',
      error_message: 'Unable to process shipment due to invalid address',
    },
  },
  'order.rto': {
    event: 'order.rto',
    timestamp: '2024-01-20T10:00:00.000Z',
    data: {
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      order_number: 'ORD-2024-001234',
      awb_number: 'AWB123456789',
      status: 'rto',
      reason: 'Delivery failed after multiple attempts',
      remarks: 'Returned to origin warehouse',
      rto_charges: 150.0,
      created_at: '2024-01-20T10:00:00.000Z',
    },
  },
  'order.cancelled': {
    event: 'order.cancelled',
    timestamp: '2024-01-15T09:00:00.000Z',
    data: {
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      order_number: 'ORD-2024-001234',
      awb_number: 'AWB123456789',
      status: 'cancelled',
      cancelled_at: '2024-01-15T09:00:00.000Z',
      cancellation_reason: 'Customer requested cancellation',
    },
  },
  'order.return_created': {
    event: 'order.return_created',
    timestamp: '2024-01-20T11:00:00.000Z',
    data: {
      order_id: '660e8400-e29b-41d4-a716-446655440001',
      order_number: 'RET-2024-001234',
      awb_number: 'AWB987654321',
      original_order_id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'booked',
      reverse_charge: 200.0,
      shipment_data: {
        courier_partner: 'Delhivery',
        tracking_url: 'https://tracking.example.com/AWB987654321',
      },
    },
  },
  'order.ndr': {
    event: 'order.ndr',
    timestamp: '2024-01-17T10:00:00.000Z',
    data: {
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      order_number: 'ORD-2024-001234',
      awb_number: 'AWB123456789',
      status: 'undelivered',
      reason: 'Door closed',
      remarks: 'Delivery attempt failed - door closed',
      attempt_no: '1',
      courier_partner: 'Delhivery',
      updated_at: '2024-01-17T10:00:00.000Z',
    },
  },
  'shipment.label_generated': {
    event: 'shipment.label_generated',
    timestamp: '2024-01-15T10:35:00.000Z',
    data: {
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      order_number: 'ORD-2024-001234',
      awb_number: 'AWB123456789',
      label_url: 'https://storage.example.com/labels/label-123456.pdf',
      generated_at: '2024-01-15T10:35:00.000Z',
    },
  },
  'shipment.manifest_generated': {
    event: 'shipment.manifest_generated',
    timestamp: '2024-01-15T16:00:00.000Z',
    data: {
      manifest_id: 'MAN-2024-001',
      manifest_url: 'https://storage.example.com/manifests/manifest-001.pdf',
      order_count: 25,
      generated_at: '2024-01-15T16:00:00.000Z',
    },
  },
  'tracking.updated': {
    event: 'tracking.updated',
    timestamp: '2024-01-16T08:00:00.000Z',
    data: {
      order_id: '550e8400-e29b-41d4-a716-446655440000',
      order_number: 'ORD-2024-001234',
      awb_number: 'AWB123456789',
      status: 'in_transit',
      location: 'Delhi Hub',
      message: 'Package is in transit',
      updated_at: '2024-01-16T08:00:00.000Z',
    },
  },
}

interface SamplePayloadModalProps {
  open: boolean
  onClose: () => void
  selectedEventType: string | null
  onSelectEvent: (event: string) => void
}

export const SamplePayloadModal = ({
  open,
  onClose,
  selectedEventType,
  onSelectEvent,
}: SamplePayloadModalProps) => {
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.open({ message: 'Copied to clipboard', severity: 'success' })
  }

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Webhook Sample Payloads"
      maxWidth="lg"
      footer={
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <Button
            variant="outlined"
            onClick={() => {
              const payload = selectedEventType
                ? SAMPLE_PAYLOADS[selectedEventType]
                : SAMPLE_PAYLOADS['order.created']
              handleCopy(JSON.stringify(payload, null, 2))
            }}
            startIcon={<MdContentCopy />}
          >
            Copy Payload
          </Button>
          <Button variant="contained" onClick={onClose}>
            Close
          </Button>
        </Stack>
      }
    >
      <Stack spacing={3}>
        {selectedEventType ? (
          <>
            <Box>
              <Typography variant="subtitle1" fontWeight={600} mb={1}>
                Event: {selectedEventType}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                This is the payload structure you'll receive when the{' '}
                <code>{selectedEventType}</code> event is triggered.
              </Typography>
            </Box>
            <Paper
              sx={{
                p: 2,
                bgcolor: '#1E1E1E',
                borderRadius: 1,
                overflow: 'auto',
                maxHeight: 500,
              }}
            >
              <Typography
                component="pre"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  color: '#D4D4D4',
                  m: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {JSON.stringify(SAMPLE_PAYLOADS[selectedEventType], null, 2)}
              </Typography>
            </Paper>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {WEBHOOK_EVENTS.map((event) => (
                <Chip
                  key={event}
                  label={event}
                  onClick={() => onSelectEvent(event)}
                  color={selectedEventType === event ? 'primary' : 'default'}
                  size="small"
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </>
        ) : (
          <>
            <Typography variant="body1" color="text.secondary" mb={2}>
              Select an event type to view its sample payload structure. Each webhook request will
              include the event type, timestamp, and event-specific data.
            </Typography>
            <Stack spacing={2}>
              {WEBHOOK_EVENTS.map((event) => {
                const payload = SAMPLE_PAYLOADS[event]
                return (
                  <Card key={event} variant="outlined">
                    <CardContent>
                      <Stack spacing={2}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="subtitle1" fontWeight={600}>
                            {event}
                          </Typography>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => onSelectEvent(event)}
                          >
                            View Details
                          </Button>
                        </Stack>
                        <Paper
                          sx={{
                            p: 1.5,
                            bgcolor: '#F5F7FA',
                            borderRadius: 1,
                            overflow: 'auto',
                            maxHeight: 200,
                          }}
                        >
                          <Typography
                            component="pre"
                            sx={{
                              fontFamily: 'monospace',
                              fontSize: '0.75rem',
                              color: '#0877C9',
                              m: 0,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                            }}
                          >
                            {JSON.stringify(payload, null, 2)}
                          </Typography>
                        </Paper>
                      </Stack>
                    </CardContent>
                  </Card>
                )
              })}
            </Stack>
          </>
        )}
      </Stack>
    </CustomDialog>
  )
}

