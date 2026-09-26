// src/services/zoneService.ts
import api from './axios'

const API_URL = '/admin/zones/'

const normalizeArrayPayload = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.zones)) return payload.zones
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

export const zoneService = {
  getZones: async (businessType, filters = {}) => {
    // Build query params dynamically
    const params = new URLSearchParams()
    if (businessType) params.append('business_type', businessType)

    // Only include courier filter if B2B
    if (businessType === 'B2B' && filters.courier_id) {
      params.append('courier_id', filters.courier_id)
    }

    const res = await api.get(`${API_URL}?${params.toString()}`)
    return normalizeArrayPayload(res.data)
  },

  getZoneById: async (zoneId) => {
    const res = await api.get(`${API_URL}${zoneId}`)
    return res.data
  },
  createZone: async (data) => {
    const res = await api.post(API_URL, data)
    return res.data
  },
  deleteZone: async (id) => {
    await api.delete(`${API_URL}${id}`)
    return id
  },
  updateZone: async (zone) => {
    const res = await api.put(`${API_URL}${zone.id}`, zone)
    return res.data
  },
  getZoneMappings: async (zoneId, params) => {
    if (!zoneId) throw new Error('Zone ID is required')
    const query = new URLSearchParams(params).toString() // optional params
    const { data } = await api.get(`${API_URL}${zoneId}/mappings?${query}`)
    return data
  },
  createZoneMapping: async (zoneId, mappingData) => {
    const res = await api.post(`${API_URL}${zoneId}/mappings`, mappingData)
    return res.data
  },
  updateZoneMapping: async (mappingId, mappingData) => {
    console.log('mapping data', mappingData)
    if (!mappingId) throw new Error('Mapping ID is required')
    const res = await api.put(`${API_URL}mappings/${mappingId}`, mappingData)
    return res.data
  },
  deleteZoneMapping: async (mappingId) => {
    if (!mappingId) throw new Error('Mapping ID is required')
    await api.delete(`${API_URL}mappings/${mappingId}`)
    return mappingId
  },
  importZoneMappings: async (zoneId, fileObj, userChoices) => {
    const formData = new FormData()
    formData.append('file', fileObj)
    console.log('user choices', userChoices)

    // Send the user choices as a JSON string
    if (userChoices) {
      formData.append('userChoices', JSON.stringify(userChoices))
    }

    const response = await api.post(`${API_URL}${zoneId}/mappings/import`, formData)

    return response.data
  },
}
