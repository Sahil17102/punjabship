import api from './axios' // your pre-configured axios instance

const normalizeArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.couriers)) return payload.couriers
  if (Array.isArray(payload?.rates)) return payload.rates
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

const normalizeFilterValues = (value) =>
  (Array.isArray(value) ? value : [value])
    .flat()
    .flatMap((item) => {
      if (item && typeof item === 'object' && 'value' in item) {
        return String(item.value || '').split(',')
      }
      return String(item || '').split(',')
    })
    .map((item) => item.trim())
    .filter(Boolean)

export const fetchShippingRates = async (filters = {}) => {
  const params = {}
  const courierNames = normalizeFilterValues(filters.courier_name)
  if (courierNames.length) params.courier_name = courierNames
  if (filters.mode) params.mode = filters.mode
  if (
    filters.min_weight !== undefined &&
    filters.min_weight !== '' &&
    filters.businessType?.toLowerCase() !== 'b2c'
  ) {
    const minWeight = Number(filters.min_weight)
    if (Number.isFinite(minWeight)) params.min_weight = minWeight
  }
  if (filters.businessType) params.businessType = filters.businessType
  if (filters.planId) params.planId = filters.planId
  const response = await api.get('/admin/couriers/shipping-rates', { params })
  return normalizeArrayPayload(response.data)
}

export const fetchAvailableCouriers = async (params) => {
  try {
    const res = await api.post('/admin/couriers/available', {
      ...params,
      shipment_type: params.shipment_type ?? 'b2c',
    })

    if (!res.data.success) {
      throw new Error(res.data.error || 'Failed to fetch couriers')
    }

    return res.data.data
  } catch (error) {
    console.error('fetchAvailableCouriers error:', error.response?.data || error.message)
    throw new Error(error.response?.data?.error || error.message || 'Failed to fetch couriers')
  }
}

export const fetchAllCouriers = async () => {
  const res = await api.get(`/admin/couriers/list`)
  if (!res.data?.success) throw new Error('Failed to fetch couriers')
  return normalizeArrayPayload(res.data) // returns an array of courier names
}

export const fetchAllCouriersList = async (filters = {}) => {
  const params = {}
  if (filters.search) params.search = filters.search
  if (filters.serviceProvider) params.serviceProvider = filters.serviceProvider
  if (filters.businessType) params.businessType = filters.businessType

  const res = await api.get(`/couriers/full-list`, { params })
  if (!res.data?.success) throw new Error('Failed to fetch couriers')
  return normalizeArrayPayload(res.data) // returns an array of courier objects
}

export const createCourier = async (payload) => {
  const { data } = await api.post(`/couriers/create`, payload)
  return data
}
export const deleteCourier = async ({ id, serviceProvider }) => {
  const { data } = await api.delete(`/couriers/delete/${id}`, {
    data: { serviceProvider },
  })
  return data
}

export const updateCourierStatus = async ({ id, serviceProvider, isEnabled, businessType }) => {
  const { data } = await api.patch(`/couriers/status/${id}`, {
    serviceProvider,
    isEnabled,
    businessType, // Optional: array of ['b2c'], ['b2b'], or ['b2c', 'b2b']
  })
  return data
}

export const fetchServiceProviders = async () => {
  const { data } = await api.get(`/couriers/providers`)
  if (!data?.success) throw new Error('Failed to fetch service providers')
  return data.data
}

export const updateServiceProviderStatus = async ({ serviceProvider, isEnabled }) => {
  const { data } = await api.patch(`/couriers/providers/${serviceProvider}`, {
    isEnabled,
  })
  return data
}

export const updateShippingRate = async (id, updates, planId) => {
  const { data } = await api.put(`/admin/couriers/shipping-rate/${id}/${planId}`, updates)
  return data
}

