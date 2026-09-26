// src/hooks/usePlans.ts
import { useToast } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PlansService } from '../services/plan.service'

export const usePlans = (params = {}) => {
  return useQuery({
    queryKey: ['plans', params],
    queryFn: () => PlansService.getPlans(params),
  })
}

export const useCreatePlan = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: PlansService.createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}

export const useUpdatePlan = () => {
  const toast = useToast()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => PlansService.updatePlan(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
      toast({
        title: 'Plan updated successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: () => {
      toast({
        title: 'Error updating plan',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    },
  })
}

export const useDeletePlan = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: PlansService.deletePlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] })
    },
  })
}

export const useAssignUserPlan = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ userId, planId, businessType }) =>
      PlansService.assignPlanToUser(userId, planId, businessType),
    onSuccess: () => {
      toast({
        title: 'Plan assigned successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
      // optional: invalidate queries to refetch updated user data
      queryClient.invalidateQueries(['userInfo'])
    },
    onError: (error) => {
      toast({
        title: 'Failed to assign plan',
        description: error?.message || 'Something went wrong',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    },
  })
}
