import axiosInstance from './axiosInstance'

export async function createReverseShipment(payload: Record<string, unknown>) {
  const res = await axiosInstance.post(`/returns/create`, payload, {
    timeout: 210000,
  })
  return res.data
}

export async function quoteReverse(payload: { orderId: string; weightGrams?: number }) {
  const res = await axiosInstance.post(`/returns/quote`, payload)
  return res.data
}


