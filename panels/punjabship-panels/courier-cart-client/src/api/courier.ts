// src/services/courierService.ts
import axiosInstance from './axiosInstance'

export interface Courier {
  id: number
  name: string
  displayName?: string | null
  courier_option_key?: string | null
  max_slab_weight?: number | null
  edd?: string | null
  tag?: string | null
  baseCourierId?: number | null
  masterCompany?: string | null
  realtimeTracking?: string | null
  deliveryBoyContact?: string | null
  podAvailable?: string | null
  callBeforeDelivery?: string | null
  activatedDate?: string | null
  mode?: number | null
  minWeight?: number | null
  courierType?: number | null
  isHyperlocal?: boolean
  isOwnKeyCourier?: boolean
  ownkeyCourierId?: number | null
  useSrPostcodes?: boolean
  serviceType?: number | null
  // Slabbed pricing fields returned by backend
  rate?: number | null
  chargeable_weight?: number | null
  volumetric_weight?: number | null
  slabs?: number | null
  courier_cost_estimate?: number | null
  gst_percent?: number | null
  gst_amount?: number | null
  total_charges_without_gst?: number | null
  total_charges_with_gst?: number | null
  wallet_debit_amount?: number | null
  tax_label?: string | null
  integration_type?: string | null
  provider_serviceability?: Record<string, any> | null
  booking_available?: boolean | null
  can_book?: boolean | null
  booking_blocked_reason?: string | null
  localRates?: Record<string, any>
  approxZone?: { id?: string; code?: string; name?: string } | null
}

export interface CourierSummary {
  totalCourierCount: number
  serviceablePincodesCount: number
  pickupPincodesCount: number
  totalRtoCount: number
  totalOdaCount: number
  updatedAt?: string
}

// src/api/courier.ts

export interface CourierListResponse {
  summary: CourierSummary
  couriers: Courier[]
  totalCount: number
  page: number
  limit: number
}

interface GetCouriersParams {
  page?: number
  limit?: number
  filters?: Record<string, string | boolean | number>
}

export const getCouriers = async ({
  page,
  limit,
  filters = {},
}: GetCouriersParams): Promise<CourierListResponse> => {
  const params = new URLSearchParams()

  // ✅ Only add pagination if provided
  if (page !== undefined) params.set('page', String(page))
  if (limit !== undefined) params.set('limit', String(limit))

  // ✅ Add filters safely
  Object.entries(filters).forEach(([key, val]) => {
    if (val !== '' && val !== undefined && val !== null) {
      params.set(key, String(val))
    }
  })

  const queryString = params.toString()
  const url = queryString ? `/couriers?${queryString}` : '/couriers'

  const res = await axiosInstance.get<{ status: string; data: CourierListResponse }>(url)

  return res.data.data
}

export const getCourierById = async (id: number): Promise<Courier> => {
  const res = await axiosInstance.get<{ status: string; data: Courier }>(`/couriers/${id}`)
  return res.data.data
}

interface FetchCouriersResponse {
  success: boolean
  data: Courier[]
  error?: string
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Courier selection can briefly fail during backend restarts or upstream gateway hiccups.
const shouldRetryCourierFetch = (error: any) => {
  const status = Number(error?.response?.status)
  const code = String(error?.code || '').toUpperCase()
  return (
    !error?.response ||
    [502, 503, 504].includes(status) ||
    ['ECONNABORTED', 'ECONNRESET', 'ETIMEDOUT'].includes(code)
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchAvailableCouriers = async (params: any): Promise<any[]> => {
  const maxAttempts = 2

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await axiosInstance.post<FetchCouriersResponse>(
        '/couriers/available-to-user',
        {
          ...params,
        },
        {
          timeout: 45000,
        },
      )

      if (!res.data.success) {
        throw new Error(res.data.error || 'Failed to fetch couriers')
      }

      return res.data.data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('fetchAvailableCouriers error:', error.response?.data || error.message)
      if (attempt < maxAttempts && shouldRetryCourierFetch(error)) {
        await delay(1200)
        continue
      }
      throw new Error(error.response?.data?.error || error.message || 'Failed to fetch couriers')
    }
  }

  throw new Error('Failed to fetch couriers')
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchB2BRateQuotes = async (params: any): Promise<any[]> => {
  try {
    const res = await axiosInstance.post<FetchCouriersResponse>(
      '/couriers/b2b-rate-quotes',
      {
        ...params,
      },
      {
        timeout: 45000,
      },
    )

    if (!res.data.success) {
      throw new Error(res.data.error || 'Failed to fetch B2B rate quotes')
    }

    return res.data.data
  } catch (error: any) {
    console.error('fetchB2BRateQuotes error:', error.response?.data || error.message)
    throw new Error(
      error.response?.data?.error || error.message || 'Failed to fetch B2B rate quotes',
    )
  }
}

interface ShippingRatesFilters {
  courier?: string | string[]
  courier_name?: string | string[]
  mode?: string
  min_weight?: number | string
  businessType?: 'b2b' | 'b2c'
  // add more fields if needed
}

const normalizeFilterValues = (value: unknown): string[] =>
  (Array.isArray(value) ? value : [value])
    .flat()
    .flatMap((item) => {
      if (item && typeof item === 'object' && 'value' in item) {
        return String((item as { value?: unknown }).value || '').split(',')
      }
      return String(item || '').split(',')
    })
    .map((item) => item.trim())
    .filter(Boolean)

export const fetchShippingRates = async (filters: ShippingRatesFilters = {}) => {
  const params: Record<string, string | number | string[]> = {}

  const courierNames = normalizeFilterValues(filters.courier_name || filters.courier)
  if (courierNames.length) params.courier_name = courierNames
  if (filters.mode) params.mode = filters.mode
  if (filters.min_weight !== undefined && filters.businessType !== 'b2c') {
    const minWeight = Number(filters.min_weight)
    if (Number.isFinite(minWeight)) params.min_weight = minWeight
  }
  if (filters.businessType) params.businessType = filters.businessType

  const response = await axiosInstance.get('/couriers/shipping-rates', { params })
  return response.data.data
}

export const fetchAllCouriers = async () => {
  const res = await axiosInstance.get(`/couriers/list`)
  if (!res.data?.success) throw new Error('Failed to fetch couriers')
  return res.data.data // returns an array of courier names
}

export const fetchCouriersWithDetails = async () => {
  const res = await axiosInstance.get(`/couriers/full-list`)
  if (!res.data?.success) throw new Error('Failed to fetch couriers')
  return res.data.data // returns an array of courier names
}
export const getZones = async () => {
  const res = await axiosInstance.get('/admin/zones')
  return res.data
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getZonesFiltered = async (businessType: string, filters: any) => {
  const params = new URLSearchParams()
  if (businessType) params.append('business_type', businessType)

  // Only include courier filter if B2B
  if (businessType === 'B2B' && filters.courier_id) {
    params.append('courier_id', filters.courier_id)
  }

  const res = await axiosInstance.get(`/admin/zones?${params.toString()}`)
  return res.data
}
