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
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ['pickupAddresses'] })
      const previous = queryClient.getQueriesData({ queryKey: ['pickupAddresses'] })
      queryClient.setQueriesData<{ pickupAddresses: HydratedPickup[]; totalCount: number }>(
        { queryKey: ['pickupAddresses'] },
        (current) => current ? {
          ...current,
          pickupAddresses: current.pickupAddresses.map((address) =>
            (address.pickupId || address.id) === id ? { ...address, ...payload } : address,
          ),
        } : current,
      )
      return { previous }
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, value]) => queryClient.setQueryData(key, value))
    },
    onSettled: () => {
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
