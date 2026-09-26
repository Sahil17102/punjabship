import { Box, Button, Card, CardContent, Divider, Stack, Typography } from '@mui/material'
import { MdInfo } from 'react-icons/md'

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

interface WebhookInfoPanelProps {
  onViewSamplePayloads: () => void
  onSelectEvent: (event: string) => void
}

export const WebhookInfoPanel = ({
  onViewSamplePayloads,
  onSelectEvent,
}: WebhookInfoPanelProps) => {
  return (
    <Card
      sx={{ width: 380, flexShrink: 0, height: 'fit-content', position: 'sticky', top: 20 }}
    >
      <CardContent>
        <Stack spacing={3}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <MdInfo size={20} color="#0877C9" />
              <Typography variant="h6" fontWeight={600} color="#0877C9">
                Webhook Information
              </Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" paragraph>
              Webhooks allow you to receive real-time notifications about order events. When an event
              occurs, we'll send a POST request to your configured URL with the event payload.
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
              Security
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Each webhook request includes an <code>X-Webhook-Signature</code> header containing an
              HMAC SHA256 signature. Verify this signature using your webhook secret to ensure the
              request is authentic.
            </Typography>
            <Box
              sx={{
                p: 1.5,
                bgcolor: '#F5F7FA',
                borderRadius: 1,
                border: '1px solid #E0E6ED',
                mt: 1,
              }}
            >
              <Typography
                variant="caption"
                component="pre"
                sx={{ fontFamily: 'monospace', fontSize: '0.75rem', m: 0 }}
              >
                Headers:
                {'\n'}X-Webhook-Signature: hmac_sha256
                {'\n'}X-Webhook-Event: order.created
                {'\n'}Content-Type: application/json
              </Typography>
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
              Sample Payloads
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              View sample payloads for each event type to understand the data structure you'll
              receive.
            </Typography>
            <Button variant="outlined" fullWidth onClick={onViewSamplePayloads} sx={{ mt: 1 }}>
              View Sample Payloads
            </Button>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" fontWeight={600} mb={1.5}>
              Available Events
            </Typography>
            <Stack spacing={0.5}>
              {WEBHOOK_EVENTS.map((event) => (
                <Button
                  key={event}
                  variant="text"
                  size="small"
                  onClick={() => onSelectEvent(event)}
                  sx={{
                    justifyContent: 'flex-start',
                    textTransform: 'none',
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                    '&:hover': {
                      bgcolor: '#F5F7FA',
                      color: '#0877C9',
                    },
                  }}
                >
                  {event}
                </Button>
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

