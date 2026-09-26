import axiosInstance from './axiosInstance'

export interface GlobalSearchResult {
  type: 'page' | 'order' | 'invoice' | 'ndr' | 'rto' | 'weight_discrepancy'
  id: string
  title: string
  subtitle?: string
  link: string
  metadata?: Record<string, unknown>
}

export interface GlobalSearchResponse {
  success: boolean
  results: GlobalSearchResult[]
  query: string
  count: number
}

export const globalSearch = async (query: string, limit = 10): Promise<GlobalSearchResponse> => {
  const { data } = await axiosInstance.get<GlobalSearchResponse>('/search/search', {
    params: { q: query, limit },
  })
  return data
}