export const uploadShippingRates = async ({
  file,
  planId,
  businessType,
  importScope,
  courierId,
  courierName,
  serviceProvider,
}) => {
  if (!file) throw new Error('No file provided for import')

  const formData = new FormData()
  formData.append('file', file?.file) // must be File or Blob

  const params = new URLSearchParams({
    planId,
    businessType: businessType.toLowerCase(),
  })
  if (importScope) params.set('importScope', importScope)
  if (courierId !== undefined && courierId !== null && courierId !== '') {
    params.set('courierId', String(courierId))
  }
  if (courierName) params.set('courierName', courierName)
  if (serviceProvider) params.set('serviceProvider', serviceProvider)

  const { data } = await api.post(
    `/admin/couriers/shipping-rates/import?${params.toString()}`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  )

  return data
}
// Unified delete function: B2C zone, B2B zone, B2B courier
export const deleteShippingRateAPI = async ({
  courierId,
  planId,
  businessType,
  zoneId,
  serviceProvider,
  mode,
}) => {
  if (!courierId || !planId || !businessType) {
    throw new Error('courierId, planId and businessType are required')
  }

  const { data } = await api.delete(`/admin/couriers/shipping-rates/${planId}/${courierId}`, {
    params: {
      businessType,
      zoneId,
      serviceProvider,
      mode,
    },
  })

  return data
}

export const fetchCourierCredentials = async () => {
  const { data } = await api.get('/admin/couriers/credentials')
  if (!data?.success) throw new Error('Failed to fetch courier credentials')
  return data.data
}

export const updateDelhiveryCredentials = async (payload) => {
  const { data } = await api.put('/admin/couriers/credentials/delhivery', payload)
  if (!data?.success) throw new Error('Failed to update Delhivery credentials')
  return data.data
}

export const testDelhiveryCredentials = async (pincode) => {
  const { data } = await api.get('/admin/couriers/credentials/delhivery/test', {
    params: { pincode },
  })
  if (!data?.success) throw new Error(data?.message || 'Delhivery B2C credential test failed')
  return data.data
}

export const requestDelhiveryLtlPasswordReset = async (payload) => {
  const { data } = await api.post('/admin/couriers/credentials/delhivery/ltl/password-reset', payload)
  if (!data?.success) throw new Error(data?.message || 'Failed to trigger Delhivery LTL password reset')
  return data.data
}

export const loginDelhiveryLtl = async (payload) => {
  const { data } = await api.post('/admin/couriers/credentials/delhivery/ltl/login', payload)
  if (!data?.success) throw new Error(data?.message || 'Failed to log in to Delhivery LTL')
  return data.data
}

export const logoutDelhiveryLtl = async () => {
  const { data } = await api.get('/admin/couriers/credentials/delhivery/ltl/logout')
  if (!data?.success) throw new Error(data?.message || 'Failed to log out of Delhivery LTL')
  return data.data
}

export const checkDelhiveryLtlServiceability = async (params) => {
  const { data } = await api.get('/admin/couriers/credentials/delhivery/ltl/serviceability', {
    params,
  })
  if (!data?.success) throw new Error(data?.message || 'Failed to fetch Delhivery LTL serviceability')
  return data.data
}

export const getDelhiveryLtlExpectedTat = async (params) => {
  const { data } = await api.get('/admin/couriers/credentials/delhivery/ltl/tat', {
    params,
  })
  if (!data?.success) throw new Error(data?.message || 'Failed to fetch Delhivery LTL expected TAT')
  return data.data
}

export const estimateDelhiveryLtlFreight = async (payload) => {
  const { data } = await api.post('/admin/couriers/credentials/delhivery/ltl/freight-estimate', payload)
  if (!data?.success) throw new Error(data?.message || 'Failed to fetch Delhivery LTL freight estimate')
  return data.data
}

export const getDelhiveryLtlFreightCharges = async (params) => {
  const { data } = await api.get('/admin/couriers/credentials/delhivery/ltl/freight-charges', {
    params,
  })
  if (!data?.success) throw new Error(data?.message || 'Failed to fetch Delhivery LTL freight charges')
  return data.data
}

export const createDelhiveryLtlClientWarehouse = async (payload) => {
  const { data } = await api.post('/admin/couriers/credentials/delhivery/ltl/client-warehouse', payload)
  if (!data?.success) throw new Error(data?.message || 'Failed to create Delhivery LTL client warehouse')
  return data.data
}

export const updateDelhiveryLtlClientWarehouse = async (payload) => {
  const { data } = await api.patch('/admin/couriers/credentials/delhivery/ltl/client-warehouse', payload)
  if (!data?.success) throw new Error(data?.message || 'Failed to update Delhivery LTL client warehouse')
  return data.data
}

