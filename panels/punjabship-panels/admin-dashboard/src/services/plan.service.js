// src/services/plansService.ts
import api from './axios' // your pre-configured axios instance

const API_URL = '/plans' // adjust if your backend is on another host

const normalizePlansResponse = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload?.plans)) return payload.plans
  if (Array.isArray(payload?.items)) return payload.items
  return []
}

export const PlansService = {
  getPlans: async (params = {}) => {
    const res = await api.get(API_URL, { params })
    return normalizePlansResponse(res.data)
  },

  createPlan: async (data) => {
    const res = await api.post(API_URL, data)
    return res.data
  },

  updatePlan: async (id, data) => {
    const res = await api.put(`${API_URL}/${id}`, data)
    return res.data
  },

  deletePlan: async (id) => {
    const res = await api.delete(`${API_URL}/${id}`)
    return res.data
  },
  assignPlanToUser: async (userId, planId, businessType) => {
    const res = await api.post(`${API_URL}/assign-to-user`, { userId, planId, businessType })
    return res.data
  },
}
