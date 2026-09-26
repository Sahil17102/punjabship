// src/hooks/useZonesSimple.ts
import { useQuery } from '@tanstack/react-query'
import { getZones, getZonesFiltered } from '../api/courier'

export function useZonesSimple() {
  const {
    data: zones = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['zones'],
    queryFn: getZones,
  })

  return { zones, isLoading, isError }
}

export function useZones(businessType: string, filters = {}) {
  const {
    data: zones = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['zones', businessType, filters],
    queryFn: () => getZonesFiltered(businessType?.toLocaleUpperCase(), filters),
  })

  return { zones, isLoading, isError }
}
