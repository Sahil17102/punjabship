import axiosInstance from './axiosInstance'

const API_BASE = '/v1'

// API Keys
export interface ApiKey {
  id: string
  key_name: string
  permissions: string[]
  is_active: boolean
  last_used_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateApiKeyResponse {
  success: boolean
  data: {
    id: string
    key_name: string
    api_key: string // Only returned on creation
    api_secret: string // Only returned on creation
    permissions: string[]
    is_active: boolean
    created_at: string
  }
  warning?: string
}

export const apiKeyService = {
  getApiKeys: async (): Promise<{ success: boolean; data: ApiKey[] }> => {
    const res = await axiosInstance.get(`${API_BASE}/api-keys`)
    return res.data
  },

  createApiKey: async (data: { key_name: string }): Promise<CreateApiKeyResponse> => {
    const res = await axiosInstance.post(`${API_BASE}/api-keys`, data)
    return res.data
  },

  updateApiKey: async (
    id: string,
    data: { key_name?: string; is_active?: boolean; permissions?: string[] },
  ): Promise<{ success: boolean; data: ApiKey }> => {
    const res = await axiosInstance.put(`${API_BASE}/api-keys/${id}`, data)
    return res.data
  },

  deleteApiKey: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await axiosInstance.delete(`${API_BASE}/api-keys/${id}`)
    return res.data
  },
}

// Webhooks
export interface WebhookSubscription {
  id: string
  url: string
  name: string | null
  events: string[]
  is_active: boolean
  total_attempts: number
  successful_deliveries: number
  failed_deliveries: number
  last_delivery_at: string | null
  last_success_at: string | null
  last_failure_at: string | null
  created_at: string
  updated_at: string
}

export interface CreateWebhookResponse {
  success: boolean
  data: {
    id: string
    url: string
    name: string | null
    events: string[]
    secret: string // Only returned on creation
    is_active: boolean
    created_at: string
  }
}

export interface RegenerateWebhookSecretResponse {
  success: boolean
  data: {
    id: string
    url: string
    name: string | null
    secret: string // New secret
    updated_at: string
  }
}

export const webhookService = {
  getWebhooks: async (): Promise<{ success: boolean; data: WebhookSubscription[] }> => {
    const res = await axiosInstance.get(`${API_BASE}/webhooks`)
    return res.data
  },

  getWebhook: async (id: string): Promise<{ success: boolean; data: WebhookSubscription }> => {
    const res = await axiosInstance.get(`${API_BASE}/webhooks/${id}`)
    return res.data
  },

  createWebhook: async (data: {
    url: string
    name?: string
    events: string[]
    is_active?: boolean
  }): Promise<CreateWebhookResponse> => {
    const res = await axiosInstance.post(`${API_BASE}/webhooks`, data)
    return res.data
  },

  updateWebhook: async (
    id: string,
    data: {
      url?: string
      name?: string
      events?: string[]
      is_active?: boolean
    },
  ): Promise<{ success: boolean; data: WebhookSubscription }> => {
    const res = await axiosInstance.put(`${API_BASE}/webhooks/${id}`, data)
    return res.data
  },

  deleteWebhook: async (id: string): Promise<{ success: boolean; message: string }> => {
    const res = await axiosInstance.delete(`${API_BASE}/webhooks/${id}`)
    return res.data
  },

  regenerateSecret: async (id: string): Promise<RegenerateWebhookSecretResponse> => {
    const res = await axiosInstance.post(`${API_BASE}/webhooks/${id}/regenerate-secret`)
    return res.data
  },
}
