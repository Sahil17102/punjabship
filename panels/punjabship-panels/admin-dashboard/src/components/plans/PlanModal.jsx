import CustomModal from 'components/Modal/CustomModal'
import PlanForm from './PlanForm'

const PlanModal = ({ isOpen, onClose, plan }) => {
  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      title={plan ? 'Edit Plan' : 'Create Plan'}
      hideFooter
    >
      <PlanForm plan={plan} onClose={onClose} />
    </CustomModal>
  )
}

export default PlanModal
