import { useQuery } from '@tanstack/react-query'
import { getAdminDashboardStats } from 'services/dashboard.service'

export const useDashboardStats = (filters = {}) => {
  return useQuery({
    queryKey: ['admin-dashboard-stats', filters],
    queryFn: () => getAdminDashboardStats(filters),
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  })
}

