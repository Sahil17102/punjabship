import axiosInstance from './axiosInstance'

export async function fetchMyRto(params: { orderId?: string; page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string; courier?: string } = {}) {
  const res = await axiosInstance.get(`/rto`, { params })
  return res.data
}

export async function exportMyRto(params: Record<string, string | undefined>) {
  const res = await axiosInstance.get('/rto/export', { params, responseType: 'blob' })
  const url = URL.createObjectURL(res.data)
  const link = document.createElement('a')
  link.href = url
  link.download = 'rto-report.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export async function fetchAdminRto(params: { orderId?: string; page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string } = {}) {
  const res = await axiosInstance.get(`/admin/rto`, { params })
  return res.data
}
