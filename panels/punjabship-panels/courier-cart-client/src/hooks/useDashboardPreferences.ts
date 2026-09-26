import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getDashboardPreferences, saveDashboardPreferences, type DashboardPreferences } from '../api/dashboardPreferences.api'

export const useDashboardPreferences = () => {
  return useQuery<DashboardPreferences, Error>({
    queryKey: ['dashboardPreferences'],
    queryFn: getDashboardPreferences,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchOnWindowFocus: false,
  })
}

export const useSaveDashboardPreferences = () => {
  const queryClient = useQueryClient()

  return useMutation<DashboardPreferences, Error, Partial<DashboardPreferences>>({
    mutationFn: saveDashboardPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['dashboardPreferences'], data)
    },
  })
}

