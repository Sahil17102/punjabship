import { useToast } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveDispute,
  getAllWeightDiscrepancies,
  getAllWeightDisputes,
  getWeightReconciliationStats,
  rejectDispute,
} from '../services/weightReconciliation.service'

/**
 * Hook to fetch weight reconciliation stats
 */
export const useWeightReconciliationStats = (params) => {
  return useQuery({
    queryKey: ['weightReconciliationStats', params],
    queryFn: () => getWeightReconciliationStats(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch all weight discrepancies (all users)
 */
export const useAllWeightDiscrepancies = (params) => {
  return useQuery({
    queryKey: ['allWeightDiscrepancies', params],
    queryFn: () => getAllWeightDiscrepancies(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook to fetch all weight disputes (all users)
 */
export const useAllWeightDisputes = (params) => {
  return useQuery({
    queryKey: ['allWeightDisputes', params],
    queryFn: () => getAllWeightDisputes(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook to approve a dispute
 */
export const useApproveDispute = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ disputeId, data }) => approveDispute(disputeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWeightDisputes'] })
      queryClient.invalidateQueries({ queryKey: ['allWeightDiscrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weightReconciliationStats'] })
      toast({
        title: 'Dispute Approved',
        description: 'The dispute has been approved successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to approve dispute',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

/**
 * Hook to reject a dispute
 */
export const useRejectDispute = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ disputeId, data }) => rejectDispute(disputeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allWeightDisputes'] })
      queryClient.invalidateQueries({ queryKey: ['allWeightDiscrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weightReconciliationStats'] })
      toast({
        title: 'Dispute Rejected',
        description: 'The dispute has been rejected successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to reject dispute',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}
