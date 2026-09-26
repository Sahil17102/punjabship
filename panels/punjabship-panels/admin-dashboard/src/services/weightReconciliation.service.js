import apiClient from './axios'

/**
 * Get admin weight reconciliation stats
 */
export const getWeightReconciliationStats = async (params = {}) => {
  const { fromDate, toDate } = params
  const response = await apiClient.get('/admin/weight-reconciliation/stats', {
    params: { fromDate, toDate },
  })
  return response.data
}

/**
 * Get all weight discrepancies (all users)
 */
export const getAllWeightDiscrepancies = async (params = {}) => {
  const { page = 1, limit = 20, status, hasDispute, userId, fromDate, toDate } = params
  const response = await apiClient.get('/admin/weight-reconciliation/discrepancies', {
    params: { page, limit, status, hasDispute, userId, fromDate, toDate },
  })
  return response.data
}

/**
 * Get all weight disputes (all users)
 */
export const getAllWeightDisputes = async (params = {}) => {
  const { page = 1, limit = 20, status, userId, fromDate, toDate } = params
  const response = await apiClient.get('/admin/weight-reconciliation/disputes', {
    params: { page, limit, status, userId, fromDate, toDate },
  })
  return response.data
}

/**
 * Approve a weight dispute
 */
export const approveDispute = async (disputeId, data) => {
  const { adminComment, adjustWeight, adjustCharge } = data
  const response = await apiClient.post(
    `/admin/weight-reconciliation/disputes/${disputeId}/approve`,
    {
      adminComment,
      adjustWeight,
      adjustCharge,
    },
  )
  return response.data
}

/**
 * Reject a weight dispute
 */
export const rejectDispute = async (disputeId, data) => {
  const { adminComment } = data
  const response = await apiClient.post(
    `/admin/weight-reconciliation/disputes/${disputeId}/reject`,
    {
      adminComment,
    },
  )
  return response.data
}
