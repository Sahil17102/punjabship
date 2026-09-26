import axiosInstance from './axiosInstance'

const API_BASE = '/courier/courier-priorities'

export const courierPriorityService = {
  create: async (data: {
    name: 'fastest' | 'economical' | 'personalised'
    personalised_order?: { courierId: number; priority: number }[]
  }) => {
    const res = await axiosInstance.post(API_BASE, data)
    return res.data
  },

  getByUser: async () => {
    const res = await axiosInstance.get(`${API_BASE}/user`)
    return res.data
  },

  getOne: async (id: number) => {
    const res = await axiosInstance.get(`${API_BASE}/${id}`)
    return res.data
  },

  update: async (
    id: number,
    data: Partial<{
      name: 'fastest' | 'economical' | 'personalised'
      personalised_order: { courierId: number; priority: number }[]
    }>,
  ) => {
    const res = await axiosInstance.put(`${API_BASE}/${id}`, data)
    return res.data
  },

  delete: async (id: number) => {
    const res = await axiosInstance.delete(`${API_BASE}/${id}`)
    return res.data
  },
}
