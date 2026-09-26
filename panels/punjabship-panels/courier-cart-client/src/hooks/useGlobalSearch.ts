import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { globalSearch, type GlobalSearchResponse } from '../api/globalSearch.api'

export const useGlobalSearch = (query: string, enabled = false) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [query])

  const queryResult = useQuery<GlobalSearchResponse, Error>({
    queryKey: ['globalSearch', debouncedQuery],
    queryFn: () => globalSearch(debouncedQuery),
    enabled: enabled && debouncedQuery.trim().length >= 2,
    staleTime: 30000,
    refetchOnWindowFocus: false,
    retry: false, // Don't retry on error
    placeholderData: (previousData) => previousData, // Keep previous data while loading new query
  })

  return {
    ...queryResult,
    data: queryResult.data as GlobalSearchResponse | undefined,
  }
}

