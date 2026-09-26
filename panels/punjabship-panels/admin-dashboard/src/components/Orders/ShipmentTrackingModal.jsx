import { Button, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody } from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import TrackingDetails from 'components/Tools/OrderTracking/TrackingDetails'
import { fetchTracking } from 'services/order.service'
import CopyableAwb from './CopyableAwb'

export default function ShipmentTrackingModal({ awb, onClose }) {
  const query = useQuery({ queryKey: ['shipment-popup', awb], queryFn: () => fetchTracking({ awb }), enabled: Boolean(awb) })
  return <Modal isOpen={Boolean(awb)} onClose={onClose} size="5xl" scrollBehavior="inside">
    <ModalOverlay /><ModalContent><ModalHeader>Shipment tracking | <CopyableAwb awb={awb} /></ModalHeader><ModalCloseButton />
      <ModalBody pb={5}><Button size="sm" onClick={() => query.refetch()} isLoading={query.isFetching}>Refresh tracking</Button>
        <TrackingDetails data={query.data} isLoading={query.isLoading} error={query.error} />
      </ModalBody></ModalContent>
  </Modal>
}
