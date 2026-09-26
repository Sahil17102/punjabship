import api from './axios'

const BASE_URL = '/admin/b2b'

const normalizeArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.zones)) return payload.zones
  if (Array.isArray(payload?.rates)) return payload.rates
  if (Array.isArray(payload?.overheads)) return payload.overheads
  if (Array.isArray(payload?.states)) return payload.states
  if (Array.isArray(payload?.holidays)) return payload.holidays
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

const buildQuery = (params = {}) => {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item))
    } else {
      searchParams.append(key, value)
    }
  })
  return searchParams.toString()
}

const normalizeZoneRate = (rate = {}) => {
  const originZoneId = rate.originZoneId ?? rate.origin_zone_id ?? ''
  const destinationZoneId = rate.destinationZoneId ?? rate.destination_zone_id ?? ''
  const ratePerKgRaw = rate.ratePerKg ?? rate.rate_per_kg
  const volumetricFactorRaw = rate.volumetricFactor ?? rate.volumetric_factor

  return {
    ...rate,
    originZoneId,
    origin_zone_id: originZoneId,
    destinationZoneId,
    destination_zone_id: destinationZoneId,
    ratePerKg: ratePerKgRaw,
    rate_per_kg: ratePerKgRaw,
    volumetricFactor: volumetricFactorRaw,
    volumetric_factor: volumetricFactorRaw,
  }
}

export const b2bAdminService = {
  // Zones
  async getZones(params = {}) {
    const query = buildQuery(params)
    const { data } = await api.get(`${BASE_URL}/zones${query ? `?${query}` : ''}`)
    return normalizeArrayPayload(data)
  },

  async createZone(payload) {
    const { data } = await api.post(`${BASE_URL}/zones`, payload)
    return data.data ?? data
  },

  async updateZone(id, payload) {
    const { data } = await api.put(`${BASE_URL}/zones/${id}`, payload)
    return data.data ?? data
  },

  async deleteZone(id) {
    const { data } = await api.delete(`${BASE_URL}/zones/${id}`)
    return data
  },

  async remapZone(id) {
    const { data } = await api.post(`${BASE_URL}/zones/${id}/remap`)
    return data
  },

  async getStates() {
    const { data } = await api.get(`${BASE_URL}/states`)
    return normalizeArrayPayload(data)
  },

  // Pincodes
  async getPincodes(params = {}) {
    const query = buildQuery(params)
    const { data } = await api.get(`${BASE_URL}/pincodes${query ? `?${query}` : ''}`)
    return {
      data: data.data ?? [],
      pagination: data.pagination ?? { total: 0, page: 1, limit: 20 },
    }
  },

  async createPincode(payload) {
    const { data } = await api.post(`${BASE_URL}/pincodes`, payload)
    return data.data ?? data
  },

  async updatePincode(id, payload) {
    const { data } = await api.put(`${BASE_URL}/pincodes/${id}`, payload)
    return data.data ?? data
  },

  async deletePincode(id) {
    const { data } = await api.delete(`${BASE_URL}/pincodes/${id}`)
    return data
  },

  async bulkDeletePincodes(payload) {
    const { data } = await api.post(`${BASE_URL}/pincodes/bulk-delete`, payload)
    return data
  },

  async bulkMovePincodes(payload) {
    const { data } = await api.post(`${BASE_URL}/pincodes/bulk-move`, payload)
    return data
  },

  async bulkUpdatePincodeFlags(payload) {
    const { data } = await api.post(`${BASE_URL}/pincodes/bulk-update-flags`, payload)
    return data
  },

  async importPincodes(formData) {
    const { data } = await api.post(`${BASE_URL}/pincodes/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  // Zone rates
  async getZoneRates(params = {}) {
    const query = buildQuery(params)
    const { data } = await api.get(`${BASE_URL}/zone-rates${query ? `?${query}` : ''}`)
    return normalizeArrayPayload(data).map((rate) => normalizeZoneRate(rate))
  },

  async upsertZoneRate(payload) {
    const { id, ...rest } = payload
    const url = id ? `${BASE_URL}/zone-rates/${id}` : `${BASE_URL}/zone-rates`
    const method = id ? 'put' : 'post'
    const { data } = await api[method](url, rest)
    return normalizeZoneRate(data.data ?? data)
  },

  async deleteZoneRate(id) {
    const { data } = await api.delete(`${BASE_URL}/zone-rates/${id}`)
    return data
  },

  async importZoneRates(formData) {
    const { data } = await api.post(`${BASE_URL}/zone-rates/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  // Overheads
  async getOverheads(params = {}) {
    const query = buildQuery(params)
    const { data } = await api.get(`${BASE_URL}/overheads${query ? `?${query}` : ''}`)
    return normalizeArrayPayload(data)
  },

  async upsertOverhead(payload) {
    const { id, ...rest } = payload
    const url = id ? `${BASE_URL}/overheads/${id}` : `${BASE_URL}/overheads`
    const method = id ? 'put' : 'post'
    const { data } = await api[method](url, rest)
    return data.data ?? data
  },

  async deleteOverhead(id) {
    const { data } = await api.delete(`${BASE_URL}/overheads/${id}`)
    return data
  },

  // Rate calculator
  async calculateRate(payload) {
    const { data } = await api.post(`${BASE_URL}/calculate-rate`, payload)
    return data.data ?? data
  },

  // Pricing Configuration
  // Additional Charges
  async getAdditionalCharges(params = {}) {
    const query = buildQuery(params)
    const { data } = await api.get(`${BASE_URL}/additional-charges${query ? `?${query}` : ''}`)
    return data.data ?? data
  },

  async upsertAdditionalCharges(payload) {
    const { data } = await api.post(`${BASE_URL}/additional-charges`, payload)
    return data.data ?? data
  },

  async importAdditionalCharges(formData) {
    const { data } = await api.post(`${BASE_URL}/additional-charges/import`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  // Zone States
  async getZoneStates(params = {}) {
    const query = buildQuery(params)
    const { data } = await api.get(`${BASE_URL}/zone-states${query ? `?${query}` : ''}`)
    return normalizeArrayPayload(data)
  },

  async createZoneState(payload) {
    const { data } = await api.post(`${BASE_URL}/zone-states`, payload)
    return data.data ?? data
  },

  async bulkCreateZoneStates(payload) {
    const { data } = await api.post(`${BASE_URL}/zone-states/bulk`, payload)
    return data.data ?? data
  },

  async deleteZoneState(id) {
    const { data } = await api.delete(`${BASE_URL}/zone-states/${id}`)
    return data
  },

  // Holidays
  async getHolidays(params = {}) {
    const query = buildQuery(params)
    const { data } = await api.get(`${BASE_URL}/holidays${query ? `?${query}` : ''}`)
    return normalizeArrayPayload(data)
  },

  async getHoliday(id) {
    const { data } = await api.get(`${BASE_URL}/holidays/${id}`)
    return data.data ?? data
  },

  async createHoliday(payload) {
    const { data } = await api.post(`${BASE_URL}/holidays`, payload)
    return data.data ?? data
  },

  async updateHoliday(id, payload) {
    const { data } = await api.put(`${BASE_URL}/holidays/${id}`, payload)
    return data.data ?? data
  },

  async deleteHoliday(id) {
    const { data } = await api.delete(`${BASE_URL}/holidays/${id}`)
    return data
  },

  async seedNationalHolidays(year) {
    const { data } = await api.post(`${BASE_URL}/holidays/seed-national`, { year })
    return data.data ?? data
  },
}
