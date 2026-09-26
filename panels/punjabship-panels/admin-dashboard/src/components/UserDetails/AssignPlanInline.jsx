import { Box, Button, Select, Spinner, Text, useToast, VStack } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { PlansService } from 'services/plan.service'

const PlanAssignmentSection = ({
  label,
  businessType,
  plans,
  value,
  currentValue,
  onChange,
  onAssign,
  isLoading,
}) => (
  <Box w="100%" minW="0">
    <Text fontSize="sm" fontWeight="semibold" mb={1}>
      {label}
    </Text>
    <VStack align="stretch" spacing={3}>
      <Select
        placeholder={`Select ${label}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        h="38px"
        borderRadius="10px"
      >
        {plans.map((plan) => (
          <option key={plan.id} value={plan.id}>
            {plan.name}
          </option>
        ))}
      </Select>
      <Button
        colorScheme={businessType === 'b2b' ? 'blue' : 'orange'}
        onClick={onAssign}
        isLoading={isLoading}
        loadingText="Assigning"
        isDisabled={!value || value === currentValue}
        h="38px"
        borderRadius="10px"
        fontWeight="800"
      >
        Update {label}
      </Button>
    </VStack>
  </Box>
)

const AssignPlanInline = ({
  userId,
  currentB2CPlanId,
  currentB2BPlanId,
  currentPlanId,
}) => {
  const [selectedB2CPlan, setSelectedB2CPlan] = useState(currentB2CPlanId || currentPlanId || '')
  const [selectedB2BPlan, setSelectedB2BPlan] = useState(currentB2BPlanId || '')
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => PlansService.getPlans(),
  })

  const activePlans = useMemo(() => plans?.filter((plan) => plan.is_active) || [], [plans])
  const activeB2CPlans = useMemo(
    () => activePlans.filter((plan) => (plan.business_type || 'b2c') === 'b2c'),
    [activePlans],
  )
  const activeB2BPlans = useMemo(
    () => activePlans.filter((plan) => (plan.business_type || 'b2c') === 'b2b'),
    [activePlans],
  )

  const assignPlanMutation = useMutation({
    mutationFn: ({ userId: targetUserId, planId, businessType }) =>
      PlansService.assignPlanToUser(targetUserId, planId, businessType),
    onSuccess: (_, variables) => {
      toast({
        title: `${variables.businessType.toUpperCase()} plan assigned successfully`,
        status: 'success',
        duration: 4000,
        isClosable: true,
      })
      queryClient.invalidateQueries({ queryKey: ['userInfo', userId] })
    },
    onError: (err) => {
      toast({
        title: 'Failed to assign plan',
        description: err.message || 'Try again later.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      })
    },
  })

  useEffect(() => {
    setSelectedB2CPlan(currentB2CPlanId || currentPlanId || '')
  }, [currentB2CPlanId, currentPlanId])

  useEffect(() => {
    setSelectedB2BPlan(currentB2BPlanId || '')
  }, [currentB2BPlanId])

  if (plansLoading) {
    return <Spinner size="sm" alignSelf="center" />
  }

  return (
    <Box w="100%" minW="0">
      <VStack align="stretch" spacing={3}>
        <PlanAssignmentSection
          label="B2C Plan"
          businessType="b2c"
          plans={activeB2CPlans}
          value={selectedB2CPlan}
          currentValue={currentB2CPlanId || currentPlanId}
          onChange={setSelectedB2CPlan}
          onAssign={() =>
            assignPlanMutation.mutate({
              userId,
              planId: selectedB2CPlan,
              businessType: 'b2c',
            })
          }
          isLoading={assignPlanMutation.isPending && assignPlanMutation.variables?.businessType === 'b2c'}
        />

        <PlanAssignmentSection
          label="B2B Plan"
          businessType="b2b"
          plans={activeB2BPlans}
          value={selectedB2BPlan}
          currentValue={currentB2BPlanId}
          onChange={setSelectedB2BPlan}
          onAssign={() =>
            assignPlanMutation.mutate({
              userId,
              planId: selectedB2BPlan,
              businessType: 'b2b',
            })
          }
          isLoading={assignPlanMutation.isPending && assignPlanMutation.variables?.businessType === 'b2b'}
        />
      </VStack>
    </Box>
  )
}

export default AssignPlanInline
