import api from './axios'

const DASHBOARD_CACHE_KEY = 'punjabship-admin-dashboard-cache-v2'

const hasActiveFilters = (filters = {}) => Object.values(filters).some(Boolean)

export const readAdminDashboardCache = (filters = {}) => {
  if (hasActiveFilters(filters) || typeof window === 'undefined') return undefined

  try {
    const cached = JSON.parse(window.localStorage.getItem(DASHBOARD_CACHE_KEY) || 'null')
    return cached?.data?.success ? cached : undefined
  } catch {
    return undefined
  }
}

const writeAdminDashboardCache = (data, filters) => {
  if (hasActiveFilters(filters) || typeof window === 'undefined') return

  try {
    window.localStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({ data, savedAt: Date.now() }))
  } catch {
    // A full or disabled storage area should never prevent dashboard rendering.
  }
}

// One compact server-side summary replaces nine large list requests.
export const getAdminDashboardStats = async (filters = {}) => {
  try {
    const response = await api.get('/admin/dashboard/stats', {
      params: filters,
      timeout: 20000,
    })
    writeAdminDashboardCache(response.data, filters)
    return response.data
  } catch (error) {
    const cached = readAdminDashboardCache(filters)
    if (cached?.data) return { ...cached.data, stale: true }
    throw error
  }
}
