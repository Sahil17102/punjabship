import api from './axios'

const API_BASE = '/static-pages'

export const StaticPagesAPI = {
  getPage: (slug) => api.get(`${API_BASE}/${slug}`).then((res) => res.data.data),
  updatePage: (slug, data) => api.put(`${API_BASE}/${slug}`, data).then((res) => res.data.data),
}




