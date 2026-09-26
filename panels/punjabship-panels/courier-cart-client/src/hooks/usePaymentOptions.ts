import { useQuery } from '@tanstack/react-query'
import { paymentOptionsService, type PaymentOptions } from '../api/paymentOptions.service'

export const usePaymentOptions = () => {
  return useQuery<PaymentOptions>({
    queryKey: ['paymentOptions'],
    queryFn: () => paymentOptionsService.getPaymentOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes - payment options don't change frequently
    refetchOnWindowFocus: false,
    retry: 3,
  })
}
