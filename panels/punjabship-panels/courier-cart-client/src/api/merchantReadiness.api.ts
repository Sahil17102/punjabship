import axiosInstance from './axiosInstance'

export interface MerchantReadinessResponse {
  onboardingComplete: boolean
  approved: boolean
  hasCompanyInfo: boolean
  kycVerified: boolean
  hasAssignedPlan: boolean
  assignedPlanName: string | null
  assignedPlanId: string | null
  hasPickupAddress: boolean
  walletReady: boolean
  walletBalance: number
  requiredWalletBalance: number
  isEmployee: boolean
  isReady: boolean
}

export const fetchMerchantReadiness = async (): Promise<MerchantReadinessResponse> => {
  const { data } = await axiosInstance.get<MerchantReadinessResponse>('/profile/readiness')
  return data
}
