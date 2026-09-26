import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptDiscrepancy,
  bulkAcceptDiscrepancies,
  bulkRejectDiscrepancies,
  createWeightDispute,
  getDiscrepancyById,
  getWeightDiscrepancies,
  getWeightDisputes,
  getWeightReconciliationSettings,
  getWeightReconciliationSummary,
  rejectDiscrepancy,
  updateWeightReconciliationSettings,
  type DiscrepanciesFilters,
  type DisputesFilters,
} from '../api/weightReconciliation'

/**
 * Hook to fetch weight discrepancies with filters
 */
export const useWeightDiscrepancies = (filters?: DiscrepanciesFilters) => {
  return useQuery({
    queryKey: ['weight-discrepancies', filters],
    queryFn: () => getWeightDiscrepancies(filters),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch a single discrepancy by ID
 */
export const useDiscrepancyDetails = (id: string) => {
  return useQuery({
    queryKey: ['weight-discrepancy', id],
    queryFn: () => getDiscrepancyById(id),
    enabled: !!id,
  })
}

/**
 * Hook to accept a discrepancy
 */
export const useAcceptDiscrepancy = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => acceptDiscrepancy(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-discrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weight-discrepancy'] })
      queryClient.invalidateQueries({ queryKey: ['weight-reconciliation-summary'] })
    },
  })
}

/**
 * Hook to reject a discrepancy
 */
export const useRejectDiscrepancy = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => rejectDiscrepancy(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-discrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weight-discrepancy'] })
      queryClient.invalidateQueries({ queryKey: ['weight-reconciliation-summary'] })
    },
  })
}

/**
 * Hook to bulk accept discrepancies
 */
export const useBulkAcceptDiscrepancies = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ discrepancyIds, notes }: { discrepancyIds: string[]; notes?: string }) =>
      bulkAcceptDiscrepancies(discrepancyIds, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-discrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weight-reconciliation-summary'] })
    },
  })
}

/**
 * Hook to bulk reject discrepancies
 */
export const useBulkRejectDiscrepancies = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ discrepancyIds, reason }: { discrepancyIds: string[]; reason: string }) =>
      bulkRejectDiscrepancies(discrepancyIds, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-discrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weight-reconciliation-summary'] })
    },
  })
}

/**
 * Hook to create a dispute
 */
export const useCreateDispute = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createWeightDispute,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-discrepancies'] })
      queryClient.invalidateQueries({ queryKey: ['weight-discrepancy'] })
      queryClient.invalidateQueries({ queryKey: ['weight-disputes'] })
      queryClient.invalidateQueries({ queryKey: ['weight-reconciliation-summary'] })
    },
  })
}

/**
 * Hook to fetch weight disputes
 */
export const useWeightDisputes = (filters?: DisputesFilters) => {
  return useQuery({
    queryKey: ['weight-disputes', filters],
    queryFn: () => getWeightDisputes(filters),
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch weight reconciliation summary
 */
export const useWeightReconciliationSummary = (fromDate?: string, toDate?: string) => {
  return useQuery({
    queryKey: ['weight-reconciliation-summary', fromDate, toDate],
    queryFn: () => getWeightReconciliationSummary(fromDate, toDate),
    staleTime: 60000, // 1 minute
  })
}

/**
 * Hook to fetch weight reconciliation settings
 */
export const useWeightReconciliationSettings = () => {
  return useQuery({
    queryKey: ['weight-reconciliation-settings'],
    queryFn: getWeightReconciliationSettings,
  })
}

/**
 * Hook to update weight reconciliation settings
 */
export const useUpdateWeightReconciliationSettings = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: updateWeightReconciliationSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['weight-reconciliation-settings'] })
    },
  })
}
