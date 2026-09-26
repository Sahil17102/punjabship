import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  bookExistingB2COrderCourier,
  createB2BShipment,
  createShipment,
  fetchAllOrders,
  fetchB2BOrdersByUser,
  fetchB2COrdersByUser,
  generateManifestService,
  regenerateOrderDocumentsService,
  retryFailedManifestService,
  type CreateB2BShipmentParams,
  type CreateShipmentParams,
  type GenerateManifestParams,
  type GenerateManifestResponse,
  type RetryManifestResponse,
} from '../../api/order.service'
import { cancelShipment as cancelShipmentApi } from '../../api/pickups'
import { createReverseShipment } from '../../api/returns'
import { toast } from '../../components/UI/Toast'

export const useCreateShipment = (onClose?: () => void) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateShipmentParams) => createShipment(data),

    // 🔹 Error handling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create shipment. Please try again.'
      toast.open({ message, severity: 'error' })
      console.error('Failed to create shipment:', error.response?.data || error.message)
    },

    // 🔹 Success handling
    onSuccess: (data) => {
      toast.open({ message: 'Shipment created successfully', severity: 'success' })
      console.log('Shipment created successfully:', data)
      queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] })
      if (onClose) onClose() // ✅ Close modal/drawer after success
    },
  })
}

export const useBookExistingB2COrderCourier = (onClose?: () => void) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, data }: { orderId: string; data: Parameters<typeof bookExistingB2COrderCourier>[1] }) =>
      bookExistingB2COrderCourier(orderId, data),
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to book courier. Please try again.'
      toast.open({ message, severity: 'error' })
      console.error('Failed to book courier:', error.response?.data || error.message)
    },
    onSuccess: () => {
      toast.open({ message: 'Courier selected and shipment booked', severity: 'success' })
      queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      if (onClose) onClose()
    },
  })
}

export const useCreateB2BShipment = (onClose?: () => void) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateB2BShipmentParams) => createB2BShipment(data),

    // 🔹 Error handling
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create B2B shipment. Please try again.'
      toast.open({ message, severity: 'error' })
      console.error('Failed to create B2B shipment:', error.response?.data || error.message)
    },

    // 🔹 Success handling
    onSuccess: (data) => {
      toast.open({ message: 'B2B Shipment created successfully', severity: 'success' })
      console.log('B2B Shipment created successfully:', data)
      queryClient.invalidateQueries({ queryKey: ['b2bOrdersByUser'] })
      if (onClose) onClose() // ✅ Close modal/drawer after success
    },
  })
}
// useOrders.ts
interface Filters {
  status?: string
  sortBy?: 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
  type?: string
  fromDate?: string
  toDate?: string
  search?: string
  warehouse?: string
  productQuery?: string
  fetchAll?: boolean
}

export const useB2COrdersByUser = (page: number, limit: number, filters: Filters = {}) => {
  return useQuery({
    queryKey: ['b2cOrdersByUser', page, limit, filters],
    queryFn: () => fetchB2COrdersByUser({ page, limit, ...filters }),
    placeholderData: (previousData) => previousData,
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })
}

export const useB2BOrdersByUser = (page: number, limit: number, filters: Filters = {}) => {
  return useQuery({
    queryKey: ['b2bOrdersByUser', page, limit, filters],
    queryFn: () => fetchB2BOrdersByUser({ page, limit, ...filters }),
    placeholderData: (previousData) => previousData,
  })
}

export const useGenerateManifest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (params: GenerateManifestParams) => generateManifestService(params),
    onSuccess: (data: GenerateManifestResponse) => {
      toast.open({ message: 'Manifest generated successfully!', severity: 'success' })
      // Refresh all merchant order lists that can surface manifest state.
      queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] })
      queryClient.invalidateQueries({ queryKey: ['b2bOrdersByUser'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      console.log('Manifest generated:', data)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to generate manifest'
      toast.open({ message, severity: 'error' })
      console.error('Manifest generation error:', error)
    },
  })
}

export const useRetryFailedManifest = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (orderId: string) => retryFailedManifestService(orderId),
    onSuccess: (data: RetryManifestResponse) => {
      const message =
        data?.retry_action === 'pickup_request'
          ? 'Pickup request retried successfully.'
          : 'Manifest retried successfully.'
      toast.open({ message, severity: 'success' })
      queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      console.log('Manifest retried:', data)
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to retry manifest'
      toast.open({ message, severity: 'error' })
      console.error('Manifest retry error:', error)
    },
  })
}

export const useRegenerateOrderDocuments = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      orderId,
      regenerateLabel = true,
      regenerateInvoice = true,
    }: {
      orderId: string
      regenerateLabel?: boolean
      regenerateInvoice?: boolean
    }) => regenerateOrderDocumentsService(orderId, { regenerateLabel, regenerateInvoice }),
    onSuccess: () => {
      toast.open({ message: 'Documents generated successfully.', severity: 'success' })
      queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] })
      queryClient.invalidateQueries({ queryKey: ['b2bOrdersByUser'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to generate documents'
      toast.open({ message, severity: 'error' })
    },
  })
}

export const useCancelShipment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderId: string) => cancelShipmentApi(orderId),
    onSuccess: () => {
      toast.open({ message: 'Cancellation request sent', severity: 'success' })
      queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to cancel shipment'
      toast.open({ message, severity: 'error' })
    },
  })
}

export const useCreateReverseShipment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mutationFn: (payload: any) => createReverseShipment(payload),
    onSuccess: () => {
      toast.open({ message: 'Reverse pickup created', severity: 'success' })
      queryClient.invalidateQueries({ queryKey: ['b2cOrdersByUser'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || error?.message || 'Failed to create reverse pickup'
      toast.open({ message, severity: 'error' })
    },
  })
}
export interface FetchOrdersParams {
  page?: number
  limit?: number
  status?: string
  fromDate?: string
  toDate?: string
  search?: string
  productQuery?: string
  sortBy?: 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
}

export const useAllOrders = (params: FetchOrdersParams) => {
  return useQuery({
    queryKey: ['orders', params], // cache key includes all params
    queryFn: () => fetchAllOrders(params), // fetch function
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })
}
