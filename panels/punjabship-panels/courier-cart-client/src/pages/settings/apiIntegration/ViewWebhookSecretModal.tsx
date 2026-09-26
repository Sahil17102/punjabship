import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { saveAs } from 'file-saver'
import { MdContentCopy, MdDownload } from 'react-icons/md'
import CustomInput from '../../../components/UI/inputs/CustomInput'
import CustomDialog from '../../../components/UI/modal/CustomModal'

interface ViewWebhookSecretModalProps {
  open: boolean
  onClose: () => void
  webhook: {
    secret: string
    name: string | null
    url: string
  } | null
  copiedSecret: string | null
  onCopy: (text: string, label: string) => void
}

export const ViewWebhookSecretModal = ({
  open,
  onClose,
  webhook,
  copiedSecret,
  onCopy,
}: ViewWebhookSecretModalProps) => {
  if (!webhook) return null

  const handleDownloadCredentials = () => {
    if (!webhook) return

    const timestamp = new Date().toISOString()
    const fileName = `punjabship-webhook-secret-${(webhook.name || 'webhook').replace(
      /\s/g,
      '-',
    )}-${timestamp.split('T')[0]}.txt`
    const fileContent = `
PunjabShip Webhook Secret
Generated: ${timestamp}
Webhook Name: ${webhook.name || 'Unnamed'}
Webhook URL: ${webhook.url}

⚠️ IMPORTANT: Keep this secret secure and never share it publicly.
Use this secret to verify webhook signatures using HMAC SHA256.

Webhook Secret:
${webhook.secret}

---
This file contains sensitive credentials. Store it securely and never commit it to version control.
    `.trim()

    const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, fileName)
  }

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Webhook Secret"
      maxWidth="sm"
      footer={
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Button
            variant="outlined"
            onClick={handleDownloadCredentials}
            startIcon={<MdDownload />}
            fullWidth
            sx={{
              borderColor: '#0877C9',
              color: '#0877C9',
              '&:hover': {
                borderColor: '#0877C9',
                bgcolor: 'rgba(51, 51, 105, 0.08)',
              },
            }}
          >
            Download Secret
          </Button>
          <Button variant="contained" onClick={onClose} fullWidth>
            I've saved the secret
          </Button>
        </Stack>
      }
    >
      <Stack spacing={3}>
        <Box
          sx={{
            p: 2,
            bgcolor: '#FFF4E6',
            borderRadius: 1,
            border: '1px solid',
            borderColor: '#FFA726',
          }}
        >
          <Typography sx={{ fontWeight: 600, color: '#E65100', mb: 1, fontSize: '0.875rem' }}>
            ⚠️ Important: Save this secret securely
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#E65100', m: 0, mt: 1 }}>
            You will not be able to view the webhook secret again after closing this dialog. Use
            this secret to verify webhook signatures using HMAC SHA256.
          </Typography>
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: '13px',
              color: '#0877C9',
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            Webhook Secret
          </Typography>
          <CustomInput
            value={webhook.secret}
            topMargin={false}
            disabled
            postfix={
              <IconButton
                onClick={() => onCopy(webhook.secret, 'secret')}
                size="small"
                sx={{
                  color: copiedSecret === 'secret' ? '#4CAF50' : '#0877C9',
                  '&:hover': { bgcolor: 'rgba(51, 51, 105, 0.08)' },
                }}
              >
                <MdContentCopy size={18} />
              </IconButton>
            }
          />
        </Box>
        <Box>
          <Typography
            sx={{
              fontSize: '13px',
              color: '#0877C9',
              fontWeight: 500,
              mb: 0.5,
            }}
          >
            Webhook URL
          </Typography>
          <CustomInput value={webhook.url} disabled topMargin={false} />
        </Box>
      </Stack>
    </CustomDialog>
  )
}
