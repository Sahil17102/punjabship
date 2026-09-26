import api from './axios'

const base = '/admin/franchise/v1'

export const franchiseService = {
  getOverview: async () => (await api.get(`${base}/overview`)).data.data,
  listApplications: async (status = 'all') =>
    (await api.get(`${base}/applications`, { params: { status } })).data.data,
  updateApplication: async (id, payload) =>
    (await api.patch(`${base}/applications/${id}/action`, payload)).data,
  listProducts: async () => (await api.get(`${base}/products`)).data.data,
  createProduct: async (payload) => (await api.post(`${base}/products`, payload)).data.data,
  listTerritories: async (params = {}) =>
    (await api.get(`${base}/territories`, { params })).data.data,
  getTerritoryDetails: async (id) =>
    (await api.get(`${base}/territories/${id}/details`)).data.data,
  listFranchises: async () => (await api.get(`${base}/franchises`)).data.data,
  listAgreements: async () => (await api.get(`${base}/agreements`)).data.data,
  listRules: async () => (await api.get(`${base}/commission-rules`)).data.data,
  createRule: async (payload) =>
    (await api.post(`${base}/commission-rules`, payload)).data.data,
  publishRule: async (id, reason) =>
    (await api.patch(`${base}/commission-rules/${id}/publish`, { reason })).data.data,
  listSettlements: async () => (await api.get(`${base}/settlements`)).data,
  getReports: async () => (await api.get(`${base}/reports`)).data.data,
  listExceptions: async () => (await api.get(`${base}/exceptions`)).data.data,
  listAudit: async () => (await api.get(`${base}/audit`)).data.data,
}
