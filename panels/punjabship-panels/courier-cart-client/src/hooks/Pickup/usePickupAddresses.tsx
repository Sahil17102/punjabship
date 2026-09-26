import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createPickupAddress,
  exportPickupAddresses,
  getPickupAddresses,
  importPickupAddresses,
  updatePickupAddress,
  type CreatePickupAddressPayload,
  type PickupAddressFilters,
} from '../../api/pickups'
import type { HydratedPickup } from '../../types/generic.types'

// Fetch all pickup addresses
export const usePickupAddresses = (filters?: PickupAddressFilters, enabled = true) => {
  return useQuery({
    queryKey: ['pickupAddresses', filters],
    queryFn: () => getPickupAddresses(filters),
    enabled,
    placeholderData: (previousData) => previousData,
  })
}

// Create a new pickup address
export const useCreatePickupAddress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePickupAddressPayload) => createPickupAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickupAddresses'] })
    },
  })
}

// ✅ Update a pickup address
export const useUpdatePickupAddress = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<HydratedPickup> }) =>
      updatePickupAddress(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pickupAddresses'] })
    },
  })
}

export const useExportPickupAddresses = () => {
  return useMutation({
    mutationFn: (filters: PickupAddressFilters) => exportPickupAddresses(filters),
  })
}

export const useImportPickupAddresses = () => {
  return useMutation({
    mutationFn: (data: HydratedPickup[]) => importPickupAddresses(data),
  })
}
