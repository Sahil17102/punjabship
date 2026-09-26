import api from './axios' // your pre-configured axios instance

const API_BASE = '/blogs/admin'

export const BlogAPI = {
  getBlogs: (params) => api.get(API_BASE, { params }).then((res) => res.data),
  getStats: () => api.get(`${API_BASE}/stats`).then((res) => res.data),
  createBlog: (data) => api.post(API_BASE, data).then((res) => res.data),
  getSingleBlog: (id) => api.get(`${API_BASE}/${id}`).then((res) => res.data),
  updateBlog: (id, data) => api.put(`${API_BASE}/${id}`, data).then((res) => res.data),
  deleteBlog: (id) => api.delete(`${API_BASE}/${id}`),
}
