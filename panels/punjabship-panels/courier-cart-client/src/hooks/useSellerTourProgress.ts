import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSellerTourProgress,
  updateSellerTourProgress,
  type SellerTourAction,
} from '../api/sellerTour.api'

const queryKey = ['seller-tour-progress']

export const useSellerTourProgress = (enabled = true) =>
  useQuery({
    queryKey,
    queryFn: getSellerTourProgress,
    enabled,
    staleTime: 60_000,
  })

export const useUpdateSellerTourProgress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    scope: { id: 'seller-tour-progress' },
    mutationFn: ({ action, page }: { action: SellerTourAction; page?: string }) =>
      updateSellerTourProgress(action, page),
    onSuccess: (data) => queryClient.setQueryData(queryKey, data),
  })
}
