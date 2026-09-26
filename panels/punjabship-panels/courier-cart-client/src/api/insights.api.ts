import axiosInstance from './axiosInstance'

export interface SellerInsights {
  summary: {
    highRiskPincodes: number
    orderNotes: number
    codOrders: number
    prepaidOrders: number
  }
  highRiskPincodes: Array<{ pincode: string; totalOrders: number; ndrOrders: number; rtoOrders: number; riskRate: number }>
  orderNotes: Array<{ orderNumber: string; status: string; note: string; courier: string; createdAt?: string | null }>
  codOrders: Array<{ orderNumber: string; status: string; pincode: string; courier: string; createdAt?: string | null }>
  prepaidOrders: Array<{ orderNumber: string; status: string; pincode: string; courier: string; createdAt?: string | null }>
}

export const fetchSellerInsights = async (): Promise<SellerInsights> => {
  const { data } = await axiosInstance.get('/reports/insights')
  return data?.data || {
    summary: { highRiskPincodes: 0, orderNotes: 0, codOrders: 0, prepaidOrders: 0 },
    highRiskPincodes: [],
    orderNotes: [],
    codOrders: [],
    prepaidOrders: [],
  }
}
