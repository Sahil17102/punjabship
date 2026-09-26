import { AddIcon } from '@chakra-ui/icons'
import { Button, Flex, useDisclosure } from '@chakra-ui/react'
import PlanModal from 'components/plans/PlanModal'
import PlanTable from 'components/plans/PlanTable'
import { useDeletePlan, usePlans, useUpdatePlan } from 'hooks/usePlans'
import { useState } from 'react'

const PlanManagement = () => {
  const { data: plans, isLoading } = usePlans()
  const deletePlan = useDeletePlan()
  const updatePlan = useUpdatePlan()

  const [selectedPlan, setSelectedPlan] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleCreate = () => {
    setSelectedPlan(null)
    onOpen()
  }

  const handleEdit = (plan) => {
    setSelectedPlan(plan)
    onOpen()
  }

  const handleDelete = (id) => {
    deletePlan.mutate(id)
  }
  const handleActivate = (plan) => {
    console.log('plan', plan)
    updatePlan.mutate({ id: plan.id, data: { is_active: plan?.is_active } })
  }

  return (
    <Flex direction="column" pt={{ base: '120px', md: '75px' }}>
      <Flex
        mb={6}
        justify="flex-end"
        align="center"
        flexDirection={{ base: 'column', md: 'row' }}
        gap={{ base: 2, md: 0 }}
      >
        <Button colorScheme="brand" leftIcon={<AddIcon />} onClick={handleCreate}>
          Create Plan
        </Button>
      </Flex>

      <PlanTable
        data={plans || []}
        loading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onActivate={handleActivate}
      />

      <PlanModal isOpen={isOpen} onClose={onClose} plan={selectedPlan} />
    </Flex>
  )
}

export default PlanManagement
