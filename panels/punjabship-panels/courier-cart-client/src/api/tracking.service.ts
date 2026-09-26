import axiosInstance from './axiosInstance'

export interface TrackingHistory {
  status_code: string // CAN, PP, IT, OFD, DL, RT, etc.
  location: string
  event_time: string
  message: string
  hub_name?: string | null
  scan_type?: string | null
  tags?: string[]
}

export interface TrackingResponse {
  id: string
  order_id: string
  order_number: string
  awb_number: string
  courier_name: string
  status: string // cancelled, in-transit, delivered, etc.
  edd: string
  history: TrackingHistory[]
  payment_type: string
  shipment_info: string
}

export interface TrackingParams {
  awb?: string
  awbs?: string
  orderNumber?: string
  contact?: string
}

export interface TrackingBulkResult {
  awb: string
  success: boolean
  data?: TrackingResponse
  message?: string
}

interface ApiResponse {
  success: boolean
  data: TrackingResponse | null
  results?: TrackingBulkResult[]
  summary?: {
    total: number
    found: number
    failed: number
  }
}

export async function fetchTracking(params: TrackingParams): Promise<TrackingResponse> {
  try {
    const { data } = await axiosInstance.get<ApiResponse>('/orders/track', { params })

    if (!data.success || !data.data) {
      throw new Error('No shipment found!')
    }

    return data.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch tracking')
  }
}

export async function fetchBulkTracking(awbs: string[]): Promise<TrackingBulkResult[]> {
  const cleaned = awbs.map((awb) => awb.trim()).filter(Boolean)
  if (!cleaned.length) return []

  try {
    const { data } = await axiosInstance.get<ApiResponse>('/orders/track', {
      params: { awbs: cleaned.join(',') },
    })

    if (!data.success) {
      throw new Error('No shipment found!')
    }

    return data.results || []
  } catch (error: any) {
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch tracking')
  }
}
