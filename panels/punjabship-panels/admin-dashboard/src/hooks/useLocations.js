import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { locationService } from '../services/location.service'

export const useLocations = (params, enabled = true, queryKey = null) => {
  // ✅ always generate a unique key (pickup/delivery) even if queryKey not passed
  const finalKey = queryKey ?? ['locations', JSON.stringify(params ?? {})]

  return useQuery({
    queryKey: finalKey,
    queryFn: () => locationService.fetchLocations(params),
    keepPreviousData: true,
    enabled: Boolean(enabled && params),
  })
}

export const useLocationById = (id) => {
  return useQuery({
    queryKey: ['location', id],
    queryFn: () => locationService.getLocationById(id),
  })
}

export const useCreateLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data) => locationService.createLocation(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['locations'])
    },
  })
}

export const useUpdateLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => locationService.updateLocation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['locations'])
    },
  })
}

export const useDeleteLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => locationService.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['locations'])
    },
  })
}
