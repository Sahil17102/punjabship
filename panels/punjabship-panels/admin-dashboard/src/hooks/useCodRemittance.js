import { useToast } from '@chakra-ui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmCourierSettlement,
  getAllCodRemittances,
  getCodPayableReport,
  getCodPlatformStats,
  getUserCodRemittances,
  manualMarkSettlement,
  previewCourierSettlement,
  updateRemittanceNotes,
} from '../services/codRemittance.service'

/**
 * Hook to fetch platform-wide COD stats
 */
export const useCodPlatformStats = () => {
  return useQuery({
    queryKey: ['codPlatformStats'],
    queryFn: getCodPlatformStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch all COD remittances (all users)
 */
export const useAllCodRemittances = (params) => {
  return useQuery({
    queryKey: ['allCodRemittances', params],
    queryFn: () => getAllCodRemittances(params),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Hook to fetch COD payable / receivables report.
 */
export const useCodPayableReport = (params) => {
  return useQuery({
    queryKey: ['codPayableReport', params],
    queryFn: () => getCodPayableReport(params),
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * Hook to fetch user-specific COD remittances
 */
export const useUserCodRemittances = (userId) => {
  return useQuery({
    queryKey: ['userCodRemittances', userId],
    queryFn: () => getUserCodRemittances(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
  })
}

/**
 * Hook to manually mark settlement
 */
export const useManualMarkSettlement = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ remittanceId, payload }) => manualMarkSettlement(remittanceId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCodRemittances'] })
      queryClient.invalidateQueries({ queryKey: ['codPlatformStats'] })
      queryClient.invalidateQueries({ queryKey: ['userCodRemittances'] })
      queryClient.invalidateQueries({ queryKey: ['codPayableReport'] })
      toast({
        title: 'Settlement Marked',
        description: 'COD remittance marked settled successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to mark settlement',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

/**
 * Hook to update remittance notes
 */
export const useUpdateRemittanceNotes = () => {
  const queryClient = useQueryClient()
  const toast = useToast()

  return useMutation({
    mutationFn: ({ remittanceId, notes }) => updateRemittanceNotes(remittanceId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCodRemittances'] })
      queryClient.invalidateQueries({ queryKey: ['userCodRemittances'] })
      queryClient.invalidateQueries({ queryKey: ['codPayableReport'] })
      toast({
        title: 'Notes Updated',
        description: 'Successfully updated notes',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update notes',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    },
  })
}

/**
 * Hook to preview courier settlement CSV
 */
export const usePreviewCourierSettlement = () => {
  return useMutation({
    mutationFn: previewCourierSettlement,
  })
}

/**
 * Hook to confirm courier settlement and mark remittances settled
 */
export const useConfirmCourierSettlement = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: confirmCourierSettlement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allCodRemittances'] })
      queryClient.invalidateQueries({ queryKey: ['codPlatformStats'] })
      queryClient.invalidateQueries({ queryKey: ['userCodRemittances'] })
      queryClient.invalidateQueries({ queryKey: ['codPayableReport'] })
    },
  })
}