export const createDelhiveryLtlManifest = async ({ payload, files = [] }) => {
  if (Array.isArray(files) && files.length > 0) {
    const formData = new FormData()
    formData.append('payload', JSON.stringify(payload || {}))
    files.forEach((file) => {
      formData.append('doc_file', file)
    })

    const { data } = await api.post('/admin/couriers/credentials/delhivery/ltl/manifest', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    if (!data?.success) throw new Error(data?.message || 'Failed to create Delhivery LTL shipment')
    return data.data
  }

  const { data } = await api.post('/admin/couriers/credentials/delhivery/ltl/manifest', payload)
  if (!data?.success) throw new Error(data?.message || 'Failed to create Delhivery LTL shipment')
  return data.data
}

export const getDelhiveryLtlManifestStatus = async (params) => {
  const { data } = await api.get('/admin/couriers/credentials/delhivery/ltl/manifest', {
    params,
  })
  if (!data?.success) throw new Error(data?.message || 'Failed to fetch Delhivery LTL shipment status')
  return data.data
}

export const updateDelhiveryLtlShipment = async ({ lrn, payload, files = [] }) => {
  const normalizedLrn = String(lrn || '').trim()
  if (!normalizedLrn) throw new Error('LRN is required')

  if (Array.isArray(files) && files.length > 0) {
    const formData = new FormData()
    formData.append('payload', JSON.stringify(payload || {}))
    files.forEach((file) => {
      formData.append('invoice_file', file)
    })

    const { data } = await api.put(
      `/admin/couriers/credentials/delhivery/ltl/lrn/${encodeURIComponent(normalizedLrn)}`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      },
    )
    if (!data?.success) throw new Error(data?.message || 'Failed to update Delhivery LTL shipment')
    return data.data
  }

  const { data } = await api.put(
    `/admin/couriers/credentials/delhivery/ltl/lrn/${encodeURIComponent(normalizedLrn)}`,
    payload,
  )
  if (!data?.success) throw new Error(data?.message || 'Failed to update Delhivery LTL shipment')
  return data.data
}

export const getDelhiveryLtlShipmentUpdateStatus = async (params) => {
  const { data } = await api.get('/admin/couriers/credentials/delhivery/ltl/lrn/update/status', {
    params,
  })
  if (!data?.success) throw new Error(data?.message || 'Failed to fetch Delhivery LTL shipment update status')
  return data.data
}

export const cancelDelhiveryLtlShipment = async ({ lrn }) => {
  const normalizedLrn = String(lrn || '').trim()
  if (!normalizedLrn) throw new Error('LRN is required')

  const { data } = await api.delete(
    `/admin/couriers/credentials/delhivery/ltl/lrn/${encodeURIComponent(normalizedLrn)}`,
  )
  if (!data?.success) throw new Error(data?.message || 'Failed to cancel Delhivery LTL shipment')
  return data.data
}

export const trackDelhiveryLtlShipment = async (params) => {
  const { data } = await api.get('/admin/couriers/credentials/delhivery/ltl/lrn/track', {
    params,
  })
  if (!data?.success) throw new Error(data?.message || 'Failed to fetch Delhivery LTL shipment tracking')
  return data.data
}

export const getDelhiveryLtlShippingLabelUrls = async ({ size, lrn }) => {
  const normalizedSize = String(size || '').trim().toLowerCase()
  const normalizedLrn = String(lrn || '').trim()

  if (!normalizedSize) throw new Error('Label size is required')
  if (!normalizedLrn) throw new Error('LRN is required')

  const { data } = await api.get(
    `/admin/couriers/credentials/delhivery/ltl/labels/${encodeURIComponent(normalizedSize)}/${encodeURIComponent(normalizedLrn)}`,
  )
  if (!data?.success) throw new Error(data?.message || 'Failed to fetch Delhivery LTL shipping label URLs')
  return data.data
}

export const getDelhiveryLtlLrCopy = async ({ lrn, lrCopyType, requestId }) => {
  const normalizedLrn = String(lrn || '').trim()
  const normalizedCopyType = String(lrCopyType || '').trim()
  const normalizedRequestId = String(requestId || '').trim()

  if (!normalizedLrn) throw new Error('LRN is required')

  const params = {}
  if (normalizedCopyType) params.lr_copy_type = normalizedCopyType

  const { data } = await api.get(
    `/admin/couriers/credentials/delhivery/ltl/lr-copy/${encodeURIComponent(normalizedLrn)}`,
    {
      params,
      headers: normalizedRequestId ? { 'X-Request-Id': normalizedRequestId } : undefined,
    },
  )
  if (!data?.success) throw new Error(data?.message || 'Failed to fetch Delhivery LTL LR copy')
  return data.data
}

