import axiosInstance from './axiosInstance'

export async function fetchMyNdr(params: { orderId?: string; page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string } = {}) {
  const res = await axiosInstance.get(`/ndr`, { params })
  return res.data
}

export async function fetchAdminNdr(params: { orderId?: string; page?: number; limit?: number; search?: string; fromDate?: string; toDate?: string } = {}) {
  const res = await axiosInstance.get(`/admin/ndr`, { params })
  return res.data
}

export async function submitNdrReattempt(payload: {
  awb?: string
  orderId?: string
  nextAttemptDate: string
  comments?: string
}) {
  const res = await axiosInstance.post(`/ndr/reattempt`, payload)
  return res.data
}

export async function submitNdrChangePhone(payload: { awb?: string; orderId?: string; phone: string }) {
  const res = await axiosInstance.post(`/ndr/change-phone`, payload)
  return res.data
}

export async function submitNdrChangeAddress(payload: {
  awb?: string
  orderId?: string
  name?: string
  address_1: string
  address_2?: string
  pincode?: string
}) {
  const res = await axiosInstance.post(`/ndr/change-address`, payload)
  return res.data
}

export async function fetchMyNdrTimeline(params: { awb?: string; orderId?: string }) {
  const res = await axiosInstance.get(`/ndr/timeline`, { params })
  return res.data
}
