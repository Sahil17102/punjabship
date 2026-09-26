import { useQuery } from '@tanstack/react-query'
import { exportRemittances, getCodRemittances, getCodStats } from '../api/codRemittance'

interface CodFilters {
  status?: string
  fromDate?: string
  toDate?: string
}

/**
 * Hook to fetch COD remittance statistics
 */
export const useCodStats = () => {
  return useQuery({
    queryKey: ['codStats'],
    queryFn: getCodStats,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch COD remittances with filters and pagination
 */
export const useCodRemittances = (page: number, limit: number, filters: CodFilters = {}) => {
  return useQuery({
    queryKey: ['codRemittances', page, limit, filters],
    queryFn: () =>
      getCodRemittances({
        page,
        limit,
        status: filters.status || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
      }),
    staleTime: 1000 * 60 * 2, // 2 minutes
  })
}

/**
 * Function to export COD remittances as CSV
 * This is not a hook since it's a one-time action
 */
export const handleCodRemittancesExport = async (filters: CodFilters = {}) => {
  try {
    await exportRemittances({
      status: filters.status || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
    })
  } catch (error) {
    console.error('Export failed:', error)
    throw error
  }
}
