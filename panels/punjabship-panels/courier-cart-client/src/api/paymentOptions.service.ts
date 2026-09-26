import axiosInstance from './axiosInstance'

export interface PaymentOptions {
  codEnabled: boolean
  prepaidEnabled: boolean
  minWalletRecharge: number
  gstPercent: number
}

export const paymentOptionsService = {
  getPaymentOptions: async (): Promise<PaymentOptions> => {
    const response = await axiosInstance.get<PaymentOptions>('/payment-options')
    return response.data
  },
}

