import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { paymentOptionsService } from 'services/paymentOptions.service'

export const usePaymentOptions = () => {
  return useQuery({
    queryKey: ['paymentOptions'],
    queryFn: () => paymentOptionsService.getPaymentOptions(),
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  })
}

export const useUpdatePaymentOptions = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data) => paymentOptionsService.updatePaymentOptions(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentOptions'] })
    },
  })
}

