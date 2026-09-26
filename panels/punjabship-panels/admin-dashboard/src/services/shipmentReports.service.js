import api from './axios'

export const fetchAdminShipmentReportOptions = async ({ fromDate, toDate }) => {
  const response = await api.post('/admin/orders/shipment-reports/options', { fromDate, toDate })
  return response.data.data
}

export const downloadAdminShipmentReport = async (payload) => {
  const response = await api.post('/admin/orders/shipment-reports/export', payload, {
    responseType: 'blob',
  })
  return response.data
}
