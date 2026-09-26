import apiClient from './axios'

export const listAdminBillingInvoices = async ({ page = 1, limit = 20, status, sellerId } = {}) => {
  const params = { page, limit, status, sellerId }
  const { data } = await apiClient.get('/admin/billing/invoices', { params })
  return data
}

export const adminAddCodOffset = async (invoiceId, { codRemittanceId, amount }) => {
  const { data } = await apiClient.post(`/admin/billing/invoices/${invoiceId}/cod-offsets`, {
    codRemittanceId,
    amount,
  })
  return data
}

export const adminCloseBillingInvoice = async (invoiceId) => {
  const { data } = await apiClient.post(`/admin/billing/invoices/${invoiceId}/close`)
  return data
}

export const adminRegenerateBillingInvoice = async (invoiceId) => {
  const { data } = await apiClient.post(`/admin/billing/invoices/${invoiceId}/regenerate`)
  return data
}

export const adminResolveDispute = async (disputeId, { status, resolutionNotes }) => {
  const { data } = await apiClient.post(`/admin/billing/disputes/${disputeId}/resolve`, {
    status,
    resolutionNotes,
  })
  return data
}

export const getInvoiceStatement = async (invoiceId) => {
  const { data } = await apiClient.get(`/admin/billing/invoices/${invoiceId}/statement`)
  return data
}

export const getInvoiceDisputes = async (invoiceId) => {
  const { data } = await apiClient.get(`/admin/billing/invoices/${invoiceId}/disputes`)
  return data
}

export const adminAddInvoiceAdjustment = async (invoiceId, { type, amount, notes }) => {
  const { data } = await apiClient.post(`/admin/billing/invoices/${invoiceId}/adjustments`, {
    type,
    amount,
    notes,
  })
  return data
}

export const getInvoiceOrders = async (invoiceId) => {
  const { data } = await apiClient.get(`/admin/billing/invoices/${invoiceId}/orders`)
  return data
}

export const adminBulkInvoiceAdjustments = async (invoiceId, rows) => {
  const { data } = await apiClient.post(`/admin/billing/invoices/${invoiceId}/adjustments/bulk`, { rows })
  return data
}

export const adminGenerateManualInvoice = async (userId, { startDate, endDate }) => {
  const { data } = await apiClient.post(`/admin/billing/invoices/${userId}/generate`, {
    startDate,
    endDate,
  })
  return data
}
