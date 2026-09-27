import { useQuery } from '@tanstack/react-query'
import { getAdminDashboardStats, readAdminDashboardCache } from 'services/dashboard.service'

export const useDashboardStats = (filters = {}) => {
  const cached = readAdminDashboardCache(filters)

  return useQuery({
    queryKey: ['admin-dashboard-stats', filters],
    queryFn: () => getAdminDashboardStats(filters),
    initialData: cached?.data,
    initialDataUpdatedAt: cached?.savedAt,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchInterval: false,
    retry: 1,
  })
}
