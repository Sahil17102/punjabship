import apiClient from './axios'

export const listAdminWallets = async ({ page = 1, limit = 20, search = '', sortBy = 'updatedAt', sortOrder = 'desc' } = {}) => {
  const params = { page, limit, search, sortBy, sortOrder }
  const { data } = await apiClient.get('/admin/wallets', { params })
  return data
}

export const getAdminWallet = async (userId) => {
  const { data } = await apiClient.get(`/admin/wallets/${userId}`)
  return data
}

export const getAdminWalletTransactions = async (userId, { page = 1, limit = 50, type, dateFrom, dateTo, category } = {}) => {
  const params = { page, limit, type, dateFrom, dateTo, category }
  const { data } = await apiClient.get(`/admin/wallets/${userId}/transactions`, { params })
  return data
}

export const getAdminWalletMisReport = async (params = {}) => {
  const { data } = await apiClient.get('/admin/wallets/mis-report', { params })
  return data
}

export const downloadAdminWalletMisReportCsv = async (params = {}) => {
  const response = await apiClient.get('/admin/wallets/mis-report/export', {
    params,
    responseType: 'blob',
  })

  const disposition = response.headers?.['content-disposition'] || ''
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i)
  return {
    blob: response.data,
    filename: filenameMatch?.[1] || `wallet_mis_${new Date().toISOString().split('T')[0]}.csv`,
  }
}

export const adjustAdminWalletBalance = async (userId, { type, amount, reason, notes }) => {
  const { data } = await apiClient.post(`/admin/wallets/${userId}/adjust`, {
    type,
    amount,
    reason,
    notes,
  })
  return data
}

