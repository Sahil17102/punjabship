import api from './axios'

const API_BASE = '/v1'
const INTEGRATION_BASE = '/integrations'

// API Keys
export const apiKeyService = {
  getApiKeys: async () => {
    const res = await api.get(`${API_BASE}/api-keys`)
    return res.data
  },

  createApiKey: async (data) => {
    const res = await api.post(`${API_BASE}/api-keys`, data)
    return res.data
  },

  updateApiKey: async (id, data) => {
    const res = await api.put(`${API_BASE}/api-keys/${id}`, data)
    return res.data
  },

  deleteApiKey: async (id) => {
    const res = await api.delete(`${API_BASE}/api-keys/${id}`)
    return res.data
  },
}

// Webhooks
export const webhookService = {
  getWebhooks: async () => {
    const res = await api.get(`${API_BASE}/webhooks`)
    return res.data
  },

  getWebhook: async (id) => {
    const res = await api.get(`${API_BASE}/webhooks/${id}`)
    return res.data
  },

  createWebhook: async (data) => {
    const res = await api.post(`${API_BASE}/webhooks`, data)
    return res.data
  },

  updateWebhook: async (id, data) => {
    const res = await api.put(`${API_BASE}/webhooks/${id}`, data)
    return res.data
  },

  deleteWebhook: async (id) => {
    const res = await api.delete(`${API_BASE}/webhooks/${id}`)
    return res.data
  },
}

export const shopifyIntegrationService = {
  getStatus: async () => {
    const res = await api.get(`${INTEGRATION_BASE}/shopify/test-connection`)
    return res.data
  },

  connectEnvStore: async (data = {}) => {
    const res = await api.post(`${INTEGRATION_BASE}/shopify/connect-env`, data)
    return res.data
  },

  startOAuth: async (data = {}) => {
    const res = await api.post(`${INTEGRATION_BASE}/shopify/oauth/start`, data)
    return res.data
  },

  syncOrders: async (data = {}) => {
    const res = await api.post(`${INTEGRATION_BASE}/shopify/sync-orders`, data)
    return res.data
  },
}
