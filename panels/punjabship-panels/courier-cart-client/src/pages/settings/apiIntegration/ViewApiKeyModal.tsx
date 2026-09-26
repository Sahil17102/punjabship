import { Box, Button, IconButton, Stack, Typography } from '@mui/material'
import { MdContentCopy, MdDownload } from 'react-icons/md'
import CustomInput from '../../../components/UI/inputs/CustomInput'
import CustomDialog from '../../../components/UI/modal/CustomModal'

interface ViewApiKeyModalProps {
  open: boolean
  onClose: () => void
  apiKey: {
    api_key: string
    api_secret: string
    key_name: string
  } | null
  copiedKey: string | null
  onCopy: (text: string, label: string) => void
}

export const ViewApiKeyModal = ({
  open,
  onClose,
  apiKey,
  copiedKey,
  onCopy,
}: ViewApiKeyModalProps) => {
  if (!apiKey) return null

  const handleDownloadCredentials = () => {
    const content = `PunjabShip API Credentials
Generated: ${new Date().toISOString()}
Key Name: ${apiKey.key_name}

⚠️ IMPORTANT: Keep these credentials secure and never share them publicly.

API Key:
${apiKey.api_key}

API Secret:
${apiKey.api_secret}

---
This file contains sensitive credentials. Store it securely and never commit it to version control.
`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `punjabship-api-credentials-${apiKey.key_name
      .replace(/\s+/g, '-')
      .toLowerCase()}-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="API Key Created"
      maxWidth="sm"
      footer={
        <Stack direction="row" spacing={2} sx={{ width: '100%' }}>
          <Button
            variant="outlined"
            startIcon={<MdDownload />}
            onClick={handleDownloadCredentials}
            sx={{ flex: 1 }}
          >
            Download Credentials
          </Button>
          <Button variant="contained" onClick={onClose} sx={{ flex: 1 }}>
            I've saved the credentials
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
            ⚠️ Important: Save these credentials securely
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: '#E65100', m: 0, mt: 1 }}>
            You will not be able to view the API key and secret again after closing this dialog.
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
            API Key
          </Typography>
          <CustomInput
            value={apiKey.api_key}
            disabled
            topMargin={false}
            postfix={
              <IconButton
                onClick={() => onCopy(apiKey.api_key, 'key')}
                size="small"
                sx={{
                  color: copiedKey === 'key' ? '#4CAF50' : '#0877C9',
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
            API Secret
          </Typography>
          <CustomInput
            value={apiKey.api_secret}
            disabled
            topMargin={false}
            postfix={
              <IconButton
                onClick={() => onCopy(apiKey.api_secret, 'secret')}
                size="small"
                sx={{
                  color: copiedKey === 'secret' ? '#4CAF50' : '#0877C9',
                  '&:hover': { bgcolor: 'rgba(51, 51, 105, 0.08)' },
                }}
              >
                <MdContentCopy size={18} />
              </IconButton>
            }
          />
        </Box>
      </Stack>
    </CustomDialog>
  )
}
