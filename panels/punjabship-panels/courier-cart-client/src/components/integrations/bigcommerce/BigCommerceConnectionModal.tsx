import {
  Box,
  Card,
  Grid,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { type Dispatch, type SetStateAction } from 'react'
import { BiKey, BiLink } from 'react-icons/bi'
import { FaConnectdevelop } from 'react-icons/fa6'
import { FcInfo } from 'react-icons/fc'
import CustomIconLoadingButton from '../../UI/button/CustomLoadingButton'
import CustomInput from '../../UI/inputs/CustomInput'
import CustomDialog from '../../UI/modal/CustomModal'
import type { BigCommerceForm } from './BigCommeceIntegration'

interface IBigCommerceConnectionModalProps {
  openModal: boolean
  onSetOpen: () => void
  handleConnect?: () => void
  integrating?: boolean
  bigCommerceDetails: BigCommerceForm
  setBigCommerceDetails: Dispatch<SetStateAction<BigCommerceForm>>
  inputErrors?: Partial<BigCommerceForm>
  isEditing?: boolean
  forOnboarding?: boolean
  handleDelete?: () => void
  deleting?: boolean
}

const BigCommerceConnectionModal = ({
  openModal,
  onSetOpen,
  handleConnect,
  integrating = false,
  bigCommerceDetails,
  setBigCommerceDetails,
  inputErrors,
  isEditing = false,
  handleDelete,
  deleting = false,
}: IBigCommerceConnectionModalProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <CustomDialog
      width="100%"
      maxWidth="lg"
      open={openModal}
      onClose={onSetOpen}
      title={
        <Stack direction="row" alignItems="center" gap={2}>
          <FaConnectdevelop /> Connect your BigCommerce store
        </Stack>
      }
      footer={
        <Stack direction="row" spacing={1}>
          {isEditing && (
            <CustomIconLoadingButton
              size={isMobile ? 'large' : 'medium'}
              onClick={handleDelete}
              disabled={integrating}
              loading={deleting}
              icon={<BiKey />}
              text="Remove"
              loadingText="Removing..."
            />
          )}
          <CustomIconLoadingButton
            size={isMobile ? 'large' : 'medium'}
            onClick={handleConnect}
            disabled={integrating}
            loading={integrating}
            text={isEditing ? 'Update' : 'Connect'}
            loadingText={isEditing ? 'Saving...' : 'Connecting...'}
          />
        </Stack>
      }
    >
      <Grid container spacing={4}>
        {/* Instructions Section */}
        <Grid size={{ md: 5, xs: 12 }}>
          <Box
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              borderRadius: 2,
              boxShadow: 1,
              overflowY: 'auto',
            }}
          >
            <Typography variant="h6" gutterBottom>
              <FcInfo style={{ marginRight: 8 }} />
              How to generate BigCommerce API credentials
            </Typography>
            <List dense>
              {[
                { primary: '1. Log in to BigCommerce Admin Panel' },
                { primary: '2. Go to Advanced Settings > API Accounts' },
                { primary: "3. Click 'Create API Account'" },
                { primary: '4. Set Name and Select OAuth Scopes' },
                { primary: '5. Save and copy Access Token and Store Hash' },
              ].map((step, i) => (
                <ListItem key={i}>
                  <ListItemText primary={step.primary} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Grid>

        {/* Input Form */}
        <Grid size={{ md: 7, xs: 12 }}>
          <Card
            variant="outlined"
            sx={{
              p: 3,
              borderRadius: 2,
              backgroundColor: 'rgba(255,255,255,0.02)',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600} mb={2}>
              Enter BigCommerce Credentials
            </Typography>

            <Stack spacing={2}>
              <CustomInput
                required
                prefix={<BiLink />}
                label="Store Hash"
                placeholder="store-hash"
                value={bigCommerceDetails.storeHash}
                onChange={(e) =>
                  setBigCommerceDetails((prev) => ({
                    ...prev,
                    storeHash: e.target.value,
                  }))
                }
                error={!!inputErrors?.storeHash}
                helperText={inputErrors?.storeHash}
              />

              <CustomInput
                required
                prefix={<BiKey />}
                label="Client ID"
                placeholder="Paste Client ID"
                value={bigCommerceDetails.storeHash}
                onChange={(e) =>
                  setBigCommerceDetails((prev) => ({
                    ...prev,
                    storeHash: e.target.value,
                  }))
                }
                error={!!inputErrors?.storeHash}
                helperText={inputErrors?.storeHash}
              />

              <CustomInput
                required
                prefix={<BiKey />}
                label="Access Token"
                placeholder="Paste Access Token"
                type="password"
                value={bigCommerceDetails.accessToken}
                onChange={(e) =>
                  setBigCommerceDetails((prev) => ({
                    ...prev,
                    accessToken: e.target.value,
                  }))
                }
                error={!!inputErrors?.accessToken}
                helperText={inputErrors?.accessToken}
              />
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </CustomDialog>
  )
}

export default BigCommerceConnectionModal
