import api from './axios'

export async function fetchDeveloperErrorLogs(page = 1, limit = 20, filters = {}) {
  try {
    const response = await api.get('/admin/developer/error-logs', {
      params: {
        page,
        limit,
        ...filters,
      },
    })

    return response.data
  } catch (error) {
    console.error('Error fetching developer logs:', error.response?.data || error.message)
    throw error
  }
}

export async function fetchDeveloperLiveLogs(limit = 1000) {
  try {
    const response = await api.get('/admin/developer/live-logs', {
      params: { limit },
    })

    return response.data
  } catch (error) {
    console.error('Error fetching live developer logs:', error.response?.data || error.message)
    throw error
  }
}

export async function fetchShopifyOAuthCredentials() {
  try {
    const response = await api.get('/admin/developer/shopify-oauth-credentials')
    return response.data
  } catch (error) {
    console.error(
      'Error fetching Shopify OAuth credentials:',
      error.response?.data || error.message,
    )
    throw error
  }
}

export async function updateShopifyOAuthCredentials(payload) {
  try {
    const response = await api.put('/admin/developer/shopify-oauth-credentials', payload)
    return response.data
  } catch (error) {
    console.error(
      'Error updating Shopify OAuth credentials:',
      error.response?.data || error.message,
    )
    throw error
  }
}

export async function updateDeveloperIssue(issueKey, payload) {
  try {
    const response = await api.patch(
      `/admin/developer/issues/${encodeURIComponent(issueKey)}`,
      payload,
    )
    return response.data
  } catch (error) {
    console.error('Error updating developer issue:', error.response?.data || error.message)
    throw error
  }
}

export async function retryDeveloperManifest({ orderId, issueKey }) {
  try {
    const response = await api.post('/admin/developer/retry-manifest', { orderId, issueKey })
    return response.data
  } catch (error) {
    console.error('Error retrying developer manifest:', error.response?.data || error.message)
    throw error
  }
}

export async function triggerShadowfaxWebhookTest(payload) {
  try {
    const response = await api.post('/admin/developer/trigger-shadowfax-webhook', payload)
    return response.data
  } catch (error) {
    console.error(
      'Error triggering Shadowfax webhook test:',
      error.response?.data || error.message,
    )
    throw error
  }
}
