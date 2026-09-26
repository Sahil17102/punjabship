// hooks/useTracking.ts
import { useQuery } from '@tanstack/react-query'
import { fetchTracking } from '../../api/tracking.service'

export const useTracking = (
  awb?: string | null,
  order?: string | null,
  contact?: string | null,
) => {
  return useQuery({
    queryKey: ['tracking', { awb, order, contact }],
    queryFn: () =>
      fetchTracking({
        awb: awb || undefined,
        orderNumber: order || undefined,
        contact: contact || undefined,
      }),
    enabled: !!awb || (!!order && !!contact),
    staleTime: 60_000, // 1 minute
    retry: 1,
  })
}
