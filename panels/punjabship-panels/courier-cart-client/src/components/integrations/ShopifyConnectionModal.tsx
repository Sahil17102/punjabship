import {
  Alert,
  Button,
  Card,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { type Dispatch, type SetStateAction, useState } from 'react'
import { FaConnectdevelop } from 'react-icons/fa6'
import { RiDeleteBin2Fill } from 'react-icons/ri'
import CustomIconLoadingButton from '../UI/button/CustomLoadingButton'
import CustomInput from '../UI/inputs/CustomInput'
import CustomSelect from '../UI/inputs/CustomSelect'
import CustomSwitch from '../UI/inputs/CustomSwitch'
import CustomDialog from '../UI/modal/CustomModal'
import type { ShopifyForm } from './ShopifyIntegration'

interface IShopifyConnectionModalProps {
  forOnboarding?: boolean
  openModal: boolean
  onSetOpen: () => void
  handleConnect?: () => void
  integrating?: boolean
  shopifyDetails: ShopifyForm
  isEditing?: boolean
  setShopifyDetails: Dispatch<SetStateAction<ShopifyForm>>
  inputErrors?: ShopifyForm
  handleDelete?: () => void
  deleting?: boolean
}

const ShopifyConnectionModal = ({
  openModal,
  onSetOpen,
  handleConnect,
  integrating = false,
  shopifyDetails,
  setShopifyDetails,
  handleDelete,
  deleting = false,
}: IShopifyConnectionModalProps) => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
  const storeDomain = shopifyDetails.domain || shopifyDetails.storeUrl
  const [disconnectOpen, setDisconnectOpen] = useState(false)

  const handleConfirmDisconnect = () => {
    handleDelete?.()
  }

  return (
    <CustomDialog
      fullScreen
      width="100%"
      maxWidth="xl"
      open={openModal}
      onClose={onSetOpen}
      title={
        <Stack direction="row" alignItems="center" gap={2}>
          <FaConnectdevelop /> Shopify settings
        </Stack>
      }
      footer={
        <Stack direction="row" spacing={1}>
          <CustomIconLoadingButton
            size={isMobile ? 'large' : 'medium'}
            onClick={() => setDisconnectOpen(true)}
            disabled={integrating}
            icon={<RiDeleteBin2Fill />}
            text="Disconnect Store"
            loading={deleting}
            loadingText="Disconnecting..."
            variant="text"
            textColor="#B42318"
            styles={{ borderColor: 'rgba(180, 35, 24, 0.32)' }}
          />
          <CustomIconLoadingButton
            size={isMobile ? 'large' : 'medium'}
            onClick={() => handleConnect?.()}
            disabled={integrating}
            text="Save Settings"
            loading={integrating}
            loadingText="Saving..."
          />
        </Stack>
      }
    >
      <Stack spacing={3}>
        <Card variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {shopifyDetails.name || 'Connected Shopify store'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {storeDomain}
          </Typography>
        </Card>

        <Card variant="outlined" sx={{ p: 3, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)' }}>
          <Typography variant="subtitle1" fontWeight={600} mb={2}>
            Fulfillment and sync
          </Typography>
          <Stack spacing={2}>
            <CustomSelect
              helperText="Select when to fulfill the Shopify order"
              label="Fulfill Orders When?"
              value={shopifyDetails.settings?.fulfillTrigger}
              onSelect={(value) =>
                setShopifyDetails((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, fulfillTrigger: value as string },
                }))
              }
              width="70%"
              items={[
                { label: 'Do not Fulfill', key: 'do_not_fulfill' },
                { label: 'Order is Booked', key: 'order_booked' },
                { label: 'Order is in Transit', key: 'order_in_transit' },
                { label: 'Order is out for Delivery', key: 'order_out_for_delivery' },
                { label: 'Order is Delivered', key: 'order_delivered' },
              ]}
            />
            <CustomSelect
              helperText="Choose whether Shopify notifies the customer"
              label="Notify Customer on Fulfill?"
              value={shopifyDetails.settings?.customerNotifyOnFulfill ?? 'do_not_notify'}
              onSelect={(value) =>
                setShopifyDetails((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, customerNotifyOnFulfill: String(value) },
                }))
              }
              width="70%"
              items={[
                { label: 'Do Not Notify', key: 'do_not_notify' },
                { label: 'Notify Customer', key: 'notify_customer' },
              ]}
            />
            <CustomInput
              label="Pull Orders via Order Tags"
              placeholder="Leave blank to fetch all orders"
              value={shopifyDetails.settings?.orderTagsToFetch ?? ''}
              onChange={(event) =>
                setShopifyDetails((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, orderTagsToFetch: event.target.value },
                }))
              }
              helpText="Only orders with these tags will be pulled"
            />
            <CustomInput
              label="COD Tag(s)"
              placeholder="COD, COD Confirmed"
              value={shopifyDetails.settings?.codTags ?? ''}
              onChange={(event) =>
                setShopifyDetails((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, codTags: event.target.value },
                }))
              }
              helpText="Comma separated tags for COD orders"
            />
            <CustomInput
              label="Prepaid Tag(s)"
              placeholder="Prepaid, Urgent Order"
              value={shopifyDetails.settings?.prepaidTags ?? ''}
              onChange={(event) =>
                setShopifyDetails((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, prepaidTags: event.target.value },
                }))
              }
              helpText="Comma separated tags for prepaid orders"
            />
            <CustomSwitch
              label="Auto Update Shipment Status in Shopify"
              checked={Boolean(shopifyDetails.settings?.autoUpdateShipmentStatus)}
              onChange={(event) =>
                setShopifyDetails((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, autoUpdateShipmentStatus: event.target.checked },
                }))
              }
              helperText="Update Shopify when shipment status changes"
            />
            <CustomSwitch
              label="Auto Cancel Shopify Order"
              checked={Boolean(shopifyDetails.settings?.autoCancelOrders)}
              onChange={(event) =>
                setShopifyDetails((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, autoCancelOrders: event.target.checked },
                }))
              }
              helperText="Cancel Shopify orders cancelled in PunjabShip"
            />
            <CustomSwitch
              label="Mark COD Orders Paid on Delivery"
              checked={Boolean(shopifyDetails.settings?.markCodPaidOnDelivery)}
              onChange={(event) =>
                setShopifyDetails((prev) => ({
                  ...prev,
                  settings: { ...prev.settings, markCodPaidOnDelivery: event.target.checked },
                }))
              }
              helperText="Mark delivered cash-on-delivery orders as paid"
            />
          </Stack>
        </Card>
      </Stack>

      <Dialog
        open={disconnectOpen}
        onClose={deleting ? undefined : () => setDisconnectOpen(false)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="disconnect-shopify-title"
      >
        <DialogTitle id="disconnect-shopify-title" sx={{ pb: 1, fontWeight: 800 }}>
          Disconnect Shopify store?
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Typography color="text.secondary">
              PunjabShip will be uninstalled from <strong>{storeDomain}</strong> and new Shopify
              orders will stop syncing.
            </Typography>
            <Alert severity="info">
              Orders already imported into PunjabShip will remain available.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={() => setDisconnectOpen(false)}
            disabled={deleting}
            color="inherit"
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDisconnect}
            disabled={deleting}
            variant="contained"
            color="error"
            startIcon={<RiDeleteBin2Fill />}
            sx={{ textTransform: 'none', fontWeight: 700, minWidth: 170 }}
          >
            {deleting ? 'Disconnecting...' : 'Disconnect Store'}
          </Button>
        </DialogActions>
      </Dialog>
    </CustomDialog>
  )
}

export default ShopifyConnectionModal
