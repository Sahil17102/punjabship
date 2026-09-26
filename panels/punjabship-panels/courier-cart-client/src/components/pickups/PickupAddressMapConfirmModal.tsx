import { Box, Button, Typography } from '@mui/material'
import MapViewer from '../UI/map/MapViewer'
import CustomDialog from '../UI/modal/CustomModal'

const PickupAddressMapConfirmModal = ({
  open,
  onClose,
  coords,
  setCoords,
  onConfirm,
  loading,
}: {
  open: boolean
  onClose: () => void
  coords: { lat: number; lng: number }
  setCoords: (c: { lat: number; lng: number }) => void
  onConfirm: () => void
  loading?: boolean
}) => {
  return (
    <CustomDialog open={open} onClose={onClose} maxWidth="sm" title={'Confirm Pickup Location'}>
      <Typography mb={1}>Scroll or drag the map to adjust the pickup location.</Typography>
      <MapViewer height="290px" coords={coords} setCoords={setCoords} />
      <Box textAlign="right" mt={2}>
        <Button loading={loading} disabled={loading} variant="contained" onClick={onConfirm}>
          Confirm Location
        </Button>
      </Box>
    </CustomDialog>
  )
}

export default PickupAddressMapConfirmModal
