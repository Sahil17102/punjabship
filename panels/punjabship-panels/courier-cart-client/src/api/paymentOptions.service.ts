import axiosInstance from './axiosInstance'

export interface PaymentOptions {
  codEnabled: boolean
  prepaidEnabled: boolean
  minWalletRecharge: number
  gstPercent: number
}

export const paymentOptionsService = {
  getPaymentOptions: async (): Promise<PaymentOptions> => {
    const response = await axiosInstance.get<PaymentOptions | { settings?: Partial<PaymentOptions> }>('/payment-options')
    const responseData = response.data as Partial<PaymentOptions> & { settings?: Partial<PaymentOptions> }
    const payload = responseData.settings ?? responseData

    return {
      codEnabled: payload.codEnabled ?? true,
      prepaidEnabled: payload.prepaidEnabled ?? true,
      minWalletRecharge: Number(payload.minWalletRecharge ?? 0),
      gstPercent: Number(payload.gstPercent ?? 0),
    }
  },
}
