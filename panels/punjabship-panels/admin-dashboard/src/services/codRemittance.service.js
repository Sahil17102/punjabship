import apiClient from './axios' // your pre-configured axios instance
/**
 * Get platform-wide COD statistics
 */
export const getCodPlatformStats = async () => {
  const response = await apiClient.get('/admin/cod-remittance/stats')
  return response.data
}

/**
 * Get all COD remittances (all users)
 */
export const getAllCodRemittances = async (params = {}) => {
  const { page = 1, limit = 50, status, fromDate, toDate, search } = params
  const response = await apiClient.get('/admin/cod-remittance/remittances', {
    params: { ...params, page, limit, status, fromDate, toDate, search },
  })
  return response.data
}

/**
 * Get COD payable / receivables report.
 */
export const getCodPayableReport = async (params = {}) => {
  const response = await apiClient.get('/admin/cod-remittance/payable-report', { params })
  return response.data
}

/**
 * Get user-specific COD remittances
 */
export const getUserCodRemittances = async (userId) => {
  const response = await apiClient.get(`/admin/cod-remittance/users/${userId}/remittances`)
  return response.data
}

/**
 * Mark a COD remittance as settled
 */
export const manualMarkSettlement = async (remittanceId, payload = {}) => {
  const response = await apiClient.post(
    `/admin/cod-remittance/remittances/${remittanceId}/settle`,
    payload,
  )
  return response.data
}

/**
 * Update remittance notes
 */
export const updateRemittanceNotes = async (remittanceId, notes) => {
  const response = await apiClient.patch(
    `/admin/cod-remittance/remittances/${remittanceId}/notes`,
    {
      notes,
    },
  )
  return response.data
}

/**
 * Export all COD remittances as CSV
 */
export const exportAllCodRemittances = async (params = {}) => {
  const { status, fromDate, toDate } = params
  const response = await apiClient.get('/admin/cod-remittance/remittances/export', {
    params: { ...params, status, fromDate, toDate },
    responseType: 'blob',
  })

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute(
    'download',
    `admin_cod_remittances_${new Date().toISOString().split('T')[0]}.csv`,
  )
  document.body.appendChild(link)
  link.click()
  link.remove()
}

/**
 * Preview courier settlement CSV
 */
export const previewCourierSettlement = async ({ courierPartner, csvData }) => {
  const response = await apiClient.post('/admin/cod-remittance/preview-settlement-csv', {
    courierPartner,
    csvData,
  })
  return response.data
}

/**
 * Confirm courier settlement and mark remittances settled
 */
export const confirmCourierSettlement = async ({
  remittances,
  utrNumber,
  settlementDate,
  courierPartner,
  settlementNotes,
}) => {
  const response = await apiClient.post('/admin/cod-remittance/confirm-settlement', {
    remittances,
    utrNumber,
    settlementDate,
    courierPartner,
    settlementNotes,
  })
  return response.data
}

/**
 * Download settlement CSV template
 */
export const downloadSettlementCsvTemplate = async () => {
  const response = await apiClient.get('/admin/cod-remittance/csv-template', {
    responseType: 'blob',
  })

  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'settlement_template.csv')
  document.body.appendChild(link)
  link.click()
  link.remove()
}
