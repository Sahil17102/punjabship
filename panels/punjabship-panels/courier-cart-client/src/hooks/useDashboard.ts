import { useQuery } from '@tanstack/react-query'
import {
  getIncomingPickups,
  getPendingActions,
  getInvoiceStatus,
  getTopDestinations,
  getCourierDistribution,
  getMerchantDashboardStats,
  type Pickup,
  type PendingActions,
  type InvoiceStatus,
  type TopDestination,
  type CourierDistribution,
  type MerchantDashboardStats,
} from '../api/dashboard.api'

export const useIncomingPickups = () => {
  return useQuery<Pickup[], Error>({
    queryKey: ['incomingPickups'],
    queryFn: getIncomingPickups,
    refetchInterval: 60000, // ⏱ auto-refresh every 60s
    staleTime: 30000, // cache for 30s before refetch
  })
}

export const usePendingActions = () => {
  return useQuery<PendingActions, Error>({
    queryKey: ['pendingActions'],
    queryFn: getPendingActions,
    refetchInterval: 60000, // auto-refresh every 60s
    staleTime: 30000,
  })
}

export const useInvoiceStatus = () => {
  return useQuery<InvoiceStatus, Error>({
    queryKey: ['invoiceStatus'],
    queryFn: getInvoiceStatus,
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export const useTopDestinations = (limit = 10) => {
  return useQuery<TopDestination[], Error>({
    queryKey: ['topDestinations', limit],
    queryFn: () => getTopDestinations(limit),
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export const useCourierDistribution = () => {
  return useQuery<CourierDistribution[], Error>({
    queryKey: ['courierDistribution'],
    queryFn: getCourierDistribution,
    refetchInterval: 60000,
    staleTime: 30000,
  })
}

export const useMerchantDashboardStats = (
  selectedDate?: string,
  dateRange?: { fromDate?: string; toDate?: string },
) => {
  return useQuery<MerchantDashboardStats, Error>({
    queryKey: [
      'merchantDashboardStats',
      selectedDate || 'all-time',
      dateRange?.fromDate || '',
      dateRange?.toDate || '',
    ],
    queryFn: () => getMerchantDashboardStats(selectedDate, dateRange),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 4000),
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })
}
