import api from './axios'

const API_BASE = '/admin/payment-options'

export const paymentOptionsService = {
  getPaymentOptions: () => api.get(API_BASE).then((res) => res.data),
  updatePaymentOptions: (data) => api.put(API_BASE, data).then((res) => res.data),
}

