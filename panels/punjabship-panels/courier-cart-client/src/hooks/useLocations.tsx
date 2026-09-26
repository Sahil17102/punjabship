import { useQuery } from '@tanstack/react-query'
import { fetchLocations } from '../api/locations'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useLocations = (params: any, enabled = true, queryKey: string[] | null = null) => {
  // ✅ always generate a unique key (pickup/delivery) even if queryKey not passed
  const finalKey = queryKey ?? ['locations', JSON.stringify(params ?? {})]

  return useQuery({
    queryKey: finalKey,
    queryFn: () => fetchLocations(params),
    enabled: Boolean(enabled && params),
  })
}