export const generateDelhiveryLtlDocuments = async ({ docType, payload, requestId }) => {
  const normalizedDocType = String(docType || '').trim().toLowerCase()
  const normalizedRequestId = String(requestId || '').trim()

  if (!normalizedDocType) throw new Error('Document type is required')

  const { data } = await api.post(
    `/admin/couriers/credentials/delhivery/ltl/generate/${encodeURIComponent(normalizedDocType)}`,
    payload,
    {
      headers: normalizedRequestId ? { 'X-Request-Id': normalizedRequestId } : undefined,
    },
  )
  if (!data?.success) throw new Error(data?.message || 'Failed to generate Delhivery LTL documents')
  return data.data
}

export const getDelhiveryLtlGeneratedDocumentStatus = async ({ docType, jobId, requestId }) => {
  const normalizedDocType = String(docType || '').trim().toLowerCase()
  const normalizedJobId = String(jobId || '').trim()
  const normalizedRequestId = String(requestId || '').trim()

  if (!normalizedDocType) throw new Error('Document type is required')
  if (!normalizedJobId) throw new Error('Job ID is required')

  const { data } = await api.get(
    `/admin/couriers/credentials/delhivery/ltl/generate/${encodeURIComponent(normalizedDocType)}/status/${encodeURIComponent(normalizedJobId)}`,
    {
      headers: normalizedRequestId ? { 'X-Request-Id': normalizedRequestId } : undefined,
    },
  )
  if (!data?.success) throw new Error(data?.message || 'Failed to fetch Delhivery LTL document status')
  return data.data
}

export const bookDelhiveryLtlLastMileAppointment = async (payload) => {
  const { data } = await api.post('/admin/couriers/credentials/delhivery/ltl/appointments/lm', payload)
  if (!data?.success) {
    throw new Error(data?.message || 'Failed to book Delhivery LTL last-mile appointment')
  }
  return data.data
}

export const cancelDelhiveryLtlPickupRequest = async ({ pickupId, requestId }) => {
  const normalizedPickupId = String(pickupId || '').trim()
  const normalizedRequestId = String(requestId || '').trim()

  if (!normalizedPickupId) throw new Error('Pickup ID is required')

  const { data } = await api.delete(
    `/admin/couriers/credentials/delhivery/ltl/pickup-requests/${encodeURIComponent(normalizedPickupId)}`,
    {
      headers: normalizedRequestId ? { 'X-Request-Id': normalizedRequestId } : undefined,
    },
  )
  if (!data?.success) throw new Error(data?.message || 'Failed to cancel Delhivery LTL pickup request')
  return data.data
}

export const updateEkartCredentials = async (payload) => {
  const { data } = await api.put('/admin/couriers/credentials/ekart', payload)
  if (!data?.success) throw new Error('Failed to update Ekart credentials')
  return data.data
}

export const updateXpressbeesCredentials = async (payload) => {
  const { data } = await api.put('/admin/couriers/credentials/xpressbees', payload)
  if (!data?.success) throw new Error('Failed to update Xpressbees credentials')
  return data.data
}

export const updateXpressbeesAwbRange = async (payload) => {
  const { data } = await api.put('/admin/couriers/credentials/xpressbees/awb-range', payload)
  if (!data?.success) throw new Error(data?.message || 'Failed to update Xpressbees AWB range')
  return data.data
}

export const updateShadowfaxCredentials = async (payload) => {
  const { data } = await api.put('/admin/couriers/credentials/shadowfax', payload)
  if (!data?.success) throw new Error('Failed to update Shadowfax credentials')
  return data.data
}

export const updateVelocityCredentials = async (payload) => {
  const { data } = await api.put('/admin/couriers/credentials/velocity', payload)
  if (!data?.success) throw new Error(data?.message || 'Failed to update Velocity credentials')
  return data.data
}

export const testVelocityCredentials = async () => {
  const { data } = await api.post('/admin/couriers/credentials/velocity/test')
  if (!data?.success) throw new Error(data?.message || 'Velocity authentication failed')
  return data.data
}

export const loadVelocityCouriers = async (payload) => {
  const { data } = await api.post('/admin/couriers/credentials/velocity/load-couriers', payload)
  if (!data?.success) throw new Error(data?.message || 'Failed to load Velocity couriers')
  return data.data
}

export const updateAmazonCredentials = async (payload) => {
  const { data } = await api.put('/admin/couriers/credentials/amazon', payload)
  if (!data?.success) throw new Error('Failed to update Amazon credentials')
  return data.data
}
