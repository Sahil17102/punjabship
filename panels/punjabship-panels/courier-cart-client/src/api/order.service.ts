import axiosInstance from './axiosInstance'

export interface CreateShipmentParams {
  order_number: string
  payment_type: 'cod' | 'prepaid' | 'reverse'
  payment_type_confirmed_by_user?: boolean
  package_weight?: number
  package_length?: number
  prepaid_amount?: number
  package_breadth?: number
  package_height?: number
  transaction_fee?: number
  integration_type?: string
  isReverse?: boolean
  request_auto_pickup?: 'Yes' | 'No'
  gift_wrap?: number
  shipping_charges?: number // What seller charges customer (customer-facing price)
  other_charges?: number
  freight_charges?: number // What platform charges seller (based on rate card)
  courier_cost?: number // Estimated courier cost from serviceability (what platform pays courier - can be updated via webhook)
  cod_charges?: number
  discount?: number
  order_date: string
  order_amount: number
  consignee: {
    name: string
    company_name?: string
    address: string
    address_2?: string
    address_line_1?: string
    address_line_2?: string
    landmark?: string
    locality?: string
    city: string
    state: string
    email?: string
    pincode: string
    phone: string
    gstin?: string
  }
  pickup: {
    warehouse_name: string
    address: string
    address_2?: string
    city: string
    state: string
    pincode: string
    phone: string
    gst_number?: string
    name?: string
    pickup_date?: string
    pickup_time?: string
  }
  pickup_location_id?: string
  is_rto_different?: 'yes' | 'no'
  rto?: {
    warehouse_name: string
    name: string
    address: string
    address_2?: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  order_items: {
    name: string
    sku: string
    qty: number
    price: number
    hsn: string
    discount: number
    tax_rate: number
  }[]
  courier_id?: number
  courier_partner?: string
  is_insurance?: 0 | 1
  tags?: string
  pickup_date?: string
  pickup_time?: string
  delivery_location?: string
  zone_id?: string
  selected_rate_card_id?: string
  selected_max_slab_weight?: number
  shipping_mode?: string
  chargedWeight?: number | null
  volumetricWeight?: number | null
  courier_option_key?: string
  amazon_request_token?: string
  amazon_rate_id?: string
  amazon_service_id?: string
  amazon_carrier_id?: string
  shadowfax_forward_mode?: 'marketplace' | 'warehouse'
  shadowfax_service_mode?: 'regular' | 'surface'
}

export interface CreateShipmentResponse {
  success: boolean
  shipment?: unknown
}

export const createShipment = async (
  data: CreateShipmentParams,
): Promise<CreateShipmentResponse> => {
  try {
    // Set longer timeout (3.5 minutes) for B2C order creation as external courier API calls can take time
    const res = await axiosInstance.post<CreateShipmentResponse>('/orders/b2c/create', data, {
      timeout: 210000, // 3.5 minutes (210 seconds)
    })
    return res.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error creating shipment:', error.response?.data || error.message)
    throw error
  }
}

export const bookExistingB2COrderCourier = async (
  orderId: string,
  data: Omit<CreateShipmentParams, 'order_number' | 'order_date' | 'order_amount' | 'order_items'>,
): Promise<CreateShipmentResponse> => {
  try {
    const res = await axiosInstance.post<CreateShipmentResponse>(
      `/orders/b2c/${orderId}/book-courier`,
      data,
      {
        timeout: 210000,
      },
    )
    return res.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error booking courier for existing B2C order:', error.response?.data || error.message)
    throw error
  }
}

export interface BulkCreateShipmentItem extends CreateShipmentParams {
  client_row_number?: number
  defer_booking?: boolean
}

export interface BulkCreateShipmentResult {
  rowNumber: number
  orderNumber: string | null
  success: boolean
  shipment?: unknown
  message: string
}

export interface BulkCreateShipmentResponse {
  success: boolean
  message: string
  summary: {
    total: number
    successCount: number
    failedCount: number
  }
  results: BulkCreateShipmentResult[]
}

export const createBulkShipments = async (orders: BulkCreateShipmentItem[]) => {
  const res = await axiosInstance.post<BulkCreateShipmentResponse>(
    '/orders/b2c/bulk-create',
    { orders },
    { timeout: 600000 },
  )
  return res.data
}

export type CreateB2BShipmentParams = {
  order_number: string
  order_date: string
  payment_type: 'prepaid' | 'cod'
  freight_mode?: 'fop' | 'fod'
  rov_type?: 'owner' | 'courier' | 'none'
  order_amount: number
  cod_amount?: number
  shipping_charges?: number
  freight_charges?: number // What platform charges seller (based on rate card)
  other_charges?: number
  cod_charges?: number
  courier_cost?: number // Estimated courier cost from serviceability (what platform pays courier - can be updated via webhook)
  transaction_fee?: number
  discount?: number
  gift_wrap?: number
  prepaid_amount?: number

  consignee: {
    name: string
    phone: string
    email?: string
    address: string
    city: string
    state: string
    pincode: string
    company_name: string
    gstin?: string
  }

  pickup: {
    warehouse_name?: string
    address?: string
    name?: string
    city: string
    state: string
    pincode: string
    phone: string
    pickup_date?: string
    pickup_time?: string
  }
  pickup_location_id?: string

  // Boxes array
  boxes: Array<{
    lengthCm: number
    breadthCm: number
    heightCm: number
    weightKg: number
    quantity: number
  }>

  // Invoices array
  invoices: Array<{
    invoiceNumber: string
    invoiceDate: string
    invoiceValue: number
    invoiceFileUrl?: string
  }>

  courier_id: number
  courier_partner?: string
  is_insurance?: 0 | 1
  is_rto_different?: 'yes' | 'no'
  rto?: {
    warehouse_name: string
    name: string
    address: string
    city: string
    state: string
    pincode: string
    phone: string
  }
  request_auto_pickup?: 'yes' | 'no'
  pickup_date?: string
  pickup_time?: string
  integration_type?: string
  shadowfax_forward_mode?: 'marketplace' | 'warehouse'
  shadowfax_service_mode?: 'regular' | 'surface'
  tags?: string
  delivery_location?: string
  zone_id?: string
}

export const createB2BShipment = async (data: CreateB2BShipmentParams) => {
  try {
    const res = await axiosInstance.post('/orders/b2b/create', data, {
      timeout: 210000,
    })
    return res.data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error creating B2B shipment:', error.response?.data || error.message)
    throw error
  }
}

export const checkOrderNumberAvailability = async (orderNumber: string) => {
  const res = await axiosInstance.get('/orders/check-order-number', {
    params: { orderNumber },
  })
  return res.data
}

export interface FetchOrdersListParams {
  page?: number
  limit?: number
  status?: string
  type?: string
  courier?: string
  warehouse?: string
  sortBy?: 'created_at' | 'updated_at'
  sortOrder?: 'asc' | 'desc'
  fromDate?: string
  toDate?: string
  search?: string
  productQuery?: string
  fetchAll?: boolean
}

export const fetchB2COrdersByUser = async (params: FetchOrdersListParams = {}) => {
  const res = await axiosInstance.get('/orders/b2c/list', {
    params,
  })
  return res.data // { success, orders, totalCount, totalPages }
}

export const fetchB2BOrdersByUser = async (params: FetchOrdersListParams = {}) => {
  const res = await axiosInstance.get('/orders/b2b/list', {
    params,
  })
  return res.data // { success, orders, totalCount, totalPages }
}

export type ClientOrderExportScope = 'all' | 'b2c' | 'b2b'

const ORDER_EXPORT_PAGE_SIZE = 100

export const fetchOrdersForCsvExport = async (
  scope: ClientOrderExportScope,
  filters: FetchOrdersListParams = {},
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders: any[] = []
  let page = 1
  let totalPages = 1

  do {
    const params = { ...filters, page, limit: ORDER_EXPORT_PAGE_SIZE }
    const response =
      scope === 'b2c'
        ? await fetchB2COrdersByUser(params)
        : scope === 'b2b'
          ? await fetchB2BOrdersByUser(params)
          : await fetchAllOrders(params)

    const pageOrders = Array.isArray(response?.orders) ? response.orders : []
    orders.push(...pageOrders)

    const totalCount = Number(response?.totalCount ?? pageOrders.length)
    const responseTotalPages = Number(response?.totalPages)
    totalPages =
      Number.isFinite(responseTotalPages) && responseTotalPages > 0
        ? responseTotalPages
        : Math.max(1, Math.ceil(totalCount / ORDER_EXPORT_PAGE_SIZE))

    page += 1
  } while (page <= totalPages)

  return orders
}

export interface GenerateManifestParams {
  awbs: string[]
  type: 'b2c' | 'b2b'
  pickup_date?: string
  pickup_time?: string
  pickup_location?: string
  expected_package_count?: number
}

export interface GenerateManifestResponse {
  manifest_id: string
  manifest_url: string
  warnings?: string[]
}

export type BulkOrderDocumentDownloadType = 'label' | 'invoice' | 'manifest'

export const downloadBulkOrderDocumentsZip = async (
  orderIds: Array<string | number>,
  documentType: BulkOrderDocumentDownloadType,
) => {
  const res = await axiosInstance.post(
    '/orders/documents/bulk-download',
    {
      orderIds: orderIds.map((orderId) => String(orderId)),
      documentType,
    },
    {
      responseType: 'blob',
      timeout: 600000,
    },
  )

  return {
    blob: res.data as Blob,
    headers: res.headers as Record<string, string | undefined>,
  }
}

export const generateManifestService = async (params: GenerateManifestParams) => {
  const res = await axiosInstance.post<GenerateManifestResponse>('/orders/b2c/manifest', params, {
    timeout: 600000,
  })
  return res.data
}

export interface RetryManifestResponse extends GenerateManifestResponse {
  manifest_key?: string | null
  retry_count: number
  retries_remaining: number
  order_status: string | null
  retry_action?: 'manifest_generation' | 'pickup_request'
}

export const retryFailedManifestService = async (orderId: string) => {
  const res = await axiosInstance.post<RetryManifestResponse>(
    `/orders/b2c/${orderId}/retry-manifest`,
  )
  return res.data
}

export const regenerateOrderDocumentsService = async (
  orderId: string,
  { regenerateLabel = true, regenerateInvoice = true } = {},
) => {
  const res = await axiosInstance.post(`/orders/${orderId}/regenerate-documents`, {
    regenerateLabel,
    regenerateInvoice,
  })
  return res.data
}

export const fetchAllOrders = async (params: FetchOrdersListParams = {}) => {
  try {
    const res = await axiosInstance.get('/orders/all', { params })
    return res.data // { success, orders, totalCount, totalPages }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error fetching orders:', error.response?.data || error.message)
    throw new Error(error.response?.data?.message || 'Failed to fetch orders')
  }
}
