import { useMutation } from '@tanstack/react-query'
import { fetchTracking } from 'services/order.service'

export const useTracking = () => {
  return useMutation({
    mutationFn: ({ awb, order, contact }) =>
      fetchTracking({
        awb: awb || undefined,
        orderNumber: order || undefined,
        contact: contact || undefined,
      }),
    retry: 1,
  })
}
